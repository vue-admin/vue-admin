import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/app/stores/user'
import { usePermissionStore } from '@/app/stores/permission'
import type { UserProfile } from '@/lib/auth/types'

describe('permissionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // 强类型 seed：直接通过 Pinia setup store 暴露的 ref 写入
  function seed(roles: string[], perms: string[]): void {
    const u = useUserStore()
    const profile: UserProfile = {
      id: '1',
      username: 'x',
      roles,
      permissions: perms
    }
    u.profile = profile
    u.isLoaded = true
  }

  it('普通用户 hasPermission 命中返回 true', () => {
    seed(['user'], ['user:read'])
    const p = usePermissionStore()
    expect(p.hasPermission('user:read')).toBe(true)
    expect(p.hasPermission('user:write')).toBe(false)
  })

  it('hasAnyPermission 任一命中即 true', () => {
    seed(['user'], ['user:read'])
    const p = usePermissionStore()
    expect(p.hasAnyPermission(['user:read', 'user:write'])).toBe(true)
    expect(p.hasAnyPermission(['user:write', 'user:delete'])).toBe(false)
  })

  it('hasAllPermissions 全部命中才 true', () => {
    seed(['user'], ['user:read', 'user:write'])
    const p = usePermissionStore()
    expect(p.hasAllPermissions(['user:read', 'user:write'])).toBe(true)
    expect(p.hasAllPermissions(['user:read', 'user:delete'])).toBe(false)
  })

  it('super_admin 短路所有检查', () => {
    seed(['super_admin'], [])
    const p = usePermissionStore()
    expect(p.isSuperAdmin).toBe(true)
    expect(p.hasPermission('any')).toBe(true)
    expect(p.hasAnyPermission(['any'])).toBe(true)
    expect(p.hasAllPermissions(['a', 'b', 'c'])).toBe(true)
    expect(p.hasRole('whatever')).toBe(true)
  })

  it('hasAnyRole / hasAllRoles', () => {
    seed(['admin', 'editor'], [])
    const p = usePermissionStore()
    expect(p.hasAnyRole(['admin'])).toBe(true)
    expect(p.hasAllRoles(['admin', 'editor'])).toBe(true)
    expect(p.hasAllRoles(['admin', 'ghost'])).toBe(false)
  })
})
