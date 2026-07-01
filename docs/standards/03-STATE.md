# 状态管理规范

> 本文档规定 Pinia store 的目录、写法、依赖、持久化。架构分层见 [01-ARCHITECTURE.md](./01-ARCHITECTURE.md)。

## 一、目录

- **全局 store**：`src/app/stores/`（跨领域共享：`user`、`permission` 等）
- **模块内 store**：`src/modules/<domain>/store.ts`（仅模块内使用）

历史目录 `src/stores/` 待评估合并到 `src/app/stores/`。

## 二、何时使用 store

**使用全局 store**（`app/stores/`）：

- 跨页面共享：用户信息、登录态、权限
- 跨模块共享且层级深：标签页、侧边栏折叠、主题

**使用模块内 store**（`modules/<domain>/store.ts`）：

- 仅模块内多视图共享的状态

**不使用 store**（用组件局部状态）：

- 仅父子组件用 props/emit
- 仅同页面多个区域共享 → 容器组件 `provide/inject` 或本地 ref
- 临时表单状态

## 三、Store 写法

**强制 `setup` 风格**（Composition API）：

```typescript
// ✅ src/app/stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserProfile } from '@/shared/types'

export const useUserStore = defineStore('user', () => {
  const profile = ref<UserProfile | null>(null)
  const isLoaded = computed(() => profile.value !== null)

  async function loadProfile(): Promise<void> {
    // ...
  }

  function reset(): void {
    profile.value = null
  }

  return { profile, isLoaded, loadProfile, reset }
})
```

禁止：

- `defineStore('user', { state, getters, actions })` 选项式写法
- 在 store 外部用 `ref` 导出全局响应式变量伪装成 store（旧 tagsView 写法）

## 四、组件中使用

```typescript
const userStore = useUserStore()

// ✅ 响应式数据用 storeToRefs 解构
const { profile, isLoaded } = storeToRefs(userStore)

// ✅ 方法直接解构（不需响应式）
const { loadProfile } = userStore

// ❌ 禁止：直接解构 ref 会丢失响应式
const { profile } = userStore
```

## 五、并发保护

如果 store action 可能被并发调用（如 `loadProfile()`），需用 promise 复用消除竞态：

```typescript
let profilePromise: Promise<void> | null = null

async function loadProfile(): Promise<void> {
  if (profilePromise) return profilePromise
  if (isLoaded.value) return
  profilePromise = doLoad().finally(() => {
    profilePromise = null
  })
  return profilePromise
}
```

参考实现：`src/app/stores/user.ts`。

## 六、Store 间依赖

- store A 依赖 store B：在 setup 内部 `const b = useBStore()`
- **避免循环依赖**，必要时拆出 `shared/types.ts` 放共享类型

## 七、命名

- 文件：`<domain>.ts`（如 `user.ts`、`permission.ts`）
- Hook：`use<Domain>Store`
- Store id（第一个参数）：与 domain 同名（如 `'user'`、`'permission'`）

## 八、副作用

- 副作用（请求、定时器、订阅）通过 action 显式触发，**不**在 store 顶层执行
- store 只管理状态

## 九、权限短路

权限相关 store（`permission.ts`）在 `isSuperAdmin` 时短路返回 `true`，避免逐条权限检查：

```typescript
function hasPermission(code: string): boolean {
  return isSuperAdmin.value || permissions.value.includes(code)
}
```

参考实现：`src/app/stores/permission.ts`。

## 十、禁止

- 把 router 实例塞进 store
- 在 store 中调用 `ElMessage`（业务反馈留给页面）
- 一个 store 承担多个业务域（拆！单一职责）
