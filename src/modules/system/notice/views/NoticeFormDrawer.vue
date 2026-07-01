<template>
  <FormDrawer
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
  createNotice,
  updateNotice,
  type NoticeInfo,
  type NoticeCreateRequest,
} from '../api'

const props = defineProps<{
  modelValue: boolean
  mode: FormDrawerMode
  data: NoticeInfo | null
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

const formData = reactive<NoticeCreateRequest>({
  title: '',
  content: '',
  type: 'notice',
  status: 'draft',
  priority: 'medium',
  publishTime: '',
  expireTime: '',
})

const drawerTitle = computed(() => {
  if (props.mode === 'add') return '新增公告'
  if (props.mode === 'edit') return '编辑公告'
  return '查看公告'
})

const fields: FormField[] = [
  { prop: 'title', label: '标题', type: 'input', span: 24 },
  {
    prop: 'type',
    label: '类型',
    type: 'select',
    span: 12,
    options: [
      { label: '公告', value: 'announcement' },
      { label: '通知', value: 'notice' },
      { label: '待办', value: 'todo' },
    ],
  },
  {
    prop: 'status',
    label: '状态',
    type: 'select',
    span: 12,
    options: [
      { label: '草稿', value: 'draft' },
      { label: '已发布', value: 'published' },
      { label: '已过期', value: 'expired' },
    ],
  },
  {
    prop: 'priority',
    label: '优先级',
    type: 'radio',
    span: 24,
    options: [
      { label: '高', value: 'high' },
      { label: '中', value: 'medium' },
      { label: '低', value: 'low' },
    ],
  },
  {
    prop: 'content',
    label: '内容',
    type: 'textarea',
    span: 24,
  },
  { prop: 'publishTime', label: '发布时间', type: 'date', span: 12 },
  { prop: 'expireTime', label: '过期时间', type: 'date', span: 12 },
]

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
}

const initForm = () => {
  if ((props.mode === 'edit' || props.mode === 'view') && props.data) {
    Object.assign(formData, {
      title: props.data.title,
      content: props.data.content,
      type: props.data.type,
      status: props.data.status,
      priority: props.data.priority,
      publishTime: props.data.publishTime || '',
      expireTime: props.data.expireTime || '',
    })
  } else {
    Object.assign(formData, {
      title: '',
      content: '',
      type: 'notice',
      status: 'draft',
      priority: 'medium',
      publishTime: '',
      expireTime: '',
    })
  }
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    if (props.mode === 'add') {
      await createNotice(formData)
      ElMessage.success('新增成功')
    } else {
      await updateNotice(props.data!.id, formData)
      ElMessage.success('更新成功')
    }
    emit('success')
    emit('update:modelValue', false)
  } finally {
    submitting.value = false
  }
}
</script>
