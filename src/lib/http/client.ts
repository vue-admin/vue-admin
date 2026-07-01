import axios from 'axios'
import { installInterceptors } from './interceptors'

// 全局唯一 HTTP 客户端。业务代码仅从此处导入。
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/',
  timeout: 15_000
})

installInterceptors(instance)

export const http = instance

// 便捷方法（强类型化）
export const api = {
  get: <T>(url: string, config?: Parameters<typeof instance.get>[1]) =>
    instance.get<T>(url, config).then((r) => r.data),
  post: <T>(
    url: string,
    data?: unknown,
    config?: Parameters<typeof instance.post>[2]
  ) => instance.post<T>(url, data, config).then((r) => r.data),
  put: <T>(
    url: string,
    data?: unknown,
    config?: Parameters<typeof instance.put>[2]
  ) => instance.put<T>(url, data, config).then((r) => r.data),
  patch: <T>(
    url: string,
    data?: unknown,
    config?: Parameters<typeof instance.patch>[2]
  ) => instance.patch<T>(url, data, config).then((r) => r.data),
  del: <T>(url: string, config?: Parameters<typeof instance.delete>[1]) =>
    instance.delete<T>(url, config).then((r) => r.data)
}

export default http
