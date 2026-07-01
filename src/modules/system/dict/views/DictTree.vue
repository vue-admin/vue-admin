<template>
  <el-card
    shadow="never"
    class="tree-card"
  >
    <template #header>
      <div class="card-header">
        <span>字典结构</span>
        <el-tag
          size="small"
          type="info"
        >
          {{ nodeCount }} 个节点
        </el-tag>
      </div>
    </template>
    <el-tree
      ref="treeRef"
      :data="filteredTreeData"
      :props="treeProps"
      node-key="id"
      :default-expand-all="!searchKeyword"
      :expand-on-click-node="false"
      :indent="24"
      highlight-current
      class="dict-tree"
      @node-click="handleNodeClick"
      @node-contextmenu="handleNodeContextMenu"
    >
      <template #default="{ data }">
        <div class="tree-node">
          <el-tag
            size="small"
            :type="levelTagMap[data.level]"
            class="level-tag"
          >
            {{ levelLabelMap[data.level] }}
          </el-tag>
          <!-- eslint-disable vue/no-v-html -- 文本已先转义再注入，仅包裹高亮 span -->
          <span
            class="node-name"
            v-html="highlightKeyword(data.name)"
          />
          <!-- eslint-enable vue/no-v-html -->
          <span class="node-code">{{ data.code }}</span>
        </div>
      </template>
    </el-tree>
    <div
      v-if="searchKeyword && filteredTreeData.length === 0"
      class="search-empty"
    >
      <el-empty
        description="未找到匹配的字典"
        :image-size="80"
      />
    </div>
  </el-card>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import type { ElTree } from 'element-plus'
import type { DictTreeNode } from './hooks/useDictTree'

const props = defineProps<{
  treeData: DictTreeNode[]
  loading: boolean
  searchKeyword?: string
}>()

const emit = defineEmits<{
  (e: 'select', node: DictTreeNode): void
  (e: 'contextmenu', event: MouseEvent, node: DictTreeNode): void
}>()

const treeRef = ref<InstanceType<typeof ElTree>>()
const treeProps = { label: 'name', children: 'children' }

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

// 递归计算总节点数
const countNodes = (nodes: DictTreeNode[]): number => {
  let count = nodes.length
  for (const node of nodes) {
    if (node.children?.length) {
      count += countNodes(node.children)
    }
  }
  return count
}

const nodeCount = computed(() => countNodes(props.treeData))

// 搜索过滤树
const filteredTreeData = computed(() => {
  const keyword = props.searchKeyword?.trim()?.toLowerCase()
  if (!keyword) return props.treeData

  const filter = (nodes: DictTreeNode[]): DictTreeNode[] => {
    const result: DictTreeNode[] = []
    for (const node of nodes) {
      const matchName = node.name?.toLowerCase().includes(keyword)
      const matchCode = node.code?.toLowerCase().includes(keyword)
      const matchValue = node.value?.toString().toLowerCase().includes(keyword)

      const filteredChildren = node.children?.length ? filter(node.children) : []

      if (matchName || matchCode || matchValue || filteredChildren.length > 0) {
        result.push({
          ...node,
          children: filteredChildren.length > 0 ? filteredChildren : node.children,
        })
      }
    }
    return result
  }

  return filter(props.treeData)
})

// HTML 转义，防止服务端返回的 name 注入恶意脚本
const escapeHtml = (str: string): string =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

// 高亮搜索关键字：先转义文本，再仅包裹 <span>（关键词已转义正则特殊字符）
const highlightKeyword = (text: string): string => {
  const safe = escapeHtml(text || '')
  const keyword = props.searchKeyword?.trim()
  if (!keyword) return safe

  const escapedKeyword = escapeHtml(keyword).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedKeyword})`, 'gi')
  return safe.replace(regex, '<span class="highlight">$1</span>')
}

const handleNodeClick = (data: DictTreeNode) => {
  emit('select', data)
}

const handleNodeContextMenu = (event: Event, data: DictTreeNode) => {
  emit('contextmenu', event as MouseEvent, data)
}

defineExpose({ treeRef })
</script>

<style scoped>
.tree-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tree-card :deep(.el-card__body) {
  flex: 1;
  overflow: hidden;
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.dict-tree {
  height: 100%;
  overflow-y: auto;
  padding: 12px;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  padding: 4px 8px 4px 0;
}

.level-tag {
  flex-shrink: 0;
  width: 52px;
  text-align: center;
}

.node-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.node-code {
  flex-shrink: 0;
  color: var(--el-text-color-tertiary);
  font-size: 12px;
  font-family: monospace;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.highlight {
  color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
  padding: 0 2px;
  border-radius: 2px;
  font-weight: 600;
}

.search-empty {
  padding: 20px;
}
</style>
