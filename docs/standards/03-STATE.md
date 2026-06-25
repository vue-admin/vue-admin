# 状态管理规范

## 一、何时使用全局状态

**使用 Pinia store**：
- 跨页面共享：用户信息、登录态、权限
- 跨组件共享且层级深：标签页、侧边栏折叠、主题
- 需要持久化（localStorage）的响应式状态

**不使用 store**（用组件局部状态）：
- 仅父子组件用 props/emit
- 仅同页面多个区域共享 → 容器组件 `provide/inject` 或本地 ref
- 临时表单状态

## 二、Store 写法

**强制 `setup` 风格**（Composition API）：

```ts
// ✅ src/stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useStorage } from '@vueuse/core'

export const useUserStore = defineStore('user', () => {
  const token = useStorage('token', '')
  const userInfo = ref<UserInfo | null>(null)
  const isLogin = computed(() => !!token.value)

  const setToken = (t: string) => { token.value = t }
  const logout = () => {
    token.value = ''
    userInfo.value = null
  }

  return { token, userInfo, isLogin, setToken, logout }
})
```

禁止：
- `defineStore('user', { state, getters, actions })` 选项式写法
- 在 store 外部用 `ref` 导出全局响应式变量伪装成 store（旧 tagsView 写法）

## 三、组件中使用

```ts
const userStore = useUserStore()

// ✅ 响应式数据用 storeToRefs 解构
const { userInfo, isLogin } = storeToRefs(userStore)

// ✅ 方法直接解构（不需响应式）
const { logout } = userStore

// ❌ 禁止：直接解构 ref 会丢失响应式
const { userInfo } = userStore
```

## 四、持久化

- 优先用 VueUse 的 `useStorage`，自动同步 localStorage
- 持久化的字段：`token`、`userInfo`、`darkMode`、`sidebarCollapsed`
- **不**持久化：列表数据、临时表单、tagsView 列表（影响多标签体验一致性）

## 五、Store 间依赖

- store A 依赖 store B：在 setup 内部 `const b = useBStore()`
- **避免循环依赖**，必要时拆出 `shared.ts` 放共享逻辑

## 六、命名

- 文件：`<domain>.ts`（如 `user.ts`、`tagsView.ts`）
- Hook：`use<Domain>Store`
- Store id（第一个参数）：与 domain 同名（如 `'user'`、`'tagsView'`）

## 七、副作用

- 副作用（请求、定时器、订阅）放在调用方的 `onMounted`，**不**在 store 顶层
- store 只管理状态，副作用通过 action 显式触发

## 八、禁止

- 把 router 实例塞进 store
- 在 store 中调用 `ElMessage`（业务反馈留给页面）
- 一个 store 承担多个业务域（拆！单一职责）
