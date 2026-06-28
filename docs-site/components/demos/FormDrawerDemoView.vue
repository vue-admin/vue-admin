<template>
  <div class="demo-controls">
    <el-button type="primary" @click="visible = true">打开 view 模式</el-button>
  </div>
  <FormDrawer
    v-model="visible"
    title="查看用户"
    :form-data="formData"
    :fields="fields"
    mode="view"
  />
</template>

<script setup>
import { reactive, ref } from 'vue'
import FormDrawer from '../../../src/app/components/FormDrawer/index.vue'

const visible = ref(false)
const formData = reactive({ name: '张三', role: 'admin' })

const fields = [
  { prop: 'name', label: '姓名', type: 'input' },
  { prop: 'role', label: '角色', type: 'select', options: [
    { label: '超级管理员', value: 'super_admin' },
    { label: '管理员', value: 'admin' },
    { label: '普通用户', value: 'user' },
  ] },
]
</script>
