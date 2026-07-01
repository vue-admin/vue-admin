<template>
  <el-tag
    :type="tagType"
    :size="size"
    :effect="effect"
  >
    {{ displayText }}
  </el-tag>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

interface StatusMap {
  [key: string]: { type: string; text: string }
}

const props = withDefaults(
  defineProps<{
    /** 状态值 */
    status?: string | number | boolean
    /** 自定义映射 */
    statusMap?: StatusMap
    /** 自定义显示文本 */
    text?: string
    /** 标签大小 */
    size?: 'large' | 'default' | 'small'
    /** 标签效果 */
    effect?: 'dark' | 'light' | 'plain'
  }>(),
  {
    status: '',
    statusMap: () => ({}),
    text: '',
    size: 'small',
    effect: 'light',
  }
)

// 默认状态映射
const defaultStatusMap: StatusMap = {
  // 启用/禁用
  active: { type: 'success', text: '启用' },
  inactive: { type: 'info', text: '禁用' },
  // 布尔值
  true: { type: 'success', text: '是' },
  false: { type: 'info', text: '否' },
  // 数字状态
  1: { type: 'success', text: '启用' },
  0: { type: 'info', text: '禁用' },
  // 通用状态
  success: { type: 'success', text: '成功' },
  failed: { type: 'danger', text: '失败' },
  error: { type: 'danger', text: '错误' },
  pending: { type: 'warning', text: '待处理' },
  processing: { type: 'primary', text: '处理中' },
  completed: { type: 'success', text: '已完成' },
  cancelled: { type: 'info', text: '已取消' },
  deleted: { type: 'danger', text: '已删除' },
  // 用户状态
  admin: { type: 'danger', text: '管理员' },
  user: { type: 'primary', text: '普通用户' },
  vip: { type: 'warning', text: 'VIP' },
}

const mergedMap = computed<StatusMap>(() => ({
  ...defaultStatusMap,
  ...props.statusMap,
}))

const tagType = computed<string>(() => {
  const key = String(props.status ?? '')
  return mergedMap.value[key]?.type || 'info'
})

const displayText = computed<string>(() => {
  if (props.text) return props.text
  const key = String(props.status ?? '')
  return mergedMap.value[key]?.text ?? String(props.status ?? '')
})
</script>
