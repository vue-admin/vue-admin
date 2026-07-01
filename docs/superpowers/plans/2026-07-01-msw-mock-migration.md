# MSW Mock 迁移实施计划

> **For agentic workers:** REQUIRED SUB-TOOL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用 MSW 替换 vite-plugin-mock，dev/prod 统一一套 mock，demo 构建启用、正式构建排除，业务代码零改动。

**Architecture:** 按域内聚组织 handler（`src/mock/handlers/<domain>.ts` 数据+handler 同文件），`main.ts` 动态 import `@/mock/browser` 注册 SW，`VITE_ENABLE_MOCK` 控制 prod 开关，dev 自动启用。分 6 批迁移 95 个端点，每批独立验证。

**Tech Stack:** MSW 2.x, vite 7, vitest 3, TypeScript 5.9

## Global Constraints

- 业务代码（`src/modules/`、`src/app/`、`src/lib/`）零改动，仅改 `src/mock/`、`src/app/main.ts`、`vite.config.ts`、`package.json`、`public/`、`test/mock/`、`.github/workflows/deploy.yml`
- 所有新增文档/注释使用简体中文
- 响应契约：成功 `{ code: 0, data, msg }`，失败 `{ code: <非0>, msg, data: null }`（HTTP 200）
- CSV 导出端点返回 `string`（含表头），禁止 data-URI 占位
- `/export` 与 `/clear` 等静态路径必须排在 `/:id` 之前（避免被 :id 抢匹配）
- 每批完成后必须通过：`pnpm dev`（对应域页面正常）+ `pnpm smoke`（对应用例）+ `pnpm test`（不回归）
- 每批独立 commit
- MSW 版本：`msw@^2.6.0`（支持 SW + node setupServer）

## 转换规则（所有批次通用）

每个 Task 的 handler 转换遵循以下映射，implementer 据此把原 `src/mock/apis/<domain>.ts` 的 `MockMethod[]` 转成 `handlers/<domain>.ts` 的 MSW handler 数组。

### 请求对象映射

| vite-plugin-mock | MSW | 说明 |
|---|---|---|
| `{ query }` | `new URL(request.url).searchParams` | 查询参数 |
| `{ body }` | `await request.json()` | 请求体（POST/PUT） |
| `{ headers }` | `request.headers` | `headers.authorization` → `request.headers.get('authorization')` |
| `{ params: { id } }` | `params.id`（MSW 路径 `:id` 自动解析） | 路径参数 |

### 响应映射

| vite-plugin-mock | MSW |
|---|---|
| `return { code: 0, data, msg }` | `return HttpResponse.json({ code: 0, data, msg })` |
| `return { code: -1, msg, data: null }` | `return HttpResponse.json({ code: -1, msg, data: null })` |
| 返回 CSV 文本 `{ code:0, data: csvString }` | `return HttpResponse.json({ code: 0, data: csvString, msg: 'success' })` |

### 路径匹配

- 静态路径 + 动态 `:id` 同域时，**静态路径（`/export`、`/clear`）的 handler 必须在 `:id` handler 之前**写入数组
- MSW 路径不带 base 前缀，直接 `/api/...`

### 数据/状态复用

原文件里的 `const USERS`、`let dataList`、`Map`、`generateUsers()`、`toCsv()`、`recentDateTime()` 等数据与工具函数**原样移植**到 `handlers/<domain>.ts`（同文件内聚），`toCsv` 改从 `handlers/_utils.ts` import（去重）。

## 文件结构

