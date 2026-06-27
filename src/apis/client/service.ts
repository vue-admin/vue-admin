// 过渡薄壳：底层走 @/lib/http/client 的统一 http 客户端，
// 对外保留旧的 service.get/post/put/delete 三参数调用签名 + { silent } 选项，
// 让现有 src/apis/*/index.ts 业务封装零改动继续工作。
// M3 完成后，业务模块迁到 modules/<domain>/api.ts，本壳删除。
import { http } from '@/lib/http/client'
import type { AxiosRequestConfig, AxiosResponse } from 'axios'

// 兼容旧 ApiRequestConfig 的 silent 字段
interface LegacyRequestOptions extends AxiosRequestConfig {
  silent?: boolean
}

// 旧响应形状：业务消费方普遍写 `res.data.xxx`，
// 部分老代码还会读 `res.error` / `res.response`（旧 Service 在异常时返回 { error: true, response }）。
// 新 http 客户端异常会抛 HttpError，正常路径下这两个字段恒为 undefined，
// 保留字段定义仅为兼容老消费方的类型签名。
interface LegacyResponse<T> {
  data: T
  error?: boolean
  response?: AxiosResponse
}

function adapt<T>(
  promise: Promise<T>,
  _options?: LegacyRequestOptions,
): Promise<LegacyResponse<T>> {
  // silent → _silent 已在调用处通过 config 传递；这里仅做形状包装
  return promise.then(data => ({ data })) as Promise<LegacyResponse<T>>
}

const service = {
  get<T = unknown>(
    url: string,
    data?: unknown,
    options?: LegacyRequestOptions,
  ): Promise<LegacyResponse<T>> {
    // GET 的 data 作为 query params（保持旧行为）
    return adapt<T>(
      http.get<T>(url, { ...options, params: data, _silent: options?.silent }).then(r => r.data),
    )
  },
  post<T = unknown>(
    url: string,
    data?: unknown,
    options?: LegacyRequestOptions,
  ): Promise<LegacyResponse<T>> {
    return adapt<T>(
      http.post<T>(url, data, { ...options, _silent: options?.silent }).then(r => r.data),
    )
  },
  put<T = unknown>(
    url: string,
    data?: unknown,
    options?: LegacyRequestOptions,
  ): Promise<LegacyResponse<T>> {
    return adapt<T>(
      http.put<T>(url, data, { ...options, _silent: options?.silent }).then(r => r.data),
    )
  },
  delete<T = unknown>(
    url: string,
    options?: LegacyRequestOptions,
  ): Promise<LegacyResponse<T>> {
    return adapt<T>(
      http.delete<T>(url, { ...options, _silent: options?.silent }).then(r => r.data),
    )
  },
}

export default service
