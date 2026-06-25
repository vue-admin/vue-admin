# API / HTTP 规范

## 一、单一 HTTP 客户端

**全项目仅使用 `src/apis/client/service.ts` 导出的 `service` 单例**。

禁止：
- 在任何业务代码中 `import axios from 'axios'` 后直接使用
- 在任何业务代码中 `axios.create(...)` 创建实例
- 保留并行的 `Request` 类作为另一套客户端

`src/apis/client/request.ts` 仅承载类型定义（`ApiResult`、`ApiRequestConfig`），不导出 HTTP 实例。

## 二、统一响应结构

所有后端接口必须遵守：

```ts
interface ApiResult<T = any> {
  code: number       // 0 = 成功，其他 = 业务错误
  data: T            // 业务数据
  msg: string        // 错误描述（成功时可为空）
}
```

分页响应：

```ts
interface PageResult<T> {
  records: T[]
  total: number
  current: number
  size: number
}
```

后端不遵守此结构时，在 service 拦截器中做转换，**不**让业务代码处理多套结构。

## 三、错误处理层级

| 层级 | 处理内容 |
|------|---------|
| **service**（拦截器） | HTTP 4xx/5xx 统一提示、401 跳登录、业务码非 0 提示 |
| **api 函数** | 不做提示，只返回 `{ data, error }` |
| **页面调用** | 检查 `error` 后做 UI 反馈（关闭弹窗、刷新列表等） |

```ts
// ✅ 页面调用范式
const res = await deleteCrudItem(id)
if (res.error) return          // service 已提示错误
ElMessage.success('删除成功')
await load()
```

## 四、命名约定

| 操作 | 前缀 | 示例 |
|------|------|------|
| 查询单个 | `fetch` | `fetchUserDetail` |
| 查询列表 | `fetch` + `List` | `fetchUserList` |
| 创建 | `create` | `createUser` |
| 更新 | `update` | `updateUser` |
| 删除单个 | `delete` | `deleteUser` |
| 批量删除 | `batchDelete` | `batchDeleteUsers` |
| 导出 | `export` | `exportUsers` |
| 选项（下拉用） | `fetch` + `Options` | `fetchUserOptions` |

禁止 `getUser` / `delUser` / `removeUser` 等模糊命名。

## 五、HTTP 方法语义

| 方法 | 用途 | URL 风格 |
|------|------|---------|
| GET | 查询 | `/api/user/list`、`/api/user/detail/:id` |
| POST | 创建 / 复杂查询 / 删除（按约定） | `/api/user/create`、`/api/user/batch-delete` |
| PUT | 全量更新 | `/api/user/update/:id` |
| DELETE | 删除单个 | `/api/user/delete/:id` |

> 当前项目的 mock 删除用 POST（`/api/crud/delete`），与 RESTful 不完全一致。
> 真实后端由调用方对接，前端按上述约定跟随。

## 六、静默模式（silent）

```ts
// 默认：错误会 ElMessage
service.get('/api/user/list', params)

// 静默：错误不提示（用于后台轮询、选项加载）
service.get('/api/user/options', {}, { silent: true })
```

使用场景：
- 下拉选项加载失败时静默（避免阻塞表单）
- 心跳/轮询
- 已经在 try/catch 中处理了用户感知的场景

## 七、鉴权

- token 存 `localStorage.token`（key 固定）
- service 拦截器自动注入 `Authorization: Bearer <token>`
- 401 响应：清空 localStorage → 跳 `/login`
- 业务码触发 `reload: true`：同上

业务代码 **禁止** 手动 `localStorage.setItem('token', ...)`，唯一例外是 `Login.vue`。

## 八、类型安全

- 所有 API 函数必须带泛型：`service.get<User>('/api/user')`
- 业务字段必须有 `interface` 定义，**禁止 `any`**
- 联合类型用字面量：`status: 'active' | 'inactive'`

## 九、Mock

- 开发环境通过 `vite-plugin-mock` 提供
- Mock 文件位于 `src/mock/apis/`，**结构对齐真实 API**
- Mock 必须返回与真实后端相同的 `ApiResult` 包装

## 十、禁止

- 业务代码捕获 HTTP 错误后吞掉不处理（除非显式 `silent`）
- 在多个文件复用同一 URL 字符串而不抽常量（DRY）
- 在 store / 组件 / utils 中直接构造 URL
