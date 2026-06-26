import type { Directive, DirectiveBinding } from 'vue'
import { usePermissionStore } from '@/app/stores/permission'

// 指令 binding value：支持字符串、数组、对象语法
export type BindingValue =
  | string
  | string[]
  | { any?: string[]; all?: string[] }

function evaluate(
  store: ReturnType<typeof usePermissionStore>,
  v: BindingValue,
): boolean {
  if (typeof v === 'string') return store.hasPermission(v)
  if (Array.isArray(v)) return store.hasAnyPermission(v)
  if (v && typeof v === 'object') {
    if (v.all) return store.hasAllPermissions(v.all)
    if (v.any) return store.hasAnyPermission(v.any)
  }
  return false
}

// v-permission：未命中权限时从 DOM 移除元素（不用 CSS 隐藏，避免逃逸检查）
export const vPermission: Directive<HTMLElement, BindingValue> = {
  mounted(el, binding: DirectiveBinding<BindingValue>) {
    const store = usePermissionStore()
    if (store.isSuperAdmin) return
    if (!evaluate(store, binding.value)) {
      el.parentNode?.removeChild(el)
    }
  },
}
