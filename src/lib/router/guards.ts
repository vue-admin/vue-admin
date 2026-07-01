import type { Router } from 'vue-router'
import { authService } from '@/lib/auth/authService'
import { useUserStore } from '@/app/stores/user'
import { usePermissionStore } from '@/app/stores/permission'
import { api } from '@/lib/http/client'
import { registerDynamicRoutes } from '@/lib/router/dynamic'
import { defaultMonitor } from '@/lib/error/monitor'
import type { MenuDTO } from '@/lib/router/types-menu'

// 模块级标志：本次会话是否已成功注册过动态路由
let menusRegistered = false
// 并发保护：复用 in-flight promise，避免并发导航重复拉取菜单 / 重复注册路由
let menusPromise: Promise<void> | null = null

// 测试或主动重置用（如登出后希望重新注册）
export function _resetMenusRegistered(): void {
  menusRegistered = false
  menusPromise = null
}

/**
 * 拉取菜单并注册动态路由。
 *
 * 设计要点（修复间歇性 404）：
 * - 仅在成功时置 menusRegistered=true，失败时保持 false 以便下次导航重试；
 * - 复用 in-flight promise，并发导航只触发一次菜单拉取，避免重复注册竞态；
 * - 失败时向上抛错，由守卫决定降级策略。
 */
export async function bootstrapMenus(router: Router): Promise<void> {
  if (menusRegistered) return
  if (menusPromise) return menusPromise
  menusPromise = (async () => {
    try {
      const menus = await api.get<MenuDTO[]>('/api/system/menus')
      registerDynamicRoutes(router, menus, defaultMonitor)
      // 同步到 permission store，供 Sidebar 渲染
      usePermissionStore().setMenus(menus)
      menusRegistered = true
    } finally {
      menusPromise = null
    }
  })()
  return menusPromise
}

// 安装 4 步全局守卫：白名单 → 认证 → bootstrap（profile + menus）→ 权限
export function installGuards(router: Router): void {
  router.beforeEach(async (to) => {
    // 1) 白名单：meta.public 标记的页面免登录
    if (to.meta.public) return true

    // 2) 认证：无 token 跳登录，带 redirect 回跳
    if (!authService.isAuthenticated()) {
      return { path: '/login', query: { redirect: to.fullPath } }
    }

    // 3) Profile bootstrap：首次访问受保护页拉用户信息；失败则登出
    const userStore = useUserStore()
    if (!userStore.isLoaded) {
      try {
        await userStore.loadProfile()
      } catch {
        await authService.logout()
        return { path: '/login' }
      }
    }

    // 3.5) Menus bootstrap：首次拉菜单并注册动态路由
    if (!menusRegistered) {
      let succeeded = false
      try {
        await bootstrapMenus(router)
        succeeded = true
      } catch (e) {
        defaultMonitor.captureException(e as Error)
        // 菜单失败不阻塞核心导航：降级用静态路由继续（不重定向，
        // 避免对未注册的动态路由形成重试；下次导航会自动重试 bootstrap）
      }
      // 仅成功时重定向到当前目标，让新注册的路由可被解析
      if (succeeded) {
        return { path: to.fullPath, replace: true }
      }
    }

    // 4) 权限：meta.permissions.{any,all} / roles.{any,all}
    const perm = usePermissionStore()
    const m = to.meta
    if (m.permissions?.any && !perm.hasAnyPermission(m.permissions.any))
      return false
    if (m.permissions?.all && !perm.hasAllPermissions(m.permissions.all))
      return false
    if (m.roles?.any && !perm.hasAnyRole(m.roles.any)) return false
    if (m.roles?.all && !perm.hasAllRoles(m.roles.all)) return false
    return true
  })
}
