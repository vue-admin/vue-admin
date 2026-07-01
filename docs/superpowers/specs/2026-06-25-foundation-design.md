# Vue Admin 基础模块设计规范（Foundation Design）

> 状态：已确认（待评审）
> 日期：2026-06-25
> 范围：HTTP 客户端、认证、权限、动态路由、错误边界、Mock、测试
> 目标：将本框架打造为面向国际标准的、可开源的 Vue 3 + Element Plus 企业级后台前端基座。

---

## 0. 设计原则

- **面向国际标准优先**：RESTful、RFC 7807、OAuth 2.0（预留）、OpenAPI、OWASP、WCAG 2.2 AA、ICU MessageFormat。
- **单一真相源**：每个能力只有一个落地实现（例如：业务代码只用 `http` 客户端，禁止散落 axios 调用）。
- **可插拔**：`AuthProvider`、`TokenStorage`、`Monitor` 均为接口，默认实现可被替换。
- **不妥协**：不为兼容现状而保留双重契约或冗余设计。旧代码一次性迁移，不并存。
- **小而独立**：每个模块单一职责、明确边界、可独立测试。
- **强类型**：所有对外 API 必须有 TypeScript 类型；禁止 `any`。

---

## 1. 架构分层

### 1.1 目录结构（方案 D）

四层划分：**基础设施层** / **应用骨架层** / **业务领域层** / **共享层**。

```
src/
├── lib/                          # 基础设施：与业务无关，可独立测试
│   ├── http/                     # HTTP 客户端
│   │   ├── client.ts             # axios 单例 + 配置（业务唯一入口）
│   │   ├── interceptors.ts       # 请求/响应拦截器
│   │   ├── problem.ts            # RFC 7807 ProblemDetail 解析
│   │   └── types.ts              # ApiResult / ProblemDetail
│   ├── auth/                     # 认证抽象层
│   │   ├── AuthProvider.ts       # 抽象接口
│   │   ├── JwtAuthProvider.ts    # 默认实现
│   │   ├── TokenStorage.ts       # 存储接口 + 默认实现
│   │   └── authService.ts        # 对外 API：login/logout/refresh/me
│   ├── error/                    # 错误处理
│   │   ├── ErrorBoundary.vue     # 错误边界组件
│   │   ├── monitor.ts            # monitor 接口 + 默认 console 实现
│   │   └── types.ts
│   ├── router/                   # 路由工具（基础设施部分）
│   │   ├── dynamic.ts            # 动态路由装载
│   │   ├── guards.ts             # 全局守卫
│   │   └── types.ts              # RouteMeta 类型扩展
│   └── utils/                    # 纯函数工具
│
├── app/                          # 应用骨架：组装层
│   ├── App.vue
│   ├── main.ts                   # 入口（注册插件、provide、挂载）
│   ├── router/
│   │   ├── index.ts              # router 实例
│   │   └── menus.ts              # 静态路由（无需权限）
│   └── stores/                   # 全局 store（跨领域共享）
│       ├── user.ts               # 当前用户信息 + loadProfile
│       └── permission.ts         # RBAC 查询
│
├── modules/                      # 业务领域：按 domain 聚合
│   ├── user/
│   │   ├── api.ts                # 该领域所有 HTTP 调用
│   │   ├── views/                # 该领域页面
│   │   ├── components/           # 该领域专用组件
│   │   ├── store.ts              # 仅领域内 store（如有）
│   │   └── types.ts
│   ├── system/                   # 系统管理（admin/role/permission/dict/config）
│   ├── crud/                     # 增删改查示例
│   └── auth/                     # 登录、找回密码等业务页面（≠ lib/auth）
│
└── shared/                       # 跨模块共享
    ├── components/               # 通用 UI 组件（无业务语义）
    └── types/                    # 全局通用类型
```

### 1.2 命名约定（关键）

- **`modules/` 装的是"业务领域"**（如 `user`、`system`、`crud`），不是功能切片。一个领域包含该领域全部代码（api/views/components/store），实现**高内聚**。
- **`lib/` 是纯基础设施**，禁止 import `modules/` 或 `app/` 的任何内容。
- **`app/` 是组装层**，依赖 `lib/` 与 `modules/`。
- **`shared/` 是无业务语义的可复用资产**（如通用 UI 组件、类型工具）。

