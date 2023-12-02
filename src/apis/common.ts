import { InternalAxiosRequestConfig, AxiosResponse } from 'axios'

// 业务接口结构
interface ApiResult<T = any> extends AxiosResponse {
  code: number
  data: T
  msg: string
  error?: boolean
  response?: AxiosResponse
}

interface ApiRequestConfig extends InternalAxiosRequestConfig {
  // 用户自定义配置
  silent?: boolean
}

export type { ApiResult, ApiRequestConfig }
