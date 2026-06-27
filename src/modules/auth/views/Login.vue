<template>
  <el-row
    class="login"
    justify="center"
    align="middle"
  >
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>用户登录</span>
          <div
            class="dark-icon"
            @click="toggleDark()"
          >
            <el-icon>
              <Moon v-if="isDark" />
              <Sunny v-else />
            </el-icon>
          </div>
        </div>
      </template>
      <div>
        <el-form
          ref="ruleFormRef"
          :model="ruleForm"
          status-icon
          :rules="rules"
          label-width="60px"
          class="demo-ruleForm"
        >
          <el-form-item
            label="用户名"
            prop="username"
          >
            <el-input v-model="ruleForm.username" />
          </el-form-item>
          <el-form-item
            label="密码"
            prop="password"
          >
            <el-input
              v-model="ruleForm.password"
              type="password"
              autocomplete="off"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              :loading="submitting"
              @click="submitForm(ruleFormRef)"
            >
              登录
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
  </el-row>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toggleDark, isDark } from '@/stores/dark'
import type { FormInstance, FormItemRule, FormRules } from 'element-plus'
import { authService } from '@/lib/auth/authService'
import { useUserStore } from '@/app/stores/user'

const ruleFormRef = ref<FormInstance>()
const router = useRouter()
const userStore = useUserStore()
const submitting = ref(false)

// 强类型校验器：禁止 any，类型由 FormItemRule['validator'] 推导
const validateEmpty: NonNullable<FormItemRule['validator']> = (
  _rule,
  value,
  callback,
) => {
  if (value === '' || value == null) {
    callback(new Error('字段不能为空'))
  } else {
    callback()
  }
}

const ruleForm = reactive({
  username: '',
  password: '',
})

const rules = reactive<FormRules>({
  username: [{ validator: validateEmpty, trigger: 'blur' }],
  password: [{ validator: validateEmpty, trigger: 'blur' }],
})

const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  try {
    await formEl.validate()
  } catch {
    return
  }
  submitting.value = true
  try {
    await authService.login(ruleForm)
    await userStore.loadProfile()
    router.push('/')
  } catch (e) {
    // 拦截器已通过 ElMessage 提示，这里仅 debug 日志
    console.debug('[login] failed', e)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.login {
  position: absolute;
  top: 20%;
  bottom: 60%;
  width: 100%;
}

.box-card {
  width: 450px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dark-icon {
  font-size: 20px;
  cursor: pointer;
}

.text {
  font-size: 14px;
}

.item {
  margin-bottom: 18px;
}
</style>