### 1.3 依赖方向（严格单向）

```
modules  ─►  app  ─►  lib
                  ▲
shared  ─────────┘

禁止方向：
  lib    ✗  modules / app
  shared ✗  modules / app / lib（除纯类型）
  app    ✗  （任何回环）
```

- 循环依赖零容忍（通过接口反转解决）。
- `lib/` 模块必须可独立单元测试，不依赖运行时业务状态。

---

## 2. HTTP 客户端 + 认证子系统

### 2.1 HTTP 客户端（`lib/http/`）

#### 入口与命名

- **单例导出**：`lib/http/client.ts` 导出名为 **`http`** 的 axios 实例。
- **业务调用**：`import { http } from '@/lib/http/client'`。
- **不导出 axios 实例本身**给业务；仅暴露 `http.get/post/put/patch/del` 等语义化方法（`del` 替代 `delete`，因后者为关键字）。
- **类型契约**：

```ts
// lib/http/types.ts
export interface ApiResult<T> {
  code: number // 0 = 成功（仅 HTTP 200 时存在）
  data: T
  msg: string
  traceId?: string
}

export interface ProblemDetail {
  // RFC 7807
  type: string // 问题类型 URI
  title: string // 简短摘要
  status: number // HTTP 状态码
  detail: string // 具体说明
  instance?: string // 资源 URI
  code?: string // 应用层错误码（机器可读）
  errors?: Record<string, string[]> // 字段级错误（如表单校验）
  traceId?: string
}
```

#### 拦截器（`lib/http/interceptors.ts`）

- **请求拦截**：自动注入 `Authorization: Bearer <token>`（token 由 `authService` 提供，不直接读 storage）。
- **响应拦截**：
  - HTTP 4xx/5xx：解析响应体为 `ProblemDetail`，抛出 `HttpError`（携带 problem）。
  - HTTP 200 + `code === 0`：解包 `data` 返回业务数据。
  - HTTP 200 + `code !== 0`：**禁止**。新契约下后端必须用合适的状态码；Mock 一次性迁移。
  - HTTP 401：触发 `authService.refresh()`，成功后重放原请求；失败跳 `/login`。

#### 错误处理三层契约

| 层                             | 默认行为                                         | 可覆写                  |
| ------------------------------ | ------------------------------------------------ | ----------------------- |
| `lib/http` 拦截器              | ElMessage 提示 `problem.title`；401 跳登录       | `silent: true` 关闭提示 |
| `modules/<domain>/api.ts`      | 仅返回 `{ data, error }`，不提示                 | 不再处理                |
| `modules/<domain>/views/*.vue` | 检查 `error`，做领域内 UI 反馈（如表单字段高亮） | 自定义                  |

**`silent` 语义明确**：传入表示"业务自己处理错误"，拦截器不做任何全局提示。

### 2.2 AuthProvider 抽象（`lib/auth/AuthProvider.ts`）

```ts
export interface AuthProvider {
  login(credentials: LoginRequest): Promise<AuthResult>
  refresh(refreshToken: string): Promise<AuthResult>
  logout(): Promise<void>
  me(): Promise<UserProfile>
}
```

- **默认实现**：`JwtAuthProvider`，对接 `/api/auth/login`、`/api/auth/refresh`、`/api/auth/logout`、`/api/auth/me`。
- **可替换**：未来对接 OAuth 2.0 Authorization Code 时，实现 `OAuthAuthProvider` 并在 `app/main.ts` 通过 `provide` 注入。

### 2.3 TokenStorage（`lib/auth/TokenStorage.ts`）

```ts
export interface TokenStorage {
  getAccessToken(): string | null
  getRefreshToken(): string | null
  setTokens(access: string, refresh?: string): void
  clear(): void
}

// 默认实现：内存（access）+ sessionStorage（access + refresh）
// 命名空间前缀 'va:'，避免与第三方 key 冲突
export class MemorySessionTokenStorage implements TokenStorage {
  /* ... */
}

// 推荐实现（未来有后端配合时启用）：HttpOnly Cookie
export class HttpOnlyCookieTokenStorage implements TokenStorage {
  /* ... */
}
```