| 文件 | 责任 |
|---|---|
| `src/mock/handlers/_utils.ts` | `ok`/`fail`/`toCsv` 公共工具 |
| `src/mock/handlers/auth.ts` | auth + menu handler（批次1） |
| `src/mock/handlers/menu.ts` | 菜单下发 handler（批次1） |
| `src/mock/handlers/user.ts` | 用户 handler（批次2） |
| `src/mock/handlers/role.ts` | 角色 handler（批次2） |
| `src/mock/handlers/permission.ts` | 权限 handler（批次2） |
| `src/mock/handlers/dept.ts` | 部门 handler（批次3） |
| `src/mock/handlers/dict.ts` | 字典 handler（批次3） |
| `src/mock/handlers/notice.ts` | 公告 handler（批次3） |
| `src/mock/handlers/dashboard.ts` | 仪表盘 handler（批次4） |
| `src/mock/handlers/crud.ts` | CRUD 示例 handler（批次4） |
| `src/mock/handlers/log.ts` | 日志 handler（批次5） |
| `src/mock/handlers/menu-manage.ts` | 菜单管理 handler（批次5） |
| `src/mock/index.ts` | 汇总 `export const handlers = [...]` |
| `src/mock/browser.ts` | `setupWorker(...handlers)` |
| `src/mock/server.ts` | `setupServer(...handlers)`（单元测试） |
| `public/mockServiceWorker.js` | MSW CLI 生成 |
| `src/app/main.ts` | 改：注册流程 |
| `vite.config.ts` | 改：移除 viteMockServe（批次6） |
| `package.json` | 改：加 msw、删 vite-plugin-mock（批次6） |
| `test/mock/apis.spec.ts` | 改：改用 MSW server（批次6） |
| `test/mock/menu-manage.spec.ts` | 改：改用 MSW server（批次6） |
| `.github/workflows/deploy.yml` | 改：demo 构建加 VITE_ENABLE_MOCK（批次6） |

---

## Task 1: 基础设施 + auth/menu handler（批次1）

**目标：** 搭建 MSW 骨架，迁移 auth(4 端点) + menu(1 端点)，dev 切到 MSW 验证登录链路跑通。

**Files:**
- Create: `src/mock/handlers/_utils.ts`
- Create: `src/mock/handlers/auth.ts`
- Create: `src/mock/handlers/menu.ts`
- Create: `src/mock/index.ts`
- Create: `src/mock/browser.ts`
- Create: `src/mock/server.ts`
- Create: `public/mockServiceWorker.js`（CLI 生成）
- Modify: `package.json`（加 msw 依赖）
- Modify: `src/app/main.ts`（注册流程）

**Interfaces:**
- Produces: `src/mock/index.ts` 导出 `handlers: RequestHandler[]`；`src/mock/browser.ts` 导出 `worker: SetupWorkerApi`；`src/mock/server.ts` 导出 `server: SetupServerApi`
- `handlers/_utils.ts` 导出 `ok<T>(data: T, msg?: string)`、`fail(code: number, msg: string)`、`toCsv(rows: object[], headers: string[]): string`

- [ ] **Step 1: 安装 MSW 依赖**

```bash
pnpm add -D msw@^2.6.0
```

- [ ] **Step 2: 生成 Service Worker 文件**

```bash
pnpm exec msw init public/ --save
```

确认 `public/mockServiceWorker.js` 生成。

- [ ] **Step 3: 创建公共工具 `src/mock/handlers/_utils.ts`**

```ts
import { HttpResponse } from 'msw'

// 成功响应：ApiResult 包装（HTTP 200 + code:0）
export const ok = <T>(data: T, msg = 'ok') =>
  HttpResponse.json({ code: 0, data, msg })

// 失败响应：过渡形态 { code:<非0>, msg, data:null }，由拦截器触发 HttpError
export const fail = (code: number, msg: string) =>
  HttpResponse.json({ code, msg, data: null })

// 将对象数组转为 CSV 文本（含表头）。字段含逗号/引号时用双引号包裹并转义。
export function toCsv(rows: object[], headers: string[]): string {
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [headers.join(',')]
  for (const row of rows) {
    const r = row as Record<string, unknown>
    lines.push(headers.map((h) => escape(r[h])).join(','))
  }
  return lines.join('\n')
}
```

- [ ] **Step 4: 创建 `src/mock/handlers/auth.ts`**

把 `src/mock/apis/auth.ts` 的 `USERS`、`TOKENS`、`REFRESH_TOKENS`、`genToken` 原样移植，把 4 个 `MockMethod` 转成 MSW handler。完整转换：

