import type { AuthProvider } from './AuthProvider'
import type { TokenStorage } from './TokenStorage'
import type { LoginRequest, AuthResult, UserProfile } from './types'
import { setTokenReader } from '@/lib/http/token'
import { jwtAuthProvider } from './JwtAuthProvider'
import { getTokenStorage } from './TokenStorage'

// 工厂函数：便于测试注入 mock
export function createAuthService(provider: AuthProvider, storage: TokenStorage) {
  let refreshPromise: Promise<AuthResult> | null = null

  // SIDE EFFECT: 把 storage 注册到 http 拦截器层（M2.3 setTokenReader 是模块级单例）
  // 工厂每次调用都会重新注册——生产路径只调用一次（module-level authService 单例），
  // 测试路径靠 beforeEach 重置 mock storage 才能保持隔离。
  // 未来若需要多实例隔离，把 setTokenReader 调用提到工厂外，由 app/main.ts 显式执行。
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