- **默认选 MemorySession 的原因**：当前无后端配合设置 HttpOnly Cookie。
- **不妥协承诺**：当后端具备 Cookie 下发能力时，**必须切换**到 `HttpOnlyCookieTokenStorage`。这是安全要求，非可选项。切换点仅 `app/main.ts` 一处。

### 2.4 authService（`lib/auth/authService.ts`）

```ts
export const authService = {
  async login(req: LoginRequest): Promise<AuthResult>
  async logout(): Promise<void>
  async refresh(): Promise<AuthResult>
  async me(): Promise<UserProfile>
  isAuthenticated(): boolean

  // 内部：并发刷新保护
  // 多个 401 共享同一 refreshPromise，避免刷新风暴
}
```

- **并发刷新保护**：模块级 `refreshPromise: Promise | null`，存在时复用。
- **refresh 失败处理**：清空 token → 跳转 `/login?redirect=...`。

---

## 3. RBAC + 动态路由

### 3.1 权限 Store（`app/stores/permission.ts`）

```ts
export const usePermissionStore = defineStore('permission', () => {
  const userStore = useUserStore()
  const permissions = computed(() => userStore.permissions ?? [])
  const roles = computed(() => userStore.roles ?? [])

  const isSuperAdmin = computed(() => roles.value.includes('super_admin'))

  const hasPermission = (p: string) =>
    isSuperAdmin.value || permissions.value.includes(p)
  const hasAnyPermission = (ps: string[]) =>
    isSuperAdmin.value || ps.some((p) => permissions.value.includes(p))
  const hasAllPermissions = (ps: string[]) =>
    isSuperAdmin.value || ps.every((p) => permissions.value.includes(p))
  const hasRole = (r: string) => isSuperAdmin.value || roles.value.includes(r)
  const hasAnyRole = (rs: string[]) =>
    isSuperAdmin.value || rs.some((r) => roles.value.includes(r))
  const hasAllRoles = (rs: string[]) =>
    isSuperAdmin.value || rs.every((r) => roles.value.includes(r))

  return {
    isSuperAdmin,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    hasAllRoles
  }
})
```

- **super_admin 短路**：所有检查在 store 层统一处理，调用方无需感知。
- **空权限兼容**：未登录或权限为空时返回 `false`，不抛错。

### 3.2 v-permission 指令

```ts
// app/main.ts 注册
app.directive('permission', {
  mounted(el, binding) {
    const store = usePermissionStore()
    if (store.isSuperAdmin) return

    // 值可以是字符串、字符串数组，或对象语法
    // v-permission="'user:create'"
    // v-permission="['user:create', 'user:read']"          → any
    // v-permission="{ all: ['user:create', 'user:read'] }" → all
    const v = binding.value
    let ok = false
    if (typeof v === 'string') ok = store.hasPermission(v)
    else if (Array.isArray(v)) ok = store.hasAnyPermission(v)
    else if (v && typeof v === 'object') {
      ok = v.all
        ? store.hasAllPermissions(v.all)
        : v.any
          ? store.hasAnyPermission(v.any)
          : false
    }
    if (!ok) el.parentNode?.removeChild(el)
  }
})
```

- **语义**：`mounted` 钩子移除 DOM（非 CSS 隐藏），避免绕过。
- **不支持响应式刷新**：权限在登录时一次性加载，运行时不变更。如需变更（如切换角色），由调用方控制组件重建。

### 3.3 路由元信息契约（`lib/router/types.ts`）

```ts
declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    icon?: string
    showMenu?: boolean
    showInBreadcrumb?: boolean
    public?: boolean // 免登录（白名单）
    cache?: boolean // 参与 KeepAlive

    // 权限：明确区分 any / all 语义
    permissions?: {
      any?: string[] // 任一命中即可
      all?: string[] // 全部命中才可
    }
    roles?: {
      any?: string[]
      all?: string[]
    }
  }
}
```

**对象语法的理由**：旧 `permissions: string[]` 模糊（是 any 还是 all？vue-element-admin 是 any，但 ant-design-pro 是 all）。明确为 `{ any?, all? }` 消除歧义。

### 3.4 路由守卫（`lib/router/guards.ts`）

