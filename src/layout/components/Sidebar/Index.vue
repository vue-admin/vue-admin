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
        <span v-if="!sidebarStore.collapsed && layoutStore.showLogo"> 后台管理系统 </span>
      </div>
      <MenuItem
        v-for="item in menus"
        v-show="item.meta?.['showMenu']"
        :key="item.path"
        :data="item"
      />
    </el-menu>
  </el-aside>
</template>

<script lang="ts" setup>
import { ref, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useSidebarStore } from '@/app/stores/sidebar'
import { useLayoutStore } from '@/app/stores/layout'
import MenuItem from '../Menu/MenuItem.vue'
import IconLogo from './IconLogo.vue'
import menus from '@/router/menus'

const sidebarStore = useSidebarStore()
const layoutStore = useLayoutStore()

// 菜单激活的路由
const route = useRoute()
const activePath = ref<string>(route.path)
watch(route, (to) => {
  activePath.value = to.path
})

const handleOpen = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}
const handleClose = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}

// TODO: M5+ 接入用户上下文后删除此占位
const _ruleForm = reactive({
  userId: ''
})
</script>

<style scoped>
.sidebar-logo-container {
  text-align: center;
  height: 50px;
  overflow: hidden;
  border-bottom: 1px solid var(--el-menu-border-color);
}

.sidebar-logo-container .el-icon {
  font-size: 26px;
  margin-top: 10px;
  margin-bottom: 10px;
}

.sidebar-logo-container span {
  margin-left: 10px;
  display: inline-block;
  line-height: 30px;
  vertical-align: super;
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
