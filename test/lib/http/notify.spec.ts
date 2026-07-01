import { describe, it, expect, vi, beforeEach } from 'vitest'
import { notifyProblem } from '@/lib/http/notify'
import type { ProblemDetail } from '@/lib/http/types'

vi.mock('element-plus', () => ({
  ElMessage: { error: vi.fn(), warning: vi.fn(), info: vi.fn() }
}))

import { ElMessage } from 'element-plus'

describe('notifyProblem', () => {
  beforeEach(() => vi.clearAllMocks())

  it('silent=true 不提示', () => {
    const p: ProblemDetail = { type: 'x', title: 't', status: 400, detail: 'd' }
    notifyProblem(p, { silent: true })
    expect(ElMessage.error).not.toHaveBeenCalled()
  })

  it('4xx 默认走 ElMessage.error', () => {
    const p: ProblemDetail = {
      type: 'x',
      title: 'Bad',
      status: 400,
      detail: 'd'
    }
    notifyProblem(p)
    expect(ElMessage.error).toHaveBeenCalledWith({
      message: 'Bad',
      grouping: true
    })
  })

  it('5xx 默认走 ElMessage.error', () => {
    const p: ProblemDetail = {
      type: 'x',
      title: 'Server Down',
      status: 500,
      detail: 'd'
    }
    notifyProblem(p)
    expect(ElMessage.error).toHaveBeenCalledWith({
      message: 'Server Down',
      grouping: true
    })
  })
})
