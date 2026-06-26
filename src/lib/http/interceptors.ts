import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'
import { parseProblem } from './problem'
import { notifyProblem } from './notify'
import { getAccessToken } from './token'
import { HttpError } from '@/lib/error/types'
import type { ApiResult } from './types'

// 扩展 config：silent 抑制全局错误提示
declare module 'axios' {
  interface AxiosRequestConfig {
    _silent?: boolean
  }
}

export interface AppAxiosRequestConfig extends InternalAxiosRequestConfig {
  _silent?: boolean
}

export function installInterceptors(instance: AxiosInstance): void {
  // 请求拦截：注入 Bearer Token
  instance.interceptors.request.use((config) => {
    const token = getAccessToken()
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`)
    }
    return config
  })

  // 响应拦截：解包 ApiResult + 解析 ProblemDetail
  instance.interceptors.response.use(
    (response) => {
      // HTTP 200 + ApiResult 包装
      const payload = response.data as ApiResult<unknown> | unknown
      if (payload && typeof payload === 'object'
        && 'code' in payload && 'data' in payload) {
        const result = payload as ApiResult<unknown>
        if (result.code !== 0) {
          // 过渡路径：HTTP 200 + ApiResult.code !== 0
          // status 选取：若 result.code 落在 4xx/5xx 区间则用之；否则默认 500（应用层错误）
          const status = result.code >= 400 && result.code < 600 ? result.code : 500
          const problem = parseProblem(status, {
            type: 'about:blank',
            title: result.msg || 'Unknown error',
            status,
            detail: result.msg || '',
          })
          notifyProblem(problem, { silent: response.config._silent })
          throw new HttpError(problem, response as unknown as Response)
        }
        response.data = result.data
      }
      return response
    },
    (error: AxiosError) => {
      const status = error.response?.status ?? 0
      const body = error.response?.data
      const problem = parseProblem(status, body)
      notifyProblem(problem, { silent: (error.config as AppAxiosRequestConfig)?._silent })
      return Promise.reject(new HttpError(problem, error.response as unknown as Response))
    },
  )
}
