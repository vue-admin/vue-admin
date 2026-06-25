// HTTP 客户端公共类型定义
// 业务模块统一使用 ./service.ts 提供的 service 单例
import type { AxiosResponse } from 'axios'

// 业务接口结构
export interface ApiResult<T = any> {
  code: number
  data: T
  msg: string
  error?: boolean
  response?: AxiosResponse
}
