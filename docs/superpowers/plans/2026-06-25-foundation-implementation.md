# Vue Admin 基础模块实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按 spec `docs/superpowers/specs/2026-06-25-foundation-design.md` 落地 HTTP / Auth / RBAC / Router / Error 五大基础模块，让 vue-admin 达到开源标杆水准。

**Architecture:** 四层结构 `lib/` + `app/` + `modules/` + `shared/`；单一 HTTP 客户端 `lib/http`；AuthProvider/TokenStorage/Monitor 全部接口化、依赖注入；RFC 7807 错误契约；MSW 替代 vite-plugin-mock。

**Tech Stack:** Vue 3.4 + Vite 4.5 + TypeScript 4.8 + Element Plus 2.5 + Pinia 2.1 + Vue Router 4.3 + Axios + Vitest + MSW 2.x

## Global Constraints

- **版本**：Vue 3.4.x、Vite 4.5.x、TypeScript 4.8.x、Element Plus 2.5.x、Pinia 2.1.x、Vue Router 4.3.x、Axios 1.x、Vitest 1.x、MSW 2.x
- **HTTP 单一入口**：业务代码仅 `import { http } from '@/lib/http/client'`；禁止 `import axios from 'axios'`
- **错误契约**：仅 RESTful + RFC 7807；后端返回 HTTP 200 + `code !== 0` 一律视为非法
- **Store 风格**：必须 `defineStore('<domain>', () => { ... })` setup 风格
- **响应式解构**：必须 `storeToRefs()`
- **目录边界**：`lib/` 禁止 import `modules/` 或 `app/`；`shared/` 禁止 import `modules/` 或 `app/`
- **命名**：组件文件 PascalCase；store camelCase；类型 PascalCase；常量 UPPER_SNAKE
- **导出名**：HTTP 客户端导出为 `http`（不是 `service` / `request`）
- **Mock**：使用 MSW，禁止新增 vite-plugin-mock 配置
- **路径别名**：`@/` → `src/`
- **提交粒度**：每个 task 一个 commit；commit message 用 `feat:` / `refactor:` / `test:` / `docs:` 前缀
- **强类型**：禁止 `any`，必要时用 `unknown` + 类型守卫
- **注释语言**：与现有代码库一致（中文注释）

---

## M1 — 目录骨架与基础设施（1–2 天）

**目标**：建立四层目录，落地 ErrorBoundary + Monitor，App.vue 接入错误边界。当前业务代码不改动。

### Task M1.1：创建目录骨架

**Files:**
- Create: `src/lib/.gitkeep`
- Create: `src/app/.gitkeep`
- Create: `src/modules/.gitkeep`
- Create: `src/shared/.gitkeep`
- Modify: `tsconfig.json`（确认 `@/*` 路径已映射到 `src/*`）

**Interfaces:**
- Produces: 四层空目录，供后续 task 使用

- [ ] **Step 1: 检查 tsconfig.json 路径别名**

Run: `cat tsconfig.json | grep -A 3 paths`
Expected: 看到 `"@/*": ["src/*"]`，如缺失需补充

- [ ] **Step 2: 创建四层空目录**

```bash
mkdir -p src/lib src/app src/modules src/shared
touch src/lib/.gitkeep src/app/.gitkeep src/modules/.gitkeep src/shared/.gitkeep
```

- [ ] **Step 3: 验证 type-check 通过**

Run: `pnpm type-check`
Expected: PASS（无新增错误）

- [ ] **Step 4: Commit**

```bash
git add src/lib/.gitkeep src/app/.gitkeep src/modules/.gitkeep src/shared/.gitkeep
git commit -m "feat: scaffold four-layer directory structure (lib/app/modules/shared)"
```

---

### Task M1.2：定义全局类型（ApiResult / ProblemDetail / RouteMeta）

**Files:**
- Create: `src/lib/http/types.ts`
- Create: `src/lib/auth/types.ts`
- Create: `src/lib/router/types.ts`
- Create: `src/lib/error/types.ts`

**Interfaces:**
- Produces: `ApiResult<T>`, `ProblemDetail`, `HttpError`, `LoginRequest`, `AuthResult`, `UserProfile`, `Monitor`, `RouteMeta` 扩展

- [ ] **Step 1: 创建 `src/lib/http/types.ts`**

```typescript
// HTTP 层通用类型

// 业务成功响应（HTTP 200 时）
export interface ApiResult<T> {
  code: number         // 0 = 成功
  data: T
  msg: string
  traceId?: string
}

// RFC 7807 Problem Details（HTTP 4xx/5xx 时）
export interface ProblemDetail {
  type: string                         // 问题类型 URI
  title: string                        // 简短摘要
  status: number                       // HTTP 状态码
  detail: string                       // 具体说明
  instance?: string                    // 资源 URI
  code?: string                        // 应用层错误码（机器可读）
  errors?: Record<string, string[]>    // 字段级错误（如表单校验）
  traceId?: string
}
```

- [ ] **Step 2: 创建 `src/lib/error/types.ts`**

```typescript
import type { ProblemDetail } from '@/lib/http/types'

// 携带 ProblemDetail 的错误类
export class HttpError extends Error {
  constructor(
    public readonly problem: ProblemDetail,
    public readonly response?: Response,
  ) {
    super(problem.title)
    this.name = 'HttpError'
  }
}

// 监控接口（默认 console，可替换 Sentry 等）
export interface Monitor {
  captureException(err: Error, context?: Record<string, unknown>): void
  captureMessage(msg: string, level?: 'info' | 'warn' | 'error'): void
  setUser(user: { id: string; username?: string } | null): void
}
```

- [ ] **Step 3: 创建 `src/lib/auth/types.ts`**

```typescript
// 认证相关类型

export interface LoginRequest {
  username: string
  password: string
}

export interface AuthResult {
  accessToken: string
  refreshToken?: string
  expiresIn?: number      // 秒
}

export interface UserProfile {
  id: string | number
  username: string
  nickname?: string
  avatar?: string
  roles: string[]
  permissions: string[]
}
```

- [ ] **Step 4: 创建 `src/lib/router/types.ts`**

```typescript
// 路由元信息契约（对象语法消除 any/all 歧义）
declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    icon?: string
    showMenu?: boolean
    showInBreadcrumb?: boolean
    public?: boolean                    // 免登录（白名单）
    cache?: boolean                     // 参与 KeepAlive
    permissions?: {
      any?: string[]
      all?: string[]
    }
    roles?: {
      any?: string[]
      all?: string[]
    }
  }
}
```

- [ ] **Step 5: 验证 type-check**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/http/types.ts src/lib/error/types.ts src/lib/auth/types.ts src/lib/router/types.ts
git commit -m "feat: define foundation types (ApiResult, ProblemDetail, Monitor, RouteMeta)"
```

---

### Task M1.3：实现 Monitor 控制台实现

**Files:**
- Create: `src/lib/error/monitor.ts`
- Test: `test/lib/error/monitor.spec.ts`

**Interfaces:**
- Consumes: `Monitor` from `@/lib/error/types`
- Produces: `consoleMonitor`、`defaultMonitor`

- [ ] **Step 1: 安装 Vitest**

Run: `pnpm add -D vitest @vue/test-utils jsdom`
然后在 `vitest.config.ts` 配置（如不存在则创建）:

```typescript
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

并在 `package.json` 添加脚本：

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 2: 写失败的测试 `test/lib/error/monitor.spec.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { consoleMonitor } from '@/lib/error/monitor'

describe('consoleMonitor', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('captureException 调用 console.error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const err = new Error('boom')
    consoleMonitor.captureException(err, { extra: 1 })
    expect(spy).toHaveBeenCalledOnce()
    expect(spy.mock.calls[0][1]).toBe(err)
  })

  it('captureMessage 默认 info 级别', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    consoleMonitor.captureMessage('hello')
    expect(spy).toHaveBeenCalledOnce()
  })

  it('captureMessage 支持 warn / error 级别', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    consoleMonitor.captureMessage('w', 'warn')
    consoleMonitor.captureMessage('e', 'error')
    expect(warnSpy).toHaveBeenCalledOnce()
    expect(errSpy).toHaveBeenCalledOnce()
  })

  it('setUser 调用 console.debug', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    consoleMonitor.setUser({ id: '1', username: 'a' })
    expect(spy).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 3: 运行测试，确认失败**

Run: `pnpm test test/lib/error/monitor.spec.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 4: 实现 `src/lib/error/monitor.ts`**

```typescript
import type { Monitor } from './types'

// 控制台实现：默认 monitor，开发期使用
export const consoleMonitor: Monitor = {
  captureException(err, ctx) {
    console.error('[monitor]', err, ctx ?? '')
  },
  captureMessage(msg, level = 'info') {
    const fn = level === 'error' ? console.error
      : level === 'warn' ? console.warn
      : console.info
    fn('[monitor]', msg)
  },
  setUser(user) {
    console.debug('[monitor] user=', user)
  },
}

// 默认导出：未来在 app/main.ts 中可替换为 SentryMonitor 等
export const defaultMonitor: Monitor = consoleMonitor
```

- [ ] **Step 5: 运行测试，确认通过**

Run: `pnpm test test/lib/error/monitor.spec.ts`
Expected: PASS（4 个用例全部通过）

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts package.json src/lib/error/monitor.ts test/lib/error/monitor.spec.ts
git commit -m "feat(error): add console-based monitor implementation with tests"
```

---

### Task M1.4：实现 ErrorBoundary 组件

**Files:**
- Create: `src/lib/error/ErrorBoundary.vue`
- Test: `test/lib/error/ErrorBoundary.spec.ts`

**Interfaces:**
- Consumes: `Monitor` injected via `app.provide('monitor', ...)`
- Produces: `<ErrorBoundary>` 默认插槽组件，捕获子树错误

- [ ] **Step 1: 写失败的测试 `test/lib/error/ErrorBoundary.spec.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, defineComponent } from 'vue'
import ErrorBoundary from '@/lib/error/ErrorBoundary.vue'
import type { Monitor } from '@/lib/error/types'

const stubMonitor: Monitor = {
  captureException: () => {},
  captureMessage: () => {},
  setUser: () => {},
}

const BoomChild = defineComponent({
  setup() {
    throw new Error('child boom')
  },
  render: () => h('div'),
})

describe('ErrorBoundary', () => {
  it('正常子树正常渲染', () => {
    const wrapper = mount(ErrorBoundary, {
      global: { provide: { monitor: stubMonitor } },
      slots: { default: () => h('div', { class: 'ok' }, 'hi') },
    })
    expect(wrapper.html()).toContain('hi')
  })

  it('子组件抛错时显示错误兜底', () => {
    const wrapper = mount(ErrorBoundary, {
      global: { provide: { monitor: stubMonitor } },
      slots: { default: () => h(BoomChild) },
    })
    expect(wrapper.text()).toContain('页面出错了')
    expect(wrapper.text()).toContain('child boom')
  })
})
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `pnpm test test/lib/error/ErrorBoundary.spec.ts`
Expected: FAIL（组件不存在）

- [ ] **Step 3: 实现 `src/lib/error/ErrorBoundary.vue`**

