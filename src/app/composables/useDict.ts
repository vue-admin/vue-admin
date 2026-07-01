import { ref, onMounted } from 'vue'
import {
  fetchDictList,
  fetchDictItemList,
  type DictInfo,
  type DictItemInfo,
} from '@/modules/system/dict/api'

interface DictOption {
  value: string | number
  label: string
  type?: string
}

// 将后端 DictItemInfo 映射为前端下拉选项
function toItemOption(item: DictItemInfo): DictOption {
  return {
    value: item.value || item.code,
    label: item.name,
    type: 'info',
  }
}

// 加载单个字典的完整流程：先按 code 找到字典，再拿 id 拉字典项。
async function loadDictByCode(code: string): Promise<DictOption[]> {
  const dictResult = await fetchDictList({
    keyword: code,
    categoryId: '',
    status: 'active',
    page: 1,
    size: 100,
  })
  const dict = dictResult.records.find((item: DictInfo) => item.code === code)
  if (!dict) {
    console.warn(`字典 ${code} 不存在`)
    return []
  }
  const itemResult = await fetchDictItemList({
    keyword: '',
    dictId: dict.id,
    status: 'active',
    page: 1,
    size: 100,
  })
  return itemResult.records.map(toItemOption)
}

/**
 * 字典 Hook - 加载单个字典
 *
 * @example
 * ```ts
 * const { loading, data } = useDict('user_status')
 * <DictTag :value="row.status" :options="data" />
 * ```
 */
export function useDict(code: string) {
  const loading = ref(false)
  const data = ref<DictOption[]>([])

  const load = async () => {
    loading.value = true
    try {
      data.value = await loadDictByCode(code)
    } catch (e) {
      console.error(`加载字典 ${code} 失败`, e)
    } finally {
      loading.value = false
    }
  }

  onMounted(load)

  return { loading, data, refresh: load }
}

/**
 * 批量加载字典（并行）。N 个字典仅耗时 max(N) 而非 sum(N)。
 */
export function useDicts(codes: string[]) {
  const loading = ref(false)
  const dicts = ref<Record<string, DictOption[]>>({})

  const loadAll = async () => {
    loading.value = true
    try {
      const entries = await Promise.all(
        codes.map(async (code) => {
          try {
            return [code, await loadDictByCode(code)] as const
          } catch (e) {
            console.error(`加载字典 ${code} 失败`, e)
            return [code, []] as const
          }
        })
      )
      dicts.value = Object.fromEntries(entries)
    } finally {
      loading.value = false
    }
  }

  onMounted(loadAll)

  return { loading, dicts, refresh: loadAll }
}
