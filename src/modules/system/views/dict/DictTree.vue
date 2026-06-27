<template>
  <el-card
    shadow="never"
    class="tree-card"
  >
    <template #header>
      <div class="card-header">
        <span>字典树</span>
        <el-tag
          v-if="loading"
          type="info"
          size="small"
        >
          加载中…
        </el-tag>
      </div>
    </template>
    <el-tree
      ref="treeRef"
      :data="treeData"
      :props="treeProps"
      node-key="id"
      default-expand-all
      highlight-current
      class="dict-tree"
      @node-click="handleNodeClick"
      @node-contextmenu="handleNodeContextMenu"
    >
      <template #default="{ node, data }">
        <div class="tree-node">
          <el-tag
            v-if="data.level === 1"
            type="primary"
            size="small"
            class="level-tag"
          >
            分类
          </el-tag>
          <el-tag
            v-else-if="data.level === 2"
            type="success"
            size="small"
            class="level-tag"
          >
            字典
          </el-tag>
          <el-tag
            v-else-if="data.level === 3"
            type="warning"
            size="small"
            class="level-tag"
          >
            字典项
          </el-tag>
          <span class="node-label">{{ node.label }}</span>
        </div>
      </template>
    </el-tree>
  </el-card>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { ElTree } from 'element-plus'
import type { DictTreeNode } from './hooks/useDictTree'

defineProps<{
  treeData: DictTreeNode[]
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'select', node: DictTreeNode): void
  (e: 'contextmenu', event: MouseEvent, node: DictTreeNode): void
}>()

const treeRef = ref<InstanceType<typeof ElTree>>()
const treeProps = { label: 'name', children: 'children' }

const handleNodeClick = (data: DictTreeNode) => {
  emit('select', data)
}

const handleNodeContextMenu = (event: Event, data: DictTreeNode) => {
  emit('contextmenu', event as MouseEvent, data)
}
</script>

<style scoped>
.tree-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.tree-card :deep(.el-card__body) {
  height: calc(100% - 60px);
  overflow: hidden;
}

.dict-tree {
  height: 100%;
  overflow-y: auto;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
}

.level-tag {
  flex-shrink: 0;
}

.node-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
