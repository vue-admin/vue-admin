<template>
  <el-drawer
    :model-value="visible"
    :title="drawerTitle"
    @close="close"
    :destroy-on-close="true"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="auto"
      style="max-width: 600px"
      v-loading="loading"
    >
      <el-form-item label="日期" prop="date">
        <el-date-picker
          v-model="form.date"
          type="date"
          placeholder="请选择日期"
          value-format="YYYY-MM-DD"
          format="YYYY-MM-DD"
          :disabled="isView"
        />
      </el-form-item>
      <el-form-item label="姓名" prop="name">
        <el-input v-model="form.name" :disabled="isView" />
      </el-form-item>
      <el-form-item label="城市" prop="city">
        <el-select
          v-model="form.city"
          placeholder="请选择城市"
          :disabled="isView"
        >
          <el-option label="北京" value="beijing" />
          <el-option label="上海" value="shanghai" />
        </el-select>
      </el-form-item>
      <el-form-item label="地址" prop="address">
        <el-input v-model="form.address" type="textarea" :disabled="isView" />
      </el-form-item>
      <el-form-item label="邮编" prop="zip">
        <el-input v-model.number="form.zip" :disabled="isView" />
      </el-form-item>
      <el-form-item>
        <template v-if="isView">
          <el-button type="primary" @click="switchToEdit">编辑</el-button>
          <el-button @click="close">关闭</el-button>
        </template>
        <template v-else>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            {{ isEdit ? '保存' : '创建' }}
          </el-button>
          <el-button @click="close">取消</el-button>
        </template>
      </el-form-item>
    </el-form>
  </el-drawer>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import {
  fetchCrudDetail,
  createCrudItem,
  updateCrudItem,
  type CrudCreatePayload,
  type CrudUpdatePayload,
  type item
} from '@/apis/crud'

type DrawerMode = 'add' | 'edit' | 'view'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  mode: {
    type: String as () => DrawerMode,
    default: 'add',
    validator: (v: DrawerMode) => ['add', 'edit', 'view'].includes(v)
  },
  recordId: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['update:visible', 'submit', 'refresh', 'change-mode'])

const formRef = ref<FormInstance>()
const loading = ref(false)
const submitting = ref(false)
const defaultFormState = {
  id: '',
  name: '',
  province: '',
  city: '',
  address: '',
  zip: null as number | null,
  date: ''
}
const form = reactive({ ...defaultFormState })

const rules = reactive<FormRules>({
  date: [{ required: true, message: '请选择日期', trigger: 'change' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  city: [{ required: true, message: '请选择城市', trigger: 'change' }],
  address: [{ required: true, message: '请输入地址', trigger: 'blur' }],
  zip: [
    { required: true, message: '请输入邮编', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value === null || value === undefined || value === '') {
          callback(new Error('请输入邮编'))
          return
        }
        if (!Number.isInteger(value)) {
          callback(new Error('邮编必须为数字'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
})

const isEdit = computed(() => props.mode === 'edit')
const isView = computed(() => props.mode === 'view')
const drawerTitle = computed(() => {
  return {
    add: '新增用户',
    edit: '编辑用户',
    view: '用户详情'
  }[props.mode]
})

const fillForm = (data: item) => {
  Object.assign(form, {
    id: data.id ?? '',
    name: data.name ?? '',
    province: data.province ?? '',
    city: data.city ?? '',
    address: data.address ?? '',
    zip: data.zip ?? null,
    date: data.date ?? ''
  })
}

const resetForm = () => {
  formRef.value?.resetFields()
  Object.assign(form, { ...defaultFormState })
}

const close = () => {
  emit('update:visible', false)
  resetForm()
}

const switchToEdit = () => {
  emit('change-mode', 'edit')
}

const loadDetail = async (id: string | number) => {
  if (!id) return
  loading.value = true
  try {
    const { data } = await fetchCrudDetail({ id })
    fillForm(data)
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
  } catch (e) {
    console.error('表单验证失败', e)
    return
  }
  submitting.value = true
  try {
    const payload: CrudCreatePayload = {
      date:
        form.date ||
        new Date().toISOString().slice(0, 10),
      name: form.name,
      province: form.province || '',
      city: form.city,
      address: form.address,
      zip: Number(form.zip) || 0
    }
    let result: CrudUpdatePayload | undefined
    if (isEdit.value) {
      result = (
        await updateCrudItem({
          ...payload,
          id: form.id
        })
      ).data
      ElMessage.success('修改成功')
    } else {
      result = (await createCrudItem(payload)).data
      ElMessage.success('创建成功')
    }
    emit('submit', result)
    emit('refresh')
    close()
  } catch (error) {
    console.error(error)
  } finally {
    submitting.value = false
  }
}

watch(
  () => [props.visible, props.mode, props.recordId],
  () => {
    if (!props.visible) {
      resetForm()
      return
    }
    if (props.mode === 'add') {
      resetForm()
      return
    }
    if (props.recordId) {
      loadDetail(props.recordId)
    }
  },
  { immediate: true }
)
</script>
