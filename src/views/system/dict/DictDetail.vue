<template>
  <el-card shadow="never" class="detail-card">
    <template #header>
      <div class="card-header">
        <span>{{ title }}</span>
        <el-button
          v-if="node"
          type="primary"
          size="small"
          :icon="Edit"
          @click="emit('edit', node)"
        >编辑</el-button>
      </div>
    </template>

    <div v-if="!node" class="no-selection">
      <el-empty description="请在左侧选择一个节点查看详情" />
    </div>

    <!-- 分类详情 -->
    <el-descriptions v-else-if="node.level === 1" :column="2" border>
      <el-descriptions-item label="分类名称">{{ node.name }}</el-descriptions-item>
      <el-descriptions-item label="分类代码">{{ node.code }}</el-descriptions-item>
      <el-descriptions-item label="描述" :span="2">{{ node.description || '-' }}</el-descriptions-item>
      <el-descriptions-item label="状态">
        <el-tag :type="node.status === 'active' ? 'success' : 'danger'">
          {{ node.status === 'active' ? '启用' : '禁用' }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">{{ formatDate(node.createTime) }}</el-descriptions-item>
      <el-descriptions-item label="更新时间" :span="2">{{ formatDate(node.updateTime) }}</el-descriptions-item>
    </el-descriptions>

    <!-- 字典详情 -->
    <el-descriptions v-else-if="node.level === 2" :column="2" border>
      <el-descriptions-item label="字典名称">{{ node.name }}</el-descriptions-item>
      <el-descriptions-item label="字典代码">{{ node.code }}</el-descriptions-item>
      <el-descriptions-item label="所属分类">{{ categoryName }}</el-descriptions-item>
      <el-descriptions-item label="描述">{{ node.description || '-' }}</el-descriptions-item>
      <el-descriptions-item label="状态">
        <el-tag :type="node.status === 'active' ? 'success' : 'danger'">
          {{ node.status === 'active' ? '启用' : '禁用' }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">{{ formatDate(node.createTime) }}</el-descriptions-item>
      <el-descriptions-item label="更新时间">{{ formatDate(node.updateTime) }}</el-descriptions-item>
    </el-descriptions>

    <!-- 字典项详情 -->
    <el-descriptions v-else :column="2" border>
      <el-descriptions-item label="字典项名称">{{ node.name }}</el-descriptions-item>
      <el-descriptions-item label="字典项代码">{{ node.code }}</el-descriptions-item>
      <el-descriptions-item label="所属字典">{{ dictName }}</el-descriptions-item>
      <el-descriptions-item label="字典值">{{ node.value }}</el-descriptions-item>
      <el-descriptions-item label="排序">{{ node.sort }}</el-descriptions-item>
      <el-descriptions-item label="状态">
        <el-tag :type="node.status === 'active' ? 'success' : 'danger'">
          {{ node.status === 'active' ? '启用' : '禁用' }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">{{ formatDate(node.createTime) }}</el-descriptions-item>
      <el-descriptions-item label="更新时间">{{ formatDate(node.updateTime) }}</el-descriptions-item>
    </el-descriptions>
  </el-card>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { Edit } from '@element-plus/icons-vue'
import type { DictTreeNode } from './hooks/useDictTree'

const props = defineProps<{
  node: DictTreeNode | null
  categoryName?: string
  dictName?: string
}>()

const emit = defineEmits<{
  (e: 'edit', node: DictTreeNode): void
}>()

const title = computed(() => {
  if (!props.node) return '请选择一个节点'
  if (props.node.level === 1) return '字典分类详情'
  if (props.node.level === 2) return '字典详情'
  return '字典项详情'
})

const formatDate = (date?: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}
</script>

<style scoped>
.detail-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.no-selection {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}
</style>