```ts
import { http } from 'msw'
import { ok, fail } from './_utils'

interface MockUser {
  id: string
  username: string
  password: string
  nickname: string
  roles: string[]
  permissions: string[]
}
type SafeUser = Omit<MockUser, 'password'>
interface AuthResultData {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

const USERS: MockUser[] = [
  { id: '1', username: 'admin', password: '123456', nickname: 'Admin', roles: ['super_admin'], permissions: ['*'] },
  { id: '2', username: 'user', password: '123456', nickname: 'User', roles: ['user'], permissions: ['user:read'] }
]

const TOKENS = new Map<string, string>()
const REFRESH_TOKENS = new Map<string, string>()

function genToken(prefix: string, username: string): string {
  const token = `${prefix}_${username}_${Date.now()}_${Math.random().toString(36).slice(2)}`
  TOKENS.set(token, username)
  return token
}

export const authHandlers = [
  http.post('/api/auth/sessions', async ({ request }) => {
    const body = (await request.json()) as { username?: string; password?: string }
    const user = USERS.find((u) => u.username === body.username && u.password === body.password)
    if (!user) return fail(401, '用户名或密码错误')
    const accessToken = genToken('a', user.username)
    const refreshToken = genToken('r', user.username)
    REFRESH_TOKENS.set(refreshToken, user.username)
    return ok<AuthResultData>({ accessToken, refreshToken, expiresIn: 3600 })
  }),
  http.post('/api/auth/tokens/refresh', async ({ request }) => {
    const body = (await request.json()) as { refreshToken?: string }
    const username = body.refreshToken ? REFRESH_TOKENS.get(body.refreshToken) : undefined
    if (!username) return fail(401, 'Invalid refresh token')
    const user = USERS.find((u) => u.username === username)
    if (!user) return fail(401, 'User not found')
    if (body.refreshToken) REFRESH_TOKENS.delete(body.refreshToken)
    const accessToken = genToken('a', user.username)
    const refreshToken = genToken('r', user.username)
    REFRESH_TOKENS.set(refreshToken, user.username)
    return ok<AuthResultData>({ accessToken, refreshToken, expiresIn: 3600 })
  }),
  http.delete('/api/auth/sessions', () => ok<null>(null)),
  http.get('/api/auth/users/me', ({ request }) => {
    const auth = request.headers.get('authorization') ?? ''
    const token = auth.replace(/^Bearer\s+/, '')
    const username = TOKENS.get(token)
    if (!username) return fail(401, 'Unauthorized')
    const user = USERS.find((u) => u.username === username)
    if (!user) return fail(401, 'User not found')
    const { password: _password, ...safe } = user
    void _password
    return ok<SafeUser>(safe)
  })
]
```

- [ ] **Step 5: 创建 `src/mock/handlers/menu.ts`**

把 `src/mock/apis/menu.ts` 的 `ALL_MENUS` 数组与 `/api/system/menus` 端点移植。注意原 mock 根据 token 是否含 `_admin_` 返回全部或仅首页：

```ts
import { http } from 'msw'
import { ok } from './_utils'

// ALL_MENUS 数组原样从 src/mock/apis/menu.ts 移植（含 system 三级结构）
const ALL_MENUS = [/* ...完整移植，与原文件一致... */]

export const menuHandlers = [
  http.get('/api/system/menus', ({ request }) => {
    const auth = request.headers.get('authorization') ?? ''
    const token = auth.replace(/^Bearer\s+/, '')
    const isAdmin = token.includes('_admin_')
    const data = isAdmin ? ALL_MENUS : [ALL_MENUS[0]]
    return ok(data, 'ok')
  })
]
```

> implementer 注意：`ALL_MENUS` 完整内容从 `src/mock/apis/menu.ts` 第 5-158 行原样复制。

- [ ] **Step 6: 创建 `src/mock/index.ts` 汇总**

```ts
import { authHandlers } from './handlers/auth'
import { menuHandlers } from './handlers/menu'

export const handlers = [...authHandlers, ...menuHandlers]
```

- [ ] **Step 7: 创建 `src/mock/browser.ts`**

```ts
import { setupWorker } from 'msw/browser'
import { handlers } from './index'

export const worker = setupWorker(...handlers)
```

- [ ] **Step 8: 创建 `src/mock/server.ts`**

```ts
import { setupServer } from 'msw/node'
import { handlers } from './index'

export const server = setupServer(...handlers)
```

- [ ] **Step 9: 改 `src/app/main.ts` 注册流程**

在 `app.mount('#app')` 前加 bootstrap：

