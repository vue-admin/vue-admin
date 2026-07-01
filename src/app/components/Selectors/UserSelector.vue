<template>
  <el-select
    :model-value="modelValue"
    :multiple="multiple"
    :disabled="disabled"
    :clearable="clearable"
    :placeholder="placeholder"
    :loading="loading"
    :remote="true"
    :remote-method="onSearch"
    :collapse-tags="multiple"
    :collapse-tags-tooltip="multiple"
    filterable
    remote-show-suffix
    style="width: 100%"
    @update:model-value="onChange"
    @visible-change="onVisible"
  >
    <el-option
      v-for="item in options"
      :key="item.id"
      :label="`${item.realName}（${item.username}）`"
      :value="item.id"
      :disabled="item.status === 'inactive'"
    />
  </el-select>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue'
import { t } from '@/lib/i18n'
import { useDebounceFn } from '@vueuse/core'
import {
  fetchUserList,
  type UserInfo,
  type UserSearchRequest,
} from '@/modules/system/user/api'

const props = withDefaults(
  defineProps<{
    modelValue: string | string[] | undefined
    multiple?: boolean
    disabled?: boolean
    clearable?: boolean
    placeholder?: string
    onlyActive?: boolean
    pageSize?: number
  }>(),
  {
    multiple: false,
    disabled: false,
    clearable: true,
    placeholder: undefined,
    onlyActive: false,
    pageSize: 20,
  }
)

const placeholder = computed(() => props.placeholder ?? t('common.placeholder.selectUser'))

const emit = defineEmits<{
  'update:modelValue': [v: string | string[] | undefined]
  change: [v: string | string[] | undefined]
}>()

const options = ref<UserInfo[]>([])
const loading = ref(false)
let loaded = false

const query = async (keyword: string) => {
  loading.value = true
  try {
    const params: UserSearchRequest = {
      keyword,
      status: props.onlyActive ? 'active' : undefined,
      page: 1,
      size: props.pageSize,
    }
    const res = await fetchUserList(params)
    options.value = res?.records ?? []
    loaded = true
  } finally {
    loading.value = false
  }
}

const onSearch = useDebounceFn((kw: string) => query(kw ?? ''), 300)

const onVisible = (visible: boolean) => {
  if (visible && !loaded) query('')
}

onMounted(() => query(''))

const onChange = (v: string | string[]) => {
  emit('update:modelValue', v)
  emit('change', v)
}
</script>
