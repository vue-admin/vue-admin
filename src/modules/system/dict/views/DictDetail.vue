<template>
  <el-card
    shadow="never"
    class="detail-card"
  >
    <template #header>
      <div class="detail-header">
        <div
          v-if="node"
          class="header-left"
        >
          <el-breadcrumb
            separator="/"
            class="breadcrumb"
          >
            <el-breadcrumb-item
              v-for="p in nodePath"
              :key="p.id"
            >
              {{ p.name }}
            </el-breadcrumb-item>
          </el-breadcrumb>
          <el-tag
            size="small"
            :type="levelTagMap[node.level]"
          >
            {{ levelLabelMap[node.level] }}
          </el-tag>
        </div>
        <span v-else>{{ title }}</span>
        <div
          v-if="node"
          class="header-actions"
        >
          <el-button
            v-if="node.level < 3"
            size="small"
            :icon="Plus"
            @click="handleAddChild"
          >
            新增{{ levelLabelMap[node.level + 1] }}
          </el-button>
          <el-button
            size="small"
            :icon="Edit"
            @click="handleEdit"
          >
            编辑
          </el-button>
          <el-button
            size="small"
            type="danger"
            :icon="Delete"
            @click="handleDelete"
          >
            删除
          </el-button>
        </div>
      </div>
    </template>

    <!-- 空状态引导 -->
    <div
      v-if="!node"
      class="empty-state"
    >
      <el-empty
        description="请从左侧选择一个分类、字典或字典项查看详情"
        :image-size="100"
      >
        <el-button
          type="primary"
          :icon="Plus"
          @click="$emit('addRoot')"
        >
          新增第一个分类
        </el-button>
      </el-empty>
    </div>

    <!-- 分类详情 -->
    <template v-else-if="node.level === 1">
      <el-descriptions
        :column="2"
        border
        size="small"
      >
        <el-descriptions-item label="分类名称">
          {{ node.name }}
        </el-descriptions-item>
        <el-descriptions-item label="分类代码">
          {{ node.code }}
        </el-descriptions-item>
        <el-descriptions-item
          label="描述"
          :span="2"
        >
          {{ node.description || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag
            :type="node.status === 'active' ? 'success' : 'danger'"
            size="small"
          >
            {{ node.status === 'active' ? '启用' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatDate(node.createTime) }}
        </el-descriptions-item>
      </el-descriptions>

      <DictChildrenPreview
        v-if="node.children?.length || true"
        :items="node.children || []"
        title="包含字典"
        parent-label="分类"
        child-label="字典"
        @add-child="handleAddChild"
      />
    </template>

    <!-- 字典详情 -->
    <template v-else-if="node.level === 2">
      <el-descriptions
        :column="2"
        border
        size="small"
      >
        <el-descriptions-item label="字典名称">
          {{ node.name }}
        </el-descriptions-item>
        <el-descriptions-item label="字典代码">
          {{ node.code }}
        </el-descriptions-item>
        <el-descriptions-item label="所属分类">
          {{ categoryName }}
        </el-descriptions-item>
        <el-descriptions-item label="描述">
          {{ node.description || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag
            :type="node.status === 'active' ? 'success' : 'danger'"
            size="small"
          >
            {{ node.status === 'active' ? '启用' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatDate(node.createTime) }}
        </el-descriptions-item>
      </el-descriptions>

      <DictChildrenPreview
        :items="node.children || []"
        title="包含字典项"
        parent-label="字典"
        child-label="字典项"
        show-value-column
        @add-child="handleAddChild"
      />
    </template>

    <!-- 字典项详情 -->
    <template v-else>
      <el-descriptions
        :column="2"
        border
        size="small"
      >
        <el-descriptions-item label="字典项名称">
          {{ node.name }}
        </el-descriptions-item>
        <el-descriptions-item label="字典项编码">
          {{ node.code }}
        </el-descriptions-item>
        <el-descriptions-item label="所属字典">
          {{ dictName }}
        </el-descriptions-item>
        <el-descriptions-item label="字典值">
          {{ node.value }}
        </el-descriptions-item>
        <el-descriptions-item label="排序">
          {{ node.sort }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag
            :type="node.status === 'active' ? 'success' : 'danger'"
            size="small"
          >
            {{ node.status === 'active' ? '启用' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item
          label="描述"
          :span="2"
        >
          {{ node.description || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatDate(node.createTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="更新时间">
          {{ formatDate(node.updateTime) }}
        </el-descriptions-item>
      </el-descriptions>
    </template>
  </el-card>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import type { DictTreeNode } from './hooks/useDictTree'
import { formatDate } from '@/lib/format'
import DictChildrenPreview from './components/DictChildrenPreview.vue'

const props = defineProps<{
  node: DictTreeNode | null
  treeData: DictTreeNode[]
  categoryName?: string
  dictName?: string
}>()

const emit = defineEmits<{
  (e: 'edit', node: DictTreeNode): void
  (e: 'delete', node: DictTreeNode): void
  (e: 'addChild', node: DictTreeNode): void
  (e: 'addRoot'): void
}>()

const levelLabelMap: Record<number, string> = {
  1: '分类',
  2: '字典',
  3: '字典项',
}

const levelTagMap: Record<number, string> = {
  1: 'primary',
  2: 'success',
  3: 'warning',
}

const title = computed(() => {
  if (!props.node) return '请选择一个节点'
  if (props.node.level === 1) return '字典分类详情'
  if (props.node.level === 2) return '字典详情'
  return '字典项详情'
})

// 查找父节点路径
function findParentPath(
  nodes: DictTreeNode[],
  targetId: string,
  path: DictTreeNode[] = []
): DictTreeNode[] {
  for (const n of nodes) {
    if (n.id === targetId) return [...path, n]
    if (n.children?.length) {
      const result = findParentPath(n.children, targetId, [...path, n])
      if (result.length) return result
    }
  }
  return []
}

const nodePath = computed(() => {
  if (!props.node) return []
  return findParentPath(props.treeData, props.node.id)
})

const handleEdit = () => {
  if (props.node) emit('edit', props.node)
}

const handleDelete = () => {
  if (props.node) emit('delete', props.node)
}

const handleAddChild = () => {
  if (props.node) emit('addChild', props.node)
}
</script>

<style scoped>
.detail-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.detail-card :deep(.el-card__body) {
  flex: 1;
  overflow-y: auto;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.breadcrumb {
  flex: 1;
  min-width: 0;
}

.breadcrumb :deep(.el-breadcrumb__inner) {
  font-weight: 600;
}

.empty-state {
  padding: 40px 20px;
}
</style>
