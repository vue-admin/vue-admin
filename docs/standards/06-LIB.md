# 业务通用服务指南

> 本文档规定 `lib/` 层的通用服务使用规范与工具函数的使用方式。

## 分层原则

`lib/` 层是基础设施层，**只依赖 `shared/（可选），禁止反向依赖 `app/` 或 `modules/`。

## lib 服务概览

| 服务 | 文件 | 用途 |
|------|------|------|
| 格式化 | `lib/format/` | 日期、货币、数字、相对时间格式化 |
| 文件上传 | `lib/file/uploadService.ts` | 文件上传、并发控制、校验 |
| 文件下载 | `lib/file/downloadService.ts` | 文件下载、Blob 处理 |
| HTTP 客户端 | `lib/http/client.ts` | 统一 HTTP 请求、拦截器 |
| 错误处理 | `lib/error/` | 错误类型、边界处理 |
| 请求缓存 | `lib/cache/` | 内存缓存、请求去重 |
| 主题色 | `lib/theme/` | Element Plus 主题色生成 |

## 格式化服务

### 引入方式：

```typescript
import {
  formatDate,
  formatCurrency,
  formatNumber,
  formatRelativeTime,
} from '@/lib/format'
```

### formatDate

日期格式化，基于 `Intl.DateTimeFormat`。

```typescript
// 默认格式：YYYY-MM-DD HH:mm:ss
formatDate(new Date()) // '2024-01-15 14:30:00'

// 自定义格式
formatDate(date, 'YYYY-MM-DD') // '2024-01-15'
formatDate(date, 'YYYY年MM月DD日') // '2024年01月15日'
formatDate(date, 'HH:mm:ss') // '14:30:00'
```

**支持的格式占位符：**

| 占位符 | 说明 | 示例 |
|--------|------|------|
| YYYY | 四位年份 | 2024 |
| MM | 两位月份 | 01-12 |
| DD | 两位日期 | 01-31 |
| HH | 24 小时制 | 00-23 |
| mm | 分钟 | 00-59 |
| ss | 秒 | 00-59 |

### formatCurrency

货币格式化，基于 `Intl.NumberFormat`。

```typescript
// 默认人民币
formatCurrency(12345.56) // '¥12,345.56'

// 美元
formatCurrency(12345.56, 'USD') // '$12,345.56'

// 自定义小数位数
formatCurrency(12345.56, 'CNY', 0) // '¥12,346'
```

### formatNumber

数字格式化，千分位分隔。

```typescript
formatNumber(1234567.89) // '1,234,567.89'
formatNumber(1234567.89, 0) // '1,234,568'
```

### formatRelativeTime

相对时间格式化。

```typescript
const date = new Date(Date.now() - 2 * 60 * 1000)
formatRelativeTime(date) // '2 分钟前'
```

**在 Vue 组件中使用：**

```vue
<template>
  <div>{{ formatDate(item.createTime) }}</div>
</template>

<script setup lang="ts">
import { formatDate } from '@/lib/format'
</script>
```

## 文件上传服务

```typescript
import { uploadFile, uploadFiles, validateFile } from '@/lib/file/uploadService'
```

### 单个文件上传

```typescript
const file = fileInput.files[0]

// 校验文件
const validation = validateFile(file, {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png'],
})

if (!validation.valid) {
  ElMessage.error(validation.message!)
  return
}

