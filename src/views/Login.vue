<template>
    <el-row class="login" justify="center" align='middle'>
        <el-col :span="6"></el-col>
        <el-col :span="6">
            <el-card class="box-card">
                <template #header>
                    <div class="card-header">
                        <span>用户登录</span>
                        <div class="dark-icon" @click="toggleDark()">
                            <el-icon>
                                <Moon v-if="isDark" />
                                <Sunny v-else />
                            </el-icon>
                        </div>
                    </div>
                </template>
                <div>
                    <el-form ref="ruleFormRef" :model="ruleForm" status-icon :rules="rules" label-width="120px"
                        class="demo-ruleForm">
                        <el-form-item label="用户名" prop="usernae">
                            <el-input v-model.number="ruleForm.usernae" />
                        </el-form-item>
                        <el-form-item label="密码" prop="password">
                            <el-input v-model="ruleForm.password" type="password" autocomplete="off" />
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" @click="submitForm(ruleFormRef)">登录</el-button>
                        </el-form-item>
                    </el-form>
                </div>
            </el-card>
        </el-col>
        <el-col :span="6"></el-col>
    </el-row>
</template>

<style scoped>
.login {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 100%;
}

.box-card {
    width: 480px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.text {
    font-size: 14px;
}

.item {
    margin-bottom: 18px;
}
</style>
  
<script lang="ts" setup>
import { reactive, ref } from 'vue'
import {
    Moon,
    Sunny,
} from '@element-plus/icons-vue'
import { toggleDark, isDark } from '@/stores/dark'
import type { FormInstance, FormRules } from 'element-plus'

const ruleFormRef = ref<FormInstance>()



const validateEmpty = (rule: any, value: any, callback: any) => {
    if (value === '') {
        callback(new Error('字段不能为空'))
    }
}

const ruleForm = reactive({
    usernae: '',
    password: '',
})

const rules = reactive<FormRules>({
    usernae: [{ validator: validateEmpty, trigger: 'blur' }],
    password: [{ validator: validateEmpty, trigger: 'blur' }],
})

const submitForm = (formEl: FormInstance | undefined) => {
    if (!formEl) return
    formEl.validate((valid) => {
        if (valid) {
            console.log('submit!')
        } else {
            console.log('error submit!')
            return false
        }
    })
}

const resetForm = (formEl: FormInstance | undefined) => {
    if (!formEl) return
    formEl.resetFields()
}
</script>
  