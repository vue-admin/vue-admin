import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createAuthService } from '@/lib/auth/authService'
import type { AuthProvider } from '@/lib/auth/AuthProvider'
import type { TokenStorage } from '@/lib/auth/TokenStorage'
import type { LoginRequest, AuthResult, UserProfile } from '@/lib/auth/types'

// 独立声明 vi.fn，避免后续断言需要 as any
const loginMock = vi.fn<(req: LoginRequest) => Promise<AuthResult>>(
  async () => ({ accessToken: 'a1', refreshToken: 'r1' })
)
const refreshMock = vi.fn<(token: string) => Promise<AuthResult>>(async () => ({
  accessToken: 'a2',
  refreshToken: 'r2'
}))
const logoutMock = vi.fn<() => Promise<void>>(async () => {})
const meMock = vi.fn<() => Promise<UserProfile>>(async () => ({
  id: '1',
  username: 'admin',
  roles: ['admin'],
  permissions: ['*']
}))

const mockProvider: AuthProvider = {
  login: loginMock,
  refresh: refreshMock,
  logout: logoutMock,
  me: meMock
}

const getAccessTokenMock = vi.fn<() => string | null>(() => null)
const getRefreshTokenMock = vi.fn<() => string | null>(() => null)
const setTokensMock = vi.fn<(access: string, refresh?: string) => void>()
const clearMock = vi.fn<() => void>()

const mockStorage: TokenStorage = {
  getAccessToken: getAccessTokenMock,
  getRefreshToken: getRefreshTokenMock,
  setTokens: setTokensMock,
  clear: clearMock
}

describe('authService', () => {
  let svc: ReturnType<typeof createAuthService>

  beforeEach(() => {
    loginMock.mockClear()
    refreshMock.mockClear()
    logoutMock.mockClear()
    meMock.mockClear()
    getAccessTokenMock.mockClear()
    getRefreshTokenMock.mockClear()
    setTokensMock.mockClear()
    clearMock.mockClear()
    // 重置默认返回值
    getAccessTokenMock.mockReturnValue(null)
    getRefreshTokenMock.mockReturnValue(null)
    svc = createAuthService(mockProvider, mockStorage)
  })

  it('login 成功后写入 token', async () => {
    await svc.login({ username: 'a', password: 'b' })
    expect(setTokensMock).toHaveBeenCalledWith('a1', 'r1')
  })

  it('isAuthenticated 在有 token 时为 true', () => {
    getAccessTokenMock.mockReturnValue('x')
    expect(svc.isAuthenticated()).toBe(true)
  })

  it('logout 清空 token', async () => {
    await svc.logout()
    expect(clearMock).toHaveBeenCalled()
    expect(logoutMock).toHaveBeenCalled()
  })

  it('并发 refresh 只触发一次 provider.refresh', async () => {
    getRefreshTokenMock.mockReturnValue('r1')
    await Promise.all([svc.refresh(), svc.refresh(), svc.refresh()])
    expect(refreshMock).toHaveBeenCalledTimes(1)
  })

  it('refresh 失败后清空 token', async () => {
    getRefreshTokenMock.mockReturnValue('r1')
    refreshMock.mockRejectedValueOnce(new Error('expired'))
    await expect(svc.refresh()).rejects.toThrow()
    expect(clearMock).toHaveBeenCalled()
  })
})
