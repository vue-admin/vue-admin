import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useUserStore } from './user'

export const usePermissionStore = defineStore('permission', () => {
  const userStore = useUserStore()
  const permissions = computed(() => userStore.permissions ?? [])
  const roles = computed(() => userStore.roles ?? [])

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

  return {
    isSuperAdmin,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    hasAllRoles,
  }
})
