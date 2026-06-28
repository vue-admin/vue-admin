<template>
  <FormDrawer
    v-model="visible"
    :title="mode === 'add' ? '新增用户' : '编辑用户'"
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
import type { FormField } from '@/app/components/FormDrawer/types'
import { ElMessage } from 'element-plus'
import {
  createUser,
  updateUser,
  type UserInfo,
  type UserCreateRequest,
} from '../api'

const props = defineProps<{
  modelValue: boolean
  mode: 'add' | 'edit'
  data: UserInfo | null
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

const formData = reactive<UserCreateRequest>({
  username: '',
  realName: '',
  email: '',
  phone: '',
  role: 'user',
  status: 'active',
  password: '',
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
      { label: '管理员', value: 'admin' },
      { label: '普通用户', value: 'user' },
      { label: 'VIP用户', value: 'vip' },
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
    type: 'input',
    span: 24,
    placeholder: props.mode === 'edit' ? '编辑时留空表示不修改' : '请输入密码',
  },
])

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度应在3-20个字符之间', trigger: 'blur' },
  ],
  realName: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '姓名长度应在2-20个字符之间', trigger: 'blur' },
  ],
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
  password: [
    {
      required: props.mode === 'add',
      message: '请输入密码',
      trigger: 'blur',
    },
    { min: 6, message: '密码长度至少6个字符', trigger: 'blur' },
  ],
}

const initForm = () => {
  const empty: UserCreateRequest = {
    username: '',
    realName: '',
    email: '',
    phone: '',
    role: 'user',
    status: 'active',
    password: '',
  }
  if (props.mode === 'edit' && props.data) {
    const u = props.data
    Object.assign(formData, {
      username: u.username,
      realName: u.realName,
      email: u.email,
      phone: u.phone,
      role: u.role,
      status: u.status,
      password: '',
    })
  } else {
    Object.assign(formData, empty)
  }
}

const handleSubmit = async (data: Record<string, unknown>) => {
  submitting.value = true
  try {
    const payload = { ...formData, ...data } as UserCreateRequest
    // 编辑模式下若密码留空，则不修改密码
    if (props.mode === 'edit' && !payload.password) {
      delete payload.password
    }
    if (props.mode === 'add') {
      await createUser(payload)
      ElMessage.success('新增成功')
    } else {
      await updateUser(props.data!.id, payload)
      ElMessage.success('更新成功')
    }
    emit('success')
    emit('update:modelValue', false)
  } finally {
    submitting.value = false
  }
}
</script>