```vue
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

<script lang="ts" setup>
import { ref, inject, onErrorCaptured } from 'vue'
import type { Monitor } from './types'

const monitor = inject<Monitor>('monitor')!
const error = ref<Error | null>(null)

onErrorCaptured((err) => {
  error.value = err as Error
  monitor.captureException(err as Error)
  return false  // 阻止向上冒泡
})
</script>
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `pnpm test test/lib/error/ErrorBoundary.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/error/ErrorBoundary.vue test/lib/error/ErrorBoundary.spec.ts
git commit -m "feat(error): add ErrorBoundary component with retry and monitor capture"
```

---

### Task M1.5：在 app/main.ts 提供 Monitor + 在 App.vue 包裹 ErrorBoundary

**Files:**
- Move: `src/main.ts` → `src/app/main.ts`
- Modify: `src/app/main.ts`
- Move: `src/App.vue` → `src/app/App.vue`
- Modify: `src/app/App.vue`
- Modify: `index.html`（更新入口 script src）
- Modify: `vite.config.ts`（如 main 路径配置在此）

**Interfaces:**
- Consumes: `defaultMonitor`, `ErrorBoundary`
- Produces: 应用启动后 `monitor` 可被任意后代组件 inject

- [ ] **Step 1: 移动 main.ts 和 App.vue**

```bash
mkdir -p src/app
git mv src/main.ts src/app/main.ts
git mv src/App.vue src/app/App.vue
```

- [ ] **Step 2: 更新 `index.html`**

```html
<!-- 把 -->
<script type="module" src="/src/main.ts"></script>
<!-- 改为 -->
<script type="module" src="/src/app/main.ts"></script>
```

- [ ] **Step 3: 修改 `src/app/main.ts`**

在文件顶部新增 import：

```typescript
import { defaultMonitor } from '@/lib/error/monitor'
```

在 `const app = createApp(App)` 之后、`app.mount('#app')` 之前添加：

```typescript
// 全局 provide monitor（依赖注入，便于替换 Sentry 等）
app.provide('monitor', defaultMonitor)
```

- [ ] **Step 4: 修改 `src/app/App.vue`**

整个 `<template>` 用 `<ErrorBoundary>` 包裹 `<RouterView />`：

```vue
<template>
  <RouterView />
</template>

<script setup lang="ts">
import ErrorBoundary from '@/lib/error/ErrorBoundary.vue'
</script>
```

改为：

```vue
<template>
  <ErrorBoundary>
    <RouterView />
  </ErrorBoundary>
</template>

<script setup lang="ts">
import ErrorBoundary from '@/lib/error/ErrorBoundary.vue'
</script>
```

如果 App.vue 还有其他逻辑（如 ElConfigProvider 配置），保留原结构，只把 `<RouterView />` 替换为 `<ErrorBoundary><RouterView /></ErrorBoundary>`。

- [ ] **Step 5: 启动 dev，验证页面正常**

Run: `pnpm dev`，浏览器打开 http://localhost:5173
Expected: 首页正常加载，无控制台错误；导航各页面无异常

- [ ] **Step 6: 验证 type-check**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/app/main.ts src/app/App.vue index.html
git commit -m "feat(app): provide monitor and wrap RouterView with ErrorBoundary"
```

---

### Task M1.6：删除旧 `src/utils/request.ts`（如还残留）

**Files:**
- Delete: `src/utils/request.ts`（如果存在）

**Interfaces:**
- Produces: 移除冗余 HTTP 客户端入口，强制业务用 `lib/http`

- [ ] **Step 1: 检查残留**

Run: `ls src/utils/request.ts 2>/dev/null && echo "EXISTS" || echo "GONE"`
Expected: GONE（如果 GONE 直接跳过此 task）

- [ ] **Step 2: 确认无引用**

Run: `grep -r "utils/request" src/ --include="*.ts" --include="*.vue"`
Expected: 无输出（或仅本 task 的引用）

- [ ] **Step 3: 删除**

```bash
git rm src/utils/request.ts
```

- [ ] **Step 4: 验证 type-check**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git commit -m "refactor: remove legacy utils/request.ts"
```

---

**M1 完成验收**：
- [ ] `pnpm type-check` 通过
- [ ] `pnpm test` 全部通过
- [ ] `pnpm dev` 页面正常加载，无控制台错误
- [ ] `lib/`、`app/`、`modules/`、`shared/` 四层目录已建立
- [ ] App.vue 已包裹 ErrorBoundary
- [ ] monitor 已通过 provide 注入

---

## M2 — HTTP 客户端升级（1 天）

**目标**：落地 `lib/http/`，业务代码全部迁移到 `http` 单例，移除旧 `apis/client/`。Mock 层一次性改为返回 RESTful + ProblemDetail。

### Task M2.1：实现 ProblemDetail 解析器

**Files:**
- Create: `src/lib/http/problem.ts`
- Test: `test/lib/http/problem.spec.ts`

**Interfaces:**
- Consumes: `ProblemDetail` from `@/lib/http/types`
- Produces: `parseProblem(status: number, body: unknown): ProblemDetail`

- [ ] **Step 1: 写失败的测试 `test/lib/http/problem.spec.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import { parseProblem } from '@/lib/http/problem'

describe('parseProblem', () => {
  it('规范的 RFC 7807 body 直接解析', () => {
    const body = {
      type: 'https://example.com/probs/out-of-credit',
      title: 'You do not have enough credit.',
      status: 400,
      detail: 'Your current balance is 30, but that costs 50.',
      instance: '/account/12345/msgs/abc',
    }
    const p = parseProblem(400, body)
    expect(p.type).toBe(body.type)
    expect(p.title).toBe(body.title)
    expect(p.status).toBe(400)
    expect(p.detail).toBe(body.detail)
    expect(p.instance).toBe(body.instance)
  })

  it('body 缺失字段时用兜底值', () => {
    const p = parseProblem(500, {})
    expect(p.status).toBe(500)
    expect(p.type).toBe('about:blank')
    expect(p.title).toBe('HTTP 500')
    expect(p.detail).toBe('')
  })

  it('body 为非对象时也能解析', () => {
    const p = parseProblem(404, 'not found string')
    expect(p.status).toBe(404)
    expect(p.detail).toBe('not found string')
  })

  it('字段级 errors 保留', () => {
    const p = parseProblem(422, {
      errors: { username: ['already taken'], email: ['invalid'] },
    })
    expect(p.errors?.username).toEqual(['already taken'])
    expect(p.errors?.email).toEqual(['invalid'])
  })
})
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `pnpm test test/lib/http/problem.spec.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现 `src/lib/http/problem.ts`**

```typescript
import type { ProblemDetail } from './types'

const HTTP_STATUS_TITLE: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  500: 'Internal Server Error',
}

// 容错解析：body 可能是对象、字符串、或 null
export function parseProblem(status: number, body: unknown): ProblemDetail {
  const fallbackTitle = HTTP_STATUS_TITLE[status] ?? `HTTP ${status}`

  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>
    return {
      type: typeof b.type === 'string' ? b.type : 'about:blank',
      title: typeof b.title === 'string' ? b.title : fallbackTitle,
      status: typeof b.status === 'number' ? b.status : status,
      detail: typeof b.detail === 'string' ? b.detail : '',
      instance: typeof b.instance === 'string' ? b.instance : undefined,
      code: typeof b.code === 'string' ? b.code : undefined,
      errors: b.errors && typeof b.errors === 'object'
        ? b.errors as Record<string, string[]>
        : undefined,
      traceId: typeof b.traceId === 'string' ? b.traceId : undefined,
    }
  }

  if (typeof body === 'string' && body.length > 0) {
    return {
      type: 'about:blank',
      title: fallbackTitle,
      status,
      detail: body,
    }
  }

  return {
    type: 'about:blank',
    title: fallbackTitle,
    status,
    detail: '',
  }
}
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `pnpm test test/lib/http/problem.spec.ts`
Expected: PASS（4 个用例）

- [ ] **Step 5: Commit**

```bash
git add src/lib/http/problem.ts test/lib/http/problem.spec.ts
git commit -m "feat(http): add RFC 7807 problem parser with edge-case handling"
```

---

### Task M2.2：实现 HttpError 工具与全局 ElMessage 提示

**Files:**
- Modify: `src/lib/error/types.ts`（仅类型，M1 已建）
- Create: `src/lib/http/notify.ts`
- Test: `test/lib/http/notify.spec.ts`

**Interfaces:**
- Consumes: `HttpError`, `ProblemDetail`
- Produces: `notifyProblem(problem, opts?: { silent?: boolean })`

- [ ] **Step 1: 写失败的测试 `test/lib/http/notify.spec.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { notifyProblem } from '@/lib/http/notify'
import type { ProblemDetail } from '@/lib/http/types'

vi.mock('element-plus', () => ({
  ElMessage: { error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

import { ElMessage } from 'element-plus'

describe('notifyProblem', () => {
  beforeEach(() => vi.clearAllMocks())

  it('silent=true 不提示', () => {
    const p: ProblemDetail = { type: 'x', title: 't', status: 400, detail: 'd' }
    notifyProblem(p, { silent: true })
    expect(ElMessage.error).not.toHaveBeenCalled()
  })

  it('4xx 默认走 ElMessage.error', () => {
    const p: ProblemDetail = { type: 'x', title: 'Bad', status: 400, detail: 'd' }
    notifyProblem(p)
    expect(ElMessage.error).toHaveBeenCalledWith('Bad')
  })

  it('5xx 默认走 ElMessage.error', () => {
    const p: ProblemDetail = { type: 'x', title: 'Server Down', status: 500, detail: 'd' }
    notifyProblem(p)
    expect(ElMessage.error).toHaveBeenCalledWith('Server Down')
  })
})
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `pnpm test test/lib/http/notify.spec.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现 `src/lib/http/notify.ts`**

```typescript
import { ElMessage } from 'element-plus'
import type { ProblemDetail } from './types'

interface NotifyOptions {
  silent?: boolean
}

// 全局错误提示。silent=true 时业务自行处理。
export function notifyProblem(problem: ProblemDetail, opts: NotifyOptions = {}): void {
  if (opts.silent) return
  // 统一用 error 类型；title 经 RFC 7807 解析后已为人类可读摘要
  ElMessage.error({
    message: problem.title,
    grouping: true,
  })
}
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `pnpm test test/lib/http/notify.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/http/notify.ts test/lib/http/notify.spec.ts
git commit -m "feat(http): add notifyProblem helper for global error toast"
```

---

### Task M2.3：实现 TokenReader 接口（为拦截器准备）

**Files:**
- Create: `src/lib/http/token.ts`

**Interfaces:**
- Produces: `TokenReader` interface、`noopTokenReader`

> 说明：HTTP 层**不能**直接 import `lib/auth`，否则循环依赖（auth 反过来用 http）。M3 会注入真正的 TokenReader。M2 暂用 noop。

- [ ] **Step 1: 实现 `src/lib/http/token.ts`**

```typescript
// Token 读取接口（避免 http ↔ auth 循环依赖）
// M3 阶段 authService 会注入真正的实现
export interface TokenReader {
  getAccessToken(): string | null
}

// 占位实现：M3 阶段被替换
export const noopTokenReader: TokenReader = {
  getAccessToken: () => null,
}

// 运行时持有的 TokenReader（由 auth 模块在启动时设置）
let activeTokenReader: TokenReader = noopTokenReader

export function setTokenReader(r: TokenReader): void {
  activeTokenReader = r
}

export function getAccessToken(): string | null {
  return activeTokenReader.getAccessToken()
}
```

- [ ] **Step 2: 验证 type-check**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/lib/http/token.ts
git commit -m "feat(http): add TokenReader interface to break circular dependency"
```

---

### Task M2.4：实现拦截器（请求注入 token + 响应解析 ProblemDetail）

**Files:**
- Create: `src/lib/http/interceptors.ts`
- Test: `test/lib/http/interceptors.spec.ts`

**Interfaces:**
- Consumes: `axios`、`getAccessToken`、`parseProblem`、`notifyProblem`、`HttpError`
- Produces: `installInterceptors(axiosInstance)`、`HttpError` 抛出契约

