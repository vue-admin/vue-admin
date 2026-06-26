import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { setActivePinia, createPinia } from 'pinia'
import { installGuards } from '@/lib/router/guards'
import { useUserStore } from '@/app/stores/user'
import type { UserProfile } from '@/lib/auth/types'

// Mock authService —— 用 vi.mocked() 在测试中改返回值，避免 as any
vi.mock('@/lib/auth/authService', () => ({
  authService: {
    isAuthenticated: vi.fn<() => boolean>(() => false),
    logout: vi.fn<() => Promise<void>>(async () => {}),
    login: vi.fn(),
    refresh: vi.fn(),
    me: vi.fn(),
  },
}))

import { authService } from '@/lib/auth/authService'

function makeRouter(routes: RouteRecordRaw[] = []): ReturnType<typeof createRouter> {
  return createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: '/',
        name: 'layout',
        component: { template: '<RouterView />' },
      },
      {
        path: '/login',
        name: 'login',
        component: { template: '<div />' },
        meta: { public: true },
      },
      ...routes,
    ],
  })
}

describe('guards', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('public 路由直接放行', async () => {
    const router = makeRouter()
    installGuards(router)
    vi.mocked(authService.isAuthenticated).mockReturnValue(true)
    await router.push('/login')
    expect(router.currentRoute.value.name).toBe('login')
  })

  it('未认证访问受保护路由 → 跳 /login', async () => {
    const router = makeRouter([
      { path: '/secret', name: 'secret', component: { template: '<div />' } },
    ])
    installGuards(router)
    vi.mocked(authService.isAuthenticated).mockReturnValue(false)
    await router.push('/secret').catch(() => undefined)
    expect(router.currentRoute.value.path).toBe('/login')
  })

  it('已认证但无权限 → 导航被取消', async () => {
    const router = makeRouter([
      {
        path: '/admin',
        name: 'admin',
        component: { template: '<div />' },
        meta: { permissions: { all: ['admin:read'] } },
      },
    ])
    installGuards(router)
    vi.mocked(authService.isAuthenticated).mockReturnValue(true)
    const u = useUserStore()
    const profile: UserProfile = {
      id: '1',
      username: 'x',
      roles: ['user'],
      permissions: ['user:read'],
    }
    u.profile = profile
    u.isLoaded = true
    await router.push('/admin').catch(() => undefined)
    expect(router.currentRoute.value.name).not.toBe('admin')
  })

  it('super_admin 放行所有', async () => {
    const router = makeRouter([
      {
        path: '/admin',
        name: 'admin',
        component: { template: '<div />' },
        meta: { permissions: { all: ['admin:read'] } },
      },
    ])
    installGuards(router)
    vi.mocked(authService.isAuthenticated).mockReturnValue(true)
    const u = useUserStore()
    const profile: UserProfile = {
      id: '1',
      username: 'x',
      roles: ['super_admin'],
      permissions: [],
    }
    u.profile = profile
    u.isLoaded = true
    await router.push('/admin').catch(() => undefined)
    expect(router.currentRoute.value.name).toBe('admin')
  })
})
