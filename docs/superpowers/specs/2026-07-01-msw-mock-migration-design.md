# Vue Admin MSW Mock 迁移设计

## 背景

Vue Admin 当前用 `vite-plugin-mock` 在 dev 模式提供 mock，生产构建不含 mock。CLAUDE.md M5.3 既定路线要求迁移到 MSW（Mock Service Worker）。当前需求：demo 演示站点（`demo.cncf.vip/vue-admin/`）需在纯静态部署下返回 mock 数据，且不引入 Node 服务、不影响未来接入真实后端。

## 目标

1. 用 MSW 替换 vite-plugin-mock，dev 与 prod 统一一套 mock。
2. demo 构建启用 MSW，纯静态部署即可演示完整功能。
3. 正式接后端时通过构建开关排除 MSW，bundle 干净。
4. 业务代码零改动，现有 mock 数据逻辑尽可能复用。

## 方案

### 目录结构（最终态 A：handlers/ 域内聚）

```
src/mock/
├── handlers/              # 数据 + MSW handler 同文件（域内聚）
│   ├── _utils.ts          # ok/fail 响应包装、toCsv 等公共工具
│   ├── auth.ts            # export const authHandlers = [...]
│   ├── user.ts
│   ├── role.ts
│   ├── dept.ts
│   ├── dict.ts
│   ├── notice.ts
│   ├── permission.ts
│   ├── menu.ts
│   ├── menu-manage.ts
│   ├── dashboard.ts
│   ├── crud.ts
│   └── log.ts
├── browser.ts             # setupWorker(...handlers) 唯一入口
├── server.ts              # setupServer(...handlers) 供单元测试
├── index.ts               # 汇总 export const handlers = [...]
└── (apis/ 目录迁移完成后删除)
```

每个 `handlers/<domain>.ts` 导出数据（内聚闭包，不外泄）+ `export const <domain>Handlers = [...]`。`index.ts` 汇总所有 handler。

### handler 组织与数据复用

域内聚：数据与 handler 写在同一文件，不单独抽 data 层。

以 `auth.ts` 为例：

```ts
import { http, HttpResponse } from 'msw'

interface MockUser { id: string; username: string; password: string; ... }
const USERS: MockUser[] = [...]
const TOKENS = new Map<string, string>()

function genToken(prefix: string, username: string) { ... }

const ok = <T>(data: T, msg = 'ok') => HttpResponse.json({ code: 0, data, msg })
const fail = (code: number, msg: string) => HttpResponse.json({ code, msg, data: null })

export const authHandlers = [
  http.post('/api/auth/sessions', async ({ request }) => {
    const body = await request.json() as { username?: string; password?: string }
    const user = USERS.find(u => u.username === body.username && u.password === body.password)
    if (!user) return fail(401, '用户名或密码错误')
    return ok({ accessToken: genToken('a', user.username), refreshToken: genToken('r', user.username), expiresIn: 3600 })
  }),
  http.delete('/api/auth/sessions', () => ok(null)),
  http.get('/api/auth/users/me', ({ request }) => {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/, '') ?? ''
    const username = TOKENS.get(token)
    if (!username) return fail(401, 'Unauthorized')
    const { password, ...safe } = USERS.find(u => u.username === username)!
    return ok(safe)
  }),
  http.post('/api/auth/tokens/refresh', async ({ request }) => { /* ... */ }),
]
```

约定：
- 每个域文件 `export const <domain>Handlers = [...]`
- `src/mock/index.ts` 汇总：`export const handlers = [...authHandlers, ...userHandlers, ...]`
- `ok`/`fail`/`toCsv` 放 `handlers/_utils.ts`，各域 import
- 路径参数用 MSW 原生 `:id` 语法：`http.get('/api/user/:id', ({ params }) => ...)`
- 原 `response({ query, body, headers, params })` 在 MSW 分别从 `new URL(request.url).searchParams`、`await request.json()`、`request.headers`、`params` 取

### 注册流程与构建开关（统一 MSW，开关仅 demo vs 正式）

dev 与 prod 都用 MSW，删除 vite-plugin-mock。开关 `VITE_ENABLE_MOCK` 仅区分 demo（需 mock）与正式（接后端）。

