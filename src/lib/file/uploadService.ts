// 文件上传服务。基于 @/lib/http/client 的 http 实例，自动携带 Bearer Token。
// 支持类型/大小校验、进度回调、并发上传。

import { http } from '@/lib/http/client'

export interface UploadOptions {
  // 上传端点（必填）
  url: string
  // 文件类型白名单。如 ['image/png', 'image/jpeg']。空表示不校验。
  accept?: string[]
  // 文件大小上限（字节）。0 表示不校验。
  maxSize?: number
  // 上传字段名，默认 'file'
  fieldName?: string
  // 额外表单数据
  formData?: Record<string, string | Blob>
  // 进度回调（0-100）
  onProgress?: (percent: number) => void
  // 取消信号
  signal?: AbortSignal
}

export interface UploadResult<T = unknown> {
  url: string
  name: string
  raw: T
}

const DEFAULT_FIELD_NAME = 'file'

export class UploadError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_TYPE' | 'TOO_LARGE' | 'HTTP_ERROR'
  ) {
    super(message)
    this.name = 'UploadError'
  }
}

// 校验文件类型与大小。
function validateFile(file: File, opts: UploadOptions): void {
  if (opts.accept?.length && !opts.accept.includes(file.type)) {
    throw new UploadError(
      `文件类型 ${file.type || '未知'} 不被允许，仅接受 ${opts.accept.join(', ')}`,
      'INVALID_TYPE'
    )
  }
  if (opts.maxSize && opts.maxSize > 0 && file.size > opts.maxSize) {
    const limitMB = (opts.maxSize / 1024 / 1024).toFixed(1)
    throw new UploadError(
      `文件大小 ${(file.size / 1024 / 1024).toFixed(1)}MB 超过上限 ${limitMB}MB`,
      'TOO_LARGE'
    )
  }
}

// 上传单个文件。返回服务端响应数据。
export async function uploadFile<T = unknown>(
  file: File,
  opts: UploadOptions
): Promise<UploadResult<T>> {
  validateFile(file, opts)

  const form = new FormData()
  form.append(opts.fieldName ?? DEFAULT_FIELD_NAME, file)
  if (opts.formData) {
    for (const [k, v] of Object.entries(opts.formData)) {
      form.append(k, v)
    }
  }

  const res = await http.post<T>(opts.url, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (e.total && opts.onProgress) {
        opts.onProgress(Math.round((e.loaded / e.total) * 100))
      }
    },
    signal: opts.signal
  })

  // 兼容 ApiResult 解包：响应拦截器已解到 data 层
  const payload = res as unknown as { url?: string; name?: string }
  return {
    url: payload?.url ?? '',
    name: payload?.name ?? file.name,
    raw: res as unknown as T
  }
}

// 批量并发上传。默认并发数 3，避免拖慢网络。
export async function uploadFiles<T = unknown>(
  files: File[],
  opts: Omit<UploadOptions, 'onProgress'> & {
    onProgress?: (fileIndex: number, percent: number) => void
  },
  concurrency: number = 3
): Promise<UploadResult<T>[]> {
  const results: UploadResult<T>[] = new Array(files.length)
  let cursor = 0

  async function worker(): Promise<void> {
    while (cursor < files.length) {
      const idx = cursor++
      // 单个文件失败，整体抛错由调用方决定是否继续
      results[idx] = await uploadFile<T>(files[idx], {
        ...opts,
        onProgress: (p) => opts.onProgress?.(idx, p)
      })
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, files.length) }, () => worker())
  )
  return results
}
