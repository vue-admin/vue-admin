<template>
  <div class="sys-config">
    <el-card shadow="never" class="sys-card">
      <template #header>
        <div class="card-header">
          <span>系统配置</span>
        </div>
      </template>

      <el-tabs v-model="activeTab" type="card">
        <!-- 基本配置 -->
        <el-tab-pane label="基本配置" name="basic">
          <el-form
            ref="basicFormRef"
            :model="basicForm"
            label-width="120px"
            class="sys-form"
          >
            <el-form-item label="网站名称" prop="siteName">
              <el-input
                v-model="basicForm.siteName"
                placeholder="请输入网站名称"
              />
            </el-form-item>

            <el-form-item label="网站标题" prop="siteTitle">
              <el-input
                v-model="basicForm.siteTitle"
                placeholder="请输入网站标题"
              />
            </el-form-item>

            <el-form-item label="网站描述" prop="siteDescription">
              <el-input
                v-model="basicForm.siteDescription"
                placeholder="请输入网站描述"
                type="textarea"
                :rows="3"
              />
            </el-form-item>

            <el-form-item label="网站关键词" prop="siteKeywords">
              <el-input
                v-model="basicForm.siteKeywords"
                placeholder="请输入网站关键词，用逗号分隔"
              />
            </el-form-item>

            <el-form-item label="联系邮箱" prop="contactEmail">
              <el-input
                v-model="basicForm.contactEmail"
                placeholder="请输入联系邮箱"
                type="email"
              />
            </el-form-item>

            <el-form-item label="联系电话" prop="contactPhone">
              <el-input
                v-model="basicForm.contactPhone"
                placeholder="请输入联系电话"
              />
            </el-form-item>

            <el-form-item label="版权信息" prop="copyright">
              <el-input
                v-model="basicForm.copyright"
                placeholder="请输入版权信息"
              />
            </el-form-item>

            <el-form-item label="ICP备案号" prop="icpNumber">
              <el-input
                v-model="basicForm.icpNumber"
                placeholder="请输入ICP备案号"
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="handleBasicSubmit"
                >保存设置</el-button
              >
              <el-button @click="handleBasicReset">重置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 功能配置 -->
        <el-tab-pane label="功能配置" name="features">
          <el-form
            ref="featuresFormRef"
            :model="featuresForm"
            label-width="120px"
            class="sys-form"
          >
            <el-form-item label="是否开启评论" prop="enableComment">
              <el-switch v-model="featuresForm.enableComment" />
            </el-form-item>

            <el-form-item label="是否开启注册" prop="enableRegister">
              <el-switch v-model="featuresForm.enableRegister" />
            </el-form-item>

            <el-form-item label="是否开启验证码" prop="enableCaptcha">
              <el-switch v-model="featuresForm.enableCaptcha" />
            </el-form-item>

            <el-form-item label="每页显示条数" prop="pageSize">
              <el-input-number
                v-model="featuresForm.pageSize"
                :min="5"
                :max="100"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>

            <el-form-item label="上传文件大小限制" prop="maxFileSize">
              <el-input-number
                v-model="featuresForm.maxFileSize"
                :min="1"
                :max="100"
                controls-position="right"
                style="width: 100%"
              />
              <span style="margin-left: 8px">MB</span>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="handleFeaturesSubmit"
                >保存设置</el-button
              >
              <el-button @click="handleFeaturesReset">重置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 安全配置 -->
        <el-tab-pane label="安全配置" name="security">
          <el-form
            ref="securityFormRef"
            :model="securityForm"
            label-width="120px"
            class="sys-form"
          >
            <el-form-item label="登录失败次数限制" prop="loginFailedLimit">
              <el-input-number
                v-model="securityForm.loginFailedLimit"
                :min="0"
                :max="10"
                controls-position="right"
                style="width: 100%"
              />
              <span style="margin-left: 8px">次</span>
            </el-form-item>

            <el-form-item label="登录失败锁定时间" prop="loginLockTime">
              <el-input-number
                v-model="securityForm.loginLockTime"
                :min="0"
                :max="1440"
                controls-position="right"
                style="width: 100%"
              />
              <span style="margin-left: 8px">分钟</span>
            </el-form-item>

            <el-form-item label="密码最小长度" prop="passwordMinLength">
              <el-input-number
                v-model="securityForm.passwordMinLength"
                :min="6"
                :max="20"
                controls-position="right"
                style="width: 100%"
              />
              <span style="margin-left: 8px">位</span>
            </el-form-item>

            <el-form-item label="密码最大长度" prop="passwordMaxLength">
              <el-input-number
                v-model="securityForm.passwordMaxLength"
                :min="6"
                :max="20"
                controls-position="right"
                style="width: 100%"
              />
              <span style="margin-left: 8px">位</span>
            </el-form-item>

            <el-form-item label="密码必须包含数字" prop="passwordIncludeNumber">
              <el-switch v-model="securityForm.passwordIncludeNumber" />
            </el-form-item>

            <el-form-item label="密码必须包含字母" prop="passwordIncludeLetter">
              <el-switch v-model="securityForm.passwordIncludeLetter" />
            </el-form-item>

            <el-form-item
              label="密码必须包含特殊字符"
              prop="passwordIncludeSpecial"
            >
              <el-switch v-model="securityForm.passwordIncludeSpecial" />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="handleSecuritySubmit"
                >保存设置</el-button
              >
              <el-button @click="handleSecurityReset">重置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 邮件配置 -->
        <el-tab-pane label="邮件配置" name="email">
          <el-form
            ref="emailFormRef"
            :model="emailForm"
            label-width="120px"
            class="sys-form"
          >
            <el-form-item label="SMTP服务器地址" prop="smtpHost">
              <el-input
                v-model="emailForm.smtpHost"
                placeholder="请输入SMTP服务器地址"
              />
            </el-form-item>

            <el-form-item label="SMTP服务器端口" prop="smtpPort">
              <el-input-number
                v-model="emailForm.smtpPort"
                :min="1"
                :max="65535"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>

            <el-form-item label="发件人邮箱" prop="fromEmail">
              <el-input
                v-model="emailForm.fromEmail"
                placeholder="请输入发件人邮箱"
                type="email"
              />
            </el-form-item>

            <el-form-item label="发件人名称" prop="fromName">
              <el-input
                v-model="emailForm.fromName"
                placeholder="请输入发件人名称"
              />
            </el-form-item>

            <el-form-item label="SMTP认证用户名" prop="smtpUsername">
              <el-input
                v-model="emailForm.smtpUsername"
                placeholder="请输入SMTP认证用户名"
              />
            </el-form-item>

            <el-form-item label="SMTP认证密码" prop="smtpPassword">
              <el-input
                v-model="emailForm.smtpPassword"
                placeholder="请输入SMTP认证密码"
                type="password"
                show-password
              />
            </el-form-item>

            <el-form-item label="是否启用SSL" prop="enableSsl">
              <el-switch v-model="emailForm.enableSsl" />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="handleEmailSubmit"
                >保存设置</el-button
              >
              <el-button @click="handleEmailReset">重置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.sys-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
}

