<template>
  <el-result
    v-if="error"
    icon="error"
    :title="displayTitle"
    :sub-title="displayMessage"
  >
    <template #extra>
      <el-button
        type="primary"
        :disabled="retryCount >= maxRetries"
        @click="handleRetry"
      >
        重试
      </el-button>
      <p
        v-if="retryCount >= maxRetries"
        class="error-boundary__hint"
      >
        错误反复发生，请刷新页面或联系管理员
      </p>
    </template>
  </el-result>
  <slot v-else />
</template>

<script lang="ts" setup>
import { ref, inject, computed, onErrorCaptured } from 'vue'
import type { Monitor } from './types'

interface Props {
  title?: string
  message?: string
  maxRetries?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: '页面出错了',
  message: undefined,
  maxRetries: 3
})

const monitor = inject<Monitor>('monitor')!
const error = ref<Error | null>(null)
const retryCount = ref(0)
const lastErrorKey = ref('')

const displayTitle = computed(() => props.title)
const displayMessage = computed(
  () => props.message ?? error.value?.message ?? ''
)

const handleRetry = () => {
  error.value = null
}

defineExpose({ error, retryCount })

onErrorCaptured((err) => {
  const errObj = err instanceof Error ? err : new Error(String(err))
  monitor.captureException(errObj)

  const key = `${errObj.name}:${errObj.message}`
  if (key === lastErrorKey.value) {
    retryCount.value += 1
  } else {
    lastErrorKey.value = key
    retryCount.value = 1
  }

  error.value = errObj
  return false
})
</script>

<style scoped>
.error-boundary__hint {
  margin-top: 12px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
