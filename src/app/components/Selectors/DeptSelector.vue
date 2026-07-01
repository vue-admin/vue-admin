<template>
  <el-tree-select
    :model-value="modelValue"
    :data="treeData"
    :multiple="multiple"
    :disabled="disabled"
    :clearable="clearable"
    :placeholder="placeholder"
    :loading="loading"
    :props="treeProps"
    :show-checkbox="multiple"
    :check-strictly="false"
    :node-key="'id'"
    filterable
    check-on-click-node
    style="width: 100%"
    @update:model-value="onChange"
  />
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue'
import { t } from '@/lib/i18n'
import { fetchDeptTree, type DeptInfo } from '@/modules/system/dept/api'

const props = withDefaults(
  defineProps<{
    modelValue: string | string[] | undefined
    multiple?: boolean
    disabled?: boolean
    clearable?: boolean
    placeholder?: string
    onlyActive?: boolean
  }>(),
  {
    multiple: false,
    disabled: false,
    clearable: true,
    placeholder: undefined,
    onlyActive: false,
  }
)

const placeholder = computed(() => props.placeholder ?? t('common.placeholder.selectDept'))

const emit = defineEmits<{
  'update:modelValue': [v: string | string[] | undefined]
  change: [v: string | string[] | undefined]
}>()

const treeData = ref<DeptInfo[]>([])
const loading = ref(false)

const treeProps = {
  label: 'name',
  children: 'children',
  disabled: (data: DeptInfo) => props.onlyActive && data.status === 'inactive',
}

const load = async () => {
  loading.value = true
  try {
    const params = props.onlyActive
      ? { keyword: '', status: 'active' }
      : undefined
    treeData.value = (await fetchDeptTree(params)) ?? []
  } finally {
    loading.value = false
  }
}

onMounted(load)

const onChange = (v: string | string[]) => {
  emit('update:modelValue', v)
  emit('change', v)
}
</script>
