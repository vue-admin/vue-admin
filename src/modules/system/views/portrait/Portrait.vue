<template>
  <div class="user-portrait">
    <el-card shadow="never" class="portrait-card">
      <template #header>
        <div class="card-header">
          <span>个人中心</span>
          <el-button type="primary" size="small" @click="handleEdit"
            >编辑资料</el-button
          >
        </div>
      </template>

      <div class="portrait-content">
        <!-- 用户头像 -->
        <div class="avatar-section">
          <el-avatar :size="120" :src="userInfo.avatar">
            <el-icon><User /></el-icon>
          </el-avatar>
          <div class="username">{{ userInfo.name }}</div>
          <div class="role">{{ userInfo.role }}</div>
        </div>

        <!-- 基本信息 -->
        <el-divider content-position="left">基本信息</el-divider>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="用户名">{{
            userInfo.username
          }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{
            userInfo.email
          }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{
            userInfo.phone
          }}</el-descriptions-item>
          <el-descriptions-item label="性别">{{
            userInfo.gender
          }}</el-descriptions-item>
          <el-descriptions-item label="部门">{{
            userInfo.department
          }}</el-descriptions-item>
          <el-descriptions-item label="职位">{{
            userInfo.position
          }}</el-descriptions-item>
          <el-descriptions-item label="入职时间">{{
            userInfo.joinDate
          }}</el-descriptions-item>
          <el-descriptions-item label="最后登录">{{
            userInfo.lastLogin
          }}</el-descriptions-item>
        </el-descriptions>

        <!-- 个人设置 -->
        <el-divider content-position="left">个人设置</el-divider>
        <el-card shadow="never" class="settings-card">
          <el-form :model="settings" label-width="100px">
            <el-form-item label="语言">
              <el-select v-model="settings.language" style="width: 100%">
                <el-option label="中文" value="zh-CN" />
                <el-option label="英文" value="en-US" />
              </el-select>
            </el-form-item>
            <el-form-item label="时区">
              <el-select v-model="settings.timezone" style="width: 100%">
                <el-option label="UTC+8" value="Asia/Shanghai" />
                <el-option label="UTC+0" value="Europe/London" />
              </el-select>
            </el-form-item>
            <el-form-item label="通知设置">
              <el-switch v-model="settings.notification" />
            </el-form-item>
            <el-form-item label="邮件提醒">
              <el-switch v-model="settings.emailReminder" />
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </el-card>

    <!-- 编辑资料对话框 -->
    <el-dialog title="编辑资料" v-model="dialogVisible" width="50%">
      <el-form :model="userInfo" label-width="100px">
        <el-form-item label="姓名">
          <el-input v-model="userInfo.name" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="userInfo.email" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="userInfo.phone" />
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="userInfo.gender">
            <el-radio value="男">男</el-radio>
            <el-radio value="女">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="部门">
          <el-input v-model="userInfo.department" />
        </el-form-item>
        <el-form-item label="职位">
          <el-input v-model="userInfo.position" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSave">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 用户信息
const userInfo = reactive({
  name: '张三',
  username: 'zhangsan',
  role: '管理员',
  email: 'zhangsan@example.com',
  phone: '13800138000',
  gender: '男',
  department: '技术部',
  position: '前端工程师',
  joinDate: '2023-01-15',
  lastLogin: '2023-10-01 10:30',
  avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
})

// 个人设置
const settings = reactive({
  language: 'zh-CN',
  timezone: 'Asia/Shanghai',
  notification: true,
  emailReminder: false
})

// 对话框可见性
const dialogVisible = ref(false)

// 编辑资料
const handleEdit = () => {
  dialogVisible.value = true
}

// 保存资料
const handleSave = () => {
  dialogVisible.value = false
  ElMessage.success('资料保存成功')
}
</script>

<style lang="scss" scoped>
.portrait-card {
  margin-bottom: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
    font-size: 16px;
  }

  .portrait-content {
    .avatar-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 30px;

      .username {
        margin-top: 10px;
        font-size: 18px;
        font-weight: 600;
        color: #303133;
      }

      .role {
        margin-top: 5px;
        font-size: 14px;
        color: #606266;
      }
    }

    .settings-card {
      margin-top: 20px;
    }
  }
}

.dialog-footer {
  text-align: right;
}
</style>