.sys-form {
  max-width: 600px;
}

.sys-form .el-form-item {
  margin-bottom: 20px;
}
</style>

<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// 激活的 tab
const activeTab = ref('basic')

// 基本配置表单数据
const basicForm = reactive({
  siteName: 'Vue Admin',
  siteTitle: 'Vue Admin 管理系统',
  siteDescription: '基于 Vue 3 和 Element Plus 的现代化管理系统',
  siteKeywords: 'Vue, Admin, Element Plus',
  contactEmail: 'admin@example.com',
  contactPhone: '13800138000',
  copyright: '© 2023 Vue Admin. All rights reserved.',
  icpNumber: ''
})

// 功能配置表单数据
const featuresForm = reactive({
  enableComment: true,
  enableRegister: true,
  enableCaptcha: true,
  pageSize: 10,
  maxFileSize: 10
})

// 安全配置表单数据
const securityForm = reactive({
  loginFailedLimit: 5,
  loginLockTime: 30,
  passwordMinLength: 6,
  passwordMaxLength: 20,
  passwordIncludeNumber: true,
  passwordIncludeLetter: true,
  passwordIncludeSpecial: false
})

// 邮件配置表单数据
const emailForm = reactive({
  smtpHost: 'smtp.example.com',
  smtpPort: 587,
  fromEmail: 'admin@example.com',
  fromName: 'Vue Admin',
  smtpUsername: 'admin@example.com',
  smtpPassword: '',
  enableSsl: true
})

// 表单验证规则
const basicFormRules = reactive<FormRules>({
  siteName: [
    { required: true, message: '请输入网站名称', trigger: 'blur' },
    {
      min: 2,
      max: 50,
      message: '网站名称长度应在2-50个字符之间',
      trigger: 'blur'
    }
  ],
  siteTitle: [
    { required: true, message: '请输入网站标题', trigger: 'blur' },
    {
      min: 2,
      max: 100,
      message: '网站标题长度应在2-100个字符之间',
      trigger: 'blur'
    }
  ],
  siteDescription: [
    { required: true, message: '请输入网站描述', trigger: 'blur' },
    {
      min: 10,
      max: 500,
      message: '网站描述长度应在10-500个字符之间',
      trigger: 'blur'
    }
  ],
  siteKeywords: [
    { required: true, message: '请输入网站关键词', trigger: 'blur' },
    {
      min: 2,
      max: 200,
      message: '网站关键词长度应在2-200个字符之间',
      trigger: 'blur'
    }
  ],
  contactEmail: [
    { required: true, message: '请输入联系邮箱', trigger: 'blur' },
    {
      type: 'email',
      message: '请输入有效的邮箱地址',
      trigger: ['blur', 'change']
    }
  ],
  contactPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入有效的手机号',
      trigger: ['blur', 'change']
    }
  ],
  copyright: [
    { required: true, message: '请输入版权信息', trigger: 'blur' },
    {
      min: 2,
      max: 200,
      message: '版权信息长度应在2-200个字符之间',
      trigger: 'blur'
    }
  ],
  icpNumber: [
    {
      pattern: /^ICP备\d{8}-\d+$/,
      message: '请输入有效的ICP备案号',
      trigger: ['blur', 'change']
    }
  ]
})