```ts
export function installGuards(router: Router) {
  router.beforeEach(async (to) => {
    const { isAuthenticated } = authService
    const userStore = useUserStore()
    const permStore = usePermissionStore()

    // 1) 白名单
    if (to.meta.public) return true

    // 2) 已认证？
    if (!isAuthenticated()) {
      return { path: '/login', query: { redirect: to.fullPath } }
    }

    // 3) 用户信息 bootstrap
    if (!userStore.isLoaded) {
      try {
        await userStore.loadProfile()
      } catch {
        await authService.logout()
        return { path: '/login' }
      }
    }

    // 4) 权限校验（super_admin 已在 store 内短路）
    const m = to.meta
    if (m.permissions?.any && !permStore.hasAnyPermission(m.permissions.any))
      return false
    if (m.permissions?.all && !permStore.hasAllPermissions(m.permissions.all))
      return false
    if (m.roles?.any && !permStore.hasAnyRole(m.roles.any)) return false
    if (m.roles?.all && !permStore.hasAllRoles(m.roles.all)) return false
    return true
  })
}
```

### 3.5 动态路由装载（`lib/router/dynamic.ts`）

```ts
const modules = import.meta.glob('@/modules/**/*.vue')

export function registerDynamicRoutes(menus: MenuDTO[]) {
  const walk = (list: MenuDTO[]) => {
    for (const m of list) {
      if (m.children?.length) {
        walk(m.children)
        continue
      }
      const key = `/src/modules/${m.component}.vue`
      const loader = modules[key]
      if (!loader) {
        monitor.captureMessage(`[router] 路由组件缺失: ${key}`, 'error')
        continue
      }
      router.addRoute('layout', {
        path: m.path,
        name: m.name,
        component: loader as any,
        meta: { ...m.meta }
      })
    }
  }
  walk(menus)
}
```

- **挂载点**：所有动态路由挂在名为 `layout` 的根路由下。
- **缺失校验**：`modules[...]` 不存在时记 monitor 并跳过，不抛错中断整个装载。

---

## 4. 错误边界 + Mock + 测试

### 4.1 ErrorBoundary（`lib/error/ErrorBoundary.vue`）

```vue
<script setup lang="ts">
import { ref, onErrorCaptured, inject } from 'vue'
import type { Monitor } from '@/lib/error/types'

const monitor = inject<Monitor>('monitor')!
const error = ref<Error | null>(null)

onErrorCaptured((err) => {
  error.value = err as Error
  monitor.captureException(err as Error)
  return false // 阻止向上冒泡
})
</script>

<template>
  <el-result
    v-if="error"
    icon="error"
    title="页面出错了"
    :sub-title="error.message"
  >
    <template #extra>
      <el-button type="primary" @click="error = null">重试</el-button>
    </template>
  </el-result>
  <slot v-else />
</template>
```

### 4.2 Monitor 接口（`lib/error/monitor.ts`）

```ts
import type { Monitor } from './types'

export const consoleMonitor: Monitor = {
  captureException: (e, ctx) => console.error('[monitor]', e, ctx ?? ''),
  captureMessage: (m, l = 'info') => console[l]('[monitor]', m),
  setUser: (u) => console.debug('[monitor] user=', u)
}

// 默认实现：console；生产可在 app/main.ts 中 provide SentryMonitor 替代
export const defaultMonitor: Monitor = consoleMonitor
```

**注入方式（不妥协）**：

```ts
// app/main.ts
import { defaultMonitor } from '@/lib/error/monitor'
app.provide('monitor', defaultMonitor)
```

- **不用 `import.meta.env` 三元判断**：依赖注入更标准、可测试、可在测试中替换。
- **未来接 Sentry**：实现 `SentryMonitor` 并在 `main.ts` 替换 provide 值，一处变更。

### 4.3 Mock 子系统（MSW）

**选型：MSW (Mock Service Worker)**

理由（对比 `vite-plugin-mock`）：

| 维度         | vite-plugin-mock | MSW                                       |
| ------------ | ---------------- | ----------------------------------------- |
| 工作环境     | 仅 Vite dev      | dev / test / preview 通用                 |
| 测试集成     | 弱               | Vitest / Playwright / Storybook 原生支持  |
| API 契约表达 | JS 配置          | 标准 Request/Response                     |
| 业界开源标准 | 国内常用         | 国际开源主流（Storybook、Vercel、Linear） |