```ts
async function bootstrap() {
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

> 注意：移除原来直接 `app.mount('#app')` 那一行，改由 bootstrap 调用。其余代码（pinia/router/i18n/theme 等）不动。

- [ ] **Step 10: 类型检查 + 启动 dev 验证**

```bash
pnpm type-check
pnpm dev
```

手动验证：浏览器打开 `http://localhost:5173/`，admin/123456 登录，确认进入首页、侧边栏菜单渲染。

- [ ] **Step 11: smoke 验证**

```bash
pnpm smoke
```

Expected: auth.spec.ts + all-pages.spec.ts（首页/菜单相关）通过。

- [ ] **Step 12: 单元测试不回归**

```bash
pnpm test
```

Expected: 全部通过（此阶段未删 vite-plugin-mock，旧 test/mock 仍跑旧 mock）。

- [ ] **Step 13: Commit**

```bash
git add src/mock/handlers/ src/mock/index.ts src/mock/browser.ts src/mock/server.ts public/mockServiceWorker.js package.json src/app/main.ts
git commit -m "feat(mock): add MSW infrastructure with auth/menu handlers"
```

---

## Task 2: user/role/permission handler（批次2）

**目标：** 迁移 user(7) + role(9) + permission(7) = 23 端点。

**Files:**
- Create: `src/mock/handlers/user.ts`
- Create: `src/mock/handlers/role.ts`
- Create: `src/mock/handlers/permission.ts`
- Modify: `src/mock/index.ts`（汇总新 handler）

**Interfaces:**
- Consumes: `handlers/_utils.ts` 的 `ok`/`fail`/`toCsv`
- Produces: 三个域各导出 `userHandlers`/`roleHandlers`/`permissionHandlers`

- [ ] **Step 1: 创建 `src/mock/handlers/user.ts`**

把 `src/mock/apis/user-list.ts` 的 `UserInfo`、`generateUsers`、`users` 数组、`toCsv`（改 import 自 `_utils`）移植，7 个端点转 MSW handler。

转换要点：
- `GET /api/user`：`query` → `new URL(request.url).searchParams`，取 `page/size/keyword/role/status`
- `GET /api/user/:id`：`params.id`
- `POST /api/user`：`await request.json()`
- `PUT /api/user/:id`：`params.id` + `await request.json()`
- `DELETE /api/user/:id`：`params.id`
- `DELETE /api/user`：`await request.json()` 取 `ids`
- `GET /api/user/export`：**必须在 `/:id` 之前**，用 `toCsv` 生成 CSV 文本，`ok(csv, 'success')`

```ts
import { http } from 'msw'
import { ok, fail, toCsv } from './_utils'

interface UserInfo { /* 原样移植 */ }
const generateUsers = (count: number): UserInfo[] => { /* 原样移植 */ }
const users: UserInfo[] = generateUsers(50)

export const userHandlers = [
  http.get('/api/user', ({ request }) => { /* 列表分页过滤 */ }),
  http.get('/api/user/export', () => ok(toCsv(users, ['username','realName','email','phone','role','status','createTime','lastLoginTime']), 'success')),
  http.get('/api/user/:id', ({ params }) => { /* 详情 */ }),
  http.post('/api/user', async ({ request }) => { /* 新增 */ }),
  http.put('/api/user/:id', async ({ request, params }) => { /* 编辑 */ }),
  http.delete('/api/user/:id', ({ params }) => { /* 删除 */ }),
  http.delete('/api/user', async ({ request }) => { /* 批量删除 */ })
]
```

> implementer 注意：各 handler 内部逻辑（过滤、分页切片、字段赋值）从原文件 `response` 函数体原样移植，仅按"转换规则"改请求对象取值方式。

- [ ] **Step 2: 创建 `src/mock/handlers/role.ts`**

同上模式，移植 `src/mock/apis/role.ts` 的 9 个端点（含 `/api/role/:id/permissions` 权限分配、`/api/permission?all=true` 全量）。`rolePermissions` 状态、`generateRoles` 原样移植。

- [ ] **Step 3: 创建 `src/mock/handlers/permission.ts`**

移植 `src/mock/apis/permission.ts` 的 7 个端点。`permissions` 数组、`generatePermissions` 原样移植。

- [ ] **Step 4: 更新 `src/mock/index.ts`**

