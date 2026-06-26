import type { Router } from 'vue-router'
import { authService } from '@/lib/auth/authService'
import { useUserStore } from '@/app/stores/user'
import { usePermissionStore } from '@/app/stores/permission'

// 安装 4 步全局守卫：白名单 → 认证 → bootstrap → 权限
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
