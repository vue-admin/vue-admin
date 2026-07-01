<template>
  <FormDrawer
    v-model="visible"
    :title="drawerTitle"
    :mode="mode"
    :form-data="formData"
    :fields="fields"
    :rules="rules"
    :loading="submitting"
    width="500px"
    @submit="handleSubmit"
  />
</template>

<script lang="ts" setup>
import { ref, watch, reactive, computed } from 'vue'
import { FormDrawer } from '@/app/components'
import type { FormField, FormDrawerMode } from '@/app/components/FormDrawer/types'
import { ElMessage } from 'element-plus'
import {
  createPermission,
  updatePermission,
  type PermissionInfo,
  type PermissionCreateRequest,
} from '../../permission/api'
import { COMMON_STATUS_OPTIONS } from '@/app/constants/enums'

const props = defineProps<{
  modelValue: boolean
  mode: FormDrawerMode
  data: PermissionInfo | null
}>()

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  success: []
}>()

const visible = ref(props.modelValue)
const submitting = ref(false)

watch(() => props.modelValue, (v) => {
  visible.value = v
  if (v) initForm()
})
watch(visible, (v) => emit('update:modelValue', v))

const formData = reactive<PermissionCreateRequest>({
  name: '',
  code: '',
  description: '',
  module: '',
  status: 'active',
})

const drawerTitle = computed(() => {
  if (props.mode === 'add') return '新增权限'
  if (props.mode === 'edit') return '编辑权限'
  return '查看权限'
})

const fields: FormField[] = [
  { prop: 'name', label: '权限名称', type: 'input', span: 12 },
  { prop: 'code', label: '权限代码', type: 'input', span: 12 },
  {
    prop: 'module',
    label: '模块',
    type: 'select',
    span: 12,
    options: [
      { label: '系统管理', value: 'system' },
      { label: '用户管理', value: 'user' },
      { label: '角色管理', value: 'role' },
      { label: '权限管理', value: 'permission' },
      { label: '字典管理', value: 'dict' },
      { label: '系统配置', value: 'config' },
    ],
  },
  {
    prop: 'status',
    label: '状态',
    type: 'radio',
    span: 12,
    options: [...COMMON_STATUS_OPTIONS],
  },
  { prop: 'description', label: '描述', type: 'textarea', span: 24 },
]

const rules = {
  name: [{ required: true, message: '请输入权限名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入权限代码', trigger: 'blur' }],
  module: [{ required: true, message: '请选择模块', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  description: [{ max: 200, message: '描述长度不能超过200个字符', trigger: 'blur' }],
}

const initForm = () => {
  if ((props.mode === 'edit' || props.mode === 'view') && props.data) {
    Object.assign(formData, {
      name: props.data.name,
      code: props.data.code,
      description: props.data.description,
      module: props.data.module,
      status: props.data.status,
    })
  } else {
    Object.assign(formData, {
      name: '',
      code: '',
      description: '',
      module: '',
      status: 'active',
    })
  }
}

const handleSubmit = async (data: Record<string, unknown>) => {
  submitting.value = true
  try {
    const payload = { ...formData, ...data } as PermissionCreateRequest
    if (props.mode === 'add') {
      await createPermission(payload)
      ElMessage.success('新增成功')
    } else {
      await updatePermission(props.data!.id, payload)
      ElMessage.success('更新成功')
    }
    emit('success')
    emit('update:modelValue', false)
  } finally {
    submitting.value = false
  }
}
</script>
