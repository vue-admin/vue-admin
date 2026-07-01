import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig
} from 'axios'
import { installInterceptors } from '@/lib/http/interceptors'
import { HttpError } from '@/lib/error/types'

vi.mock('element-plus', () => ({
  ElMessage: { error: vi.fn(), warning: vi.fn(), info: vi.fn() }
}))

// 用自定义 adapter 替代真实网络：返回成功响应
function successAdapter(data: unknown, status = 200) {
  return async (
    config: InternalAxiosRequestConfig
  ): Promise<AxiosResponse> => ({
    data,
    status,
    statusText: 'OK',
    headers: {},
    config
  })
}

// 用自定义 adapter 抛出错误响应（模拟 HTTP 4xx/5xx）
function errorAdapter(status: number, data: unknown) {
  return async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    const err = Object.assign(new Error('Request failed'), {
      config,
      response: { data, status, statusText: '', headers: {}, config },
      isAxiosError: true,
      toJSON() {
        return { message: 'Request failed', code: 'ERR_BAD_REQUEST' }
      }
    })
    throw err
  }
}

describe('interceptors', () => {
  let instance: AxiosInstance

  beforeEach(() => {
    vi.clearAllMocks()
    instance = axios.create()
    installInterceptors(instance)
  })

  it('HTTP 200 + code=0 解包 data', async () => {
    instance.defaults.adapter = successAdapter({
      code: 0,
      data: { id: 1 },
      msg: 'ok'
    })
    const res = await instance.get('/x')
    expect(res.data).toEqual({ id: 1 })
  })

  it('HTTP 4xx 抛 HttpError 含 ProblemDetail', async () => {
    const problem = {
      type: 'about:blank',
      title: 'Bad Request',
      status: 400,
      detail: 'invalid'
    }
    instance.defaults.adapter = errorAdapter(400, problem)
    await expect(instance.get('/x')).rejects.toBeInstanceOf(HttpError)
    try {
      await instance.get('/x')
    } catch (e) {
      expect(e).toBeInstanceOf(HttpError)
      expect((e as HttpError).problem.title).toBe('Bad Request')
    }
  })

  it('silent 请求错误不触发全局 ElMessage', async () => {
    instance.defaults.adapter = errorAdapter(400, {
      type: 'x',
      title: 't',
      status: 400,
      detail: 'd'
    })
    const { ElMessage } = await import('element-plus')
    await instance.get('/x', { _silent: true } as never).catch(() => {})
    expect(ElMessage.error).not.toHaveBeenCalled()
  })
})