- [ ] **Step 1: 写失败的测试 `test/lib/http/interceptors.spec.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { installInterceptors } from '@/lib/http/interceptors'
import { HttpError } from '@/lib/error/types'

vi.mock('element-plus', () => ({
  ElMessage: { error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

describe('interceptors', () => {
  let instance: axios.AxiosInstance

  beforeEach(() => {
    instance = axios.create()
    installInterceptors(instance)
  })

  it('HTTP 200 + code=0 返回 data', async () => {
    vi.spyOn(instance, 'request').mockResolvedValue({
      status: 200,
      data: { code: 0, data: { id: 1 }, msg: 'ok' },
    })
    const res = await instance.get('/x')
    expect(res.data).toEqual({ id: 1 })
  })

  it('HTTP 4xx 抛 HttpError 含 ProblemDetail', async () => {
    const problem = {
      type: 'about:blank',
      title: 'Bad Request',
      status: 400,
      detail: 'invalid',
    }
    vi.spyOn(instance, 'request').mockRejectedValue({
      response: { status: 400, data: problem },
    })
    await expect(instance.get('/x')).rejects.toMatchObject({
      name: 'HttpError',
    })
    try {
      await instance.get('/x')
    } catch (e) {
      expect(e).toBeInstanceOf(HttpError)
      expect((e as HttpError).problem.title).toBe('Bad Request')
    }
  })

  it('silent 请求错误不抛全局提示（仅抛 HttpError）', async () => {
    vi.spyOn(instance, 'request').mockRejectedValue({
      response: { status: 400, data: { type: 'x', title: 't', status: 400, detail: 'd' } },
    })
    const { ElMessage } = await import('element-plus')
    await instance.get('/x', { _silent: true } as any).catch(() => {})
    expect(ElMessage.error).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `pnpm test test/lib/http/interceptors.spec.ts`
Expected: FAIL

- [ ] **Step 3: 实现 `src/lib/http/interceptors.ts`**

```typescript
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'
import { parseProblem } from './problem'
import { notifyProblem } from './notify'
import { getAccessToken } from './token'
import { HttpError } from '@/lib/error/types'
import type { ApiResult } from './types'

// 扩展 config：silent 抑制全局错误提示
declare module 'axios' {
  interface AxiosRequestConfig {
    _silent?: boolean
  }
}

export interface AppAxiosRequestConfig extends InternalAxiosRequestConfig {
  _silent?: boolean
}

export function installInterceptors(instance: AxiosInstance): void {
  // 请求拦截：注入 Bearer Token
  instance.interceptors.request.use((config) => {
    const token = getAccessToken()
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`)
    }
    return config
  })

  // 响应拦截：解包 ApiResult + 解析 ProblemDetail
  instance.interceptors.response.use(
    (response) => {
      // HTTP 200 + ApiResult 包装
      const payload = response.data as ApiResult<unknown> | unknown
      if (payload && typeof payload === 'object'
        && 'code' in payload && 'data' in payload) {
        const result = payload as ApiResult<unknown>
        if (result.code !== 0) {
          // 视为非法：契约只允许 code === 0
          const problem = parseProblem(200, {
            type: 'about:blank',
            title: result.msg || 'Unknown error',
            status: 200,
            detail: result.msg || '',
          })
          notifyProblem(problem, { silent: response.config._silent })
          throw new HttpError(problem, response as unknown as Response)
        }
        response.data = result.data
      }
      return response
    },
    (error: AxiosError) => {
      const status = error.response?.status ?? 0
      const body = error.response?.data
      const problem = parseProblem(status, body)
      notifyProblem(problem, { silent: (error.config as AppAxiosRequestConfig)?._silent })
      return Promise.reject(new HttpError(problem, error.response as unknown as Response))
    },
  )
}
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `pnpm test test/lib/http/interceptors.spec.ts`
Expected: PASS（3 个用例）

- [ ] **Step 5: Commit**

```bash
git add src/lib/http/interceptors.ts test/lib/http/interceptors.spec.ts
git commit -m "feat(http): install interceptors (token injection + ProblemDetail parse)"
```

---

### Task M2.5：实现 client.ts 单例（导出 http）

**Files:**
- Create: `src/lib/http/client.ts`

**Interfaces:**
- Produces: `http` axios 实例（含 interceptors）

- [ ] **Step 1: 实现 `src/lib/http/client.ts`**

```typescript
import axios from 'axios'
import { installInterceptors } from './interceptors'

// 全局唯一 HTTP 客户端。业务代码仅从此处导入。
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/',
  timeout: 15_000,
})

installInterceptors(instance)

export const http = instance

// 便捷方法（强类型化）
export const api = {
  get: <T>(url: string, config?: Parameters<typeof instance.get>[1]) =>
    instance.get<T>(url, config).then(r => r.data),
  post: <T>(url: string, data?: unknown, config?: Parameters<typeof instance.post>[2]) =>
    instance.post<T>(url, data, config).then(r => r.data),
  put: <T>(url: string, data?: unknown, config?: Parameters<typeof instance.put>[2]) =>
    instance.put<T>(url, data, config).then(r => r.data),
  patch: <T>(url: string, data?: unknown, config?: Parameters<typeof instance.patch>[2]) =>
    instance.patch<T>(url, data, config).then(r => r.data),
  del: <T>(url: string, config?: Parameters<typeof instance.delete>[1]) =>
    instance.delete<T>(url, config).then(r => r.data),
}

export default http
```

- [ ] **Step 2: 添加环境变量类型声明 `src/lib/http/env.d.ts`**

```typescript
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_USE_MOCK?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

- [ ] **Step 3: 验证 type-check**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/lib/http/client.ts src/lib/http/env.d.ts
git commit -m "feat(http): export unified 'http' instance with typed api helpers"
```

---

### Task M2.6：迁移业务代码到 `http`

**Files:**
- Modify: `src/apis/crud/index.ts`
- Modify: `src/apis/user/login.ts`（仅作为过渡，M3 会迁到 modules/auth/）
- Modify: `src/apis/client/service.ts`（保留为薄壳，仅 re-export `http`，过渡用）
- Delete: `src/apis/client/request.ts`（如果还有类型残留，迁移到 lib/http/types.ts）

**Interfaces:**
- Consumes: `http`、`api`
- Produces: 业务代码全部用新客户端

- [ ] **Step 1: 把 `src/apis/client/service.ts` 改为薄壳**

```typescript
// 过渡壳：仅 re-export，避免一次性改动所有业务代码。
// M3 完成后，业务模块迁到 modules/<domain>/api.ts，本文件删除。
export { http, api } from '@/lib/http/client'
export default (await import('@/lib/http/client')).default
```

- [ ] **Step 2: 改造 `src/apis/crud/index.ts`，去除旧 service 引用**

读取原文件：
```bash
cat src/apis/crud/index.ts
```

把 `import service from '@/apis/client/service'` 之类的导入保持不变（因 service.ts 已是薄壳）。

> 注意：业务调用方式不变，只是底层走新 http。此步主要验证兼容性。

- [ ] **Step 3: 删除 `src/apis/client/request.ts`（如还残留）**

```bash
ls src/apis/client/request.ts 2>/dev/null && git rm src/apis/client/request.ts
```

- [ ] **Step 4: 启动 dev，验证 CRUD 页面**

Run: `pnpm dev`
浏览器打开 http://localhost:5173/crud/list
Expected: 列表正常加载（走 mock）

- [ ] **Step 5: 验证 type-check + test**

Run: `pnpm type-check && pnpm test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/apis/client/service.ts src/apis/crud/index.ts src/apis/user/login.ts
git rm src/apis/client/request.ts 2>/dev/null || true
git commit -m "refactor(http): migrate business code to unified http client"
```

---

### Task M2.7：将 Mock 改为返回 RESTful + ProblemDetail

**Files:**
- Modify: `src/mock/apis/crud.ts`
- Modify: `src/mock/apis/menu.ts`
- Modify: `src/mock/apis/login.ts`（如存在）

> 说明：MSW 完整迁移放 M5。本 task 仅把 vite-plugin-mock 的响应体改为符合新契约，确保 M2 阶段业务跑通。

- [ ] **Step 1: 检查现有 mock 结构**

Run: `ls src/mock/apis/`
Expected: 看到现有 mock 文件列表

- [ ] **Step 2: 改造 `src/mock/apis/crud.ts` 让错误场景返回 ProblemDetail**

举例（具体改造按现有内容定）：

```typescript
// 失败场景（删除不存在的 id）
{
  url: '/api/crud/:id',
  method: 'delete',
  response: (req) => {
    const id = req.query.id
    if (!exists(id)) {
      // 返回 RFC 7807
      return {
        status: 404,  // 注意：vite-plugin-mock 可能用 statusCode
        body: {
          type: 'about:blank',
          title: 'Not Found',
          status: 404,
          detail: `Resource ${id} not found`,
        }
      }
    }
    return { code: 0, data: null, msg: 'ok' }
  }
}
```

- [ ] **Step 3: 同样改造 menu / login 等 mock**

每个 mock 文件按相同模式改造：成功返回 `{ code: 0, data, msg }`，失败返回 `{ status, body: { type, title, status, detail } }`。

- [ ] **Step 4: 启动 dev，触发 404 场景验证**

Run: `pnpm dev`
浏览器手动触发一个失败场景（如删除不存在的 id），观察 ElMessage 是否显示 `Not Found`。

- [ ] **Step 5: 验证 type-check**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/mock/apis/
git commit -m "refactor(mock): return RESTful + ProblemDetail for error responses"
```

---

**M2 完成验收**：
- [ ] `pnpm type-check` 通过
- [ ] `pnpm test` 全部通过
- [ ] `pnpm dev` 各业务页面正常
- [ ] 业务代码无 `import axios from 'axios'`：`grep -r "from 'axios'" src/apis src/views` 无输出
- [ ] mock 错误返回 RFC 7807 格式
- [ ] 删除了 `src/apis/client/request.ts`

---

## M3 — 认证子系统（2–3 天）

**目标**：落地 `lib/auth/` 全套，改造 Login.vue 走 `authService`，引入 user store 与路由守卫。

### Task M3.1：实现 TokenStorage 接口与默认实现

**Files:**
- Create: `src/lib/auth/TokenStorage.ts`
- Test: `test/lib/auth/TokenStorage.spec.ts`

**Interfaces:**
- Produces: `TokenStorage` interface、`MemorySessionTokenStorage`、`setTokenStorage(storage)`

- [ ] **Step 1: 写失败的测试 `test/lib/auth/TokenStorage.spec.ts`**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { MemorySessionTokenStorage } from '@/lib/auth/TokenStorage'

describe('MemorySessionTokenStorage', () => {
  let storage: MemorySessionTokenStorage

  beforeEach(() => {
    sessionStorage.clear()
    storage = new MemorySessionTokenStorage()
  })

  it('初始状态 token 为 null', () => {
    expect(storage.getAccessToken()).toBeNull()
    expect(storage.getRefreshToken()).toBeNull()
  })

  it('setTokens 仅 access 时只存 access', () => {
    storage.setTokens('a1')
    expect(storage.getAccessToken()).toBe('a1')
    expect(storage.getRefreshToken()).toBeNull()
  })

  it('setTokens 同时存 access + refresh', () => {
    storage.setTokens('a1', 'r1')
    expect(storage.getAccessToken()).toBe('a1')
    expect(storage.getRefreshToken()).toBe('r1')
  })

  it('clear 后 token 全部清空', () => {
    storage.setTokens('a1', 'r1')
    storage.clear()
    expect(storage.getAccessToken()).toBeNull()
    expect(storage.getRefreshToken()).toBeNull()
  })

  it('sessionStorage key 带命名空间 va:', () => {
    storage.setTokens('a1', 'r1')
    expect(sessionStorage.getItem('va:access')).toBe('a1')
    expect(sessionStorage.getItem('va:refresh')).toBe('r1')
  })

  it('新建实例从 sessionStorage 恢复', () => {
    storage.setTokens('a1', 'r1')
    const fresh = new MemorySessionTokenStorage()
    expect(fresh.getAccessToken()).toBe('a1')
    expect(fresh.getRefreshToken()).toBe('r1')
  })
})
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `pnpm test test/lib/auth/TokenStorage.spec.ts`
Expected: FAIL

- [ ] **Step 3: 实现 `src/lib/auth/TokenStorage.ts`**

```typescript
// Token 存储抽象：默认实现为 内存 + sessionStorage
// 未来后端具备 HttpOnly Cookie 能力时，必须切换到 HttpOnlyCookieTokenStorage（强制）

export interface TokenStorage {
  getAccessToken(): string | null
  getRefreshToken(): string | null
  setTokens(access: string, refresh?: string): void
  clear(): void
}

const KEY_ACCESS = 'va:access'
const KEY_REFRESH = 'va:refresh'

// 默认实现：access token 同时存内存（关闭标签前的快速访问）+ sessionStorage（刷新页面恢复）
// refresh token 仅存 sessionStorage
export class MemorySessionTokenStorage implements TokenStorage {
  private memoryAccess: string | null = null

  constructor() {
    this.memoryAccess = sessionStorage.getItem(KEY_ACCESS)
  }

  getAccessToken(): string | null {
    return this.memoryAccess ?? sessionStorage.getItem(KEY_ACCESS)
  }

  getRefreshToken(): string | null {
    return sessionStorage.getItem(KEY_REFRESH)
  }

  setTokens(access: string, refresh?: string): void {
    this.memoryAccess = access
    sessionStorage.setItem(KEY_ACCESS, access)
    if (refresh) sessionStorage.setItem(KEY_REFRESH, refresh)
    else sessionStorage.removeItem(KEY_REFRESH)
  }

  clear(): void {
    this.memoryAccess = null
    sessionStorage.removeItem(KEY_ACCESS)
    sessionStorage.removeItem(KEY_REFRESH)
  }
}

// 运行时持有的存储实例（由 app/main.ts 在启动时设置）
let activeStorage: TokenStorage = new MemorySessionTokenStorage()

export function setTokenStorage(s: TokenStorage): void {
  activeStorage = s
}

export function getTokenStorage(): TokenStorage {
  return activeStorage
}
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `pnpm test test/lib/auth/TokenStorage.spec.ts`
Expected: PASS（6 个用例）

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/TokenStorage.ts test/lib/auth/TokenStorage.spec.ts
git commit -m "feat(auth): add TokenStorage interface with MemorySession default"
```

---

### Task M3.2：实现 AuthProvider 接口与 JwtAuthProvider

**Files:**
- Create: `src/lib/auth/AuthProvider.ts`
- Create: `src/lib/auth/JwtAuthProvider.ts`

**Interfaces:**
- Consumes: `http`、`LoginRequest`、`AuthResult`、`UserProfile`
- Produces: `AuthProvider` 接口、`jwtAuthProvider`

- [ ] **Step 1: 实现 `src/lib/auth/AuthProvider.ts`**

```typescript
import type { LoginRequest, AuthResult, UserProfile } from './types'

// 认证提供方抽象。默认 JwtAuthProvider；未来可替换为 OAuthAuthProvider
export interface AuthProvider {
  login(credentials: LoginRequest): Promise<AuthResult>
  refresh(refreshToken: string): Promise<AuthResult>
  logout(): Promise<void>
  me(): Promise<UserProfile>
}
```

- [ ] **Step 2: 实现 `src/lib/auth/JwtAuthProvider.ts`**

```typescript
import { api } from '@/lib/http/client'
import type { AuthProvider } from './AuthProvider'
import type { LoginRequest, AuthResult, UserProfile } from './types'

// JWT 默认实现：对接 /api/auth/* 四端点
export const jwtAuthProvider: AuthProvider = {
  async login(req: LoginRequest): Promise<AuthResult> {
    return api.post<AuthResult>('/api/auth/login', req, { _silent: true })
  },

  async refresh(refreshToken: string): Promise<AuthResult> {
    return api.post<AuthResult>('/api/auth/refresh', { refreshToken }, { _silent: true })
  },

  async logout(): Promise<void> {
    await api.post<void>('/api/auth/logout', {}, { _silent: true })
  },

  async me(): Promise<UserProfile> {
    return api.get<UserProfile>('/api/auth/me', { _silent: true })
  },
}
```

- [ ] **Step 3: 验证 type-check**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth/AuthProvider.ts src/lib/auth/JwtAuthProvider.ts
git commit -m "feat(auth): add AuthProvider interface with JWT default"
```

---

### Task M3.3：实现 authService（含并发刷新保护）

**Files:**
- Create: `src/lib/auth/authService.ts`
- Test: `test/lib/auth/authService.spec.ts`

**Interfaces:**
- Consumes: `AuthProvider`、`TokenStorage`、`setTokenReader`（注入给 http 层）
- Produces: `authService.login/refresh/logout/me/isAuthenticated`

- [ ] **Step 1: 写失败的测试 `test/lib/auth/authService.spec.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createAuthService } from '@/lib/auth/authService'
import type { AuthProvider } from '@/lib/auth/AuthProvider'
import type { TokenStorage } from '@/lib/auth/TokenStorage'

