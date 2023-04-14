<template>
  <el-aside :class="isCollapse ? 'el-aside--collapse' : ''">
    <el-menu
      default-active="2"
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
      <el-menu-item index="/">
        <el-icon><Menu /></el-icon>
        <template #title> 控制台 </template>
      </el-menu-item>
      <el-menu-item index="/doc">
        <el-icon><document /></el-icon>
        <template #title> 文档列表 </template>
      </el-menu-item>
      <el-sub-menu index="3">
        <template #title>
          <el-icon>
            <location />
          </el-icon>
          <span>用户中心</span>
        </template>
        <el-menu-item-group>
          <template #title><span>用户</span></template>
          <el-menu-item index="/user/list">用户列表</el-menu-item>
          <el-menu-item index="/user/portrait">用户画像</el-menu-item>
        </el-menu-item-group>
        <el-menu-item-group title="商家">
          <el-menu-item index="/merchant/list">商家列表</el-menu-item>
        </el-menu-item-group>
        <el-sub-menu index="/admin">
          <template #title><span>管理员</span></template>
          <el-menu-item index="/admiln/list">管理员列表</el-menu-item>
        </el-sub-menu>
      </el-sub-menu>
      <el-menu-item index="/sys">
        <el-icon>
          <setting />
        </el-icon>
        <template #title>系统设置</template>
      </el-menu-item>
    </el-menu>
  </el-aside>
</template>

<script lang="ts" setup>
import { isCollapse } from '@/stores/collapse'
const handleOpen = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}
const handleClose = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}
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