const featuresFormRules = reactive<FormRules>({
  pageSize: [
    { required: true, message: '请输入每页显示条数', trigger: 'blur' }
  ],
  maxFileSize: [
    { required: true, message: '请输入上传文件大小限制', trigger: 'blur' }
  ]
})

const securityFormRules = reactive<FormRules>({
  loginFailedLimit: [
    { required: true, message: '请输入登录失败次数限制', trigger: 'blur' }
  ],
  loginLockTime: [
    { required: true, message: '请输入登录失败锁定时间', trigger: 'blur' }
  ],
  passwordMinLength: [
    { required: true, message: '请输入密码最小长度', trigger: 'blur' }
  ],
  passwordMaxLength: [
    { required: true, message: '请输入密码最大长度', trigger: 'blur' }
  ]
})

const emailFormRules = reactive<FormRules>({
  smtpHost: [
    { required: true, message: '请输入SMTP服务器地址', trigger: 'blur' }
  ],
  smtpPort: [
    { required: true, message: '请输入SMTP服务器端口', trigger: 'blur' }
  ],
  fromEmail: [
    { required: true, message: '请输入发件人邮箱', trigger: 'blur' },
    {
      type: 'email',
      message: '请输入有效的邮箱地址',
      trigger: ['blur', 'change']
    }
  ],
  fromName: [{ required: true, message: '请输入发件人名称', trigger: 'blur' }],
  smtpUsername: [
    { required: true, message: '请输入SMTP认证用户名', trigger: 'blur' }
  ],
  smtpPassword: [
    { required: true, message: '请输入SMTP认证密码', trigger: 'blur' }
  ]
})

// 表单引用
const basicFormRef = ref<FormInstance>()
const featuresFormRef = ref<FormInstance>()
const securityFormRef = ref<FormInstance>()
const emailFormRef = ref<FormInstance>()

// 提交基本配置表单
const handleBasicSubmit = async () => {
  if (!basicFormRef.value) return

  try {
    await basicFormRef.value.validate()
    // 模拟保存设置
    await new Promise((resolve) => setTimeout(resolve, 500))
    ElMessage.success('保存成功')
  } catch (error) {
    console.error(error)
  }
}

// 重置基本配置表单
const handleBasicReset = () => {
  Object.assign(basicForm, {
    siteName: 'Vue Admin',
    siteTitle: 'Vue Admin 管理系统',
    siteDescription: '基于 Vue 3 和 Element Plus 的现代化管理系统',
    siteKeywords: 'Vue, Admin, Element Plus',
    contactEmail: 'admin@example.com',
    contactPhone: '13800138000',
    copyright: '© 2023 Vue Admin. All rights reserved.',
    icpNumber: ''
  })
  ElMessage.info('已重置为默认设置')
}

// 提交功能配置表单
const handleFeaturesSubmit = async () => {
  if (!featuresFormRef.value) return

  try {
    await featuresFormRef.value.validate()
    // 模拟保存设置
    await new Promise((resolve) => setTimeout(resolve, 500))
    ElMessage.success('保存成功')
  } catch (error) {
    console.error(error)
  }
}

// 重置功能配置表单
const handleFeaturesReset = () => {
  Object.assign(featuresForm, {
    enableComment: true,
    enableRegister: true,
    enableCaptcha: true,
    pageSize: 10,
    maxFileSize: 10
  })
  ElMessage.info('已重置为默认设置')
}

// 提交安全配置表单
const handleSecuritySubmit = async () => {
  if (!securityFormRef.value) return

  try {
    await securityFormRef.value.validate()
    // 模拟保存设置
    await new Promise((resolve) => setTimeout(resolve, 500))
    ElMessage.success('保存成功')
  } catch (error) {
    console.error(error)
  }
}

// 重置安全配置表单
const handleSecurityReset = () => {
  Object.assign(securityForm, {
    loginFailedLimit: 5,
    loginLockTime: 30,
    passwordMinLength: 6,
    passwordMaxLength: 20,
    passwordIncludeNumber: true,
    passwordIncludeLetter: true,
    passwordIncludeSpecial: false
  })
  ElMessage.info('已重置为默认设置')
}

// 提交邮件配置表单
const handleEmailSubmit = async () => {
  if (!emailFormRef.value) return

  try {
    await emailFormRef.value.validate()
    // 模拟保存设置
    await new Promise((resolve) => setTimeout(resolve, 500))
    ElMessage.success('保存成功')
  } catch (error) {
    console.error(error)
  }
}

// 重置邮件配置表单
const handleEmailReset = () => {
  Object.assign(emailForm, {
    smtpHost: 'smtp.example.com',
    smtpPort: 587,
    fromEmail: 'admin@example.com',
    fromName: 'Vue Admin',
    smtpUsername: 'admin@example.com',
    smtpPassword: '',
    enableSsl: true
  })
  ElMessage.info('已重置为默认设置')
}
</script>
