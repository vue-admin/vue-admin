<template>
  <el-aside :class="isCollapse ? 'el-aside--collapse' : ''">
    <el-menu
      :default-active="activePath"
      class="el-menu-aside"
      :collapse="isCollapse"
      :router="true"
      :collapse-transition="false"
      @open="handleOpen"
      @close="handleClose"
    >
      <div class="sidebar-logo-container">
        <el-icon>
          <IconLogo />
        </el-icon>
        <span v-if="!isCollapse"> 后台管理系统 </span>
      </div>
      <MenuItem
        v-for="item in menus"
        v-show="item.meta?.['showMenu']"
        :data="item"
      />
    </el-menu>
  </el-aside>
</template>

<script lang="ts" setup>
import { isCollapse } from '@/stores/collapse'
import { ref, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'
import MenuItem from '../Menu/MenuItem.vue'
import menus from '@/router/menus'

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

const ruleForm = reactive({
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
