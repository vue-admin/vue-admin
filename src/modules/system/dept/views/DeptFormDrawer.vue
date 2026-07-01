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
  >
    <!-- 上级部门：复用 DeptSelector，免去本组件手动加载树 -->
    <template #field-parentId>
      <DeptSelector
        v-model="formData.parentId"
        :disabled="mode === 'view'"
        placeholder="无上级部门"
      />
    </template>
  </FormDrawer>
</template>

<script lang="ts" setup>
import { ref, watch, reactive, computed } from 'vue'
import { FormDrawer, DeptSelector } from '@/app/components'
import type { FormField, FormDrawerMode } from '@/app/components/FormDrawer/types'
import { ElMessage } from 'element-plus'
import {
  createDept,
  updateDept,
  type DeptInfo,
  type DeptCreateRequest,
} from '../api'
import { COMMON_STATUS_OPTIONS } from '@/app/constants/enums'

const props = defineProps<{
  modelValue: boolean
  mode: FormDrawerMode
  data: DeptInfo | null
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

const formData = reactive<DeptCreateRequest>({
  name: '',
  parentId: '',
  leader: '',
  phone: '',
  email: '',
  sort: 0,
  status: 'active',
})

const drawerTitle = computed(() => {
  if (props.mode === 'edit') return '编辑部门'
  return '新增部门'
})

// parentId 由 #field-parentId 插槽内的 DeptSelector 渲染；
// 保留 treeSelect 类型占位以保证 label/span 正常计算。
const fields = computed<FormField[]>(() => [
  { prop: 'parentId', label: '上级部门', type: 'treeSelect' },
  { prop: 'name', label: '部门名称', type: 'input' },
  { prop: 'leader', label: '负责人', type: 'input' },
  { prop: 'phone', label: '联系电话', type: 'input' },
  { prop: 'email', label: '邮箱', type: 'input' },
  { prop: 'sort', label: '排序', type: 'number' },
  {
    prop: 'status',
    label: '状态',
    type: 'radio',
    options: [...COMMON_STATUS_OPTIONS],
  },
])

const rules = {
  name: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
}

const initForm = () => {
  if ((props.mode === 'edit' || props.mode === 'view') && props.data) {
    Object.assign(formData, {
      name: props.data.name,
      parentId: props.data.parentId,
      leader: props.data.leader,
      phone: props.data.phone,
      email: props.data.email,
      sort: props.data.sort,
      status: props.data.status,
    })
  } else {
    // 新增：若从某行触发，预填该行为上级
    Object.assign(formData, {
      name: '',
      parentId: props.data?.id || '',
      leader: '',
      phone: '',
      email: '',
      sort: 0,
      status: 'active',
    })
  }
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    if (props.mode === 'edit') {
      await updateDept(props.data!.id, formData)
      ElMessage.success('更新成功')
    } else {
      await createDept(formData)
      ElMessage.success('新增成功')
    }
    emit('success')
    emit('update:modelValue', false)
  } finally {
    submitting.value = false
  }
}
</script>
