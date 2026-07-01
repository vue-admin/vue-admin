# 通用服务

业务代码中频繁出现的「全屏 loading / 确认对话框 / 文件下载」三类副作用，已沉淀为三个无框架耦合的纯服务，从 `@/lib/` 下对应模块导出。

::: tip 统一约定
禁止在业务代码中直接调用 `ElLoading.service` / `ElMessageBox.confirm` / 手写 `<a download>`，统一走以下三个服务，便于 Mock 与维护。
:::

## loadingService

封装 `ElLoading`，提供**引用计数**的全屏 loading：多次 `show` 只创建一个实例，配对 `close` 后才真正关闭，避免并发请求互相提前关闭 loading。

来自 `@/lib/loading/loadingService`。

```ts
import { loadingService } from '@/lib/loading/loadingService'

// 1. 手动控制
loadingService.show({ text: '加载中...' })
// ... 异步操作
loadingService.close()

// 2. 包裹 Promise（推荐）：自动 show / close
const data = await loadingService.withLoading(
  () => fetchUsers(),
  { text: '正在加载用户列表' }
)
```

### 默认行为

`show` 默认 `lock: true`、`background: 'rgba(0, 0, 0, 0.7)'`、`text: '加载中...'`，传入的 `options` 会覆盖默认值。

### API

```ts
type LoadingServiceOptions = Partial<LoadingOptionsResolved>

interface LoadingService {
  show(options?: LoadingServiceOptions): void
  close(): void
  withLoading<T>(fn: () => Promise<T>, options?: LoadingServiceOptions): Promise<T>
}
```

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `show` | `(options?: LoadingServiceOptions) => void` | 显示全屏 loading；引用计数 `+1`，首次调用才真正创建实例 |
| `close` | `() => void` | 引用计数 `-1`；归零时关闭并销毁实例；计数已为 0 时安全空操作 |
| `withLoading` | `<T>(fn: () => Promise<T>, options?: LoadingServiceOptions) => Promise<T>` | 包裹异步函数，自动 `show` / `close`；`fn` 抛错也会在 `finally` 中关闭 |

::: tip 引用计数语义
并发场景下 `show` / `close` 必须配对。例如同时发出两个请求都 `show`，则需两次 `close` 才会真正关闭 loading；推荐用 `withLoading` 避免手动管理。
:::

## confirmService

封装 `ElMessageBox.confirm`，返回 `Promise<boolean>`：确认 resolve `true`，取消/关闭 resolve `false`，业务代码不再需要 `try/catch`。

来自 `@/lib/confirm/confirmService`。

```ts
import { confirmService } from '@/lib/confirm/confirmService'

const ok = await confirmService.showConfirm('确认删除该用户？', '危险操作')
if (ok) {
  await deleteUser(id)
}
```

### 自定义按钮与类型

第三参 `options` 透传 `ElMessageBoxOptions`（排除 `message` / `title`）：

```ts
const ok = await confirmService.showConfirm(
  '此操作将永久删除，是否继续？',
  '提示',
  {
    confirmButtonText: '确认删除',
    cancelButtonText: '再想想',
    type: 'error'
  }
)
```

### 默认行为

默认 `confirmButtonText: '确定'`、`cancelButtonText: '取消'`、`type: 'warning'`，`options` 会覆盖默认值。

### API

```ts
interface ConfirmService {
  showConfirm(
    message: string,
    title?: string,
    options?: Omit<Partial<ElMessageBoxOptions>, 'message' | 'title'>
  ): Promise<boolean>
}
```

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `showConfirm` | `(message: string, title?: string, options?: ...) => Promise<boolean>` | 显示确认框；`title` 默认 `'提示'`；确认返回 `true`，取消/关闭返回 `false` |

## downloadService

无 Vue 依赖的文件下载服务，提供 Blob / URL / Stream / CSV 四种下载方式，统一处理文件名提取与浏览器兼容。来自 `@/lib/file/downloadService`。

### downloadCsv —— 下载 CSV 文本

前置 BOM（`﻿`）确保 Excel 正确识别 UTF-8，避免中文乱码：

```ts
import { downloadCsv } from '@/lib/file/downloadService'

const csv = 'name,role\n张三,admin\n李四,user'
downloadCsv(csv, 'users.csv')
```

::: tip 与后端导出端点配合
后端 `exportXxx` 端点返回 CSV 文本（含表头），前端拿到字符串后用 `downloadCsv` 触发下载。详见架构约定中的「CSV 导出契约」。
:::

### downloadBlob —— 下载 Blob

filename 必填，避免浏览器忽略扩展名：

```ts
import { downloadBlob } from '@/lib/file/downloadService'

const blob = new Blob([json], { type: 'application/json' })
downloadBlob(blob, 'data.json')
```

Blob URL 会在 1 秒后或页面隐藏时（`visibilitychange`）自动 `revokeObjectURL`，避免快速点击累积内存。

### downloadUrl —— 下载已有 URL

GET 请求指定 URL，优先从 `Content-Disposition` 头提取真实文件名（支持 `filename*=UTF-8''` 与 `filename=` 两种形式），提取失败时用 `fallbackFilename`：

```ts
import { downloadUrl } from '@/lib/file/downloadService'

await downloadUrl('/api/files/123', '未命名文件.pdf')
```

请求默认 `credentials: 'include'`，可通过第三参 `init` 追加 `RequestInit`（如 headers）。

### downloadStream —— 下载流

读取 `ReadableStream<Uint8Array>` 为 chunks 后合并下载，适合大文件流式下载：

```ts
import { downloadStream } from '@/lib/file/downloadService'

const res = await fetch('/api/files/large')
if (res.body) {
  await downloadStream(res.body, 'large.zip')
}
```

### API

| 方法 | 签名 | 返回 | 说明 |
| --- | --- | --- | --- |
| `downloadBlob` | `(blob: Blob, filename: string)` | `DownloadResult` | 下载 Blob；filename 必填；自动回收 blob URL |
| `downloadUrl` | `(url: string, fallbackFilename: string, init?: RequestInit)` | `Promise<DownloadResult>` | GET 下载 URL；从 `Content-Disposition` 提取文件名 |
| `downloadStream` | `(stream: ReadableStream<Uint8Array>, filename: string)` | `Promise<DownloadResult>` | 读取流为 chunks 后下载 |
| `downloadCsv` | `(text: string, filename: string)` | `DownloadResult` | 下载 CSV 文本；自动加 UTF-8 BOM |

`DownloadResult` 结构：

```ts
interface DownloadResult {
  filename: string
  size: number
}
```
