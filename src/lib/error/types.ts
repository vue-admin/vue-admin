import type { ProblemDetail } from '@/lib/http/types'

// 携带 ProblemDetail 的错误类
export class HttpError extends Error {
  constructor(
    public readonly problem: ProblemDetail,
    public readonly response?: Response
  ) {
    super(problem.title)
    this.name = 'HttpError'
  }
}

// 监控接口（默认 console，可替换 Sentry 等）
export interface Monitor {
  captureException(err: Error, context?: Record<string, unknown>): void
  captureMessage(msg: string, level?: 'info' | 'warn' | 'error'): void
  setUser(user: { id: string; username?: string } | null): void
}