```ts
import { authHandlers } from './handlers/auth'
import { menuHandlers } from './handlers/menu'
import { userHandlers } from './handlers/user'
import { roleHandlers } from './handlers/role'
import { permissionHandlers } from './handlers/permission'

export const handlers = [
  ...authHandlers,
  ...menuHandlers,
  ...userHandlers,
  ...roleHandlers,
  ...permissionHandlers
]
```

- [ ] **Step 5: type-check + dev 验证**

```bash
pnpm type-check
pnpm dev
```

手动：登录后访问 用户管理 / 角色管理 / 权限管理，列表渲染、新增/编辑/删除 drawer、权限分配。

- [ ] **Step 6: smoke + test**

```bash
pnpm smoke
pnpm test
```

Expected: business.spec.ts 的 user/role/permission 用例通过；test 不回归。

- [ ] **Step 7: Commit**

```bash
git add src/mock/handlers/user.ts src/mock/handlers/role.ts src/mock/handlers/permission.ts src/mock/index.ts
git commit -m "feat(mock): migrate user/role/permission handlers to MSW"
```

---

## Task 3: dept/dict/notice handler（批次3）

**目标：** 迁移 dept(7) + dict(21) + notice(9) = 37 端点。dict 文件最大（759 行），含三层树结构。

**Files:**
- Create: `src/mock/handlers/dept.ts`
- Create: `src/mock/handlers/dict.ts`
- Create: `src/mock/handlers/notice.ts`
- Modify: `src/mock/index.ts`

**Interfaces:**
- Consumes: `_utils` 的 `ok`/`fail`/`toCsv`

- [ ] **Step 1: 创建 `src/mock/handlers/dept.ts`**

移植 `src/mock/apis/dept.ts` 7 端点。`deptList`、`recentDate`、树构建逻辑原样移植。`/export` 在 `/:id` 前。

- [ ] **Step 2: 创建 `src/mock/handlers/dict.ts`**

移植 `src/mock/apis/dict.ts` 21 端点。`DictCategoryInfo`/`DictInfo`/`DictItemInfo` 类型、`generateDictCategories`、三层树状态原样移植。注意 dict 有多个静态路径（`/categories`、`/dicts`、`/items`、各 `/export`）必须在各自 `/:id` 前。

- [ ] **Step 3: 创建 `src/mock/handlers/notice.ts`**

移植 `src/mock/apis/notice.ts` 9 端点。`noticeList`、`fmt`、`NOW`、`DAY` 原样移植。`/export` 在 `/:id` 前。

- [ ] **Step 4: 更新 `src/mock/index.ts`**

追加 `deptHandlers`、`dictHandlers`、`noticeHandlers` 到 `handlers` 数组。

- [ ] **Step 5: type-check + dev 验证**

```bash
pnpm type-check
pnpm dev
```

手动：部门管理（树/列表）、字典管理（三层树+详情）、公告管理（列表+drawer）。

- [ ] **Step 6: smoke + test**

```bash
pnpm smoke
pnpm test
```

Expected: business.spec.ts 的 dept/dict/notice 用例通过；test 不回归。

- [ ] **Step 7: Commit**

```bash
git add src/mock/handlers/dept.ts src/mock/handlers/dict.ts src/mock/handlers/notice.ts src/mock/index.ts
git commit -m "feat(mock): migrate dept/dict/notice handlers to MSW"
```

---

## Task 4: dashboard/crud handler（批次4）

**目标：** 迁移 dashboard(3) + crud(8) = 11 端点。

**Files:**
- Create: `src/mock/handlers/dashboard.ts`
- Create: `src/mock/handlers/crud.ts`
- Modify: `src/mock/index.ts`

- [ ] **Step 1: 创建 `src/mock/handlers/dashboard.ts`**

移植 `src/mock/apis/dashboard.ts` 3 端点（`/api/dashboard/stats`、`/charts`、`/activities`）。`genTrend`、`now`、`fmt` 原样移植。

- [ ] **Step 2: 创建 `src/mock/handlers/crud.ts`**

移植 `src/mock/apis/crud.ts` 8 端点。`CrudRecord`、`crudList`、`success`/`notFound`（改用 `_utils` 的 `ok`/`fail`）、`extractId` 原样移植。注意原 crud 用 `/api/crud/:id` 但 GET 列表用 `current`/`size` 而非 `page`/`size`，保持原样。

