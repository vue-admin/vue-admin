<template>
  <el-tag
    :type="tagType"
    :size="size"
  >
    {{ displayText }}
  </el-tag>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

interface DictItem {
  value: string | number
  label: string
  type?: string
}

const props = withDefaults(
  defineProps<{
    /** 字典值 */
    value: string | number
    /** 字典列表 */
    options: DictItem[]
    /** 标签大小 */
    size?: 'large' | 'default' | 'small'
  }>(),
  {
    size: 'small',
  }
)

// 获取字典项
const dictItem = computed<DictItem | null>(() => {
  if (!props.options?.length) return null
  return props.options.find((item) => item.value === props.value) || null
})

const displayText = computed(() => {
  return dictItem.value?.label ?? String(props.value)
})

const tagType = computed<string>(() => {
  return dictItem.value?.type ?? 'info'
})
</script>