**目录结构**：

```
src/
└── mock/
    ├── handlers/             # MSW request handlers
    │   ├── auth.ts
    │   ├── user.ts
    │   ├── system.ts
    │   └── index.ts          # 汇总
    ├── data/                 # Mock 数据
    │   ├── users.ts
    │   └── menus.ts
    └── server.ts             # MSW setup（dev 启动 + 测试启用）
```

**开关与启动**：

- 开发：`app/main.ts` 中根据 `import.meta.env.DEV && import.meta.env.VITE_USE_MOCK` 异步启动 worker。
- 测试：Vitest setup 文件中启动 server（node 环境）。
- 生产构建：MSW 代码不进入 bundle（动态 import + 条件加载）。

**契约**：

- Mock 必须返回与生产一致的结构（`ApiResult` 或 `ProblemDetail`）。
- Mock 账号：`admin / 123456`（super_admin，全权限）、`user / 123456`（普通角色，仅 `user:read`）。

### 4.4 测试（Vitest）

**框架**：Vitest（与 Vite 原生集成，零额外构建）。

**覆盖目标（M5 阶段）**：

| 文件                       | 测试场景                                                |
| -------------------------- | ------------------------------------------------------- |
| `lib/http/interceptors.ts` | 401 → refresh 重放；ProblemDetail 解析；silent 抑制提示 |
| `lib/auth/TokenStorage.ts` | 读写、清空、命名空间隔离                                |
| `lib/auth/authService.ts`  | 并发 refresh 单次触发；refresh 失败跳登录               |
| `lib/router/guards.ts`     | 白名单 / 未登录 / 权限拒绝 / bootstrap 失败 四条路径    |
| `lib/router/dynamic.ts`    | 组件缺失时记 monitor 不中断                             |
| `app/stores/permission.ts` | hasAnyPermission / hasAllPermissions / super_admin 短路 |

**CI 阈值**：本次仅要求新增模块有测试；整体覆盖率阈值后续设定。

---

## 5. 迁移计划（5 阶段，每阶段独立可合入）

### M1 — 目录骨架与基础设施（1–2 天）

- 创建 `lib/`、`app/`、`modules/`、`shared/` 四层目录。
- 新建 `lib/http/`、`lib/error/`、`lib/auth/`（仅类型 + 抽象）。
- 新建 `lib/error/ErrorBoundary.vue`、`lib/error/monitor.ts`。
- `app/main.ts` provide monitor。
- `App.vue` 根部包裹 `<ErrorBoundary>`。
- **验收**：type-check 通过；现有页面无行为变化。

### M2 — HTTP 客户端升级（1 天）

- 落地 `lib/http/client.ts`、`interceptors.ts`、`problem.ts`。
- 移除旧 `apis/client/request.ts`（保留类型迁移到 `lib/http/types.ts`）。
- 业务调用全部改为 `import { http } from '@/lib/http/client'`。
- Mock 层一次性改为返回 RESTful + ProblemDetail（旧 `code !== 0` 不再支持）。
- **验收**：现有 crud/dict/user 业务全部跑通；Mock 错误返回 ProblemDetail。

### M3 — 认证子系统（2–3 天）

- 落地 `lib/auth/` 全部文件。
- 改造 `modules/auth/Login.vue` 使用 `authService.login`。
- 引入 `app/stores/user.ts` 的 `loadProfile()`，路由守卫接入 `isAuthenticated`。
- MSW Mock：`auth/login`、`auth/refresh`、`auth/logout`、`auth/me`。
- **验收**：登录 → 拉取用户信息 → 退出 三条路径走通；并发 401 触发单次 refresh。

### M4 — 动态路由 + 权限（1–2 天）

- 落地 `app/stores/permission.ts`、`lib/router/dynamic.ts`、`lib/router/guards.ts`。
- 注册 `v-permission` 指令。
- MSW Mock `/api/system/menus` 返回带 `permissions`/`roles` 的结构。
- **验收**：不同账户登录看到不同菜单；无权限路由访问被拒绝。

### M5 — 测试 + 文档 + Mock 切换（1 天）

