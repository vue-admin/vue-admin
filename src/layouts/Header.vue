<template>
    <el-header>
        <el-menu :default-active="activeIndex" class="el-menu-header" mode="horizontal" :ellipsis="false"
            @select="handleSelect">
            <div class="el-collapse-icon">
                <a @click="collapse.change()">
                    <el-icon v-if="collapse.collapse">
                        <Expand />
                    </el-icon>
                    <el-icon v-else>
                        <Fold />
                    </el-icon>
                </a>
            </div>
            <div class="flex-grow" />
            <el-menu-item index="1">
                <RouterLink to="/">首页</RouterLink>
            </el-menu-item>
            <el-menu-item index="2">
                <RouterLink to="/about">关于</RouterLink>
            </el-menu-item>
            <div class="dark-icon" @click="toggleDark()">
                <el-icon>
                    <Moon v-if="isDark" />
                    <Sunny v-else />
                </el-icon>
            </div>
            <el-sub-menu index="100">
                <template #title>
                    <el-icon>
                        <Avatar />
                    </el-icon>
                    管理员
                </template>
                <el-menu-item index="100-1">个人中心</el-menu-item>
                <el-menu-item index="100-2">退出</el-menu-item>
            </el-sub-menu>
        </el-menu>

    </el-header>
</template>
  
<script lang="ts" setup>
import { ref } from 'vue'
import {
    Expand,
    Fold,
    Moon,
    Sunny,
    Avatar,
} from '@element-plus/icons-vue'
import { useCollapseStore } from '@/stores/collapse'
import { toggleDark, isDark } from '@/stores/dark'
const collapse = useCollapseStore()
const activeIndex = ref('1')
const handleSelect = (key: string, keyPath: string[]) => {
    console.log(key, keyPath)
}
</script>
  
<style>
.el-header {
    --el-header-padding: 0;
    --el-header-height: initial;
}

.el-menu-header a {
    font-size: 14px;
    font-weight: 500;
}

.el-collapse-icon a {
    margin: 15px;
    font-size: 20px;
    line-height: 50px;
}

.dark-icon {
    font-size: 20px;
    margin-top: 15px;
    cursor: pointer;
}

.flex-grow {
    flex-grow: 1;
}
</style>