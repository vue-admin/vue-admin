<template>
  <div class="demo-controls">
    <el-button type="primary" @click="visible = true">打开 dependencies 演示</el-button>
  </div>
  <FormDrawer
    v-model="visible"
    title="声明式联动"
    :form-data="formData"
    :fields="fields"
    mode="add"
  />
</template>

<script setup>
import { reactive, ref } from 'vue'
import FormDrawer from '../../../src/app/components/FormDrawer/index.vue'

const visible = ref(false)
const formData = reactive({ enableEmail: false, email: '' })

const fields = [
  { prop: 'enableEmail', label: '启用邮件', type: 'switch' },
  { prop: 'email', label: '邮箱', type: 'input', dependencies: [
    { trigger: 'enableEmail', show: (v) => v.enableEmail === true },
  ] },
]
</script>
