import { defineStore } from 'pinia'
import { useDark } from '@vueuse/core'
import { ref, watch } from 'vue'

/**
 * 主题（深色 / 浅色）状态。
 *
 * 迁移自 `src/stores/dark.ts`。`useDark()` 内部已处理：
 * - `document.documentElement.classList.toggle('dark')` 切换
 * - localStorage 持久化（`vueuse-color-scheme`）
 * - 与 `main.ts` 中导入的 `element-plus/theme-chalk/dark/css-vars.css` 联动
 *
 * 实现说明：`useDark()` 返回 `WritableComputedRef`，Pinia setup store 直接返回
 * 会让调用方 `storeToRefs` 在内部 `isComputed` 检查时访问 `undefined.effect`
 * 报错。这里包一层普通 `ref` + 双向 `watch` 同步，保留 useDark 的全部副作用。
 */
export const useThemeStore = defineStore('theme', () => {
  const _dark = useDark()
  const isDark = ref(_dark.value)
  watch(_dark, (v) => {
    isDark.value = v
  })
  watch(isDark, (v) => {
    _dark.value = v
  })
  const toggleDark = () => {
    isDark.value = !isDark.value
  }
  return { isDark, toggleDark }
})
