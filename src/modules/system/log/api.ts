// log 领域 API。
import { api } from '@/lib/http/client'

export interface LoginLogInfo {
  id: string
  username: string
  ip: string
  location: string
  browser: string
  os: string
  status: 'success' | 'failed'
  message?: string
  loginTime: string
}

export interface OperationLogInfo {
  id: string
  username: string
  module: string
  operation: string
  method: string
  params: string
  time: number
  ip: string
  location: string
  status: 'success' | 'failed'
  errorMsg?: string
  operationTime: string
}

export interface LogSearchRequest {
  keyword: string
  status: string
  startTime: string
  endTime: string
  page: number
  size: number
}

export interface LogSearchResponse<T> {
  records: T[]
  total: number
  current: number
  size: number
}

// 登录日志
export const fetchLoginLogList = (params: LogSearchRequest) =>
  api.get<LogSearchResponse<LoginLogInfo>>('/api/system/login-log', { params })

export const fetchLoginLogDetail = (id: string) =>
  api.get<LoginLogInfo>(`/api/system/login-log/${id}`)

export const deleteLoginLog = (id: string) =>
  api.del<boolean>(`/api/system/login-log/${id}`)

export const batchDeleteLoginLogs = (ids: string[]) =>
  api.del<boolean>('/api/system/login-log', { data: { ids } })

export const clearLoginLogs = () =>
  api.del<boolean>('/api/system/login-log/clear')

export const exportLoginLogs = () =>
  api.get<string>('/api/system/login-log/export')

// 操作日志
export const fetchOperationLogList = (params: LogSearchRequest) =>
  api.get<LogSearchResponse<OperationLogInfo>>('/api/system/operation-log', { params })

export const fetchOperationLogDetail = (id: string) =>
  api.get<OperationLogInfo>(`/api/system/operation-log/${id}`)

export const deleteOperationLog = (id: string) =>
  api.del<boolean>(`/api/system/operation-log/${id}`)

export const batchDeleteOperationLogs = (ids: string[]) =>
  api.del<boolean>('/api/system/operation-log', { data: { ids } })

export const clearOperationLogs = () =>
  api.del<boolean>('/api/system/operation-log/clear')

export const exportOperationLogs = () =>
  api.get<string>('/api/system/operation-log/export')
