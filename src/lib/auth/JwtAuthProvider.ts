import { api } from '@/lib/http/client'
import type { AuthProvider } from './AuthProvider'
import type { LoginRequest, AuthResult, UserProfile } from './types'

// JWT 默认实现：对接 /api/auth/* 四端点
export const jwtAuthProvider: AuthProvider = {
  async login(req: LoginRequest): Promise<AuthResult> {
    return api.post<AuthResult>('/api/auth/login', req, { _silent: true })
  },

  async refresh(refreshToken: string): Promise<AuthResult> {
    return api.post<AuthResult>('/api/auth/refresh', { refreshToken }, { _silent: true })
  },

  async logout(): Promise<void> {
    await api.post<void>('/api/auth/logout', {}, { _silent: true })
  },

  async me(): Promise<UserProfile> {
    return api.get<UserProfile>('/api/auth/me', { _silent: true })
  },
}
