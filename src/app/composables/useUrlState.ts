// URL 状态同步：ref ↔ router query 双向绑定。
// 列表页搜索条件、分页、tab 等可由 URL 驱动，刷新或分享链接后自动恢复。
// 类型默认 string；调用方如需 number/boolean，自行转换。

import { ref, watch, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export type UrlStateValue = string | string[] | null | undefined

// 将 URL 中的 query 值绑定到 ref。任何一方变化都会同步另一方。
// replace 默认 true，避免污染历史记录；如需前进/后退可置 false。
export function useUrlState(
  key: string,
  defaultValue: string = '',
  options: { replace?: boolean } = {}
): Ref<string> {
  const { replace = true } = options
  const route = useRoute()
  const router = useRouter()

  const state = ref<string>(
    (route.query[key] as string | undefined) ?? defaultValue
  )

  // ref → URL
  watch(state, (val) => {
    const currentQuery = { ...route.query }
    if (
      val === defaultValue ||
      val === '' ||
      val === null ||
      val === undefined
    ) {
      delete currentQuery[key]
    } else {
      currentQuery[key] = val
    }
    router.replace({ query: currentQuery })
  })

  // URL → ref（如用户后退/前进、或外部链接跳入）
  watch(
    () => route.query[key],
    (val) => {
      const next = (val as string | undefined) ?? defaultValue
      if (next !== state.value) {
        state.value = next
      }
    }
  )

  void replace // reserved for future use (currently always replace)
  return state
}

// 多个 URL 状态的批量版本。传入 { key: defaultValue } 字典，返回 { key: ref } 字典。
export function useUrlStates(
  schema: Record<string, string>
): Record<string, Ref<string>> {
  const result: Record<string, Ref<string>> = {}
  for (const [k, def] of Object.entries(schema)) {
    result[k] = useUrlState(k, def)
  }
  return result
}
