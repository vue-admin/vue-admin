<template>
  <ErrorBoundary>
    <el-config-provider
      :locale="locale"
      :size="layoutStore.componentSize"
    >
      <router-view />
    </el-config-provider>
  </ErrorBoundary>
</template>

<script lang="ts" setup>
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import ErrorBoundary from '@/lib/error/ErrorBoundary.vue'
import { useLayoutStore } from '@/app/stores/layout'

const locale = zhCn
const layoutStore = useLayoutStore()
</script>

<style lang="scss"></style>
