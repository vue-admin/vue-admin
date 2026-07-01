<template>
  <el-select
    :model-value="modelValue"
    :multiple="multiple"
    :disabled="disabled"
    :clearable="clearable"
    :placeholder="placeholder"
    :loading="loading"
    :collapse-tags="multiple"
    :collapse-tags-tooltip="multiple"
    filterable
    style="width: 100%"
    @update:model-value="onChange"
  >
    <el-option
      v-for="item in options"
      :key="item.id"
      :label="item.name"
      :value="item.id"
      :disabled="item.status === 'inactive'"
    />
  </el-select>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch, computed } from 'vue'
import { t } from '@/lib/i18n'
import {
  fetchRoleList,
  type RoleInfo,
  type RoleSearchRequest,
} from '@/modules/system/role/api'

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

const placeholder = computed(() => props.placeholder ?? t('common.placeholder.selectRole'))

const emit = defineEmits<{
  'update:modelValue': [v: string | string[] | undefined]
  change: [v: string | string[] | undefined]
}>()

const options = ref<RoleInfo[]>([])
const loading = ref(false)

const load = async () => {
  loading.value = true
  try {
    const params: RoleSearchRequest = {
      keyword: '',
      status: props.onlyActive ? 'active' : '',
      page: 1,
      size: 200,
    }
    const res = await fetchRoleList(params)
    options.value = res?.records ?? []
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(
  () => props.onlyActive,
  () => load()
)

const onChange = (v: string | string[]) => {
  emit('update:modelValue', v)
  emit('change', v)
}
</script>
