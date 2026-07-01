<template>
  <div class="panel">
    <div class="panel-header">
      <span class="panel-title">最新动态</span>
    </div>
    <div class="panel-body">
      <el-timeline v-if="activities.length">
        <el-timeline-item
          v-for="item in activities"
          :key="item.id"
          :timestamp="item.time"
          :type="item.type"
        >
          <div class="activity-title">
            {{ item.title }}
          </div>
          <div class="activity-desc">
            {{ item.desc }}
          </div>
        </el-timeline-item>
      </el-timeline>
      <el-empty
        v-else
        description="暂无动态"
        :image-size="80"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Activity } from '../api'

defineProps<{
  activities: Activity[]
}>()
</script>

<style scoped>
.panel {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
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

.panel-body {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
}

.activity-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.activity-desc {
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.5;
}
</style>
