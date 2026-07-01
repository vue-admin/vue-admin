<template>
  <el-breadcrumb separator="/">
    <el-breadcrumb-item :to="'/'">
      首页
    </el-breadcrumb-item>
    <el-breadcrumb-item
      v-for="item in breadcrumbItems"
      :key="item.path"
      :to="{ path: item?.path }"
    >
      {{ item?.title || '--' }}
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>
<script setup lang="ts">
import { useRouter } from 'vue-router'
import { computed } from 'vue'

const router = useRouter()

// 父路由标题映射（用于补全动态路由注册时缺失的父级）
const parentTitleMap: Record<string, string> = {
  '/system': '系统管理',
  '/system/log': '日志管理',
}

const breadcrumbItems = computed(() => {
  const items: { path: string; title: string }[] = []
  const matched = router.currentRoute.value.matched

  // 先收集所有已匹配的路由
  for (const item of matched) {
    if (item.meta?.title) {
      items.push({
        path: item.path,
        title: item.meta.title as string
      })
    }
  }

  // 检查是否需要补全父级（根据路径前缀）
  const currentPath = router.currentRoute.value.path
  for (const [parentPath, title] of Object.entries(parentTitleMap)) {
    // 如果当前路径以父路径开头，且父路径不在已匹配列表中，则补全
    if (currentPath.startsWith(parentPath) && !items.some(i => i.path === parentPath)) {
      // 找到合适的插入位置（按路径层级）
      const insertIndex = items.findIndex(i => i.path.startsWith(parentPath))
      const newItem = { path: parentPath, title }
      if (insertIndex >= 0) {
        items.splice(insertIndex, 0, newItem)
      } else {
        items.unshift(newItem)
      }
    }
  }

  return items
})
</script>
