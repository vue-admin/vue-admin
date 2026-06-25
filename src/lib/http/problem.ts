import type { ProblemDetail } from './types'

const HTTP_STATUS_TITLE: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  500: 'Internal Server Error',
}

// 容错解析：body 可能是对象、字符串、或 null
export function parseProblem(status: number, body: unknown): ProblemDetail {
  const fallbackTitle = HTTP_STATUS_TITLE[status] ?? `HTTP ${status}`

  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>
    return {
      type: typeof b.type === 'string' ? b.type : 'about:blank',
      title: typeof b.title === 'string' ? b.title : fallbackTitle,
      status: typeof b.status === 'number' ? b.status : status,
      detail: typeof b.detail === 'string' ? b.detail : '',
      instance: typeof b.instance === 'string' ? b.instance : undefined,
      code: typeof b.code === 'string' ? b.code : undefined,
      errors: b.errors && typeof b.errors === 'object'
        ? b.errors as Record<string, string[]>
        : undefined,
      traceId: typeof b.traceId === 'string' ? b.traceId : undefined,
    }
  }

  if (typeof body === 'string' && body.length > 0) {
    return {
      type: 'about:blank',
      title: fallbackTitle,
      status,
      detail: body,
    }
  }

  return {
    type: 'about:blank',
    title: fallbackTitle,
    status,
    detail: '',
  }
}
