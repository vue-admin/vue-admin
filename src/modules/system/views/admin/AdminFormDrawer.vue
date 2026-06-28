<template>
  <FormDrawer
    ref="formDrawerRef"
    v-model="visible"
    :title="drawerTitle"
    :mode="mode"
    :form-data="formData"
    :fields="fields"
    :rules="rules"
    :loading="submitting"
    width="600px"
    @submit="handleSubmit"
  />
</template>

<script lang="ts" setup>
import { ref, watch, reactive, computed } from 'vue'
import { FormDrawer } from '@/app/components'
import type { FormField, FormDrawerMode } from '@/app/components/FormDrawer/types'
import { ElMessage } from 'element-plus'
import {
  createAdmin,
  updateAdmin,
  type AdminInfo,
  type AdminCreateRequest,
} from '../../admin/api'

const props = defineProps<{
  modelValue: boolean
  mode: FormDrawerMode
  data: AdminInfo | null
}>()

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  success: []
}>()

const visible = ref(props.modelValue)
const submitting = ref(false)
const formDrawerRef = ref<InstanceType<typeof FormDrawer>>()

watch(() => props.modelValue, (v) => {
  visible.value = v
  if (v) initForm()
})
watch(visible, (v) => emit('update:modelValue', v))

const formData = reactive<AdminCreateRequest & { confirmPassword: string }>({
  username: '',
  realName: '',
  email: '',
  phone: '',
  role: 'admin',
  status: 'active',
  password: '',
  confirmPassword: '',
})

const drawerTitle = computed(() => {
  if (props.mode === 'add') return '新增管理员'
  if (props.mode === 'edit') return '编辑管理员'
  return '查看管理员'
})

const fields = computed<FormField[]>(() => [
  { prop: 'username', label: '用户名', type: 'input', span: 12 },
  { prop: 'realName', label: '姓名', type: 'input', span: 12 },
  { prop: 'email', label: '邮箱', type: 'input', span: 12 },
  { prop: 'phone', label: '电话', type: 'input', span: 12 },
  {
    prop: 'role',
    label: '角色',
    type: 'select',
    span: 12,
    options: [
      { label: '超级管理员', value: 'super' },
      { label: '普通管理员', value: 'admin' },
    ],
  },
  {
    prop: 'status',
    label: '状态',
    type: 'select',
    span: 12,
    options: [
      { label: '启用', value: 'active' },
      { label: '禁用', value: 'inactive' },
    ],
  },
  {
    prop: 'password',
    label: '密码',
    type: 'password',
    span: 12,
    placeholder: props.mode === 'edit' ? '编辑时留空表示不修改' : '请输入密码',
    dependencies: [{ trigger: 'mode', show: (_, ctx) => ctx.mode !== 'view' }],
    rules: [
      { required: props.mode === 'add', message: '请输入密码', trigger: 'blur' },
      { min: 6, message: '密码长度至少6个字符', trigger: 'blur' },
    ],
  },
  {
    prop: 'confirmPassword',
    label: '确认密码',
    type: 'password',
    span: 12,
    dependencies: [{ trigger: 'mode', show: (_, ctx) => ctx.mode !== 'view' }],
    rules: [
      { required: props.mode === 'add', message: '请再次输入密码', trigger: 'blur' },
      {
        validator: (_rule, value, cb) => {
          if (value !== formData.password) cb(new Error('两次输入的密码不一致'))
          else cb()
        },
        trigger: ['blur', 'change'],
      },
    ],
  },
])

// password 字段变化时手动触发 confirmPassword 重校验（EP 2.11 不支持 relations prop）
watch(() => formData.password, () => {
  if (formData.confirmPassword) {
    formDrawerRef.value?.validateField('confirmPassword')
  }
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度应在3-20个字符之间', trigger: 'blur' },
  ],
  realName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: ['blur', 'change'] },
  ],
  phone: [
    { required: true, message: '请输入电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号', trigger: ['blur', 'change'] },
  ],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

const initForm = () => {
  const empty = {
    username: '',
    realName: '',
    email: '',
    phone: '',
    role: 'admin' as const,
    status: 'active' as const,
    password: '',
    confirmPassword: '',
  }
  if (props.mode === 'edit' && props.data) {
    Object.assign(formData, {
      username: props.data.username,
      realName: props.data.realName,
      email: props.data.email,
      phone: props.data.phone,
      role: props.data.role,
      status: props.data.status,
      password: '',
      confirmPassword: '',
    })
  } else {
    Object.assign(formData, empty)
  }
}

const handleSubmit = async (data: Record<string, unknown>) => {
  submitting.value = true
  try {
    const { confirmPassword: _omit, ...rest } = formData
    const payload = { ...rest, ...data } as AdminCreateRequest
    // 编辑模式下若密码留空，则不修改密码
    if (props.mode === 'edit' && !payload.password) delete payload.password
    if (props.mode === 'add') {
      await createAdmin(payload)
      ElMessage.success('新增成功')
    } else {
      await updateAdmin(props.data!.id, payload)
      ElMessage.success('更新成功')
    }
    emit('success')
    emit('update:modelValue', false)
  } finally {
    submitting.value = false
  }
}
</script>
