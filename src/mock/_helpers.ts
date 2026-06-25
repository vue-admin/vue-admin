import type { ServerResponse } from 'http'
import type { ProblemDetail } from '@/lib/http/types'
import type { ApiResult } from '@/lib/http/types'

// 成功响应（HTTP 200 + ApiResult）
export function success<T>(data: T, msg = 'ok'): ApiResult<T> {
  return { code: 0, data, msg }
}

// 在 vite-plugin-mock 的 response 回调里写入 HTTP 4xx/5xx + RFC 7807 ProblemDetail
// 调用此函数后，response 回调不再返回值
export function sendProblem(
  res: ServerResponse,
  opts: { status: number; title: string; detail: string; type?: string },
): void {
  const problem: ProblemDetail = {
    type: opts.type ?? 'about:blank',
    title: opts.title,
    status: opts.status,
    detail: opts.detail,
  }
  res.statusCode = opts.status
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify(problem))
}
