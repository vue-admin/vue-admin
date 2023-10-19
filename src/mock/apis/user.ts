import type { MockMethod } from 'vite-plugin-mock'

export default [
  {
    url: '/api/login', // 注意，这里只能是string格式
    method: 'post',
    response: (req) => {
      if (req.body.username == 'admin') {
        return {
          code: 0,
          data: {
            token: 'safdasdfas'
          }
        }
      } else {
        return {
          code: 401,
          msg: '用户名密码错误'
        }
      }
    }
  }
] as MockMethod[] // 这里其实就是定义数据格式的，不了解的同学可以参考typescript的官方文档
