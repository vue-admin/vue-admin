import { describe, it, expect, beforeEach } from 'vitest'
import { MemorySessionTokenStorage } from '@/lib/auth/TokenStorage'

describe('MemorySessionTokenStorage', () => {
  let storage: MemorySessionTokenStorage

  beforeEach(() => {
    sessionStorage.clear()
    storage = new MemorySessionTokenStorage()
  })

  it('初始状态 token 为 null', () => {
    expect(storage.getAccessToken()).toBeNull()
    expect(storage.getRefreshToken()).toBeNull()
  })

  it('setTokens 仅 access 时只存 access', () => {
    storage.setTokens('a1')
    expect(storage.getAccessToken()).toBe('a1')
    expect(storage.getRefreshToken()).toBeNull()
  })

  it('setTokens 同时存 access + refresh', () => {
    storage.setTokens('a1', 'r1')
    expect(storage.getAccessToken()).toBe('a1')
    expect(storage.getRefreshToken()).toBe('r1')
  })

  it('clear 后 token 全部清空', () => {
    storage.setTokens('a1', 'r1')
    storage.clear()
    expect(storage.getAccessToken()).toBeNull()
    expect(storage.getRefreshToken()).toBeNull()
  })

  it('sessionStorage key 带命名空间 va:', () => {
    storage.setTokens('a1', 'r1')
    expect(sessionStorage.getItem('va:access')).toBe('a1')
    expect(sessionStorage.getItem('va:refresh')).toBe('r1')
  })

  it('新建实例从 sessionStorage 恢复', () => {
    storage.setTokens('a1', 'r1')
    const fresh = new MemorySessionTokenStorage()
    expect(fresh.getAccessToken()).toBe('a1')
    expect(fresh.getRefreshToken()).toBe('r1')
  })
})
