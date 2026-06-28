import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import { ref, watch } from 'vue'

/**
 * 侧边栏折叠状态。
 *
 * 迁移自 `src/stores/collapse.ts`（旧版为 VueUse `useStorage` + `useToggle` 全局 ref）。
 * 保留 localStorage 持久化（key: `collapse`）与默认折叠（true）行为。
 *
 * 实现说明：包一层普通 `ref` + 双向 `watch` 同步 `useStorage`，与 theme store
 * 风格一致，避免 Pinia setup store 直接返回 VueUse ref 的潜在问题。
 */
export const useSidebarStore = defineStore('sidebar', () => {
  const _stored = useStorage('collapse', true)
  const collapsed = ref(_stored.value)
  watch(_stored, (v) => {
    collapsed.value = v
  })
  watch(collapsed, (v) => {
    _stored.value = v
  })
  const toggleCollapsed = () => {
    collapsed.value = !collapsed.value
  }
  const setCollapsed = (v: boolean) => {
    collapsed.value = v
  }
  return { collapsed, toggleCollapsed, setCollapsed }
})
