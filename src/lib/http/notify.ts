import { ElMessage } from 'element-plus'
import type { ProblemDetail } from './types'

interface NotifyOptions {
  silent?: boolean
}

// 全局错误提示。silent=true 时业务自行处理。
export function notifyProblem(problem: ProblemDetail, opts: NotifyOptions = {}): void {
  if (opts.silent) return
  // 统一用 error 类型；title 经 RFC 7807 解析后已为人类可读摘要
  ElMessage.error(problem.title)
}
