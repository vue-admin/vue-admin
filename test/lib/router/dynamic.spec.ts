import { describe, it, expect, vi } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'
import { registerDynamicRoutes } from '@/lib/router/dynamic'
import type { MenuDTO } from '@/lib/router/types-menu'
import type { Monitor } from '@/lib/error/types'

// 强类型 stub monitor（满足 Monitor 接口，禁止 any）
const stubMonitor: Monitor = {
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  setUser: vi.fn(),
}

// 强类型 glob mock：path -> loader
type Glob = Record<string, () => Promise<unknown>>

function makeRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: '/',
        name: 'layout',
        component: { template: '<RouterView />' },
      },
    ],
  })
}

describe('registerDynamicRoutes', () => {
  it('存在的 component 注册成功', () => {
    const router = makeRouter()
    const menus: MenuDTO[] = [
      { path: '/x', name: 'x', component: 'crud/Index' },
    ]
    const glob: Glob = {
      '/src/modules/crud/Index.vue': () => Promise.resolve({}),
    }
    expect(() => registerDynamicRoutes(router, menus, stubMonitor, glob)).not.toThrow()
    expect(router.hasRoute('x')).toBe(true)
  })

  it('缺失 component 记 monitor 并跳过', () => {
    const router = makeRouter()
    const menus: MenuDTO[] = [
      { path: '/y', name: 'y', component: 'nonexistent/Foo' },
    ]
    const glob: Glob = {}
    registerDynamicRoutes(router, menus, stubMonitor, glob)
    expect(stubMonitor.captureMessage).toHaveBeenCalled()
    expect(router.hasRoute('y')).toBe(false)
  })

  it('children 递归注册', () => {
    const router = makeRouter()
    const menus: MenuDTO[] = [
      {
        path: '/parent',
        name: 'parent',
        children: [
          { path: '/parent/child', name: 'child', component: 'crud/Index' },
        ],
      },
    ]
    const glob: Glob = {
      '/src/modules/crud/Index.vue': () => Promise.resolve({}),
    }
    registerDynamicRoutes(router, menus, stubMonitor, glob)
    expect(router.hasRoute('child')).toBe(true)
  })
})
