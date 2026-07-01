import { http } from 'msw'
import { ok, fail } from './_utils'

interface MockUser {
  id: string
  username: string
  password: string
  nickname: string
  roles: string[]
  permissions: string[]
}
type SafeUser = Omit<MockUser, 'password'>
interface AuthResultData {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

const USERS: MockUser[] = [
  { id: '1', username: 'admin', password: '123456', nickname: 'Admin', roles: ['super_admin'], permissions: ['*'] },
  { id: '2', username: 'user', password: '123456', nickname: 'User', roles: ['user'], permissions: ['user:read'] }
]

const TOKENS = new Map<string, string>()
const REFRESH_TOKENS = new Map<string, string>()

function genToken(prefix: string, username: string): string {
  const token = `${prefix}_${username}_${Date.now()}_${Math.random().toString(36).slice(2)}`
  TOKENS.set(token, username)
  return token
}

export const authHandlers = [
  http.post('/api/auth/sessions', async ({ request }) => {
    const body = (await request.json()) as { username?: string; password?: string }
    const user = USERS.find((u) => u.username === body.username && u.password === body.password)
    if (!user) return fail(401, '用户名或密码错误')
    const accessToken = genToken('a', user.username)
    const refreshToken = genToken('r', user.username)
    REFRESH_TOKENS.set(refreshToken, user.username)
    return ok<AuthResultData>({ accessToken, refreshToken, expiresIn: 3600 })
  }),
  http.post('/api/auth/tokens/refresh', async ({ request }) => {
    const body = (await request.json()) as { refreshToken?: string }
    const username = body.refreshToken ? REFRESH_TOKENS.get(body.refreshToken) : undefined
    if (!username) return fail(401, 'Invalid refresh token')
    const user = USERS.find((u) => u.username === username)
    if (!user) return fail(401, 'User not found')
    if (body.refreshToken) REFRESH_TOKENS.delete(body.refreshToken)
    const accessToken = genToken('a', user.username)
    const refreshToken = genToken('r', user.username)
    REFRESH_TOKENS.set(refreshToken, user.username)
    return ok<AuthResultData>({ accessToken, refreshToken, expiresIn: 3600 })
  }),
  http.delete('/api/auth/sessions', () => ok<null>(null)),
  http.get('/api/auth/users/me', ({ request }) => {
    const auth = request.headers.get('authorization') ?? ''
    const token = auth.replace(/^Bearer\s+/, '')
    const username = TOKENS.get(token)
    if (!username) return fail(401, 'Unauthorized')
    const user = USERS.find((u) => u.username === username)
    if (!user) return fail(401, 'User not found')
    const { password: _password, ...safe } = user
    void _password
    return ok<SafeUser>(safe)
  })
]
