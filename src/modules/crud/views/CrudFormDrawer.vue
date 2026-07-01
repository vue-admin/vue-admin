<!-- CRUD FormDrawer 示例。展示 input/select/date/textarea 四种字段类型 + rules 校验。 -->
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
import type {
  FormField,
  FormDrawerMode
} from '@/app/components/FormDrawer/types'
import { ElMessage } from 'element-plus'
import {
  createCrudItem,
  updateCrudItem,
  type item as CrudItem,
  type CrudCreatePayload
} from '../api'

const props = defineProps<{
  modelValue: boolean
  mode: FormDrawerMode
  data: CrudItem | null
}>()

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  success: []
}>()

const visible = ref(props.modelValue)
const submitting = ref(false)

watch(
  () => props.modelValue,
  (v) => {
    visible.value = v
    if (v) initForm()
  }
)
watch(visible, (v) => emit('update:modelValue', v))

const formData = reactive<CrudCreatePayload & { id?: string }>({
  date: new Date().toISOString().slice(0, 10),
  name: '',
  province: '',
  city: '',
  address: '',
  zip: 0
})

const drawerTitle = computed(() => {
  if (props.mode === 'add') return '新增记录'
  if (props.mode === 'edit') return '编辑记录'
  if (props.mode === 'view') return '查看记录'
  return '记录'
})

const fields: FormField[] = [
  { prop: 'name', label: '姓名', type: 'input', span: 12 },
  {
    prop: 'province',
    label: '省份',
    type: 'select',
    span: 12,
    options: [
      { label: '上海', value: '上海' },
      { label: '北京', value: '北京' },
      { label: '广东', value: '广东' },
      { label: '浙江', value: '浙江' },
      { label: '江苏', value: '江苏' }
    ]
  },
  { prop: 'city', label: '城市', type: 'input', span: 12 },
  { prop: 'date', label: '日期', type: 'date', span: 12 },
  { prop: 'address', label: '地址', type: 'input', span: 24 },
  { prop: 'zip', label: '邮编', type: 'input', span: 12 }
]

const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  province: [{ required: true, message: '请选择省份', trigger: 'change' }],
  city: [{ required: true, message: '请输入城市', trigger: 'blur' }],
  address: [{ required: true, message: '请输入地址', trigger: 'blur' }],
  zip: [
    { required: true, message: '请输入邮编', trigger: 'blur' },
    { pattern: /^\d{6}$/, message: '请输入6位邮编', trigger: 'blur' }
  ]
}

const initForm = () => {
  // edit 与 view 都需要回填；仅 add 走清空分支
  if ((props.mode === 'edit' || props.mode === 'view') && props.data) {
    Object.assign(formData, {
      id: props.data.id,
      name: props.data.name,
      province: props.data.province,
      city: props.data.city,
      address: props.data.address,
      zip: props.data.zip,
      date: props.data.date
    })
  } else {
    Object.assign(formData, {
      id: undefined,
      date: new Date().toISOString().slice(0, 10),
      name: '',
      province: '',
      city: '',
      address: '',
      zip: 0
    })
  }
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    const payload: CrudCreatePayload = {
      date: formData.date,
      name: formData.name,
      province: formData.province,
      city: formData.city,
      address: formData.address,
      zip: Number(formData.zip) || 0
    }
    if (props.mode === 'add') {
      await createCrudItem(payload)
      ElMessage.success('新增成功')
    } else {
      await updateCrudItem(props.data!.id, payload)
      ElMessage.success('更新成功')
    }
    emit('success')
    emit('update:modelValue', false)
  } finally {
    submitting.value = false
  }
}
</script>
