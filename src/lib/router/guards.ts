import type { Router } from 'vue-router'
import { authService } from '@/lib/auth/authService'
import { useUserStore } from '@/app/stores/user'
import { usePermissionStore } from '@/app/stores/permission'
import { api } from '@/lib/http/client'
import { registerDynamicRoutes } from '@/lib/router/dynamic'
import { defaultMonitor } from '@/lib/error/monitor'
import type { MenuDTO } from '@/lib/router/types-menu'

// 模块级标志：本次会话是否已注册过动态路由
let menusRegistered = false

// 测试或主动重置用（如登出后希望重新注册）
export function _resetMenusRegistered(): void {
  menusRegistered = false
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

    // 3.5) Menus bootstrap：首次拉菜单并注册动态路由（仅一次）
    if (!menusRegistered) {
      try {
        const menus = await api.get<MenuDTO[]>('/api/system/menus')
        registerDynamicRoutes(router, menus, defaultMonitor)
      } catch (e) {
        defaultMonitor.captureException(e as Error)
        // 菜单失败不阻塞核心导航：降级用静态路由继续
      } finally {
        menusRegistered = true
      }
      // 注册完动态路由后，重定向到当前目标，让新路由可被解析
      return { path: to.fullPath, replace: true }
    }

    // 4) 权限：meta.permissions.{any,all} / roles.{any,all}
    const perm = usePermissionStore()
    const m = to.meta
    if (m.permissions?.any && !perm.hasAnyPermission(m.permissions.any)) return false
    if (m.permissions?.all && !perm.hasAllPermissions(m.permissions.all)) return false
    if (m.roles?.any && !perm.hasAnyRole(m.roles.any)) return false
    if (m.roles?.all && !perm.hasAllRoles(m.roles.all)) return false
    return true
  })
}
