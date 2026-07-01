# HTTP 客户端规范

> 本文档规定 HTTP 调用、错误处理、Mock 数据契约。架构分层见 [01-ARCHITECTURE.md](./01-ARCHITECTURE.md)。

## 一、单一入口

业务代码必须：

```typescript
import { http, api } from '@/lib/http/client'
```

- `http`：axios 实例（仅在需要 axios 原生 API 时使用）
- `api`：类型化辅助函数集合（`get/post/put/patch/del`），首选

禁止：

- `import axios from 'axios'`（任何业务模块）
- `axios.create(...)` 创建新实例
- 保留并行的 `Request` 类、`service` 单例（已在 M2.6 改为 `lib/http/client` 上的兼容适配壳，新代码勿用）

## 二、错误契约（RFC 7807）

### 成功响应

HTTP 200 + `ApiResult` 包装：

```typescript
interface ApiResult<T = unknown> {
  code: number // 必为 0
  data: T
  msg: string
}
```

拦截器自动解包：业务代码拿到的 `res.data` 直接是 `T`，而非 `ApiResult<T>`。

### 失败响应

HTTP 4xx/5xx + RFC 7807 ProblemDetail：

```typescript
interface ProblemDetail {
  type: string
  title: string
  status: number
  detail: string
  instance?: string
  code?: string // 应用层错误码（可选）
  errors?: Record<string, string[]> // 字段级校验错误（422）
  traceId?: string
}
```

拦截器把 ProblemDetail 包成 `HttpError` 抛出。

### 不允许的过渡形态

HTTP 200 + `code !== 0`：M5.3 MSW 迁移前的过渡路径，拦截器仍会把它转成 `HttpError`（status 落在 4xx/5xx 用之，否则 500）。**真实后端必须返回正确 HTTP 状态码 + ProblemDetail**。

## 三、错误处理三层

| 层                                              | 行为                                                                        |
| ----------------------------------------------- | --------------------------------------------------------------------------- |
| `lib/http/interceptors.ts`                      | 全局 `ElMessage.error` 提示（grouping 合并相同消息）；构造 `HttpError` 抛出 |
| `modules/<domain>/api.ts`                       | 仅返回数据，不提示；透传 `HttpError`                                        |
| `views/*.vue` 或 `modules/<domain>/views/*.vue` | 检查 `HttpError` 做领域内 UI 反馈                                           |

`silent` 选项反转默认提示行为。

## 四、示例

```typescript
import { api, HttpError } from '@/lib/http/client'
import type { HttpError } from '@/lib/error/types'

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
```

## 五、命名约定

| 操作           | 前缀                | 示例               |
| -------------- | ------------------- | ------------------ |
| 查询单个       | `fetch`             | `fetchUserDetail`  |
| 查询列表       | `fetch` + `List`    | `fetchUserList`    |
| 创建           | `create`            | `createUser`       |
| 更新           | `update`            | `updateUser`       |
| 删除单个       | `delete`            | `deleteUser`       |
| 批量删除       | `batchDelete`       | `batchDeleteUsers` |
| 导出           | `export`            | `exportUsers`      |
| 选项（下拉用） | `fetch` + `Options` | `fetchUserOptions` |

禁止 `getUser` / `delUser` / `removeUser` 等模糊命名。

## 六、HTTP 方法与 RESTful 语义

### RESTful 设计原则

本项目的 API 遵循 RESTful 架构风格：

1. **资源导向**：URL 使用名词表示资源，使用复数形式
2. **HTTP 方法语义明确**：GET=查询、POST=创建、PUT=更新、DELETE=删除
3. **层级结构**：通过路径层级表示资源间关系
4. **命名规范**：使用小写字母和连字符（kebab-case）

### 标准端点规范

| 操作 | 方法 | URL | 说明 |
|------|------|-----|------|
| 查询列表 | GET | `/api/{resource}` | 支持分页、搜索、过滤 |
| 查询单个 | GET | `/api/{resource}/{id}` | 获取单条资源详情 |
| 创建 | POST | `/api/{resource}` | 创建新资源 |
| 更新 | PUT | `/api/{resource}/{id}` | 完整更新资源 |
| 删除单个 | DELETE | `/api/{resource}/{id}` | 删除单条资源 |
| 批量删除 | DELETE | `/api/{resource}` | 请求体 `{ ids: string[] }` |
| 导出 | GET | `/api/{resource}/export` | 导出数据 |

**示例 - 用户模块：**

```
GET    /api/user           # 获取用户列表
GET    /api/user/123       # 获取单个用户
POST   /api/user           # 创建用户
PUT    /api/user/123       # 更新用户
DELETE /api/user/123       # 删除用户
DELETE /api/user           # 批量删除（body: { ids: ["1", "2"] }）
```

### 子资源

子资源通过路径层级表示：

```
GET    /api/user/123/orders      # 获取用户的订单列表
POST   /api/user/123/orders      # 为用户创建订单
GET    /api/user/123/orders/456  # 获取用户的特定订单
```

### 特殊端点

**树形视图：**

```
GET /api/{resource}?view=tree
```

**范围查询（不分页）：**

```
GET /api/{resource}?all=true
```

**集合操作（部分更新）：**

```
PATCH /api/{resource}/sort     # 排序
PATCH /api/{resource}/batch    # 批量更新
```

### 认证端点

```
POST   /api/auth/sessions          # 登录（创建会话）
DELETE /api/auth/sessions          # 登出（销毁会话）
POST   /api/auth/tokens/refresh    # 刷新 token
GET    /api/auth/users/me          # 获取当前用户信息
```

### HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 422 | 验证失败 |
| 500 | 服务器内部错误 |

## 七、鉴权

- `authService` 单例管理 access/refresh token（M3）
- `lib/http/interceptors.ts` 通过 `getAccessToken()` 注入 `Authorization: Bearer <token>`
- 401 响应：`authService.refresh()` 尝试刷新（含并发保护）；失败 → `authService.logout()` → 跳 `/login`
- token 存储抽象为 `TokenStorage` 接口，默认 `MemorySessionTokenStorage`；未来后端用 HttpOnly Cookie 时切到 `HttpOnlyCookieTokenStorage`

业务代码 **禁止** 直接操作 token 存储。

## 八、类型安全

- 所有 API 函数必须带泛型：`api.get<User>('/api/user/1')`
- 业务字段必须有 `interface` 定义，**禁止 `any`**
- 联合类型用字面量：`status: 'active' | 'inactive'`

## 九、Mock

- 开发环境通过 `vite-plugin-mock` 提供
- Mock 文件位于 `src/mock/apis/`，**结构对齐真实 API**
- M2.7 起：`crud.ts` + `admin.ts` 已迁移到 RFC 7807 + RESTful
- M5.3 起：可切换到 MSW（统一 dev/test 数据契约），plan 标注为可选 task
- Mock 必须返回与真实后端相同的 `ApiResult` 包装

## 十、禁止

- 业务代码捕获 HTTP 错误后吞掉不处理（除非显式 `_silent`）
- 在多个文件复用同一 URL 字符串而不抽常量（DRY）
- 在 store / 组件 / utils 中直接构造 URL
- HTTP 200 + `code !== 0` 的过渡形态（M5.3 MSW 迁移后清理）
