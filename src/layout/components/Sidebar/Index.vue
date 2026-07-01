<template>
  <el-aside :class="sidebarStore.collapsed ? 'el-aside--collapse' : ''">
    <el-menu
      :default-active="activePath"
      class="el-menu-aside"
      :collapse="sidebarStore.collapsed"
      :router="true"
      :collapse-transition="false"
      @open="handleOpen"
      @close="handleClose"
    >
      <div class="sidebar-logo-container">
        <el-icon v-if="layoutStore.showLogo">
          <IconLogo />
        </el-icon>
        <span v-if="!sidebarStore.collapsed && layoutStore.showLogo">
          后台管理系统
        </span>
      </div>
      <template v-if="permissionStore.menusLoaded">
        <MenuItem
          v-for="item in permissionStore.visibleMenus"
          :key="item.path"
          :data="item"
        />
      </template>
      <div
        v-else
        class="sidebar-loading"
      >
        <el-icon class="is-loading">
          <Loading />
        </el-icon>
      </div>
    </el-menu>
  </el-aside>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Loading } from '@element-plus/icons-vue'
import { useSidebarStore } from '@/app/stores/sidebar'
import { useLayoutStore } from '@/app/stores/layout'
import { usePermissionStore } from '@/app/stores/permission'
import MenuItem from '../Menu/MenuItem.vue'
import IconLogo from './IconLogo.vue'

const sidebarStore = useSidebarStore()
const layoutStore = useLayoutStore()
const permissionStore = usePermissionStore()

// 菜单激活的路由
const route = useRoute()
const activePath = ref<string>(route.path)
watch(route, (to) => {
  activePath.value = to.path
})

const handleOpen = () => {}
const handleClose = () => {}
</script>

<style scoped>
.sidebar-logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 50px;
  overflow: hidden;
  border-bottom: 1px solid var(--el-menu-border-color);
}

.sidebar-logo-container .el-icon {
  font-size: 26px;
}

.sidebar-logo-container span {
  line-height: 50px;
}

.sidebar-loading {
  display: flex;
  justify-content: center;
  padding: 20px 0;
  color: var(--el-text-color-secondary);
}

.el-menu-aside {
  height: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden auto;
}

.el-aside {
  -webkit-transition: width 0.28s;
  transition: width 0.28s;
  width: var(--ep-aside-width, 200px);
}

.el-aside--collapse {
  -webkit-transition: width 0.28s;
  transition: width 0.28s;
  width: var(--ep-aside-width, 65px);
}
</style>