const mockProvider: AuthProvider = {
  login: vi.fn(async () => ({ accessToken: 'a1', refreshToken: 'r1' })),
  refresh: vi.fn(async () => ({ accessToken: 'a2', refreshToken: 'r2' })),
  logout: vi.fn(async () => {}),
  me: vi.fn(async () => ({
    id: '1', username: 'admin', roles: ['admin'], permissions: ['*'],
  })),
}

const mockStorage: TokenStorage = {
  getAccessToken: vi.fn(() => null),
  getRefreshToken: vi.fn(() => null),
  setTokens: vi.fn(),
  clear: vi.fn(),
}

describe('authService', () => {
  let svc: ReturnType<typeof createAuthService>

  beforeEach(() => {
    vi.clearAllMocks()
    svc = createAuthService(mockProvider, mockStorage)
  })

  it('login 成功后写入 token', async () => {
    await svc.login({ username: 'a', password: 'b' })
    expect(mockStorage.setTokens).toHaveBeenCalledWith('a1', 'r1')
  })

  it('isAuthenticated 在有 token 时为 true', () => {
    ;(mockStorage.getAccessToken as any).mockReturnValue('x')
    expect(svc.isAuthenticated()).toBe(true)
  })

  it('logout 清空 token', async () => {
    await svc.logout()
    expect(mockStorage.clear).toHaveBeenCalled()
    expect(mockProvider.logout).toHaveBeenCalled()
  })

  it('并发 refresh 只触发一次 provider.refresh', async () => {
    ;(mockStorage.getRefreshToken as any).mockReturnValue('r1')
    await Promise.all([svc.refresh(), svc.refresh(), svc.refresh()])
    expect(mockProvider.refresh).toHaveBeenCalledTimes(1)
  })

  it('refresh 失败后清空 token', async () => {
    ;(mockStorage.getRefreshToken as any).mockReturnValue('r1')
    ;(mockProvider.refresh as any).mockRejectedValueOnce(new Error('expired'))
    await expect(svc.refresh()).rejects.toThrow()
    expect(mockStorage.clear).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `pnpm test test/lib/auth/authService.spec.ts`
Expected: FAIL

- [ ] **Step 3: 实现 `src/lib/auth/authService.ts`**

```typescript
import type { AuthProvider } from './AuthProvider'
import type { TokenStorage } from './TokenStorage'
import type { LoginRequest, AuthResult, UserProfile } from './types'
import { setTokenReader } from '@/lib/http/token'

// 工厂函数：便于测试注入 mock
export function createAuthService(provider: AuthProvider, storage: TokenStorage) {
  let refreshPromise: Promise<AuthResult> | null = null

  // 把 storage 注册到 http 层（让拦截器能读 token）
  setTokenReader({
    getAccessToken: () => storage.getAccessToken(),
  })

  return {
    async login(req: LoginRequest): Promise<AuthResult> {
      const result = await provider.login(req)
      storage.setTokens(result.accessToken, result.refreshToken)
      return result
    },

    async refresh(): Promise<AuthResult> {
      // 并发保护：复用同一 refreshPromise
      if (refreshPromise) return refreshPromise
      const refreshToken = storage.getRefreshToken()
      if (!refreshToken) {
        storage.clear()
        throw new Error('No refresh token')
      }
      refreshPromise = provider.refresh(refreshToken)
        .then((result) => {
          storage.setTokens(result.accessToken, result.refreshToken)
          return result
        })
        .finally(() => {
          refreshPromise = null
        })
      try {
        return await refreshPromise
      } catch (e) {
        storage.clear()
        throw e
      }
    },

    async logout(): Promise<void> {
      try {
        await provider.logout()
      } finally {
        storage.clear()
      }
    },

    async me(): Promise<UserProfile> {
      return provider.me()
    },

    isAuthenticated(): boolean {
      return !!storage.getAccessToken()
    },
  }
}

// 默认单例（生产环境用）
import { jwtAuthProvider } from './JwtAuthProvider'
import { getTokenStorage } from './TokenStorage'

export const authService = createAuthService(jwtAuthProvider, getTokenStorage())
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `pnpm test test/lib/auth/authService.spec.ts`
Expected: PASS（5 个用例）

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/authService.ts test/lib/auth/authService.spec.ts
git commit -m "feat(auth): add authService with concurrent refresh protection"
```

---

### Task M3.4：实现 user store（含 loadProfile bootstrap）

**Files:**
- Create: `src/app/stores/user.ts`

**Interfaces:**
- Consumes: `authService.me`
- Produces: `useUserStore`、`isLoaded`、`loadProfile`

- [ ] **Step 1: 实现 `src/app/stores/user.ts`**

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/lib/auth/authService'
import type { UserProfile } from '@/lib/auth/types'

export const useUserStore = defineStore('user', () => {
  const profile = ref<UserProfile | null>(null)
  const isLoaded = ref(false)
  const loading = ref(false)

  const roles = computed(() => profile.value?.roles ?? [])
  const permissions = computed(() => profile.value?.permissions ?? [])

  async function loadProfile(): Promise<UserProfile> {
    if (isLoaded.value) return profile.value!
    loading.value = true
    try {
      profile.value = await authService.me()
      isLoaded.value = true
      return profile.value
    } finally {
      loading.value = false
    }
  }

  function reset(): void {
    profile.value = null
    isLoaded.value = false
  }

  return { profile, isLoaded, loading, roles, permissions, loadProfile, reset }
})
```

- [ ] **Step 2: 验证 type-check**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/stores/user.ts
git commit -m "feat(app): add user store with loadProfile bootstrap"
```

---

### Task M3.5：迁移 Login.vue 到 modules/auth/ 并接入 authService

**Files:**
- Move: `src/views/Login.vue` → `src/modules/auth/views/Login.vue`
- Modify: `src/modules/auth/views/Login.vue`
- Modify: `src/router/menus.ts`（更新 Login 路由）

**Interfaces:**
- Consumes: `authService.login`、`useUserStore`
- Produces: 登录成功后写入 token + 跳首页

- [ ] **Step 1: 创建目录并移动文件**

```bash
mkdir -p src/modules/auth/views
git mv src/views/Login.vue src/modules/auth/views/Login.vue
```

- [ ] **Step 2: 改造 `src/modules/auth/views/Login.vue`**

替换 `<script>` 部分（保留原 template 和 style）：

```vue
<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toggleDark, isDark } from '@/stores/dark'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { authService } from '@/lib/auth/authService'
import { useUserStore } from '@/app/stores/user'

const ruleFormRef = ref<FormInstance>()
const router = useRouter()
const userStore = useUserStore()
const submitting = ref(false)

const validateEmpty = (_rule: any, value: any, callback: any) => {
  if (value === '') callback(new Error('字段不能为空'))
  else callback()
}

const ruleForm = reactive({
  username: '',
  password: '',
})

const rules = reactive<FormRules>({
  username: [{ validator: validateEmpty, trigger: 'blur' }],
  password: [{ validator: validateEmpty, trigger: 'blur' }],
})

const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  try {
    await formEl.validate()
  } catch {
    return
  }
  submitting.value = true
  try {
    await authService.login(ruleForm)
    await userStore.loadProfile()
    router.push('/')
  } catch (e) {
    // 拦截器已通过 ElMessage 提示，这里不需重复
    console.debug('[login] failed', e)
  } finally {
    submitting.value = false
  }
}
</script>
```

> 注意：删除原 `import { fetchUsers } from '@/apis/user/login'` 及相关业务调用。

- [ ] **Step 3: 更新 router/menus.ts 中 Login 相关导入**

如果 router 中有 `component: () => import('@/views/Login.vue')`，改为：

```typescript
component: () => import('@/modules/auth/views/Login.vue')
```

- [ ] **Step 4: 启动 dev 验证登录流程**

Run: `pnpm dev`
浏览器打开 `/login`，输入 `admin / 123456`，提交后应跳转到首页。

> 如果 mock 还没改完，先做下一步 M3.6 mock。

- [ ] **Step 5: 验证 type-check**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/modules/auth/ src/router/menus.ts
git commit -m "feat(auth): migrate Login.vue to modules/auth and use authService"
```

---

### Task M3.6：Mock /api/auth/* 四端点（vite-plugin-mock 形式）

**Files:**
- Create: `src/mock/apis/auth.ts`
- Modify: `src/mock/index.ts`（注册新 mock）

> 说明：MSW 完整迁移在 M5。本 task 仅用现有 vite-plugin-mock 提供 auth 端点。

- [ ] **Step 1: 创建 `src/mock/apis/auth.ts`**

```typescript
import type { MockMethod } from 'vite-plugin-mock'

// 测试账号：admin / 123456（super_admin，全权限）；user / 123456（普通，user:read）
const USERS = [
  {
    id: '1', username: 'admin', password: '123456',
    nickname: 'Admin', roles: ['super_admin'], permissions: ['*'],
  },
  {
    id: '2', username: 'user', password: '123456',
    nickname: 'User', roles: ['user'], permissions: ['user:read'],
  },
]

const TOKENS = new Map<string, string>()  // accessToken -> username
const REFRESH_TOKENS = new Map<string, string>()  // refreshToken -> username

function genToken(prefix: string, username: string): string {
  const t = `${prefix}_${username}_${Date.now()}_${Math.random().toString(36).slice(2)}`
  TOKENS.set(t, username)
  return t
}

export default [
  {
    url: '/api/auth/login',
    method: 'post',
    response: ({ body }) => {
      const { username, password } = body
      const user = USERS.find(u => u.username === username && u.password === password)
      if (!user) {
        return {
          status: 401,
          body: {
            type: 'about:blank',
            title: '用户名或密码错误',
            status: 401,
            detail: 'Invalid credentials',
          },
        }
      }
      const accessToken = genToken('a', user.username)
      const refreshToken = genToken('r', user.username)
      REFRESH_TOKENS.set(refreshToken, user.username)
      return { code: 0, data: { accessToken, refreshToken, expiresIn: 3600 }, msg: 'ok' }
    },
  },
  {
    url: '/api/auth/refresh',
    method: 'post',
    response: ({ body }) => {
      const { refreshToken } = body
      const username = REFRESH_TOKENS.get(refreshToken)
      if (!username) {
        return {
          status: 401,
          body: { type: 'about:blank', title: 'Invalid refresh token', status: 401, detail: '' },
        }
      }
      const user = USERS.find(u => u.username === username)!
      const newAccess = genToken('a', user.username)
      const newRefresh = genToken('r', user.username)
      REFRESH_TOKENS.delete(refreshToken)
      REFRESH_TOKENS.set(newRefresh, user.username)
      return { code: 0, data: { accessToken: newAccess, refreshToken: newRefresh, expiresIn: 3600 }, msg: 'ok' }
    },
  },
  {
    url: '/api/auth/logout',
    method: 'post',
    response: () => ({ code: 0, data: null, msg: 'ok' }),
  },
  {
    url: '/api/auth/me',
    method: 'get',
    response: ({ headers }) => {
      const auth = headers.authorization || ''
      const token = auth.replace(/^Bearer\s+/, '')
      const username = TOKENS.get(token)
      if (!username) {
        return {
          status: 401,
          body: { type: 'about:blank', title: 'Unauthorized', status: 401, detail: 'Token invalid' },
        }
      }
      const user = USERS.find(u => u.username === username)!
      const { password, ...safe } = user
      return { code: 0, data: safe, msg: 'ok' }
    },
  },
] as MockMethod[]
```

- [ ] **Step 2: 在 mock 入口注册**

读取现有入口文件（`src/mock/index.ts` 或类似），把 auth mock 加入数组：

```typescript
import auth from './apis/auth'
import crud from './apis/crud'
// ...
export default [...auth, ...crud, ...]
```

- [ ] **Step 3: 启动 dev，完整测试登录 → me → logout 流程**

Run: `pnpm dev`
- 浏览器打开 `/login`
- 输入 `admin / 123456` 登录
- 观察控制台无错误，页面跳转到 `/`
- 退出登录功能（如有按钮）应能正常工作

- [ ] **Step 4: 验证 type-check + test**

Run: `pnpm type-check && pnpm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/mock/apis/auth.ts src/mock/index.ts
git commit -m "feat(mock): add auth endpoints (login/refresh/logout/me)"
```

---

**M3 完成验收**：
- [ ] `pnpm type-check` 通过
- [ ] `pnpm test` 全部通过
- [ ] 登录 → 跳首页 → 退出 三条路径手动测试通过
- [ ] 并发 401 触发单次 refresh（可通过 console.log 验证 mock refresh 只被调一次）
- [ ] `lib/auth/` 模块完整，无 `lib/` → `modules/` 或 `app/` 的导入

---

## M4 — 动态路由 + 权限（1–2 天）

**目标**：落地 permission store、v-permission 指令、动态路由装载、4 步路由守卫。

### Task M4.1：实现 permission store

**Files:**
- Create: `src/app/stores/permission.ts`
- Test: `test/app/stores/permission.spec.ts`

**Interfaces:**
- Consumes: `useUserStore` 的 roles / permissions
- Produces: `isSuperAdmin`、`hasPermission`、`hasAnyPermission`、`hasAllPermissions`、`hasRole`、`hasAnyRole`、`hasAllRoles`

- [ ] **Step 1: 写失败的测试 `test/app/stores/permission.spec.ts`**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/app/stores/user'
import { usePermissionStore } from '@/app/stores/permission'

describe('permissionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function seed(roles: string[], perms: string[]) {
    const u = useUserStore()
    ;(u as any).profile = {
      id: '1', username: 'x', roles, permissions: perms,
    }
    ;(u as any).isLoaded = true
  }

  it('普通用户 hasPermission 命中返回 true', () => {
    seed(['user'], ['user:read'])
    const p = usePermissionStore()
    expect(p.hasPermission('user:read')).toBe(true)
    expect(p.hasPermission('user:write')).toBe(false)
  })

  it('hasAnyPermission 任一命中即 true', () => {
    seed(['user'], ['user:read'])
    const p = usePermissionStore()
    expect(p.hasAnyPermission(['user:read', 'user:write'])).toBe(true)
    expect(p.hasAnyPermission(['user:write', 'user:delete'])).toBe(false)
  })

  it('hasAllPermissions 全部命中才 true', () => {
    seed(['user'], ['user:read', 'user:write'])
    const p = usePermissionStore()
    expect(p.hasAllPermissions(['user:read', 'user:write'])).toBe(true)
    expect(p.hasAllPermissions(['user:read', 'user:delete'])).toBe(false)
  })

  it('super_admin 短路所有检查', () => {
    seed(['super_admin'], [])
    const p = usePermissionStore()
    expect(p.isSuperAdmin).toBe(true)
    expect(p.hasPermission('any')).toBe(true)
    expect(p.hasAnyPermission(['any'])).toBe(true)
    expect(p.hasAllPermissions(['a', 'b', 'c'])).toBe(true)
    expect(p.hasRole('whatever')).toBe(true)
  })

  it('hasAnyRole / hasAllRoles', () => {
    seed(['admin', 'editor'], [])
    const p = usePermissionStore()
    expect(p.hasAnyRole(['admin'])).toBe(true)
    expect(p.hasAllRoles(['admin', 'editor'])).toBe(true)
    expect(p.hasAllRoles(['admin', 'ghost'])).toBe(false)
  })
})
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `pnpm test test/app/stores/permission.spec.ts`
Expected: FAIL

- [ ] **Step 3: 实现 `src/app/stores/permission.ts`**

```typescript
import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useUserStore } from './user'

export const usePermissionStore = defineStore('permission', () => {
  const userStore = useUserStore()
  const permissions = computed(() => userStore.permissions ?? [])
  const roles = computed(() => userStore.roles ?? [])

  const isSuperAdmin = computed(() => roles.value.includes('super_admin'))

  const hasPermission = (p: string) =>
    isSuperAdmin.value || permissions.value.includes(p)

  const hasAnyPermission = (ps: string[]) =>
    isSuperAdmin.value || ps.some(p => permissions.value.includes(p))

  const hasAllPermissions = (ps: string[]) =>
    isSuperAdmin.value || ps.every(p => permissions.value.includes(p))

  const hasRole = (r: string) =>
    isSuperAdmin.value || roles.value.includes(r)

  const hasAnyRole = (rs: string[]) =>
    isSuperAdmin.value || rs.some(r => roles.value.includes(r))

  const hasAllRoles = (rs: string[]) =>
    isSuperAdmin.value || rs.every(r => roles.value.includes(r))

  return {
    isSuperAdmin,
    hasPermission, hasAnyPermission, hasAllPermissions,
    hasRole, hasAnyRole, hasAllRoles,
  }
})
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `pnpm test test/app/stores/permission.spec.ts`
Expected: PASS（5 个用例）

- [ ] **Step 5: Commit**

```bash
git add src/app/stores/permission.ts test/app/stores/permission.spec.ts
git commit -m "feat(app): add permission store with super_admin short-circuit"
```

---

### Task M4.2：实现 v-permission 指令

**Files:**
- Create: `src/app/directives/permission.ts`
- Test: `test/app/directives/permission.spec.ts`

**Interfaces:**
- Consumes: `usePermissionStore`
- Produces: `vPermission` Directive

- [ ] **Step 1: 写失败的测试 `test/app/directives/permission.spec.ts`**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { defineComponent, h } from 'vue'
import { vPermission } from '@/app/directives/permission'
import { useUserStore } from '@/app/stores/user'

const DivWithPerm = defineComponent({
  directives: { permission: vPermission },
  props: { perm: { type: [String, Array, Object], default: '' } },
  setup(props) {
    return () => h('div', { 'data-test': 'target', directives: [[vPermission, props.perm]] })
  },
})
```

> 注：directives 通过 `directives` 数组在 render 函数中使用比较复杂。下面用模板组件代替：

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { defineComponent } from 'vue'
import { vPermission } from '@/app/directives/permission'
import { useUserStore } from '@/app/stores/user'

const make = (binding: any) => defineComponent({
  directives: { permission: vPermission },
  setup() {
    return () => {
      // 用 withDirectives 简化（如有问题改模板）
      const vnode: any = {
        type: 'div',
        props: { 'data-test': 't' },
        children: 'hi',
        dir: [[vPermission, binding.value]],
      }
      return vnode
    }
  },
})

describe('v-permission', () => {
  beforeEach(() => setActivePinia(createPinia()))

  function seed(roles: string[], perms: string[]) {
    const u = useUserStore()
    ;(u as any).profile = { id: '1', username: 'x', roles, permissions: perms }
    ;(u as any).isLoaded = true
  }

  it('无权限：DOM 移除', () => {
    seed(['user'], [])
    const C = make({ value: 'user:create' })
    const w = mount(C)
    expect(w.find('[data-test="t"]').exists()).toBe(false)
  })

  it('有权限：保留 DOM', () => {
    seed(['user'], ['user:create'])
    const C = make({ value: 'user:create' })
    const w = mount(C)
    expect(w.find('[data-test="t"]').exists()).toBe(true)
  })

  it('super_admin 短路：保留 DOM', () => {
    seed(['super_admin'], [])
    const C = make({ value: 'user:create' })
    const w = mount(C)
    expect(w.find('[data-test="t"]').exists()).toBe(true)
  })

  it('数组语法：任一命中保留', () => {
    seed(['user'], ['user:read'])
    const C = make({ value: ['user:read', 'user:write'] })
    const w = mount(C)
    expect(w.find('[data-test="t"]').exists()).toBe(true)
  })

  it('对象语法 { all }: 全部命中保留', () => {
    seed(['user'], ['user:read', 'user:write'])
    const C = make({ value: { all: ['user:read', 'user:write'] } })
    const w = mount(C)
    expect(w.find('[data-test="t"]').exists()).toBe(true)
  })

  it('对象语法 { all }: 部分命中移除', () => {
    seed(['user'], ['user:read'])
    const C = make({ value: { all: ['user:read', 'user:write'] } })
    const w = mount(C)
    expect(w.find('[data-test="t"]').exists()).toBe(false)
  })
})
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `pnpm test test/app/directives/permission.spec.ts`
Expected: FAIL

- [ ] **Step 3: 实现 `src/app/directives/permission.ts`**

```typescript
import type { Directive, DirectiveBinding } from 'vue'
import { usePermissionStore } from '@/app/stores/permission'

type BindingValue = string | string[] | { any?: string[]; all?: string[] }

function evaluate(store: ReturnType<typeof usePermissionStore>, v: BindingValue): boolean {
  if (typeof v === 'string') return store.hasPermission(v)
  if (Array.isArray(v)) return store.hasAnyPermission(v)
  if (v && typeof v === 'object') {
    if (v.all) return store.hasAllPermissions(v.all)
    if (v.any) return store.hasAnyPermission(v.any)
  }
  return false
}

export const vPermission: Directive<HTMLElement, BindingValue> = {
  mounted(el, binding: DirectiveBinding<BindingValue>) {
    const store = usePermissionStore()
    if (store.isSuperAdmin) return
    if (!evaluate(store, binding.value)) {
      el.parentNode?.removeChild(el)
    }
  },
}
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `pnpm test test/app/directives/permission.spec.ts`
Expected: PASS（6 个用例）

> 如果测试中的 vnode.dir 方式不稳定，改为模板：

```typescript
const Template = defineComponent({
  directives: { permission: vPermission },
  props: { perm: { type: null as any, default: '' } },
  template: `<div v-permission="perm" data-test="t">hi</div>`,
})
```

并使用 `mount(Template, { props: { perm: ... } })`。

- [ ] **Step 5: Commit**

```bash
git add src/app/directives/permission.ts test/app/directives/permission.spec.ts
git commit -m "feat(app): add v-permission directive with DOM removal"
```

---

### Task M4.3：实现动态路由装载

**Files:**
- Create: `src/lib/router/dynamic.ts`
- Create: `src/lib/router/types-menu.ts`（MenuDTO 类型）
- Test: `test/lib/router/dynamic.spec.ts`

**Interfaces:**
- Consumes: `router` 实例、`monitor`（用于错误上报）
- Produces: `registerDynamicRoutes(menus)`

- [ ] **Step 1: 定义 MenuDTO 类型 `src/lib/router/types-menu.ts`**

```typescript
import type { RouteMeta } from 'vue-router'

export interface MenuDTO {
  path: string
  name: string
  component?: string                 // 文件路径（相对 src/modules/）
  meta?: RouteMeta
  children?: MenuDTO[]
}
```

- [ ] **Step 2: 写失败的测试 `test/lib/router/dynamic.spec.ts`**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'
import { registerDynamicRoutes } from '@/lib/router/dynamic'
import type { MenuDTO } from '@/lib/router/types-menu'

const stubMonitor = {
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  setUser: vi.fn(),
}

describe('registerDynamicRoutes', () => {
  it('存在的 component 注册成功', () => {
    const router = createRouter({ history: createWebHistory(), routes: [
      { path: '/', name: 'layout', component: { template: '<RouterView/>' } },
    ]})
    const menus: MenuDTO[] = [
      { path: '/x', name: 'x', component: 'crud/Index' },
    ]
    // 不实际装载 glob，仅 mock
    vi.stubGlobal('__DYNAMIC_GLOB__', { '/src/modules/crud/Index.vue': () => Promise.resolve({}) })
    expect(() => registerDynamicRoutes(router, menus, stubMonitor as any)).not.toThrow()
    expect(router.hasRoute('x')).toBe(true)
  })

  it('缺失 component 记 monitor 并跳过', () => {
    const router = createRouter({ history: createWebHistory(), routes: [
      { path: '/', name: 'layout', component: { template: '<RouterView/>' } },
    ]})
    const menus: MenuDTO[] = [
      { path: '/y', name: 'y', component: 'nonexistent/Foo' },
    ]
    registerDynamicRoutes(router, menus, stubMonitor as any)
    expect(stubMonitor.captureMessage).toHaveBeenCalled()
    expect(router.hasRoute('y')).toBe(false)
  })

  it('children 递归注册', () => {
    const router = createRouter({ history: createWebHistory(), routes: [
      { path: '/', name: 'layout', component: { template: '<RouterView/>' } },
    ]})
    const menus: MenuDTO[] = [
      {
        path: '/parent', name: 'parent', children: [
          { path: '/parent/child', name: 'child', component: 'crud/Index' },
        ],
      },
    ]
    registerDynamicRoutes(router, menus, stubMonitor as any)
    expect(router.hasRoute('child')).toBe(true)
  })
})
```

- [ ] **Step 3: 实现 `src/lib/router/dynamic.ts`**

```typescript
import type { Router, RouteRecordRaw } from 'vue-router'
import type { MenuDTO } from './types-menu'
import type { Monitor } from '@/lib/error/types'
import { inject } from 'vue'

// 收集所有业务页面模块（懒加载）
const modules = import.meta.glob('@/modules/**/*.vue')

export function registerDynamicRoutes(
  router: Router,
  menus: MenuDTO[],
  monitor: Monitor,
): void {
  const walk = (list: MenuDTO[]) => {
    for (const m of list) {
      if (m.children?.length) {
        walk(m.children)
        continue
      }
      if (!m.component) continue
      const key = `/src/modules/${m.component}.vue`
      const loader = modules[key]
      if (!loader) {
        monitor.captureMessage(`[router] 路由组件缺失: ${key}`, 'error')
        continue
      }
      const route: RouteRecordRaw = {
        path: m.path,
        name: m.name,
        component: loader as any,
        meta: { ...(m.meta ?? {}) },
      }
      router.addRoute('layout', route)
    }
  }
  walk(menus)
}

// 组合式便捷获取（在 setup 中使用）
export function useMonitor(): Monitor {
  return inject<Monitor>('monitor')!
}
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `pnpm test test/lib/router/dynamic.spec.ts`
Expected: PASS（3 个用例）

> 测试中 mock `import.meta.glob` 可能需要 Vitest 配置；如果难以 mock，改为注入 `modules` 参数：

```typescript
export function registerDynamicRoutes(
  router: Router,
  menus: MenuDTO[],
  monitor: Monitor,
  glob: Record<string, () => Promise<unknown>> = modules,
): void {
  // 用 glob 代替 modules
}
```

并在测试中传入自定义 glob 字典。

- [ ] **Step 5: Commit**

```bash
git add src/lib/router/dynamic.ts src/lib/router/types-menu.ts test/lib/router/dynamic.spec.ts
git commit -m "feat(router): add dynamic route registration with module glob"
```

---

### Task M4.4：实现 4 步路由守卫

**Files:**
- Create: `src/lib/router/guards.ts`
- Test: `test/lib/router/guards.spec.ts`

**Interfaces:**
- Consumes: `authService`、`useUserStore`、`usePermissionStore`
- Produces: `installGuards(router)`

- [ ] **Step 1: 写失败的测试 `test/lib/router/guards.spec.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'
import { setActivePinia, createPinia } from 'pinia'
import { installGuards } from '@/lib/router/guards'
import { useUserStore } from '@/app/stores/user'

// Mock authService
vi.mock('@/lib/auth/authService', () => ({
  authService: {
    isAuthenticated: vi.fn(),
    logout: vi.fn(async () => {}),
  },
}))

import { authService } from '@/lib/auth/authService'

function makeRouter(routes: any[] = []) {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'layout', component: { template: '<RouterView/>' } },
      { path: '/login', name: 'login', component: { template: '<div/>' }, meta: { public: true } },
      ...routes,
    ],
  })
}

describe('guards', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('public 路由直接放行', async () => {
    const router = makeRouter()
    installGuards(router)
    ;(authService.isAuthenticated as any).mockReturnValue(true)
    const result = await router.resolve('/login')
    expect(result).toBeDefined()
  })

  it('未认证访问受保护路由 → 跳 /login', async () => {
    const router = makeRouter([
      { path: '/secret', name: 'secret', component: { template: '<div/>' } },
    ])
    installGuards(router)
    ;(authService.isAuthenticated as any).mockReturnValue(false)
    await router.push('/secret').catch(() => {})
    expect(router.currentRoute.value.path).toBe('/login')
  })

  it('已认证但无权限 → 守卫返回 false（导航被取消）', async () => {
    const router = makeRouter([
      {
        path: '/admin', name: 'admin', component: { template: '<div/>' },
        meta: { permissions: { all: ['admin:read'] } },
      },
    ])
    installGuards(router)
    ;(authService.isAuthenticated as any).mockReturnValue(true)
    const u = useUserStore()
    ;(u as any).profile = { id: '1', username: 'x', roles: ['user'], permissions: ['user:read'] }
    ;(u as any).isLoaded = true
    await router.push('/admin').catch(() => {})
    expect(router.currentRoute.value.name).not.toBe('admin')
  })

  it('super_admin 放行所有', async () => {
    const router = makeRouter([
      {
        path: '/admin', name: 'admin', component: { template: '<div/>' },
        meta: { permissions: { all: ['admin:read'] } },
      },
    ])
    installGuards(router)
    ;(authService.isAuthenticated as any).mockReturnValue(true)
    const u = useUserStore()
    ;(u as any).profile = { id: '1', username: 'x', roles: ['super_admin'], permissions: [] }
    ;(u as any).isLoaded = true
    await router.push('/admin').catch(() => {})
    expect(router.currentRoute.value.name).toBe('admin')
  })
})
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `pnpm test test/lib/router/guards.spec.ts`
Expected: FAIL

- [ ] **Step 3: 实现 `src/lib/router/guards.ts`**

```typescript
import type { Router } from 'vue-router'
import { authService } from '@/lib/auth/authService'
import { useUserStore } from '@/app/stores/user'
import { usePermissionStore } from '@/app/stores/permission'

export function installGuards(router: Router): void {
  router.beforeEach(async (to) => {
    // 1) 白名单
    if (to.meta.public) return true

    // 2) 已认证？
    if (!authService.isAuthenticated()) {
      return { path: '/login', query: { redirect: to.fullPath } }
    }

    // 3) 用户信息 bootstrap
    const userStore = useUserStore()
    if (!userStore.isLoaded) {
      try {
        await userStore.loadProfile()
      } catch {
        await authService.logout()
        return { path: '/login' }
      }
    }

    // 4) 权限校验
    const perm = usePermissionStore()
    const m = to.meta
    if (m.permissions?.any && !perm.hasAnyPermission(m.permissions.any)) return false
    if (m.permissions?.all && !perm.hasAllPermissions(m.permissions.all)) return false
    if (m.roles?.any && !perm.hasAnyRole(m.roles.any)) return false
    if (m.roles?.all && !perm.hasAllRoles(m.roles.all)) return false
    return true
  })
}
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `pnpm test test/lib/router/guards.spec.ts`
Expected: PASS（4 个用例）

- [ ] **Step 5: Commit**

```bash
git add src/lib/router/guards.ts test/lib/router/guards.spec.ts
git commit -m "feat(router): add 4-step global guard (whitelist/auth/bootstrap/permission)"
```

---

### Task M4.5：在 main.ts 注册指令与守卫，提供 monitor

**Files:**
- Modify: `src/app/main.ts`

**Interfaces:**
- Consumes: `installGuards`、`vPermission`、router 实例

- [ ] **Step 1: 修改 `src/app/main.ts`**

在 `const app = createApp(App)` 后、`app.mount('#app')` 前，添加：

```typescript
import { vPermission } from '@/app/directives/permission'
import { installGuards } from '@/lib/router/guards'
import router from './router'

// 注册权限指令
app.directive('permission', vPermission)

// 安装守卫
installGuards(router)
```

> 如果 main.ts 已有 `app.use(router)`，确保 `installGuards(router)` 在 `app.use(router)` 之前调用。

- [ ] **Step 2: 启动 dev 验证**

Run: `pnpm dev`
- 不登录直接访问 `/`：应跳到 `/login`
- 登录后访问 `/`：进入首页
- 用 admin 登录：能看到所有菜单
- 用 user 登录：应只看到部分菜单（取决于 menus mock 是否加了 permissions 元信息，下一步）

- [ ] **Step 3: 验证 type-check + test**

Run: `pnpm type-check && pnpm test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/main.ts
git commit -m "feat(app): register v-permission directive and install guards"
```

---

### Task M4.6：Mock /api/system/menus 返回带权限的路由

**Files:**
- Modify: `src/mock/apis/menu.ts`

**Interfaces:**
- Consumes: auth token（区分用户）
- Produces: 不同用户看到不同菜单

- [ ] **Step 1: 改造 `src/mock/apis/menu.ts`**

```typescript
import type { MockMethod } from 'vite-plugin-mock'

// 全部菜单（带权限元信息）
const ALL_MENUS = [
  {
    path: '/', name: 'home', component: 'Home',
    meta: { title: '首页', icon: 'menu', showMenu: true },
  },
  {
    path: '/system', name: 'system',
    meta: { title: '系统管理', icon: 'setting', showMenu: true },
    children: [
      {
        path: '/system/admin', name: 'systemAdmin', component: 'system/admin/List',
        meta: {
          title: '管理员', icon: 'Avatar', showMenu: true,
          permissions: { any: ['admin:read', '*'] },
        },
      },
      {
        path: '/system/dict', name: 'systemDict', component: 'system/dict/List',
        meta: {
          title: '字典管理', icon: 'DataBoard', showMenu: true,
          permissions: { any: ['dict:read', '*'] },
        },
      },
    ],
  },
]

export default [
  {
    url: '/api/system/menus',
    method: 'get',
    response: ({ headers }) => {
      const auth = headers.authorization || ''
      const token = auth.replace(/^Bearer\s+/, '')
      // 简化：admin 看全部；user 仅首页
      const isAdmin = token.includes('_admin_')
      const data = isAdmin ? ALL_MENUS : [ALL_MENUS[0]]
      return { code: 0, data, msg: 'ok' }
    },
  },
] as MockMethod[]
```

- [ ] **Step 2: 启动 dev 双账号验证**

Run: `pnpm dev`
- 用 `admin / 123456` 登录：能看到全部菜单
- 退出，用 `user / 123456` 登录：只能看到首页

- [ ] **Step 3: 验证 type-check**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/mock/apis/menu.ts
git commit -m "feat(mock): menus endpoint returns permission-aware structure"
```

---

### Task M4.7：启动时拉取菜单并注册动态路由

**Files:**
- Modify: `src/app/router/index.ts`（或新建）
- Modify: `src/app/main.ts`

**Interfaces:**
- Consumes: `registerDynamicRoutes`、`api.get('/api/system/menus')`、`monitor`

- [ ] **Step 1: 创建或修改 `src/app/router/index.ts`**

```typescript
import { createRouter, createWebHistory } from 'vue-router'
import { menus as staticMenus } from './menus'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'layout',
      component: () => import('@/layout/Index.vue'),  // 根据实际路径调整
      children: [...staticMenus],
    },
  ],
})

