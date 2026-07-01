<template>
  <!-- 项目统一模式：PageContainer 内置 title + header 同行布局 -->
  <PageContainer title="字典管理">
    <template #header>
      <el-input
        v-model="searchKeyword"
        placeholder="搜索字典分类、名称、编码、值"
        clearable
        style="width: 260px"
        @input="handleSearch"
        @keyup.enter="handleSearch"
        @clear="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button
        :icon="Refresh"
        link
        @click="handleRefresh"
      >
        刷新
      </el-button>
      <el-button
        :icon="Download"
        link
        @click="handleExport"
      >
        导出
      </el-button>
      <el-button
        type="primary"
        :icon="Plus"
        @click="smartAdd"
      >
        {{ smartAddLabel }}
      </el-button>
    </template>

    <!-- 主体：左树右详情 33% + 67% 布局 -->
    <el-row
      :gutter="16"
      class="main-row"
    >
      <!-- 左侧：字典树 -->
      <el-col
        :span="8"
        class="tree-col"
      >
        <DictTree
          ref="dictTreeRef"
          :tree-data="treeData"
          :loading="loading"
          :search-keyword="searchKeyword"
          @select="handleNodeSelect"
          @contextmenu="handleNodeContextMenu"
        />
      </el-col>

      <!-- 右侧：详情面板 -->
      <el-col
        :span="16"
        class="detail-col"
      >
        <DictDetail
          :node="selectedNode"
          :tree-data="treeData"
          :category-name="categoryName"
          :dict-name="dictName"
          @edit="handleEdit"
          @delete="handleDelete"
          @add-child="handleAddChild"
          @add-root="addRootCategory"
        />
      </el-col>
    </el-row>

    <!-- 右键菜单 -->
    <div
      v-show="contextMenuVisible"
      class="context-menu"
      :style="{ top: contextMenuPos.top + 'px', left: contextMenuPos.left + 'px' }"
      @click.stop
    >
      <div
        v-if="contextMenuNode && contextMenuNode.level < 3"
        class="context-menu-item"
        @click="handleContextMenuAdd"
      >
        <el-icon><Plus /></el-icon>
        <span>新增{{ levelLabelMap[contextMenuNode.level + 1] }}</span>
      </div>
      <div
        class="context-menu-item"
        @click="handleContextMenuEdit"
      >
        <el-icon><Edit /></el-icon>
        <span>编辑</span>
      </div>
      <div
        class="context-menu-item danger"
        @click="handleContextMenuDelete"
      >
        <el-icon><Delete /></el-icon>
        <span>删除</span>
      </div>
    </div>

    <DictFormDrawer
      v-model="drawerVisible"
      v-model:form="form"
      :mode="drawerMode"
      :parent-node="selectedParentNode"
      :selected-node="selectedNode"
      @submit="handleSubmit"
    />
  </PageContainer>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Search, Refresh, Plus, Download, Edit, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { confirmService } from '@/lib/confirm'
import { useDebounceFn } from '@vueuse/core'
import { PageContainer } from '@/app/components'
import { downloadCsv } from '@/lib/file'
import DictTree from './DictTree.vue'
import DictDetail from './DictDetail.vue'
import DictFormDrawer from './DictFormDrawer.vue'
import { useDictTree, type DictTreeNode } from './hooks/useDictTree'
import {
  exportDictCategories,
  exportDicts,
  exportDictItems,
} from '../api'

const dictTreeRef = ref<InstanceType<typeof DictTree>>()

const {
  keyword,
  treeData,
  loading,
  selectedNode,
  selectedParentNode,
  drawerVisible,
  drawerMode,
  form,
  load,
  startAdd,
  startEdit,
  submit,
  remove,
  findNode,
} = useDictTree()

const searchKeyword = ref('')

const levelLabelMap: Record<number, string> = {
  1: '分类',
  2: '字典',
  3: '字典项',
}

// 智能新增按钮文案
const smartAddLabel = computed(() => {
  if (!selectedNode.value) return '新增分类'
  if (selectedNode.value.level === 1) return '新增字典'
  if (selectedNode.value.level === 2) return '新增字典项'
  return '新增'
})

// 右键菜单
const contextMenuVisible = ref(false)
const contextMenuPos = ref({ top: 0, left: 0 })
const contextMenuNode = ref<DictTreeNode | null>(null)

const closeContextMenu = () => {
  contextMenuVisible.value = false
}

