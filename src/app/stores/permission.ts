import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useUserStore } from './user'
import type { MenuDTO } from '@/lib/router/types-menu'

export const usePermissionStore = defineStore('permission', () => {
  const userStore = useUserStore()
  const permissions = computed(() => userStore.permissions ?? [])
  const roles = computed(() => userStore.roles ?? [])

  // 动态菜单（从 API 加载）
  const menus = ref<MenuDTO[]>([])
  const menusLoaded = ref(false)

  const isSuperAdmin = computed(() => roles.value.includes('super_admin'))

  const hasPermission = (p: string): boolean =>
    isSuperAdmin.value || permissions.value.includes(p)

  const hasAnyPermission = (ps: string[]): boolean =>
    isSuperAdmin.value || ps.some((p) => permissions.value.includes(p))

  const hasAllPermissions = (ps: string[]): boolean =>
    isSuperAdmin.value || ps.every((p) => permissions.value.includes(p))

  const hasRole = (r: string): boolean =>
    isSuperAdmin.value || roles.value.includes(r)

  const hasAnyRole = (rs: string[]): boolean =>
    isSuperAdmin.value || rs.some((r) => roles.value.includes(r))

  const hasAllRoles = (rs: string[]): boolean =>
    isSuperAdmin.value || rs.every((r) => roles.value.includes(r))

  // 检查单个菜单项是否对当前用户可见
  function canSeeMenu(menu: MenuDTO): boolean {
    const perm = menu.meta?.permissions as
      | { any?: string[]; all?: string[] }
      | undefined
    if (!perm) return true
    if (isSuperAdmin.value) return true
    if (perm.any && perm.any.length) return hasAnyPermission(perm.any)
    if (perm.all && perm.all.length) return hasAllPermissions(perm.all)
    return true
  }

  // 过滤后的菜单（侧边栏使用）
  const visibleMenus = computed<MenuDTO[]>(() => {
    const filter = (list: MenuDTO[]): MenuDTO[] => {
      const result: MenuDTO[] = []
      for (const item of list) {
        if (!canSeeMenu(item)) continue
        if (item.children?.length) {
          const children = filter(item.children)
          if (children.length > 0) {
            result.push({ ...item, children })
          }
        } else {
          result.push(item)
        }
      }
      return result
    }
    return filter(menus.value)
  })

  function setMenus(list: MenuDTO[]) {
    menus.value = list
    menusLoaded.value = true
  }

  function clearMenus() {
    menus.value = []
    menusLoaded.value = false
  }

  return {
    permissions,
    roles,
    isSuperAdmin,
    menus,
    menusLoaded,
    visibleMenus,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    canSeeMenu,
    setMenus,
    clearMenus
  }
})
