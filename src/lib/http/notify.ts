import { ElMessage } from 'element-plus'
import type { ProblemDetail } from './types'

interface NotifyOptions {
  silent?: boolean
}

// 全局错误提示。silent=true 时业务自行处理。
// grouping=true：相同 message 自动合并，避免重复 4xx/5xx 刷屏。
export function notifyProblem(problem: ProblemDetail, opts: NotifyOptions = {}): void {
  if (opts.silent) return
  ElMessage.error({ message: problem.title, grouping: true })
}
