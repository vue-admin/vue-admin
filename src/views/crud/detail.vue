<template>
  <el-drawer :model-value="visible" :title="drawerTitle">
    <el-form :model="form" label-width="auto" style="max-width: 600px">
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
          <el-button type="primary" @click="handleSubmit">编辑</el-button>
          <el-button @click="close">返回</el-button>
        </template>
        <template v-else>
          <el-button type="primary" @click="handleSubmit">
            {{ isEdit ? '保存' : '创建' }}
          </el-button>
        </template>
        <el-button @click="close">取消</el-button>
      </el-form-item>
    </el-form>
  </el-drawer>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, watch } from 'vue'
import type { FormInstance } from 'element-plus'

const props = defineProps({
  // 控制抽屉显示
  visible: {
    type: Boolean,
    default: false
  },
  // 操作模式：view/edit/add
  mode: {
    type: String,
    default: 'add',
    validator: (v: string) => ['add', 'edit', 'view'].includes(v)
  },
  // 编辑/查看时需要传递ID
  recordId: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['update:visible', 'submit', 'refresh'])
// 表单实例
const formRef = ref<FormInstance>()
// do not use same name with ref
const form = reactive({
  id: '',
  name: '',
  province: '',
  city: '',
  address: '',
  zip: '',
  date: ''
})

// 计算属性
const isEdit = computed(() => props.mode === 'edit')
const isView = computed(() => props.mode === 'view')
const drawerTitle = computed(() => {
  return {
    add: '新增用户',
    edit: '编辑用户',
    view: '用户详情'
  }[props.mode]
})

// 提交处理
const handleSubmit = async () => {
  try {
    await formRef.value?.validate()

    const success = await (isEdit.value ? updateUser(form) : createUser(form))

    if (success) {
      emit('submit', form)
      emit('refresh')
      close()
    }
  } catch (e) {
    console.error('表单验证失败', e)
  }
}

// 重置表单
const resetForm = () => {
  formRef.value?.resetFields()
  Object.assign(form, {
    id: '',
    name: '',
    city: '',
    address: '',
    zip: ''
  })
}
// 关闭抽屉
const close = () => {
  emit('update:visible', false)
  resetForm()
}

// 模拟接口方法
const createUser = async (data: any) => {
  /* POST请求 */
  return true
}

const updateUser = async (data: any) => {
  /* PUT请求 */
  return true
}
</script>