- 编写 §4.4 列出的测试用例。
- 配置 ESLint flat config（强制 `lib/` 不依赖 `modules/`/`app/` 的 import 边界规则）。
- 更新 `docs/standards/` 相关章节。
- README 添加"基础模块架构"链接 + Mock 账号。
- **验收**：`pnpm test`、`pnpm type-check`、`pnpm lint` 均通过。

**总工期**：5–9 天。每个阶段是一个可评审、可独立合入的 PR。

---

## 6. 非目标（YAGNI）

明确**不做**以下内容，避免范围蔓延：

- OAuth 2.0 / OIDC 客户端实现（仅预留 `AuthProvider` 接口）。
- 多语言 i18n（`meta.title` 留翻译钩子，但不在本次实现）。
- 主题切换体系（保留现有暗黑模式即可）。
- SSE / WebSocket 长连接封装。
- 微前端运行时。
- 表单引擎 / 代码生成器。
- Feature-Sliced Design 完整规范（仅取其分层思想，不引入 7 层结构）。

---

## 7. 风险与对策

| 风险                                 | 影响        | 对策                                                                   |
| ------------------------------------ | ----------- | ---------------------------------------------------------------------- |
| 旧业务代码依赖 `code !== 0` 业务契约 | 迁移阻力    | **一刀切**：M2 阶段同步迁移 Mock 与业务代码；不保留双契约              |
| 无后端配合 HttpOnly Cookie           | 安全性降级  | 默认 MemorySession；接口预留；**未来切 Cookie 是强制项**，写入 ADR-003 |
| 动态路由 component 字符串路径错配    | 白屏        | `registerDynamicRoutes` 校验 `modules[...]`，缺失记 monitor 并跳过     |
| 并发 401 触发多次 refresh            | token 失效  | refreshPromise 单例 + 请求队列重放                                     |
| MSW 学习曲线                         | M5 进度风险 | M3 阶段开始用 MSW，提前在 auth 模块练手                                |
| 大规模目录重构                       | 引用断链    | M1 完成后立即跑 type-check；逐模块迁移（非一次性）                     |

---

## 8. 开源就绪验收清单

- [ ] 所有新模块均有 TypeScript 类型导出。
- [ ] `pnpm type-check` 通过。
- [ ] `pnpm lint` 通过（M5 配置 ESLint flat config，含 import 边界规则）。
- [ ] `pnpm test` 通过 §4.4 列出的核心路径。
- [ ] `docs/standards/` 与本设计一致。
- [ ] README 含基础模块架构说明 + MSW Mock 账号。
- [ ] `VITE_USE_MOCK=true` 下完整可跑（dev / test / preview）。
- [ ] `lib/` 模块零业务依赖（通过 ESLint 规则强制）。

---

## 附：ADR 决策记录

- **ADR-001**：采用 RFC 7807 Problem Details 作为唯一错误格式，不保留旧 `code` 业务契约。
- **ADR-002**：业务代码仅允许使用 `lib/http/client.ts` 导出的 `http`；禁止散落 axios。
- **ADR-003**：默认 TokenStorage 为 `MemorySessionTokenStorage`；当后端具备 HttpOnly Cookie 能力时，**必须**切换到 `HttpOnlyCookieTokenStorage`。
- **ADR-004**：采用 `lib/` + `app/` + `modules/` + `shared/` 四层架构；`modules/` 装业务领域，不用 `features/`（语义不符）。
- **ADR-005**：基础设施（HTTP / Auth / Error / Router）一律放 `lib/`，禁止按 `utils/` 类型聚合。
- **ADR-006**：Monitor 通过依赖注入提供（`app.provide('monitor', ...)`），不用环境变量三元判断。
- **ADR-007**：Mock 选 MSW 而非 vite-plugin-mock；前者 dev/test/preview 通用且为国际开源主流。
- **ADR-008**：路由权限 meta 用对象语法 `{ any?, all? }`，消除 any/all 语义模糊。
- **ADR-009**：v-permission 通过 `mounted` 钩子 DOM 移除实现，不依赖 CSS 隐藏。
- **ADR-010**：动态路由挂在 `layout` 命名路由下；权限元信息走扩展的 `RouteMeta`。
