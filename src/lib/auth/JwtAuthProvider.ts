import { api } from '@/lib/http/client'
import type { AuthProvider } from './AuthProvider'
import type { LoginRequest, AuthResult, UserProfile } from './types'

// JWT 默认实现：对接 /api/auth/* RESTful 端点
// - POST   /api/auth/sessions       创建会话（登录）
// - DELETE /api/auth/sessions       销毁会话（登出）
// - POST   /api/auth/tokens/refresh 刷新 token
// - GET    /api/auth/users/me       当前用户
export const jwtAuthProvider: AuthProvider = {
  async login(req: LoginRequest): Promise<AuthResult> {
    return api.post<AuthResult>('/api/auth/sessions', req, { _silent: true })
  },

  async refresh(refreshToken: string): Promise<AuthResult> {
    return api.post<AuthResult>(
      '/api/auth/tokens/refresh',
      { refreshToken },
      { _silent: true }
    )
  },

  async logout(): Promise<void> {
    await api.del<void>('/api/auth/sessions', { _silent: true })
  },

  async me(): Promise<UserProfile> {
    return api.get<UserProfile>('/api/auth/users/me', { _silent: true })
  }
}
