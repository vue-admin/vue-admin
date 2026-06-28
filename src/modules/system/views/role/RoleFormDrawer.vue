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
  createRole,
  updateRole,
  type RoleInfo,
  type RoleCreateRequest,
} from '../../role/api'

const props = defineProps<{
  modelValue: boolean
  mode: FormDrawerMode
  data: RoleInfo | null
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

const formData = reactive<RoleCreateRequest>({
  name: '',
  code: '',
  description: '',
  status: 'active',
})

const drawerTitle = computed(() => {
  if (props.mode === 'add') return '新增角色'
  if (props.mode === 'edit') return '编辑角色'
  return '查看角色'
})

const fields: FormField[] = [
  { prop: 'name', label: '角色名称', type: 'input', span: 24 },
  { prop: 'code', label: '角色代码', type: 'input', span: 24 },
  { prop: 'description', label: '描述', type: 'textarea', span: 24 },
  {
    prop: 'status',
    label: '状态',
    type: 'radio',
    span: 24,
    options: [
      { label: '启用', value: 'active' },
      { label: '禁用', value: 'inactive' },
    ],
  },
]

const rules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 20, message: '角色名称长度应在2-20个字符之间', trigger: 'blur' },
  ],
  code: [
    { required: true, message: '请输入角色代码', trigger: 'blur' },
    { min: 2, max: 20, message: '角色代码长度应在2-20个字符之间', trigger: 'blur' },
  ],
  description: [{ max: 200, message: '描述长度不能超过200个字符', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

const initForm = () => {
  if (props.mode === 'edit' && props.data) {
    Object.assign(formData, {
      name: props.data.name,
      code: props.data.code,
      description: props.data.description,
      status: props.data.status,
    })
  } else {
    Object.assign(formData, {
      name: '',
      code: '',
      description: '',
      status: 'active',
    })
  }
}

const handleSubmit = async (data: Record<string, unknown>) => {
  submitting.value = true
  try {
    const payload = { ...formData, ...data } as RoleCreateRequest
    if (props.mode === 'add') {
      await createRole(payload)
      ElMessage.success('新增成功')
    } else {
      await updateRole(props.data!.id, payload)
      ElMessage.success('更新成功')
    }
    emit('success')
    emit('update:modelValue', false)
  } finally {
    submitting.value = false
  }
}
</script>
