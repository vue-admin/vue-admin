<template>
  <el-result
    v-if="error"
    icon="error"
    title="页面出错了"
    :sub-title="error.message"
  >
    <template #extra>
      <el-button
        type="primary"
        @click="error = null"
      >
        重试
      </el-button>
    </template>
  </el-result>
  <slot v-else />
</template>

<script lang="ts" setup>
import { ref, inject, onErrorCaptured } from 'vue'
import type { Monitor } from './types'

const monitor = inject<Monitor>('monitor')!
const error = ref<Error | null>(null)

onErrorCaptured((err) => {
  error.value = err as Error
  monitor.captureException(err as Error)
  return false  // 阻止向上冒泡
})
</script>
