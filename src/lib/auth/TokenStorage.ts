// Token 存储抽象：默认实现为 内存 + sessionStorage
// 未来后端具备 HttpOnly Cookie 能力时，必须切换到 HttpOnlyCookieTokenStorage（强制）

export interface TokenStorage {
  getAccessToken(): string | null
  getRefreshToken(): string | null
  setTokens(access: string, refresh?: string): void
  clear(): void
}

const KEY_ACCESS = 'va:access'
const KEY_REFRESH = 'va:refresh'

// 默认实现：access token 同时存内存（关闭标签前的快速访问）+ sessionStorage（刷新页面恢复）
// refresh token 仅存 sessionStorage
export class MemorySessionTokenStorage implements TokenStorage {
  private memoryAccess: string | null = null

  constructor() {
    this.memoryAccess = sessionStorage.getItem(KEY_ACCESS)
  }

  getAccessToken(): string | null {
    return this.memoryAccess ?? sessionStorage.getItem(KEY_ACCESS)
  }

  getRefreshToken(): string | null {
    return sessionStorage.getItem(KEY_REFRESH)
  }

  setTokens(access: string, refresh?: string): void {
    this.memoryAccess = access
    sessionStorage.setItem(KEY_ACCESS, access)
    if (refresh) sessionStorage.setItem(KEY_REFRESH, refresh)
    else sessionStorage.removeItem(KEY_REFRESH)
  }

  clear(): void {
    this.memoryAccess = null
    sessionStorage.removeItem(KEY_ACCESS)
    sessionStorage.removeItem(KEY_REFRESH)
  }
}

// 运行时持有的存储实例（由 app/main.ts 在启动时设置）
let activeStorage: TokenStorage = new MemorySessionTokenStorage()

export function setTokenStorage(s: TokenStorage): void {
  activeStorage = s
}

export function getTokenStorage(): TokenStorage {
  return activeStorage
}
