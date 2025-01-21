<template>
  <el-form :model="form" label-width="auto" style="max-width: 600px">
    <el-form-item label="姓名">
      <el-input v-model="form.name" />
    </el-form-item>
    <el-form-item label="城市">
      <el-select v-model="form.city" placeholder="请选择城市">
        <el-option label="北京" value="beijing" />
        <el-option label="上海" value="shanghai" />
      </el-select>
    </el-form-item>
    <el-form-item label="地址">
      <el-input v-model="form.address" type="textarea" />
    </el-form-item>
    <el-form-item label="邮编" prop="zip">
      <el-input v-model.number="form.zip" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="onSubmit">创建</el-button>
      <el-button>取消</el-button>
    </el-form-item>
  </el-form>
</template>

<script lang="ts" setup>
import { reactive } from 'vue'

// do not use same name with ref
const form = reactive({
  name: '',
  province: '',
  city: '',
  address: '',
  zip: '',
  date: ''
})

const onSubmit = () => {
  console.log('submit!')
}
</script>