- [ ] **Step 3: 更新 `src/mock/index.ts`**

追加 `dashboardHandlers`、`crudHandlers`。

- [ ] **Step 4: type-check + dev 验证**

```bash
pnpm type-check
pnpm dev
```

手动：首页仪表盘渲染（stats/charts/activities）、CRUD 示例页列表+drawer。

- [ ] **Step 5: smoke + test**

```bash
pnpm smoke
pnpm test
```

Expected: all-pages 的首页/CRUD 用例通过；test 不回归。

- [ ] **Step 6: Commit**

```bash
git add src/mock/handlers/dashboard.ts src/mock/handlers/crud.ts src/mock/index.ts
git commit -m "feat(mock): migrate dashboard/crud handlers to MSW"
```

---

## Task 5: log/menu-manage handler（批次5）

**目标：** 迁移 log(12) + menu-manage(7) = 19 端点。含 CSV 导出与菜单树管理。

**Files:**
- Create: `src/mock/handlers/log.ts`
- Create: `src/mock/handlers/menu-manage.ts`
- Modify: `src/mock/index.ts`

- [ ] **Step 1: 创建 `src/mock/handlers/log.ts`**

移植 `src/mock/apis/log.ts` 12 端点（login-log 6 + operation-log 6）。`loginLogs`/`operationLogs`、`recentDateTime`、`toCsv`（改 import 自 `_utils`）原样移植。**关键：每个日志域的 `/export` 与 `/clear` 必须在 `/:id` 之前**（原文件已修正过此顺序，保持一致）。

- [ ] **Step 2: 创建 `src/mock/handlers/menu-manage.ts`**

移植 `src/mock/apis/menu-manage.ts` 7 端点。`MenuRecord`/`RouteMenuNode`/`MenuTreeNode` 类型、`menuIdCounter`、`genId`、菜单树构建/walk 逻辑原样移植。

- [ ] **Step 3: 更新 `src/mock/index.ts`**

追加 `logHandlers`、`menuManageHandlers`。此时全部 95 端点已迁移，`handlers` 数组完整。

- [ ] **Step 4: type-check + dev 验证**

```bash
pnpm type-check
pnpm dev
```

手动：登录日志（列表+导出）、操作日志（列表+导出）、菜单管理（树+新增/编辑 drawer）。

- [ ] **Step 5: smoke + test**

```bash
pnpm smoke
pnpm test
```

Expected: business.spec.ts 的 log 导出用例 + all-pages 的日志/菜单管理用例通过；test 不回归。

- [ ] **Step 6: Commit**

```bash
git add src/mock/handlers/log.ts src/mock/handlers/menu-manage.ts src/mock/index.ts
git commit -m "feat(mock): migrate log/menu-manage handlers to MSW"
```

---

## Task 6: 删除 vite-plugin-mock + 切换单元测试 + 部署配置（批次6）

**目标：** 移除 vite-plugin-mock 依赖与配置，删除 `src/mock/apis/`，单元测试改用 MSW server，deploy.yml 加 demo 开关。

**Files:**
- Delete: `src/mock/apis/`（整个目录）
- Modify: `vite.config.ts`（移除 viteMockServe）
- Modify: `package.json`（删 vite-plugin-mock；mockjs 保留——handler 仍用 `Mock.mock`）
- Modify: `test/mock/apis.spec.ts`（改用 MSW server）
- Modify: `test/mock/menu-manage.spec.ts`（改用 MSW server）
- Modify: `test/setup.ts`（注册 MSW server beforeAll/beforeEach/afterAll）
- Modify: `.github/workflows/deploy.yml`（demo 构建加 `VITE_ENABLE_MOCK`）

- [ ] **Step 1: 改 `test/setup.ts` 启动 MSW server**

```ts
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from '@/mock/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
})
afterAll(() => server.close())
```

> 若 `test/setup.ts` 已有其他 setup（如 EP 注册），保留并追加。

- [ ] **Step 2: 改 `test/mock/apis.spec.ts`**

原测试直接 import `apis/*.ts` 调 `response` 函数。改为通过 MSW server 发真实 HTTP 请求验证。

