import axios from 'axios' // 引入axios
import type { AxiosInstance, AxiosResponse, AxiosError } from 'axios'
import type { ApiResult, ApiRequestConfig } from '../common'
import { ElMessage, ElMessageBox } from 'element-plus'
import router from '@/router/index'

class Service {
  axios: AxiosInstance

  constructor(baseURL = '/', timeout = 30000) {
    this.axios = axios.create({
      baseURL,
      timeout,
      headers: {
        'Content-type': 'application/json'
      }
    })
    this.interceptors()
  }
  interceptors() {
    // http request 拦截器
    this.axios.interceptors.request.use(
      (config: ApiRequestConfig) => {
        return config
      },
      (error: AxiosError) => {
        ElMessage({
          showClose: true,
          message: error.message,
          type: 'error'
        })
        return error
      }
    )
    // http response 拦截器
    this.axios.interceptors.response.use(
      (response: AxiosResponse) => {
        const resData = response.data as ApiResult
        if (resData.code === 0) {
          return { data: resData.data, response } as any
        } else {
          const { silent } = response.config as ApiRequestConfig
          !silent &&
            ElMessage({
              showClose: true,
              message: response.data.msg || decodeURI(response.headers.msg),
              type: 'error'
            })
          if (response.data.data && response.data.data.reload) {
            localStorage.clear()
            router.push({ name: 'login', replace: true })
          }
          return { error: true, response }
        }
      },
      (error: AxiosError) => {
        let message = ''
        if (!error.response) {
          ElMessageBox.confirm(
            `
              <p>检测到请求错误</p>
              <p>${error}</p>
              `,
            '请求报错',
            {
              dangerouslyUseHTMLString: true,
              distinguishCancelAndClose: true,
              confirmButtonText: '稍后重试',
              cancelButtonText: '取消'
            }
          ).then((r) => r.action.replace.name)
          return { error: true }
        }

        switch (error.response.status) {
          case 400:
            message = '请求错误(400)'
            break
          case 401:
            message = '未授权，请重新登录(401)'
            localStorage.clear()
            router.push({ name: 'login', replace: true })
            break
          case 403:
            message = '拒绝访问(403)'
            break
          case 404:
            message = '请求出错(404)'
            break
          case 408:
            message = '请求超时(408)'
            break
          case 500:
            message = '服务器错误(500)'
            break
          case 501:
            message = '服务未实现(501)'
            break
          case 502:
            message = '网络错误(502)'
            break
          case 503:
            message = '服务不可用(503)'
            break
          case 504:
            message = '网络超时(504)'
            break
          case 505:
            message = 'HTTP版本不受支持(505)'
            break
          default:
            message = `连接出错(${error.response.status})!`
        }
        // 这里错误消息可以使用全局弹框展示出来
        ElMessage({
          showClose: true,
          message: `${message}，请检查网络或联系管理员！`,
          type: 'error'
        })
        return {
          error: true,
          response: error.response
        }
      }
    )
  }
  get<T = any, D = any>(
    url: string,
    data?: D,
    options?: Partial<ApiRequestConfig>
  ): Promise<ApiResult<T>> {
    return this.axios.get(url, { params: data, ...options })
  }
  put<T = any, D = any>(
    url: string,
    data?: D,
    options?: Partial<ApiRequestConfig>
  ): Promise<ApiResult<T>> {
    return this.axios.put(url, data, options)
  }
  post<T = any, D = any>(
    url: string,
    data?: D,
    options?: Partial<ApiRequestConfig>
  ): Promise<ApiResult<T>> {
    return this.axios.post(url, data, options)
  }
  delete<T = any>(
    url: string,
    options?: Partial<ApiRequestConfig>
  ): Promise<ApiResult<T>> {
    return this.axios.delete(url, options)
  }
}

export default new Service()