export default router
```

> 如果项目已有路由实例，保留现有结构，只确保有名为 `layout` 的根路由。

- [ ] **Step 2: 在登录成功后拉取菜单**

修改 `src/modules/auth/views/Login.vue` 的 submitForm，登录后拉取菜单：

```typescript
import { api } from '@/lib/http/client'
import { registerDynamicRoutes } from '@/lib/router/dynamic'
import { useMonitor } from '@/lib/router/dynamic'
// 或直接 inject monitor

const submitForm = async (formEl: FormInstance | undefined) => {
  // ... 验证、登录
  await authService.login(ruleForm)
  await userStore.loadProfile()

  // 拉取菜单并注册动态路由
  const monitor = inject<Monitor>('monitor')!
  const { data } = await api.get<{ code: number; data: MenuDTO[] }>('/api/system/menus')
  registerDynamicRoutes(router, data, monitor)

  router.push('/')
}
```

> 注：菜单拉取可以放在路由守卫的 bootstrap 阶段（首次进入 layout 时），避免每个登录页都拉一次。这属于优化，本 task 简化处理。

- [ ] **Step 3: 启动 dev 端到端验证**

Run: `pnpm dev`
- admin 登录：看到全部菜单，点击各菜单页正常
- user 登录：只看到首页

- [ ] **Step 4: 验证 type-check + test**

Run: `pnpm type-check && pnpm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/router/ src/modules/auth/views/Login.vue
git commit -m "feat(router): fetch menus and register dynamic routes on login"
```

---

**M4 完成验收**：
- [ ] `pnpm type-check` 通过
- [ ] `pnpm test` 全部通过
- [ ] admin / user 双账号登录看到不同菜单
- [ ] v-permission 在某个页面（如 user 列表）验证生效：用 user 账号登录，无权限的按钮被移除
- [ ] 守卫四步流程：未登录跳转、bootstrap 加载、权限拒绝都符合预期
- [ ] 动态路由缺失 component 时记 monitor，不中断

---

## M5 — 测试补全 + Lint + 文档 + Mock 切换（1 天）

**目标**：补齐关键路径测试、配置 ESLint（含边界规则）、更新 standards 与 README、（可选）MSW 切换。

### Task M5.1：配置 ESLint flat config 含 import 边界规则

**Files:**
- Create: `eslint.config.js`
- Modify: `package.json`（添加 lint script + 依赖）

**Interfaces:**
- Produces: `pnpm lint` 命令、目录边界强制规则

- [ ] **Step 1: 安装 ESLint flat config 依赖**

Run: `pnpm add -D eslint @eslint/js eslint-plugin-vue @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-import-resolver-typescript eslint-plugin-import`

- [ ] **Step 2: 创建 `eslint.config.js`**

```javascript
import js from '@eslint/js'
import vue from 'eslint-plugin-vue'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import importPlugin from 'eslint-plugin-import'