`src/app/main.ts` 改动：

```ts
async function bootstrap() {
  // dev 默认启用 mock；prod 由 VITE_ENABLE_MOCK 控制（demo=true，正式=false）
  const enableMock = import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCK === 'true'
  if (enableMock) {
    const { worker } = await import('@/mock/browser')
    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` }
    })
  }
  app.mount('#app')
}
bootstrap()
```

关键点：
- `worker` 动态 import——`VITE_ENABLE_MOCK !== 'true'` 且非 DEV 时，msw 库 + handler 不进 bundle（tree-shaking）
- `await worker.start()` 完成才 mount，确保 SW 就绪，首次请求不漏
- `onUnhandledRequest: 'bypass'`——未匹配请求放行到真实后端
- `serviceWorker.url` 用 `BASE_URL` 前缀，适配子路径部署

构建开关：

| 构建场景 | `VITE_ENABLE_MOCK` | dev/prod | MSW |
|---|---|---|---|
| 本地 dev | 不设（DEV 自动启用） | dev | 启用 |
| demo 部署 | `true` | prod | 启用 |
| 正式接后端 | `false` 或不设 | prod | 不打包 |

SW 文件：`pnpm exec msw init public/ --save` 生成 `public/mockServiceWorker.js`，提交仓库，构建时拷到 `dist/`。

### 迁移策略与测试

95 个端点分 6 批迁移，每批可独立验证：

| 批次 | 域 | 端点数 | 说明 |
|---|---|---|---|
| 1 | auth + menu | 5 | 登录链路 + 菜单下发，先验证整体跑通 |
| 2 | user + role + permission | 23 | RBAC 核心 |
| 3 | dept + dict + notice | 37 | 业务模块 |
| 4 | dashboard + crud | 11 | 独立页面 |
| 5 | log + menu-manage | 19 | 含 export CSV |
| 6 | 删 vite-plugin-mock + apis/ | — | 切换 dev 到 MSW，改单元测试 |

每批验证标准：
1. `pnpm dev` 启动，对应域页面正常加载
2. `pnpm smoke` 对应用例通过
3. `pnpm test` 单元测试不回归

单元测试：现有 `test/mock/` 依赖 vite-plugin-mock 的测试在第 6 批改用 MSW `setupServer`。

风险与回滚：每批独立 commit，出问题可回滚单批。第 6 批前 vite-plugin-mock 配置保留不删（dev 已切 MSW 但配置仍在，双 mock 共存期间 dev 只启 MSW）。第 6 批才真正删 vite-plugin-mock 与 `apis/`。

## 对后端集成的影响：零

MSW 纯浏览器端，后端无感知。关闭 MSW（`VITE_ENABLE_MOCK=false`）→ SW 不注册 → 请求照常发到真实后端。切换后端只改构建环境变量，不改业务代码、不改 mock 代码、不改后端。

## 副作用

| 项 | 影响 | 说明 |
|---|---|---|
| bundle 体积 | +约 30-50KB（gzip） | msw 库 + handler；`VITE_ENABLE_MOCK=false` 时不打包 |
| 首次访问延迟 | +200-500ms | SW 注册 + 激活，`await worker.start()` 后才渲染 |
| SW 缓存 | 需更新策略 | `mockServiceWorker.js` 每次构建重新生成，浏览器检测更新 |
| 单元测试 | 需调整 | 第 6 批改用 MSW `setupServer` |
| 生产误开 | 风险可控 | 误设 `VITE_ENABLE_MOCK=true` 上线会显示 mock 数据，部署文档需强调 |

## 影响范围

- 新增：`src/mock/handlers/`、`src/mock/browser.ts`、`src/mock/server.ts`、`src/mock/index.ts`、`public/mockServiceWorker.js`
- 修改：`src/app/main.ts`（注册流程）、`vite.config.ts`（移除 viteMockServe）、`package.json`（加 msw 依赖、删 vite-plugin-mock）、`.github/workflows/deploy.yml`（demo 构建加 `VITE_ENABLE_MOCK: 'true'`）
- 删除：`src/mock/apis/` 整个目录（第 6 批）
- 业务代码（`views/`、`api.ts`、`store`）零改动
