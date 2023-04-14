<template>
  <el-breadcrumb separator="/">
    <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
    <el-breadcrumb-item
      v-for="item in routers"
      :key="item.path"
      :to="{ path: item?.path }"
      >{{ item?.meta?.title || '--' }}</el-breadcrumb-item
    >
    <el-breadcrumb-item>文档详情</el-breadcrumb-item>
  </el-breadcrumb>
</template>
<script setup lang="ts">
import { useRouter } from 'vue-router'
import { computed } from 'vue'
// 处理点击事件
const router = useRouter()
// 当前路由的匹配记录
console.log(router.currentRoute.value.matched)
const routers = computed(() => {
  // 过滤掉没有meta的
  return router.currentRoute.value.matched.filter(
    (item) => item.meta.title || null
  )
})
</script>