// 上传文件
try {
  const result = await uploadFile(file, {
    url: '/api/upload',
    onProgress: (percent => {
      console.log(`上传进度：${percent}%`)
    },
  })
  console.log('文件 URL：', result.url)
} catch (e) {
  console.error('上传失败：', e)
}
```

### 批量上传

```typescript
const files = Array.from(fileInput.files)

// 并发控制：最多 3 个同时上传
const results = await uploadFiles(files, {
  url: '/api/upload',
  concurrency: 3,
  onProgress: (file, percent) => {
    console.log(`${file.name}: ${percent}%`)
  },
})
```

### 上传配置

```typescript
interface UploadOptions {
  url: string                    // 上传接口地址
  fieldName?: string             // 表单字段名，默认 file
  maxSize?: number              // 最大文件大小（字节）
  allowedTypes?: string[]      // 允许的 MIME 类型
  concurrency?: number         // 并发数，默认 3
  onProgress?: (percent: number, file: File) => void
  headers?: Record<string, string>
}
```

## 文件下载服务

```typescript
import {
  downloadBlob,
  downloadUrl,
  downloadStream,
} from '@/lib/file/downloadService'
```

### 下载 Blob

```typescript
// 下载 Blob 数据
const blob = await api.get('/api/export', { responseType: 'blob' })
downloadBlob(blob, 'data.xlsx')
```

### 下载 URL

```typescript
// 通过 URL 下载文件
downloadUrl('/api/files/123/download', 'document.pdf')
```

### 流式下载

```typescript
// 流式下载（适用于大文件）
await downloadStream(response.body, 'large-file.zip')
```

## 请求缓存服务

```typescript
import { withCache, dedupe, memoryCache } from '@/lib/cache'
```

### 内存缓存

```typescript
// 创建缓存实例
const cache = new MemoryCache<string>({
  maxSize: 100,      // 最大条数
  ttl: 5 * 60 * 1000, // 5 分钟过期
})

// 设置缓存
cache.set('key', 'value')

// 获取缓存
const value = cache.get('key')

// 删除缓存
cache.delete('key')

// 清空
cache.clear()
```

### 包装请求缓存

```typescript
// 包装 API 请求，自动缓存结果
const fetchUserWithCache = withCache(
  (userId) => fetchUser(userId),
  {
    keyGen: (userId) => `user:${userId}`,
    ttl: 5 * 60 * 1000, // 5 分钟
  },
)

// 首次调用：发请求
const user1 = await fetchUserWithCache(123)
// 第二次调用：5 分钟内返回缓存
const user2 = await fetchUserWithCache(123)
```

### 请求去重

```typescript
// 并发相同请求自动合并
const fetchDataDeduped = dedupe(fetchData)

// 同一时间多次调用只会发一次请求
const [result1, result2, result3] = await Promise.all([
  fetchDataDeduped(params),
  fetchDataDeduped(params),
  fetchDataDeduped(params),
])
```

**适用场景：**
- 多个组件同时请求相同数据
- 用户快速点击导致重复请求
- 轮询场景减少服务器压力

## URL 状态同步

在 `app/composables/useUrlState.ts`（Vue 响应式与 URL query 参数双向绑定。

```typescript
import { useUrlState } from '@/app/composables/useUrlState'

// 响应式 ref 与 URL query 同步
const keyword = useUrlState('keyword', '')

// 当 ref 变化时 URL 自动更新
keyword.value = 'search term'
// URL: ?keyword=search term

// 当 URL 变化时 ref 自动更新
// 用户手动修改 URL ?keyword=new value
// keyword.value === 'new value'
```

**高级用法：JSON 序列化：

```typescript
const filters = useUrlState('filters', { status: 'active', type: 'all' }, {
  serialize: JSON.stringify,
  deserialize: JSON.parse,
})
```

## HTTP 客户端

统一通过 `api` 辅助函数调用接口。

```typescript
import { api } from '@/lib/http/client'

// GET 请求
const data = await api.get<User>('/api/user/1')

// POST 请求
const created = await api.post<User>('/api/user', { name: '张三' })

// PUT 请求
const updated = await api.put<User>('/api/user/1', { name: '李四' })

// DELETE 请求
await api.del('/api/user/1')

// 关闭全局错误提示
await api.post('/api/user', data, { _silent: true })
```

**完整示例见 [02-API.md](./02-API.md)。

## 扩展新服务

在 `lib/` 下新增通用服务时遵循以下原则：

1. **纯函数优先**：不依赖 Vue 响应式
2. **类型完备**：TypeScript 类型完整覆盖
3. **单元测试**：关键路径有测试
4. **文档齐全**：使用示例、边界情况
5. **不反向依赖**：不依赖 `app/` 或 `modules/`

**目录结构：**

```
src/lib/{service-name}/
├── index.ts              # 对外导出
├── types.ts              # 类型定义
└── __tests__/
    └── service.test.ts   # 单元测试
```
