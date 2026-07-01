<template>
  <div class="welcome-card">
    <div class="welcome-left">
      <div class="greeting">
        <span class="greeting-text">{{ greeting }}</span>
        <span class="greeting-name">{{ username }}</span>
      </div>
      <div class="role-row">
        <el-tag
          :type="roleType"
          size="small"
          effect="plain"
        >
          {{ roleLabel }}
        </el-tag>
        <span class="current-time">{{ currentTime }}</span>
      </div>
      <div
        v-if="isAdmin && lastLogin"
        class="last-login"
      >
        上次登录：{{ lastLogin }}
      </div>
    </div>
    <div class="welcome-actions">
      <el-button
        type="primary"
        plain
        @click="$emit('action-click', 'profile')"
      >
        <el-icon><User /></el-icon>
        <span>个人中心</span>
      </el-button>
      <el-button @click="$emit('action-click', 'docs')">
        <el-icon><Document /></el-icon>
        <span>使用文档</span>
      </el-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { User, Document } from '@element-plus/icons-vue'

const props = defineProps<{
  username: string
  isAdmin?: boolean
  roleLabel?: string
  lastLogin?: string
}>()

defineEmits<{
  (e: 'action-click', action: string): void
}>()

const currentTime = ref('')
let timer: number | undefined

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '凌晨好'
  if (h < 9) return '早上好'
  if (h < 12) return '上午好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const roleType = computed<'danger' | 'warning' | 'info'>(() => {
  if (props.isAdmin) return 'danger'
  return 'info'
})

const updateTime = () => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  currentTime.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

onMounted(() => {
  updateTime()
  timer = window.setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.welcome-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  margin-bottom: 16px;
}

.welcome-left {
  flex: 1;
}

.greeting {
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 12px;
}

.greeting-name {
  margin-left: 8px;
  color: var(--el-color-primary);
}

.role-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.current-time {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
}

.last-login {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.welcome-actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 768px) {
  .welcome-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}
</style>
