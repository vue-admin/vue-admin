import type { AuthProvider } from './AuthProvider'
import type { TokenStorage } from './TokenStorage'
import type { LoginRequest, AuthResult, UserProfile } from './types'
import { setTokenReader } from '@/lib/http/token'
import { jwtAuthProvider } from './JwtAuthProvider'
import { getTokenStorage } from './TokenStorage'

// 工厂函数：便于测试注入 mock
export function createAuthService(provider: AuthProvider, storage: TokenStorage) {
  let refreshPromise: Promise<AuthResult> | null = null

  // 把 storage 注册到 http 层（让拦截器能读 token）
  setTokenReader({
    getAccessToken: () => storage.getAccessToken(),
  })

  return {
    async login(req: LoginRequest): Promise<AuthResult> {
      const result = await provider.login(req)
      storage.setTokens(result.accessToken, result.refreshToken)
      return result
    },

    async refresh(): Promise<AuthResult> {
      // 并发保护：复用同一 refreshPromise
      if (refreshPromise) return refreshPromise
      const refreshToken = storage.getRefreshToken()
      if (!refreshToken) {
        storage.clear()
        throw new Error('No refresh token')
      }
      refreshPromise = provider
        .refresh(refreshToken)
        .then((result) => {
          storage.setTokens(result.accessToken, result.refreshToken)
          return result
        })
        .finally(() => {
          refreshPromise = null
        })
      try {
        return await refreshPromise
      } catch (e) {
        storage.clear()
        throw e
      }
    },

    async logout(): Promise<void> {
      try {
        await provider.logout()
      } finally {
        storage.clear()
      }
    },

    async me(): Promise<UserProfile> {
      return provider.me()
    },

    isAuthenticated(): boolean {
      return !!storage.getAccessToken()
    },
  }
}

// 默认单例（生产环境用）
export const authService = createAuthService(jwtAuthProvider, getTokenStorage())
