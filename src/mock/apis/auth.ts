import type { MockMethod } from 'vite-plugin-mock'

// 测试账号：admin / 123456（super_admin，全权限）；user / 123456（普通，user:read）
interface MockUser {
  id: string
  username: string
  password: string
  nickname: string
  roles: string[]
  permissions: string[]
}

// 不含 password 的用户视图（/api/auth/me 返回值）
type SafeUser = Omit<MockUser, 'password'>

interface AuthResultData {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

const USERS: MockUser[] = [
  {
    id: '1',
    username: 'admin',
    password: '123456',
    nickname: 'Admin',
    roles: ['super_admin'],
    permissions: ['*']
  },
  {
    id: '2',
    username: 'user',
    password: '123456',
    nickname: 'User',
    roles: ['user'],
    permissions: ['user:read']
  }
]

// accessToken / refreshToken -> username 内存索引
const TOKENS = new Map<string, string>()
const REFRESH_TOKENS = new Map<string, string>()

// 生成测试用 token：前缀_用户名_时间戳_随机串，同时登记到对应 Map
function genToken(prefix: string, username: string): string {
  const token = `${prefix}_${username}_${Date.now()}_${Math.random().toString(36).slice(2)}`
  TOKENS.set(token, username)
  return token
}

// 失败响应：过渡形态 { code:<non-zero>, msg, data:null }，
// 由 M2.4 拦截器的 transitional path 触发 HttpError（title 取自 msg）。
// M5 切到 MSW 后再做正式 HTTP 4xx + RFC 7807。
function fail(code: number, msg: string) {
  return { code, msg, data: null }
}

// 成功响应：ApiResult 包装
function success<T>(data: T, msg = 'ok') {
  return { code: 0, data, msg }
}

export default [
  {
    url: '/api/auth/sessions',
    method: 'post',
    response: ({
      body
    }: {
      body: { username?: string; password?: string }
    }) => {
      const user = USERS.find(
        (u) => u.username === body.username && u.password === body.password
      )
      if (!user) {
        return fail(401, '用户名或密码错误')
      }
      const accessToken = genToken('a', user.username)
      const refreshToken = genToken('r', user.username)
      REFRESH_TOKENS.set(refreshToken, user.username)
      return success<AuthResultData>({
        accessToken,
        refreshToken,
        expiresIn: 3600
      })
    }
  },
  {
    url: '/api/auth/tokens/refresh',
    method: 'post',
    response: ({ body }: { body: { refreshToken?: string } }) => {
      const username = body.refreshToken
        ? REFRESH_TOKENS.get(body.refreshToken)
        : undefined
      if (!username) {
        return fail(401, 'Invalid refresh token')
      }
      const user = USERS.find((u) => u.username === username)
      if (!user) {
        return fail(401, 'User not found')
      }
      // 旧 refresh token 一次性失效，签发新对
      if (body.refreshToken) {
        REFRESH_TOKENS.delete(body.refreshToken)
      }
      const accessToken = genToken('a', user.username)
      const refreshToken = genToken('r', user.username)
      REFRESH_TOKENS.set(refreshToken, user.username)
      return success<AuthResultData>({
        accessToken,
        refreshToken,
        expiresIn: 3600
      })
    }
  },
  {
    url: '/api/auth/sessions',
    method: 'delete',
    response: () => success<null>(null)
  },
  {
    url: '/api/auth/users/me',
    method: 'get',
    response: ({ headers }: { headers: { authorization?: string } }) => {
      const auth = headers.authorization || ''
      const token = auth.replace(/^Bearer\s+/, '')
      const username = TOKENS.get(token)
      if (!username) {
        return fail(401, 'Unauthorized')
      }
      const user = USERS.find((u) => u.username === username)
      if (!user) {
        return fail(401, 'User not found')
      }
      // 不返回 password
      const { password: _password, ...safe } = user
      void _password
      return success<SafeUser>(safe)
    }
  }
] as MockMethod[]
