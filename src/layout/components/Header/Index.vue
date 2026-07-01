<template>
  <div class="layout-header">
    <div class="header-left">
      <div
        class="collapse-btn"
        @click="sidebarStore.toggleCollapsed()"
      >
        <el-icon v-if="sidebarStore.collapsed">
          <Expand />
        </el-icon>
        <el-icon v-else>
          <Fold />
        </el-icon>
      </div>
      <Breadcrumb v-if="layoutStore.showBreadcrumb" />
    </div>
    <div class="header-right">
      <NoticeCenter />
      <el-tooltip content="主题切换">
        <div
          class="header-icon"
          @click="themeStore.toggleDark()"
        >
          <el-icon>
            <Moon v-if="themeStore.isDark" />
            <Sunny v-else />
          </el-icon>
        </div>
      </el-tooltip>
      <el-tooltip content="设置">
        <div
          class="header-icon settings-icon"
          @click="settingsVisible = true"
        >
          <el-icon><Setting /></el-icon>
        </div>
      </el-tooltip>
      <el-dropdown @command="handleDropdownCommand">
        <div class="user-info">
          <el-icon><Avatar /></el-icon>
          <span>{{ displayName }}</span>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              个人中心
            </el-dropdown-item>
            <el-dropdown-item command="logout">
              退出
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    <SettingsDrawer v-model="settingsVisible" />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { Setting, Expand, Fold, Moon, Sunny, Avatar } from '@element-plus/icons-vue'
import { useSidebarStore } from '@/app/stores/sidebar'
import { useThemeStore } from '@/app/stores/theme'
import { useUserStore } from '@/app/stores/user'
import { useLayoutStore } from '@/app/stores/layout'
import { usePermissionStore } from '@/app/stores/permission'
import { authService } from '@/lib/auth/authService'
import { _resetMenusRegistered } from '@/lib/router/guards'
import Breadcrumb from '../Breadcrumb/Index.vue'
import SettingsDrawer from '../SettingsDrawer.vue'
import NoticeCenter from '../NoticeCenter.vue'

const router = useRouter()
const sidebarStore = useSidebarStore()
const themeStore = useThemeStore()
const userStore = useUserStore()
const layoutStore = useLayoutStore()
const permissionStore = usePermissionStore()
const settingsVisible = ref(false)

const displayName = computed(
  () => userStore.profile?.nickname || userStore.profile?.username || ''
)

const handleDropdownCommand = async (command: string) => {
  if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      })
    } catch {
      return
    }
    // 清理认证、用户、菜单状态
    await authService.logout()
    userStore.reset()
    permissionStore.clearMenus()
    _resetMenusRegistered()
    router.push('/login')
  }
}
</script>

<style scoped>
.layout-header {
  height: 50px;
  padding: 0 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.collapse-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  cursor: pointer;
  font-size: 18px;
  transition: background-color 0.2s;
}

.collapse-btn:hover {
  background-color: var(--el-fill-color-light);
}

.header-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  cursor: pointer;
  font-size: 18px;
  transition: background-color 0.2s;
}

.header-icon:hover {
  background-color: var(--el-fill-color-light);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.user-info:hover {
  background-color: var(--el-fill-color-light);
}

.user-info .el-icon {
  font-size: 18px;
}
</style>