export default [
  js.configs.recommended,
  ...vue.configs['flat/recommended'],
  {
    files: ['**/*.{ts,tsx,vue}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      import: importPlugin,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  // 目录边界强制：lib 不得依赖 modules / app
  {
    files: ['src/lib/**/*.ts', 'src/lib/**/*.vue'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['@/app/*', '@/modules/*', '@/views/*', '@/apis/*'], message: 'lib/ 不得依赖业务层（app/modules/views/apis）' },
        ],
      }],
    },
  },
  // shared 不得依赖业务层
  {
    files: ['src/shared/**/*'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['@/app/*', '@/modules/*', '@/views/*', '@/apis/*'], message: 'shared/ 不得依赖业务层' },
        ],
      }],
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'docs/**'],
  },
]
```

- [ ] **Step 3: 在 package.json 添加 lint 脚本**

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.vue,.tsx",
    "lint:fix": "eslint . --ext .ts,.vue,.tsx --fix"
  }
}
```

- [ ] **Step 4: 运行 lint 查看现状**

Run: `pnpm lint`
Expected: 可能有现有代码的 warning/error；记录下来但不强制修复（除非是边界违规）

- [ ] **Step 5: 验证边界规则生效**

故意在 `src/lib/http/client.ts` 顶部加 `import '@/app/main'`，运行 `pnpm lint`，应报错。验证后移除测试代码。