onMounted(() => {
  load()
  document.addEventListener('click', closeContextMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', closeContextMenu)
})

// 监听搜索关键词，自动展开匹配路径（300ms 防抖，避免每次按键触发）
const handleSearch = useDebounceFn(() => {
  keyword.value = searchKeyword.value
}, 300)

const handleRefresh = () => {
  searchKeyword.value = ''
  load()
  ElMessage.success('已刷新')
}

const handleExport = async () => {
  // 按当前选中节点层级导出对应层；未选中默认导出分类（顶层）
  const level = selectedNode.value?.level ?? 1
  try {
    const [csv, filename] =
      level === 1
        ? [await exportDictCategories(), '字典分类.csv']
        : level === 2
          ? [await exportDicts(), '字典.csv']
          : [await exportDictItems(), '字典项.csv']
    downloadCsv(csv, filename)
    ElMessage.success('导出成功')
  } catch {
    ElMessage.error('导出失败')
  }
}

const handleNodeSelect = (node: DictTreeNode) => {
  selectedNode.value = node
}

const handleNodeContextMenu = (event: MouseEvent, node: DictTreeNode) => {
  event.preventDefault()
  contextMenuNode.value = node
  selectedNode.value = node
  contextMenuPos.value = { top: event.clientY, left: event.clientX }
  contextMenuVisible.value = true
}

// 智能新增入口
const smartAdd = () => {
  if (!selectedNode.value || selectedNode.value.level >= 3) {
    // 无选中或选中字典项 -> 新增顶级分类
    addRootCategory()
  } else {
    // 新增子节点
    handleAddChild(selectedNode.value)
  }
}

const addRootCategory = () => {
  startAdd({ level: 0 })
}

const handleAddChild = (node: DictTreeNode) => {
  startAdd(node)
}

const handleEdit = (node?: DictTreeNode) => {
  const target = node || selectedNode.value
  if (!target) return
  startEdit(target)
}

const handleDelete = async (node?: DictTreeNode) => {
  const target = node || selectedNode.value
  if (!target) return

  const confirmed = await confirmService.showConfirm(
    `确定要删除该${levelLabelMap[target.level]}吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    }
  )
  if (!confirmed) {
    ElMessage.info('已取消删除')
    return
  }
  try {
    await remove(target)
    if (selectedNode.value?.id === target.id) {
      selectedNode.value = null
    }
  } catch {
    ElMessage.error('删除失败')
  }
}

const handleContextMenuAdd = () => {
  closeContextMenu()
  if (!contextMenuNode.value) return
  handleAddChild(contextMenuNode.value)
}

const handleContextMenuEdit = () => {
  closeContextMenu()
  if (!contextMenuNode.value) return
  handleEdit(contextMenuNode.value)
}

const handleContextMenuDelete = () => {
  closeContextMenu()
  if (!contextMenuNode.value) return
  handleDelete(contextMenuNode.value)
}

const handleSubmit = async () => {
  await submit()
}

// 计算面包屑路径辅助字段
const categoryName = computed(() => {
  if (!selectedNode.value || selectedNode.value.level !== 2) return '-'
  const cat = findNode(treeData.value, selectedNode.value.categoryId || '', 1)
  return cat?.name ?? '-'
})

const dictName = computed(() => {
  if (!selectedNode.value || selectedNode.value.level !== 3) return '-'
  const dict = findNode(treeData.value, selectedNode.value.dictId || '', 2)
  return dict?.name ?? '-'
})
</script>

<style scoped lang="scss">
.main-row {
  min-height: calc(100vh - 200px);
}

.tree-col,
.detail-col {
  display: flex;

  > :deep(*) {
    flex: 1;
    width: 100%;
  }
}

.context-menu {
  position: fixed;
  z-index: 3000;
  min-width: 160px;
  background: #fff;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 4px 0;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  color: var(--el-text-color-regular);

  &:hover {
    background-color: var(--el-fill-color-light);
  }

  &.danger:hover {
    color: var(--el-color-danger);
  }
}

// 响应式适配
@media (max-width: 1024px) {
  .tree-col {
    width: 100% !important;
    flex: 0 0 100%;
    margin-bottom: 16px;
  }

  .detail-col {
    width: 100% !important;
    flex: 0 0 100%;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;

    &-left,
    &-right {
      justify-content: center;
    }
  }
}
</style>
