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

// 成功响应 adapter：模拟 HTTP 200/2xx 返回任意 data
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

// 错误响应 adapter：模拟 HTTP 4xx/5xx，抛出 axios 风格错误
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

// 网络错误 adapter：模拟断网，无 response 字段
function networkErrorAdapter() {
  return async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    throw Object.assign(new Error('Network Error'), {
      config,
      isAxiosError: true
      // 注意：无 response 字段
    })
  }
}

describe('interceptors integration', () => {
  let instance: AxiosInstance

  beforeEach(() => {
    vi.clearAllMocks()
    instance = axios.create()
    installInterceptors(instance)
  })

  it('HTTP 200 + ApiResult.code=0 解包 data', async () => {
    instance.defaults.adapter = successAdapter({
      code: 0,
      data: { hello: 'world' },
      msg: 'ok'
    })
    const res = await instance.get('/x')
    expect(res.data).toEqual({ hello: 'world' })
  })

  it('HTTP 200 + ApiResult.code=1 抛 HttpError（业务层错误，违反 ApiResult 契约）', async () => {
    instance.defaults.adapter = successAdapter({
      code: 1,
      data: null,
      msg: 'biz error'
    })
    await expect(instance.get('/x')).rejects.toBeInstanceOf(HttpError)
    try {
      await instance.get('/x')
    } catch (e) {
      const he = e as HttpError
      // code=1 不在 4xx/5xx 区间 → status 应为 500
      expect(he.problem.status).toBe(500)
      expect(he.problem.title).toBe('biz error')
    }
  })

  it('HTTP 500 抛 HttpError 含 ProblemDetail', async () => {
    instance.defaults.adapter = errorAdapter(500, {
      type: 'about:blank',
      title: 'Server Error',
      status: 500,
      detail: 'down'
    })
    await expect(instance.get('/x')).rejects.toBeInstanceOf(HttpError)
    try {
      await instance.get('/x')
    } catch (e) {
      const he = e as HttpError
      expect(he.problem.status).toBe(500)
      expect(he.problem.title).toBe('Server Error')
      expect(he.problem.detail).toBe('down')
    }
  })

  it('silent 请求错误不触发 ElMessage', async () => {
    instance.defaults.adapter = errorAdapter(400, {
      type: 'x',
      title: 't',
      status: 400,
      detail: 'd'
    })
    const { ElMessage } = await import('element-plus')
    await instance.get('/x', { _silent: true } as never).catch(() => undefined)
    expect(ElMessage.error).not.toHaveBeenCalled()
  })

  it('网络错误（无 response）抛 HttpError 含 status=0', async () => {
    instance.defaults.adapter = networkErrorAdapter()
    await expect(instance.get('/x')).rejects.toBeInstanceOf(HttpError)
    try {
      await instance.get('/x')
    } catch (e) {
      const he = e as HttpError
      expect(he.problem.status).toBe(0)
    }
  })
})
