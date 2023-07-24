import axios from 'axios' // 引入axios
import type { AxiosInstance, AxiosResponse, AxiosError } from 'axios'
import type { ApiResult, ApiRequestConfig } from './types'
import { ElMessage, ElMessageBox } from 'element-plus'
import router from '@/router/index'

class Service {
  service: AxiosInstance

  constructor(baseURL = '/', timeout = 30000) {
    this.service = axios.create({
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
    this.service.interceptors.request.use(
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
    this.service.interceptors.response.use(
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
          case 500:
            ElMessageBox.confirm(
              `
              <p>检测到接口错误${error}</p>
              <p>错误码<span style="color:red"> 500 </span>：此类错误内容常见于后台panic，请先查看后台日志，如果影响您正常使用可强制登出清理缓存</p>
              `,
              '接口报错',
              {
                dangerouslyUseHTMLString: true,
                distinguishCancelAndClose: true,
                confirmButtonText: '清理缓存',
                cancelButtonText: '取消'
              }
            ).then(() => {
              router.push({ name: 'login', replace: true })
            })
            break
          case 404:
            ElMessageBox.confirm(
              `
                <p>检测到接口错误${error}</p>
                <p>错误码<span style="color:red"> 404 </span>：此类错误多为接口未注册（或未重启）或者请求路径（方法）与api路径（方法）不符--如果为自动化代码请检查是否存在空格</p>
                `,
              '接口报错',
              {
                dangerouslyUseHTMLString: true,
                distinguishCancelAndClose: true,
                confirmButtonText: '我知道了',
                cancelButtonText: '取消'
              }
            ).then(() => {
              router.push({ name: 'login', replace: true })
            })
            break
        }

        return {
          error: true,
          response: error.response
        }
      }
    )
  }
  get<T = any>(
    url: string,
    data?: T,
    options?: Partial<ApiRequestConfig>
  ): Promise<ApiResult<T>> {
    return this.service.get(url, { params: data, ...options })
  }
  put<T = any, D = any>(
    url: string,
    data?: D,
    options?: Partial<ApiRequestConfig>
  ): Promise<ApiResult<T>> {
    return this.service.put(url, data, options)
  }
  post<T = any, D = any>(
    url: string,
    data?: D,
    options?: Partial<ApiRequestConfig>
  ): Promise<ApiResult<T>> {
    return this.service.post(url, data, options)
  }
  delete<T = any>(
    url: string,
    options?: Partial<ApiRequestConfig>
  ): Promise<ApiResult<T>> {
    return this.service.delete(url, options)
  }
}

export default new Service()
