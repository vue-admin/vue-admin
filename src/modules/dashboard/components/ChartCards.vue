<template>
  <div class="charts-grid">
    <!-- 趋势图 -->
    <div class="chart-card trend-card">
      <div class="chart-header">
        <span class="chart-title">访问趋势</span>
        <el-radio-group
          v-model="localRange"
          size="small"
          @change="onRangeChange"
        >
          <el-radio-button value="7d">
            7 天
          </el-radio-button>
          <el-radio-button value="30d">
            30 天
          </el-radio-button>
          <el-radio-button value="90d">
            90 天
          </el-radio-button>
        </el-radio-group>
      </div>
      <div
        ref="trendRef"
        v-loading="loading"
        class="chart-body"
      />
    </div>

    <!-- 分布图 -->
    <div class="chart-card dist-card">
      <div class="chart-header">
        <span class="chart-title">用户角色分布</span>
      </div>
      <div
        ref="distRef"
        v-loading="loading"
        class="chart-body"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted, onBeforeUnmount, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts/core'
import { LineChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useThemeStore } from '@/app/stores/theme'
import type { TrendPoint, DistItem, ChartRange } from '../api'

echarts.use([
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer
])

const props = defineProps<{
  trendData: TrendPoint[]
  distributionData: DistItem[]
  range: ChartRange
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'range-change', range: ChartRange): void
}>()

const themeStore = useThemeStore()
const trendRef = ref<HTMLElement | null>(null)
const distRef = ref<HTMLElement | null>(null)
let trendChart: echarts.ECharts | null = null
let distChart: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null

const localRange = ref<ChartRange>(props.range)

watch(
  () => props.range,
  (v) => {
    localRange.value = v
  }
)

const onRangeChange = (v: string | number | boolean | undefined) => {
  emit('range-change', v as ChartRange)
}

const textColor = () => (themeStore.isDark ? '#fff' : '#333')
const axisLineColor = () =>
  themeStore.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'

// 安全销毁 ECharts 实例（dispose 在某些场景下可能抛错，加保护）
function safeDispose(chart: echarts.ECharts | null): null {
  if (!chart) return null
  try {
    chart.dispose()
  } catch (e) {
    console.warn('[ChartCards] dispose failed:', e)
  }
  return null
}

const renderTrend = () => {
  if (!trendRef.value) return
  if (!trendChart) trendChart = echarts.init(trendRef.value)
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'category',
      data: props.trendData.map((p) => p.date),
      axisLine: { lineStyle: { color: axisLineColor() } },
      axisLabel: { color: textColor(), fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: axisLineColor() } },
      axisLabel: { color: textColor(), fontSize: 11 },
      splitLine: { lineStyle: { color: axisLineColor() } }
    },
    series: [
      {
        type: 'line',
        smooth: true,
        data: props.trendData.map((p) => p.value),
        areaStyle: { opacity: 0.1 },
        lineStyle: { width: 2 },
        itemStyle: { color: '#409eff' }
      }
    ]
  })
}

const renderDist = () => {
  if (!distRef.value) return
  if (!distChart) distChart = echarts.init(distRef.value)
  distChart.setOption({
    tooltip: { trigger: 'item' },
    legend: {
      bottom: 0,
      textStyle: { color: textColor() }
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        label: { color: textColor() },
        data: props.distributionData,
        color: ['#409eff', '#67c23a', '#e6a23c', '#f56c6c']
      }
    ]
  })
}

const renderAll = () => {
  renderTrend()
  renderDist()
}

// 浅监听：数组引用变化或长度变化时重渲染。避免 deep watch 每帧遍历整个数组。
watch(
  () => [props.trendData.length, props.distributionData.length] as const,
  () => {
    nextTick(renderAll)
  }
)

// 主题切换：通过 setOption 平滑更新颜色，避免 dispose 重建造成的闪烁
watch(
  () => themeStore.isDark,
  () => {
    nextTick(() => {
      if (trendChart && distChart) {
        renderAll()
      } else {
        // 实例不存在时（首次未挂载或异常），重建
        trendChart = safeDispose(trendChart)
        distChart = safeDispose(distChart)
        nextTick(renderAll)
      }
    })
  }
)

onMounted(() => {
  nextTick(() => {
    renderAll()
    if (trendRef.value?.parentElement) {
      resizeObserver = new ResizeObserver(() => {
        trendChart?.resize()
        distChart?.resize()
      })
      resizeObserver.observe(trendRef.value.parentElement)
    }
  })
})

// 提前在 onBeforeUnmount 断开观察器，避免组件卸载期间触发 resize
onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})

onUnmounted(() => {
  trendChart = safeDispose(trendChart)
  distChart = safeDispose(distChart)
})
</script>

<style scoped>
.charts-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.chart-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  padding: 16px 20px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.chart-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.chart-body {
  height: 280px;
}

@media (max-width: 992px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
