<template>
  <div class="stats-grid">
    <div
      v-for="item in items"
      :key="item.key"
      class="stat-card"
    >
      <div class="stat-header">
        <span class="stat-label">{{ item.label }}</span>
        <span
          v-if="item.unit"
          class="stat-unit"
        >{{ item.unit }}</span>
      </div>
      <div class="stat-value">
        {{ formatValue(item) }}
      </div>
      <div
        v-if="item.trendPct !== undefined"
        class="stat-trend"
        :class="trendClass(item.trendPct)"
      >
        <span class="trend-arrow">{{ trendArrow(item.trendPct) }}</span>
        <span>{{ Math.abs(item.trendPct).toFixed(1) }}%</span>
        <span class="trend-label">较昨日</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
interface StatItem {
  key: string
  label: string
  value: number
  unit?: string
  trendPct?: number
}

const props = defineProps<{
  items: StatItem[]
}>()

const formatValue = (item: StatItem): string => {
  if (item.unit === '¥') {
    return item.value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  return item.value.toLocaleString('zh-CN')
}

const trendClass = (pct: number): string => {
  if (pct > 0) return 'trend-up'
  if (pct < 0) return 'trend-down'
  return 'trend-flat'
}

const trendArrow = (pct: number): string => {
  if (pct > 0) return '↑'
  if (pct < 0) return '↓'
  return '→'
}

// 避免 props 未使用告警（保留接口用于未来扩展）
void props
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  padding: 20px;
  transition: box-shadow 0.2s;
}

.stat-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.stat-unit {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  line-height: 1.2;
  margin-bottom: 8px;
  font-variant-numeric: tabular-nums;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.trend-arrow {
  font-weight: 700;
}

.trend-up {
  color: var(--el-color-success);
}

.trend-down {
  color: var(--el-color-danger);
}

.trend-flat {
  color: var(--el-text-color-secondary);
}

.trend-label {
  color: var(--el-text-color-secondary);
  margin-left: 4px;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
