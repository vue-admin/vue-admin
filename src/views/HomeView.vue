<template>
  <div class="home">
    <!-- 欢迎区域 -->
    <el-card shadow="never" class="welcome-card">
      <template #header>
        <div class="card-header">
          <span>欢迎使用 Vue Admin 管理系统</span>
          <el-tag type="success">v1.0.0</el-tag>
        </div>
      </template>

      <div class="welcome-content">
        <div class="welcome-text">
          <h2>您好，管理员！</h2>
          <p>
            欢迎您登录 Vue Admin 管理系统，这是一个基于 Vue 3 和 Element Plus
            的现代化管理系统。
          </p>
          <p>
            系统提供了用户管理、CRUD
            操作、系统配置等功能，帮助您高效管理业务数据。
          </p>
        </div>
        <div class="welcome-image">
          <el-empty description="系统首页展示" :image-size="120" />
        </div>
      </div>
    </el-card>

    <!-- 数据统计区域 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="stats-card">
          <div class="stats-content">
            <div class="stats-icon user-icon">
              <el-icon><User /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ userCount }}</div>
              <div class="stats-label">总用户数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="stats-card">
          <div class="stats-content">
            <div class="stats-icon admin-icon">
              <el-icon><Avatar /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ adminCount }}</div>
              <div class="stats-label">管理员数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="stats-card">
          <div class="stats-content">
            <div class="stats-icon order-icon">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ orderCount }}</div>
              <div class="stats-label">订单数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="stats-card">
          <div class="stats-content">
            <div class="stats-icon revenue-icon">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ formatCurrency(revenue) }}</div>
              <div class="stats-label">总营收</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="16" class="charts-row">
      <el-col :xs="24" :md="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>用户增长趋势</span>
              <el-select v-model="timeRange" size="small" style="width: 120px">
                <el-option label="近7天" value="7d" />
                <el-option label="近30天" value="30d" />
                <el-option label="近90天" value="90d" />
              </el-select>
            </div>
          </template>

          <div class="chart-container">
            <el-empty description="图表展示区域" :image-size="150" />
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>用户角色分布</span>
              <el-button type="primary" size="small" link>查看详情</el-button>
            </div>
          </template>

          <div class="chart-container">
            <el-empty description="图表展示区域" :image-size="150" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 更新模块 -->
    <el-card shadow="hover" class="activity-card">
      <template #header>
        <div class="card-header">
          <span>更新</span>
          <el-button type="primary" size="small" link>{{ currentDate }}</el-button>
        </div>
      </template>

      <el-timeline>
        <el-timeline-item
          v-for="(activity, index) in activities"
          :key="index"
          :timestamp="activity.time"
          :type="activity.type"
          :color="activity.color"
        >
          <template #dot>
            <el-icon><Clock /></el-icon>
          </template>

          <div class="activity-content">
            <h4>{{ activity.title }}</h4>
            <p>{{ activity.description }}</p>
          </div>
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <!-- 快速操作区域 -->
    <el-card shadow="hover" class="quick-actions-card">
      <template #header>
        <div class="card-header">
          <span>快速操作</span>
        </div>
      </template>

      <el-row :gutter="16">
        <el-col
          :xs="12"
          :sm="6"
          v-for="(action, index) in quickActions"
          :key="index"
        >
          <el-card
            shadow="never"
            class="action-card"
            @click="handleQuickAction(action)"
          >
            <div class="action-icon" :style="{ backgroundColor: action.color }">
              <el-icon :size="24">{{ action.icon }}</el-icon>
            </div>
            <div class="action-label">{{ action.label }}</div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { User, Avatar, Document, Money, Clock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()

// 数据统计
const userCount = ref(12345)
const adminCount = ref(123)
const orderCount = ref(5678)
const revenue = ref(1234567.89)

// 时间范围
const timeRange = ref('7d')

// 格式化金额
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2
  }).format(value)
}