```ts
import { describe, it, expect } from 'vitest'
import { api } from '@/lib/http/client'

describe('crud mock (MSW)', () => {
  it('name 过滤生效', async () => {
    const all = await api.get('/api/crud', { params: { current: 1, size: 100 } })
    const filtered = await api.get('/api/crud', { params: { current: 1, size: 100, name: '王小虎' } })
    expect(filtered.data.records.length).toBe(all.data.records.length)
    const none = await api.get('/api/crud', { params: { current: 1, size: 100, name: '不存在的名字' } })
    expect(none.data.records.length).toBe(0)
  })
  // 其余用例同理改写
})
```

> implementer 注意：逐个用例改写，断言逻辑保持，仅把"直接调 response 函数"换成"调 api.get/post"。

- [ ] **Step 3: 改 `test/mock/menu-manage.spec.ts`**

同 Step 2 模式，改用 `api.*` 调真实请求（经 MSW server 拦截）。

- [ ] **Step 4: 删除 `src/mock/apis/` 目录**

```bash
git rm -r src/mock/apis/
```

- [ ] **Step 5: 移除 `vite.config.ts` 的 viteMockServe**

删除 `vite.config.ts` 中：
- `import { viteMockServe } from 'vite-plugin-mock'`
- `plugins` 数组里的 `viteMockServe({...})` 块

- [ ] **Step 6: 移除 vite-plugin-mock 依赖**

```bash
pnpm remove vite-plugin-mock
```

> mockjs 保留（handler 仍用 `Mock.mock` 生成随机数据）。

- [ ] **Step 7: 改 `.github/workflows/deploy.yml` demo 构建加开关**

在 Build app 步骤加 `VITE_ENABLE_MOCK`：

```yaml
- name: Build app
  run: pnpm build
  env:
    VITE_BASE: ${{ vars.APP_BASE || '/vue-admin/' }}
    VITE_ENABLE_MOCK: 'true'
```

- [ ] **Step 8: 全量验证**

```bash
pnpm type-check
pnpm lint
pnpm test
pnpm dev   # 手动确认 dev 正常
pnpm smoke
pnpm build   # 确认生产构建成功（默认不打包 MSW）
```

Expected: 全部通过；`pnpm build` 产物不含 msw 代码（`VITE_ENABLE_MOCK` 未设）。

- [ ] **Step 9: 验证 demo 构建**

```bash
VITE_ENABLE_MOCK=true VITE_BASE=/vue-admin/ pnpm build
ls dist/mockServiceWorker.js   # 确认 SW 文件在产物中
grep -l "msw" dist/assets/*.js | head   # 确认 msw 进了 bundle
```

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(mock): remove vite-plugin-mock, switch tests to MSW server, add demo deploy flag"
```

---

## Final Verification

- [ ] `pnpm type-check` 通过
- [ ] `pnpm lint` 通过
- [ ] `pnpm test` 全部通过
- [ ] `pnpm smoke` 25/25 通过
- [ ] `pnpm build`（无 VITE_ENABLE_MOCK）成功，产物不含 msw
- [ ] `VITE_ENABLE_MOCK=true pnpm build` 成功，产物含 `mockServiceWorker.js`
- [ ] 部署到 demo 站点，`https://demo.cncf.vip/vue-admin/` 登录、列表、CRUD 全功能可用

---

## Spec Coverage Check

| Spec 要求 | 对应 Task |
|---|---|
| 目录结构 handlers/ 域内聚 | Task 1-5 |
| handler 组织（原生 http.* + _utils） | Task 1（_utils + auth 示例）+ Task 2-5 |
| 注册流程 main.ts + 动态 import | Task 1 Step 9 |
| 构建开关 VITE_ENABLE_MOCK | Task 6 Step 7 |
| SW 文件生成 | Task 1 Step 2 |
| 6 批迁移 95 端点 | Task 1-5（5 批）+ Task 6（清理）|
| 删 vite-plugin-mock + apis/ | Task 6 Step 4-6 |
| 单元测试改 MSW server | Task 6 Step 1-3 |
| 部署配置 | Task 6 Step 7 |
| 后端集成零影响 | Task 6 验证（默认构建不含 msw）|
