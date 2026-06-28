<template>
  <el-menu
    :default-active="activeIndex"
    class="el-menu-header"
    mode="horizontal"
    :ellipsis="false"
    :router="true"
    @select="handleSelect"
  >
    <div class="el-collapse-icon">
      <a @click="sidebarStore.toggleCollapsed()">
        <el-icon v-if="sidebarStore.collapsed">
          <Expand />
        </el-icon>
        <el-icon v-else>
          <Fold />
        </el-icon>
      </a>
    </div>
    <div class="breadcrumb">
      <Breadcrumb />
    </div>
    <div class="flex-grow" />
    <el-menu-item index="/">
      首页
    </el-menu-item>
    <el-menu-item index="/about">
      关于
    </el-menu-item>
    <div
      class="dark-icon"
      @click="themeStore.toggleDark()"
    >
      <el-icon>
        <Moon v-if="themeStore.isDark" />
        <Sunny v-else />
      </el-icon>
    </div>
    <el-sub-menu index="/">
      <template #title>
        <el-icon>
          <Avatar />
        </el-icon>
        {{ displayName }}
      </template>
      <el-menu-item index="/profile">
        个人中心
      </el-menu-item>
      <el-menu-item index="/login">
        退出
      </el-menu-item>
    </el-sub-menu>
  </el-menu>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useSidebarStore } from '@/app/stores/sidebar'
import { useThemeStore } from '@/app/stores/theme'
import { useUserStore } from '@/app/stores/user'
import Breadcrumb from '../Breadcrumb/Index.vue'
const activeIndex = ref('1')
const handleSelect = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}

const sidebarStore = useSidebarStore()
const themeStore = useThemeStore()
const userStore = useUserStore()

// 旧版 Header 引用 `user.name`（来自 useStorage demo）；M3+ user store 已通过
// authService 加载 profile，优先展示 nickname，回退到 username
const displayName = computed(
  () => userStore.profile?.nickname || userStore.profile?.username || ''
)
</script>

<style scoped>
.el-menu-header a {
  font-size: 14px;
  font-weight: 500;
}

.el-collapse-icon a {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  font-size: 16px;
  margin: 0 0 0 15px;
}

.breadcrumb {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  font-size: 20px;
  margin: 0 0 0 15px;
}

/* 窄屏模式下隐藏面包屑 */
@media (max-width: 768px) {
  .breadcrumb {
    display: none;
  }
}

.dark-icon {
  font-size: 20px;
  margin: 15px 15px 0 15px;
  cursor: pointer;
}

.flex-grow {
  flex-grow: 1;
}
</style>