// 最新动态
const activities = ref([
  {
    time: '2023-10-01 10:30',
    type: 'primary',
    color: 'blue',
    title: '系统更新',
    description: 'Vue Admin 管理系统已更新至 v1.0.0 版本，新增用户管理功能'
  },
  {
    time: '2023-09-28 14:20',
    type: 'success',
    color: 'green',
    title: '数据统计',
    description: '本月用户注册量突破 5000 人，订单量增长 20%'
  },
  {
    time: '2023-09-25 09:15',
    type: 'warning',
    color: 'orange',
    title: '安全提醒',
    description: '系统检测到异常登录行为，已自动封禁 2 个账号'
  },
  {
    time: '2023-09-20 16:45',
    type: 'danger',
    color: 'red',
    title: '系统维护',
    description: '系统将于 2023-09-25 00:00 进行维护，预计持续 2 小时'
  }
])

// 快速操作
const quickActions = ref([
  {
    icon: 'User',
    label: '用户管理',
    color: '#409eff',
    path: '/user/list'
  },
  {
    icon: 'Document',
    label: 'CRUD 操作',
    color: '#67c23a',
    path: '/crud/list'
  },
  {
    icon: 'Setting',
    label: '系统配置',
    color: '#e6a23c',
    path: '/system/config'
  },
  {
    icon: 'Avatar',
    label: '管理员',
    color: '#f56c6c',
    path: '/system/admin'
  },
  {
    icon: 'UserFilled',
    label: '个人中心',
    color: '#909399',
    path: '/system/portrait'
  }
])

// 处理快速操作
const handleQuickAction = (action: any) => {
  if (action.path) {
    router.push(action.path)
  } else {
    ElMessage.info('该功能正在开发中...')
  }
}

// 页面加载时的操作
onMounted(() => {
  // 模拟数据加载
  console.log('首页加载完成')
})

// 获取当前日期（格式：YYYY-MM）
const currentDate = ref('')
onMounted(() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  currentDate.value = `${year}-${month}`
})
</script>

<style lang="scss" scoped>
.welcome-card {
  margin-bottom: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
    font-size: 16px;
  }

  .welcome-content {
    display: flex;
    align-items: center;
    gap: 20px;

    .welcome-text {
      flex: 1;

      h2 {
        margin: 0 0 10px 0;
        font-size: 24px;
        color: var(--el-text-color-primary);
      }

      p {
        margin: 0 0 10px 0;
        color: var(--el-text-color-regular);
        font-size: 14px;
      }
    }

    .welcome-image {
      flex-shrink: 0;
    }
  }
}

.stats-row {
  margin-bottom: 20px;
}

.stats-card {
  .stats-content {
    display: flex;
    align-items: center;
    gap: 15px;

    .stats-icon {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: #fff;

      &.user-icon {
        background-color: #409eff;
      }

      &.admin-icon {
        background-color: #67c23a;
      }

      &.order-icon {
        background-color: #e6a23c;
      }

      &.revenue-icon {
        background-color: #f56c6c;
      }
    }

    .stats-info {
      flex: 1;

      .stats-number {
        font-size: 24px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .stats-label {
        font-size: 14px;
        color: var(--el-text-color-regular);
      }
    }
  }
}

.charts-row {
  margin-bottom: 20px;
}

.chart-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
    font-size: 16px;
  }

  .chart-container {
    height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.activity-card {
  margin-bottom: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
    font-size: 16px;
  }

  .activity-content {
    h4 {
      margin: 0 0 5px 0;
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    p {
      margin: 0;
      font-size: 13px;
      color: var(--el-text-color-regular);
    }
  }
}

.quick-actions-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
    font-size: 16px;
  }

  .action-card {
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }

    .action-icon {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      margin: 0 auto 10px;
    }

    .action-label {
      text-align: center;
      font-size: 14px;
      color: var(--el-text-color-primary);
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .welcome-content {
    flex-direction: column;
    text-align: center;
  }

  .stats-card .stats-content {
    flex-direction: column;
    text-align: center;
  }

  .charts-row .chart-card .chart-container {
    height: 200px;
  }
}
</style>
