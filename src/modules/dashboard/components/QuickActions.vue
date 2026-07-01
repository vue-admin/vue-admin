<template>
  <div class="panel">
    <div class="panel-header">
      <span class="panel-title">快捷入口</span>
    </div>
    <div class="actions-grid">
      <div
        v-for="action in visibleActions"
        :key="action.key"
        class="action-item"
        @click="$emit('select', action)"
      >
        <el-icon class="action-icon">
          <component :is="action.icon" />
        </el-icon>
        <span class="action-label">{{ action.label }}</span>
      </div>
      <el-empty
        v-if="visibleActions.length === 0"
        description="暂无可用快捷入口"
        :image-size="60"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, type Component } from 'vue'
import { usePermissionStore } from '@/app/stores/permission'

interface QAction {
  key: string
  label: string
  icon: Component
  path?: string
  perm?: string[]
}

const props = defineProps<{
  actions: QAction[]
}>()

defineEmits<{
  (e: 'select', action: QAction): void
}>()

const permissionStore = usePermissionStore()

const visibleActions = computed(() =>
  props.actions.filter(
    (a) => !a.perm || permissionStore.hasAnyPermission(a.perm)
  )
)
</script>

<style scoped>
.panel {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  height: 100%;
}

.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 20px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 8px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-item:hover {
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

.action-icon {
  font-size: 24px;
  color: var(--el-color-primary);
}

.action-label {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

@media (max-width: 768px) {
  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
