<template>
  <el-header>
    <el-menu
      :default-active="activeIndex"
      class="el-menu-header"
      mode="horizontal"
      :ellipsis="false"
      :router="true"
      @select="handleSelect"
    >
      <div class="el-collapse-icon">
        <a @click="toggleCollapse()">
          <el-icon v-if="isCollapse">
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
      <el-menu-item index="/">首页</el-menu-item>
      <el-menu-item index="/about"> 关于 </el-menu-item>
      <div class="dark-icon" @click="toggleDark()">
        <el-icon>
          <Moon v-if="isDark" />
          <Sunny v-else />
        </el-icon>
      </div>
      <el-sub-menu index="/">
        <template #title>
          <el-icon>
            <Avatar />
          </el-icon>
          {{ user.name }}
        </template>
        <el-menu-item index="/user">个人中心</el-menu-item>
        <el-menu-item index="/login">退出</el-menu-item>
      </el-sub-menu>
    </el-menu>
  </el-header>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { toggleCollapse, isCollapse } from '@/stores/collapse'
import { toggleDark, isDark } from '@/stores/dark'
import { user } from '@/stores/user'
const activeIndex = ref('1')
const handleSelect = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}
</script>

<style scoped>
.el-menu-header a {
  font-size: 14px;
  font-weight: 500;
}

.el-collapse-icon a {
  margin: 15px;
  font-size: 20px;
  line-height: 50px;
}

.breadcrumb {
  margin: 15px;
  font-size: 20px;
  line-height: 50px;
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
