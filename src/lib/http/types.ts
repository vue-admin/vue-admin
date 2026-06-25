// HTTP 层通用类型

// 业务成功响应（HTTP 200 时）
export interface ApiResult<T> {
  code: number         // 0 = 成功
  data: T
  msg: string
  traceId?: string
}

// RFC 7807 Problem Details（HTTP 4xx/5xx 时）
export interface ProblemDetail {
  type: string                         // 问题类型 URI
  title: string                        // 简短摘要
  status: number                       // HTTP 状态码
  detail: string                       // 具体说明
  instance?: string                    // 资源 URI
  code?: string                        // 应用层错误码（机器可读）
  errors?: Record<string, string[]>    // 字段级错误（如表单校验）
  traceId?: string
}
