import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/app/stores/user'
import type { UserProfile } from '@/lib/auth/types'

// Mock authService —— 用 vi.mocked() 在测试中改返回值，避免 as any
vi.mock('@/lib/auth/authService', () => ({
  authService: {
    isAuthenticated: vi.fn<() => boolean>(() => false),
    logout: vi.fn<() => Promise<void>>(async () => {}),
    login: vi.fn(),
    refresh: vi.fn(),
    me: vi.fn()
  }
}))

// Mock api：默认空菜单，避免守卫卡在 reject
vi.mock('@/lib/http/client', () => ({
  api: {
    get: vi.fn<(url: string) => Promise<unknown[]>>(async () => []),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    del: vi.fn()
  }
}))

// Mock registerDynamicRoutes：验证调用而不真正注册路由
// 用 vi.hoisted 把变量提升到 vi.mock 之前，避免 ReferenceError
const { mockRegisterDynamicRoutes } = vi.hoisted(() => ({
  mockRegisterDynamicRoutes:
    vi.fn<(router: unknown, menus: unknown, monitor: unknown) => void>()
}))

vi.mock('@/lib/router/dynamic', () => ({
  registerDynamicRoutes: mockRegisterDynamicRoutes
}))

import { authService } from '@/lib/auth/authService'
import { api } from '@/lib/http/client'
import { _resetMenusRegistered, bootstrapMenus, installGuards } from '@/lib/router/guards'

function makeRouter(
  routes: RouteRecordRaw[] = []
): ReturnType<typeof createRouter> {
  return createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: '/',
        name: 'layout',
        component: { template: '<RouterView />' }
      },
      {
        path: '/login',
        name: 'login',
        component: { template: '<div />' },
        meta: { public: true }
      },
      ...routes
    ]
  })
}

describe('guards', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    // 每个用例重置 menusRegistered 标志，确保 bootstrap 子步骤可重复触发
    _resetMenusRegistered()
    // 默认空菜单：守卫会调用 api.get 拉菜单，必须给个 resolved 值
    vi.mocked(api.get).mockResolvedValue([])
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
      { path: '/secret', name: 'secret', component: { template: '<div />' } }
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
        meta: { permissions: { all: ['admin:read'] } }
      }
    ])
    installGuards(router)
    vi.mocked(authService.isAuthenticated).mockReturnValue(true)
    const u = useUserStore()
    const profile: UserProfile = {
      id: '1',
      username: 'x',
      roles: ['user'],
      permissions: ['user:read']
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
        meta: { permissions: { all: ['admin:read'] } }
      }
    ])
    installGuards(router)
    vi.mocked(authService.isAuthenticated).mockReturnValue(true)
    const u = useUserStore()
    const profile: UserProfile = {
      id: '1',
      username: 'x',
      roles: ['super_admin'],
      permissions: []
    }
    u.profile = profile
    u.isLoaded = true
    await router.push('/admin').catch(() => undefined)
    expect(router.currentRoute.value.name).toBe('admin')
  })

  it('菜单请求失败后再次导航应重新拉取（不能因 finally 误标记为已注册）', async () => {
    const router = makeRouter()
    installGuards(router)
    vi.mocked(authService.isAuthenticated).mockReturnValue(true)
    const u = useUserStore()
    u.profile = { id: '1', username: 'x', roles: [], permissions: [] }
    u.isLoaded = true

    // 首次失败，第二次成功（用内部计数避免 Once 队列语义歧义）
    let count = 0
    vi.mocked(api.get).mockImplementation(() => {
      count += 1
      return count === 1
        ? Promise.reject(new Error('network'))
        : Promise.resolve([])
    })
    // 用两个不同路径，确保 vue-router 真正重跑守卫（同路径 push 会被判为重复导航）
    await router.push('/a').catch(() => undefined)
    await router.push('/b').catch(() => undefined)
    // 失败后重试生效：api.get 被调用两次
    expect(count).toBe(2)
  })

  it('bootstrapMenus 失败不标记已注册，允许重试', async () => {
    const router = makeRouter()
    let count = 0
    vi.mocked(api.get).mockImplementation(() => {
      count += 1
      return count === 1
        ? Promise.reject(new Error('net'))
        : Promise.resolve([])
    })
    await expect(bootstrapMenus(router)).rejects.toThrow('net')
    // 失败后状态可重试
    await expect(bootstrapMenus(router)).resolves.toBeUndefined()
    expect(count).toBe(2)
  })

  it('bootstrapMenus 并发调用复用 in-flight promise（只拉一次）', async () => {
    const router = makeRouter()
    let resolveFn: ((v: unknown[]) => void) | null = null
    vi.mocked(api.get).mockImplementation(
      () =>
        new Promise<unknown[]>(
          (r) => (resolveFn = r as (v: unknown[]) => void)
        )
    )
    // 两次并发调用：第二次必须复用第一次的 in-flight promise
    const p1 = bootstrapMenus(router)
    const p2 = bootstrapMenus(router)
    expect(vi.mocked(api.get).mock.calls.length).toBe(1)
    expect(resolveFn).not.toBeNull()
    resolveFn!([])
    await Promise.all([p1, p2])
    // resolve 后总调用数仍为 1
    expect(vi.mocked(api.get).mock.calls.length).toBe(1)
  })
})