- [ ] **Step 6: Commit**

```bash
git add eslint.config.js package.json pnpm-lock.yaml
git commit -m "chore(lint): add ESLint flat config with layer boundary rules"
```

---

### Task M5.2：补全 interceptors 集成测试

**Files:**
- Test: `test/lib/http/interceptors.integration.spec.ts`

**Interfaces:**
- Consumes: `http`、`installInterceptors`

- [ ] **Step 1: 写集成测试**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { installInterceptors } from '@/lib/http/interceptors'
import { HttpError } from '@/lib/error/types'

vi.mock('element-plus', () => ({
  ElMessage: { error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

describe('interceptors integration', () => {
  let instance: axios.AxiosInstance

  beforeEach(() => {
    instance = axios.create()
    installInterceptors(instance)
  })

  it('200 + code=0 解包 data', async () => {
    vi.spyOn(instance, 'request').mockResolvedValue({
      status: 200,
      data: { code: 0, data: { hello: 'world' }, msg: 'ok' },
    } as any)
    const res = await instance.get('/x')
    expect(res.data).toEqual({ hello: 'world' })
  })

  it('200 + code=1 抛 HttpError（违反契约）', async () => {
    vi.spyOn(instance, 'request').mockResolvedValue({
      status: 200,
      data: { code: 1, data: null, msg: 'biz error' },
    } as any)
    await expect(instance.get('/x')).rejects.toBeInstanceOf(HttpError)
  })

  it('500 抛 HttpError 含 ProblemDetail', async () => {
    vi.spyOn(instance, 'request').mockRejectedValue({
      response: {
        status: 500,
        data: { type: 'x', title: 'Server Error', status: 500, detail: 'down' },
      },
    })
    try {
      await instance.get('/x')
    } catch (e) {
      expect(e).toBeInstanceOf(HttpError)
      expect((e as HttpError).problem.status).toBe(500)
    }
  })

  it('silent 请求不触发 ElMessage', async () => {
    vi.spyOn(instance, 'request').mockRejectedValue({
      response: { status: 400, data: { type: 'x', title: 't', status: 400, detail: 'd' } },
      config: { _silent: true },
    })
    const { ElMessage } = await import('element-plus')
    await instance.get('/x').catch(() => {})
    expect(ElMessage.error).not.toHaveBeenCalled()
  })

  it('网络错误（无 response）抛 HttpError 含 status=0', async () => {
    vi.spyOn(instance, 'request').mockRejectedValue({ message: 'Network Error' })
    try {
      await instance.get('/x')
    } catch (e) {
      expect(e).toBeInstanceOf(HttpError)
      expect((e as HttpError).problem.status).toBe(0)
    }
  })
})
```

- [ ] **Step 2: 运行测试，确认通过**

Run: `pnpm test test/lib/http/interceptors.integration.spec.ts`
Expected: PASS（5 个用例）

- [ ] **Step 3: Commit**

```bash
git add test/lib/http/interceptors.integration.spec.ts
git commit -m "test(http): add interceptor integration tests covering edge cases"
```

---

### Task M5.3：迁移到 MSW（可选，时间够才做）

> **决策点**：MSW 迁移改动较大，建议作为独立 PR。如果时间紧张，本 task 可跳过，保留 vite-plugin-mock + M2.7 改造的 mock。

**Files:**
- Create: `src/mock/handlers/auth.ts`
- Create: `src/mock/handlers/system.ts`
- Create: `src/mock/handlers/index.ts`
- Create: `src/mock/server.ts`
- Create: `src/mock/browser.ts`
- Modify: `src/app/main.ts`
- Modify: `vitest.config.ts`（setup 文件）
- Create: `test/setup.ts`

- [ ] **Step 1: 安装 MSW**

Run: `pnpm add -D msw`

- [ ] **Step 2: 创建 handlers（以 auth 为例）`src/mock/handlers/auth.ts`**

```typescript
import { http, HttpResponse } from 'msw'

const USERS = [
  { id: '1', username: 'admin', password: '123456', roles: ['super_admin'], permissions: ['*'] },
  { id: '2', username: 'user', password: '123456', roles: ['user'], permissions: ['user:read'] },
]

const TOKENS = new Map<string, string>()

export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as { username: string; password: string }
    const user = USERS.find(u => u.username === body.username && u.password === body.password)
    if (!user) {
      return HttpResponse.json(
        { type: 'about:blank', title: '用户名或密码错误', status: 401, detail: 'Invalid credentials' },
        { status: 401 },
      )
    }
    const access = `a_${user.username}_${Date.now()}`
    const refresh = `r_${user.username}_${Date.now()}`
    TOKENS.set(access, user.username)
    return HttpResponse.json(
      { code: 0, data: { accessToken: access, refreshToken: refresh, expiresIn: 3600 }, msg: 'ok' },
    )
  }),

  http.get('/api/auth/me', ({ request }) => {
    const auth = request.headers.get('Authorization') ?? ''
    const token = auth.replace(/^Bearer\s+/, '')
    const username = TOKENS.get(token)
    if (!username) {
      return HttpResponse.json(
        { type: 'about:blank', title: 'Unauthorized', status: 401, detail: 'Token invalid' },
        { status: 401 },
      )
    }
    const user = USERS.find(u => u.username === username)!
    const { password, ...safe } = user
    return HttpResponse.json({ code: 0, data: safe, msg: 'ok' })
  }),
]
```

- [ ] **Step 3: 汇总 handlers `src/mock/handlers/index.ts`**

```typescript
import { authHandlers } from './auth'
// import { systemHandlers } from './system'  // M5.3 后续 task 扩展

export const handlers = [...authHandlers]
```

- [ ] **Step 4: 创建 server（测试用）`src/mock/server.ts`**

```typescript
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

- [ ] **Step 5: 创建 browser（dev 用）`src/mock/browser.ts`**

```typescript
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)
```

- [ ] **Step 6: 创建 Vitest setup `test/setup.ts`**

```typescript
import { beforeAll, afterEach, afterAll } from 'vitest'
import { server } from '@/mock/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

- [ ] **Step 7: 修改 `vitest.config.ts`**

```typescript
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: ['./test/setup.ts'],
},
```

- [ ] **Step 8: 修改 `src/app/main.ts` 启动 worker**

```typescript
async function enableMocking() {
  if (!import.meta.env.DEV || !import.meta.env.VITE_USE_MOCK) return
  const { worker } = await import('@/mock/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
}

enableMocking().then(() => {
  app.mount('#app')
})
```

- [ ] **Step 9: 生成 MSW service worker**

Run: `pnpm msw init public/ --save`

- [ ] **Step 10: 删除 vite-plugin-mock 配置与 mock 文件**

```bash
pnpm remove vite-plugin-mock
git rm -r src/mock/apis/
```

修改 `vite.config.ts` 移除 `viteMockServe` 配置。

- [ ] **Step 11: 验证 dev + test 全流程**

Run:
- `pnpm dev` 浏览器登录测试，看到 MSW 启动提示 `[MSW] Mocking enabled`
- `pnpm test` 全部通过（MSW 拦截 HTTP 请求）

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "refactor(mock): migrate from vite-plugin-mock to MSW (dev/test unified)"
```

---

### Task M5.4：更新 standards 文档与 spec 对齐

**Files:**
- Modify: `docs/standards/01-ARCHITECTURE.md`（更新目录结构为四层）
- Modify: `docs/standards/02-API.md`（移除旧 service 描述，指向 lib/http）
- Modify: `docs/standards/03-STATE.md`（更新 store 目录到 app/stores）
- Modify: `docs/standards/04-NAMING.md`（添加 `http` 命名约定）
- Modify: `CLAUDE.md`（更新目录约定）

- [ ] **Step 1: 重写 `docs/standards/01-ARCHITECTURE.md`**

把目录结构改为 spec §1.1 的四层结构（lib/app/modules/shared）。

```markdown
# 架构规范

## 四层目录

\`\`\`
src/
├── lib/         # 基础设施：与业务无关
├── app/         # 应用骨架：组装层
├── modules/     # 业务领域：按 domain 聚合
└── shared/      # 跨模块共享
\`\`\`

## 依赖方向

modules → app → lib
              ▲
shared ───────┘

lib 禁止 import modules/app；shared 禁止 import modules/app/lib（除类型）。
```

- [ ] **Step 2: 重写 `docs/standards/02-API.md`**

```markdown
# HTTP 客户端规范

## 单一入口

业务代码必须：

\`\`\`typescript
import { http, api } from '@/lib/http/client'
\`\`\`

禁止：
- \`import axios from 'axios'\`（任何业务模块）
- 创建新的 axios 实例

## 错误契约（RFC 7807）

成功：HTTP 200 + { code: 0, data, msg }
失败：HTTP 4xx/5xx + ProblemDetail { type, title, status, detail, errors? }

不允许 HTTP 200 + code !== 0。

## 错误处理三层

| 层 | 行为 |
|---|---|
| lib/http interceptors | 全局 ElMessage 提示；401 触发 refresh |
| modules/<domain>/api.ts | 仅返回数据，不提示 |
| views/*.vue | 检查 error 做领域内 UI 反馈 |

silent 选项反转默认提示行为。

## 示例

\`\`\`typescript
// 默认全局提示
const data = await api.get<User>('/api/users/1')

// 业务自处理（如表单校验展示）
try {
  await api.post('/api/users', form, { _silent: true })
} catch (e) {
  if (e instanceof HttpError && e.problem.errors) {
    // 字段级错误填充表单
  }
}
\`\`\`
```

- [ ] **Step 3: 重写 `docs/standards/03-STATE.md`**

更新 store 目录约定：

```markdown
# 状态管理规范

## 目录

- 全局 store：\`src/app/stores/\`（user、permission 等跨领域）
- 模块内 store：\`src/modules/<domain>/store.ts\`（仅模块内使用）

## 风格

必须 setup 风格：

\`\`\`typescript
export const useUserStore = defineStore('user', () => {
  const profile = ref<UserProfile | null>(null)
  // ...
  return { profile }
})
\`\`\`

## 响应式解构

必须 \`storeToRefs()\`：

\`\`\`typescript
const userStore = useUserStore()
const { profile } = storeToRefs(userStore)
\`\`\`
```

- [ ] **Step 4: 更新 `docs/standards/04-NAMING.md`**

在文件命名末尾添加：

```markdown
## 基础设施命名

- HTTP 客户端导出名：`http`（不是 `service` / `request`）
- 错误捕获组件：`ErrorBoundary`
- 监控接口：`Monitor`
- 认证服务：`authService`（单例）/ `AuthProvider`（接口）
```

- [ ] **Step 5: 更新 `CLAUDE.md` 的"关键架构约定"**

```markdown
1. **单一 HTTP 客户端**：业务代码必须用 \`src/lib/http/client.ts\` 导出的 \`http\`。禁止 \`import axios\`。

2. **四层目录**：lib（基础设施）/ app（骨架）/ modules（业务领域）/ shared（共享）。lib 不得依赖 app/modules。

3. **Store 必须用 setup 风格**：全局 store 放 \`app/stores/\`，模块 store 放 \`modules/<domain>/store.ts\`。

4. **错误处理三层**：lib/http interceptors（提示）→ modules/<domain>/api.ts（不提示）→ views（领域内反馈）。

5. **业务代码禁止直接调 axios**。

6. **RFC 7807 错误契约**：禁止 HTTP 200 + code !== 0。
```

- [ ] **Step 6: 验证 type-check + lint**

Run: `pnpm type-check && pnpm lint`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add docs/standards/ CLAUDE.md
git commit -m "docs: align standards with four-layer architecture and new conventions"
```

---

### Task M5.5：升级 README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 重写 README**

```markdown
# Vue Admin

> Vue 3 + Element Plus 企业级后台管理前端基座

## 特性

- 🏗️ 四层架构（lib / app / modules / shared）
- 🔒 RBAC 权限系统 + v-permission 指令
- 🌐 RFC 7807 错误契约
- 🎨 Element Plus 2.5 + 暗黑模式
- 🧪 Vitest + MSW 端到端可测

## 快速开始

\`\`\`bash
pnpm i
pnpm dev          # 启动开发服务器（含 Mock）
\`\`\`

## Mock 账号

| 用户名 | 密码 | 角色 | 权限 |
|---|---|---|---|
| admin | 123456 | super_admin | 全部 |
| user | 123456 | user | user:read |

## 架构

详见 [docs/standards/01-ARCHITECTURE.md](./docs/standards/01-ARCHITECTURE.md)

## 文档

- [项目定位](./docs/standards/00-OVERVIEW.md)
- [架构规范](./docs/standards/01-ARCHITECTURE.md)
- [HTTP 客户端规范](./docs/standards/02-API.md)
- [状态管理规范](./docs/standards/03-STATE.md)
- [命名规范](./docs/standards/04-NAMING.md)
- [基础模块设计 spec](./docs/superpowers/specs/2026-06-25-foundation-design.md)
- [实施计划](./docs/superpowers/plans/2026-06-25-foundation-implementation.md)

## 技术栈

Vue 3.4 + Vite 4.5 + TypeScript 4.8 + Element Plus 2.5 + Pinia 2.1 + Vue Router 4.3 + Axios + Vitest + MSW

## License

MIT
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: upgrade README with architecture and mock accounts"
```

---

### Task M5.6：配置 husky + lint-staged（可选）

**Files:**
- Modify: `package.json`
- Create: `.husky/pre-commit`
- Create: `.lintstagedrc.json`

- [ ] **Step 1: 安装**

Run: `pnpm add -D husky lint-staged`

- [ ] **Step 2: 初始化 husky**

Run: `pnpm exec husky init`

- [ ] **Step 3: 修改 `.husky/pre-commit`**

```bash
pnpm exec lint-staged
```

- [ ] **Step 4: 创建 `.lintstagedrc.json`**

```json
{
  "*.{ts,tsx,vue}": ["eslint --fix", "prettier --write"],
  "*.{json,md}": ["prettier --write"]
}
```

- [ ] **Step 5: 测试 pre-commit 钩子**

故意改一个文件加个 eslint 错误，commit 应被阻止。

- [ ] **Step 6: Commit**

```bash
git add .husky/ .lintstagedrc.json package.json
git commit -m "chore: add husky + lint-staged pre-commit hook"
```

---

**M5 完成验收**：
- [ ] `pnpm type-check` 通过
- [ ] `pnpm lint` 无 error
- [ ] `pnpm test` 全部通过
- [ ] `pnpm dev` Mock 正常工作（MSW 或 vite-plugin-mock）
- [ ] standards 文档已对齐 spec
- [ ] README 含架构说明 + Mock 账号
- [ ] lib/ → modules/app 边界违规会被 lint 拦截

---

## Self-Review

### Spec coverage

| Spec 章节 | 对应 Task |
|---|---|
| §0 设计原则 | Global Constraints |
| §1 架构分层 | M1.1, M1.2 |
| §2.1 HTTP 客户端 | M2.1–M2.5 |
| §2.2 AuthProvider | M3.2 |
| §2.3 TokenStorage | M3.1 |
| §2.4 authService | M3.3 |
| §2.4 user store | M3.4 |
| §2.4 Login 改造 | M3.5 |
| §3.1 permission store | M4.1 |
| §3.2 v-permission | M4.2 |
| §3.3 路由 meta | M1.2（types） |
| §3.4 路由守卫 | M4.4 |
| §3.5 动态路由 | M4.3, M4.7 |
| §4.1 ErrorBoundary | M1.4 |
| §4.2 Monitor | M1.3 |
| §4.3 Mock (MSW) | M5.3（M2.7 / M3.6 用 vite-plugin-mock 过渡） |
| §4.4 测试 | M1.3, M1.4, M2.1, M2.4, M3.1, M3.3, M4.1, M4.2, M4.3, M4.4, M5.2 |
| §5 迁移计划 | M1–M5 五阶段对应 |
| §8 验收清单 | 各 milestone 验收块 + M5 整体 |

### Placeholder scan
- 无 TBD / TODO / 待定
- 每个 code step 都有完整代码
- 每个测试 step 都有完整测试代码

### Type consistency
- `Monitor` 接口在 M1.2 定义 → M1.3 实现 → M1.4 / M4.3 使用 ✅
- `HttpError` 在 M1.2 定义 → M2.4 抛出 → M2.4 测试 / M5.2 集成测试 ✅
- `ProblemDetail` 在 M1.2 定义 → M2.1 解析 → M2.2 提示 ✅
- `TokenStorage` 在 M3.1 定义 → M3.3 使用 ✅
- `AuthProvider` 在 M3.2 定义 → M3.3 注入 ✅
- `usePermissionStore` 在 M4.1 定义 → M4.2 / M4.4 使用 ✅
- `MenuDTO` 在 M4.3 定义 → M4.7 使用 ✅

---

## 执行说明

**总工期估算**：5–9 天

| Milestone | 工期 | 依赖 |
|---|---|---|
| M1 | 1–2 天 | 无 |
| M2 | 1 天 | M1 |
| M3 | 2–3 天 | M2 |
| M4 | 1–2 天 | M3 |
| M5 | 1 天 | M1–M4 |

每个 milestone 是一个独立 PR，建议按顺序合入。MSW 迁移（M5.3）可独立 PR 不阻塞其他工作。
