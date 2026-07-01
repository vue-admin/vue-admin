<template>
  <div class="home">
    <!-- 公告横幅 -->
    <NoticeBanner />

    <!-- 欢迎卡 -->
    <WelcomeCard
      :username="displayName"
      :is-admin="permissionStore.isSuperAdmin"
      :role-label="roleLabel"
      @action-click="onWelcomeAction"
    />

    <!-- 管理员视角：统计 + 图表 -->
    <template v-if="permissionStore.isSuperAdmin">
      <StatsCards :items="statItems" />

      <ChartCards
        :trend-data="charts.trend"
        :distribution-data="charts.distribution"
        :range="range"
        :loading="chartsLoading"
        @range-change="onRangeChange"
      />
    </template>

    <!-- 双列：动态 + 快捷入口 -->
    <div class="bottom-grid">
      <ActivityTimeline :activities="activities" />
      <QuickActions
        :actions="quickActions"
        @select="onQuickAction"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, type Component } from 'vue'
import { useRouter } from 'vue-router'
import {
  User,
  UserFilled,
  Lock,
  DataBoard,
  Menu as MenuIcon,
  Bell,
  Document,
  Setting
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/app/stores/user'
import { usePermissionStore } from '@/app/stores/permission'
import { Permissions, PERMISSION_WILDCARD } from '@/app/constants/permissions'
import {
  fetchDashboardStats,
  fetchDashboardCharts,
  fetchDashboardActivities,
  type DashboardStats,
  type DashboardCharts,
  type Activity,
  type ChartRange
} from '../api'
import NoticeBanner from '../components/NoticeBanner.vue'
import WelcomeCard from '../components/WelcomeCard.vue'
import StatsCards from '../components/StatsCards.vue'
import ChartCards from '../components/ChartCards.vue'
import ActivityTimeline from '../components/ActivityTimeline.vue'
import QuickActions from '../components/QuickActions.vue'

const router = useRouter()
const userStore = useUserStore()
const permissionStore = usePermissionStore()

const displayName = computed(
  () => userStore.profile?.nickname || userStore.profile?.username || '用户'
)

const roleLabel = computed(() => {
  if (permissionStore.isSuperAdmin) return '超级管理员'
  return '普通用户'
})

// 统计数据
const stats = ref<DashboardStats | null>(null)
const statItems = computed(() => {
  if (!stats.value) return []
  const s = stats.value
  return [
    { key: 'users', label: '总用户数', value: s.users.value, trendPct: s.users.trendPct },
    { key: 'orders', label: '订单数', value: s.orders.value, trendPct: s.orders.trendPct },
    { key: 'revenue', label: '总营收', value: s.revenue.value, unit: '¥', trendPct: s.revenue.trendPct },
    { key: 'active', label: '活跃用户', value: s.active.value, trendPct: s.active.trendPct }
  ]
})

// 图表数据
const range = ref<ChartRange>('7d')
const charts = ref<DashboardCharts>({ trend: [], distribution: [] })
const chartsLoading = ref(false)

const loadCharts = async () => {
  chartsLoading.value = true
  try {
    charts.value = await fetchDashboardCharts(range.value)
  } catch {
    // 静默失败，UI 显示空图表
  } finally {
    chartsLoading.value = false
  }
}

const onRangeChange = (r: ChartRange) => {
  range.value = r
  loadCharts()
}

// 动态
const activities = ref<Activity[]>([])

// 快捷入口（含权限过滤）
interface QAction {
  key: string
  label: string
  icon: Component
  path?: string
  perm?: string[]
}
const quickActions = computed<QAction[]>(() => {
  const actions: QAction[] = [
    { key: 'user', label: '用户管理', icon: User, path: '/system/user', perm: [Permissions.USER_READ, PERMISSION_WILDCARD] },
    { key: 'role', label: '角色管理', icon: UserFilled, path: '/system/role', perm: [Permissions.ROLE_READ, PERMISSION_WILDCARD] },
    { key: 'permission', label: '权限管理', icon: Lock, path: '/system/permission', perm: [Permissions.PERMISSION_READ, PERMISSION_WILDCARD] },
    { key: 'dict', label: '字典管理', icon: DataBoard, path: '/system/dict', perm: [Permissions.DICT_READ, PERMISSION_WILDCARD] },
    { key: 'menu', label: '菜单管理', icon: MenuIcon, path: '/system/menu', perm: [Permissions.MENU_READ, PERMISSION_WILDCARD] },
    { key: 'notice', label: '公告管理', icon: Bell, path: '/system/notice', perm: [Permissions.NOTICE_READ, PERMISSION_WILDCARD] },
    { key: 'crud', label: '增删改查', icon: Document, path: '/crud' },
    { key: 'profile', label: '个人中心', icon: Setting, path: '/profile' }
  ]
  return actions
})

const onQuickAction = (action: QAction) => {
  if (action.path) {
    router.push(action.path)
  } else {
    ElMessage.info('该功能正在开发中')
  }
}

const onWelcomeAction = (action: string) => {
  if (action === 'profile') router.push('/profile')
  else if (action === 'docs') {
    ElMessage.info('文档站点建设中')
  }
}

onMounted(async () => {
  // 普通用户不需要加载统计和图表
  if (!permissionStore.isSuperAdmin) {
    activities.value = await fetchDashboardActivities().catch(() => [])
    return
  }
  try {
    const [s, c, a] = await Promise.all([
      fetchDashboardStats(),
      fetchDashboardCharts(range.value),
      fetchDashboardActivities()
    ])
    stats.value = s
    charts.value = c
    activities.value = a
  } catch {
    ElMessage.error('首页数据加载失败')
  }
})
</script>

<style scoped>
.home {
  padding: 16px;
}

.bottom-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
}

@media (max-width: 992px) {
  .bottom-grid {
    grid-template-columns: 1fr;
  }
}
</style>
