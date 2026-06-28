<template>
  <PageContainer title="字典管理">
    <!-- 搜索和工具栏区域 -->
    <el-card
      shadow="never"
      class="search-card"
    >
      <div class="search-toolbar">
        <div class="search-area">
          <el-input
            v-model="keyword"
            placeholder="请输入字典分类、字典或字典项的名称、代码"
            clearable
            style="width: 320px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button
            type="primary"
            :icon="Search"
            @click="handleSearch"
          >
            搜索
          </el-button>
          <el-button
            :icon="Refresh"
            @click="handleReset"
          >
            重置
          </el-button>
        </div>

        <div class="action-buttons">
          <el-dropdown @command="handleDropdownCommand">
            <el-button
              type="primary"
              :icon="Plus"
            >
              新增<el-icon class="el-icon--right">
                <ArrowDown />
              </el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="addCategory">
                  新增分类
                </el-dropdown-item>
                <el-dropdown-item
                  command="addDict"
                  :disabled="!selectedNode || selectedNode.level !== 1"
                >
                  新增字典
                </el-dropdown-item>
                <el-dropdown-item
                  command="addItem"
                  :disabled="!selectedNode || selectedNode.level !== 2"
                >
                  新增字典项
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button
            type="primary"
            :icon="Edit"
            :disabled="!selectedNode"
            @click="handleEdit"
          >
            编辑
          </el-button>
          <el-button
            type="danger"
            :icon="Delete"
            :disabled="!selectedNode"
            @click="handleDelete"
          >
            删除
          </el-button>
          <el-button
            :icon="Download"
            @click="handleExport"
          >
            导出
          </el-button>
          <el-button
            :icon="RefreshRight"
            @click="handleRefresh"
          >
            刷新
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 字典树和详情区域 -->
    <el-card
      shadow="never"
      class="main-card"
    >
      <el-row :gutter="20">
        <el-col :span="6">
          <DictTree
            :tree-data="treeData"
            :loading="loading"
            @select="handleNodeSelect"
            @contextmenu="handleNodeContextMenu"
          />
        </el-col>
        <el-col :span="18">
          <DictDetail
            :node="selectedNode"
            :category-name="categoryName"
            :dict-name="dictName"
            @edit="handleEdit"
          />
        </el-col>
      </el-row>
    </el-card>

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
        <span>新增子节点</span>
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
import {
  Search,
  Refresh,
  Plus,
  Delete,
  Download,
  RefreshRight,
  Edit,
  ArrowDown,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { PageContainer } from '@/app/components'
import DictTree from './DictTree.vue'
import DictDetail from './DictDetail.vue'
import DictFormDrawer from './DictFormDrawer.vue'
import { useDictTree, type DictTreeNode } from './hooks/useDictTree'

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

const handleSearch = () => load()
const handleReset = () => {
  keyword.value = ''
  load()
}
const handleRefresh = () => load()
const handleExport = () => ElMessage.info('导出功能开发中...')

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

const handleDropdownCommand = (cmd: string) => {
  if (cmd === 'addCategory') {
    startAdd({ level: 0 })
  } else if (cmd === 'addDict') {
    if (!selectedNode.value || selectedNode.value.level !== 1) {
      ElMessage.warning('请先选择一个字典分类')
      return
    }
    startAdd(selectedNode.value)
  } else if (cmd === 'addItem') {
    if (!selectedNode.value || selectedNode.value.level !== 2) {
      ElMessage.warning('请先选择一个字典')
      return
    }
    startAdd(selectedNode.value)
  }
}

const handleContextMenuAdd = () => {
  closeContextMenu()
  if (!contextMenuNode.value) return
  if (contextMenuNode.value.level === 1) {
    startAdd(contextMenuNode.value)
  } else if (contextMenuNode.value.level === 2) {
    startAdd(contextMenuNode.value)
  }
}

const handleContextMenuEdit = () => {
  closeContextMenu()
  if (!contextMenuNode.value) return
  startEdit(contextMenuNode.value)
}

const handleContextMenuDelete = async () => {
  closeContextMenu()
  if (!contextMenuNode.value) return
  await deleteNode(contextMenuNode.value)
}

const handleEdit = (node?: DictTreeNode) => {
  const target = node || selectedNode.value
  if (!target) {
    ElMessage.warning('请先选择一个节点')
    return
  }
  startEdit(target)
}

const deleteNode = async (node: DictTreeNode) => {
  const typeMap: Record<number, string> = { 1: '分类', 2: '字典', 3: '字典项' }
  try {
    await ElMessageBox.confirm(
      `确定要删除该${typeMap[node.level]}吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    await remove(node)
  } catch {
    ElMessage.info('已取消删除')
  }
}

const handleDelete = async () => {
  if (!selectedNode.value) return
  await deleteNode(selectedNode.value)
}

const handleSubmit = async () => {
  await submit()
}
</script>

<style scoped>
.search-card {
  margin-bottom: 16px;
}

.search-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.search-area {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.main-card {
  margin-bottom: 16px;
}

.context-menu {
  position: fixed;
  z-index: 3000;
  min-width: 140px;
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
}

.context-menu-item:hover {
  background-color: var(--el-fill-color-light);
}

.context-menu-item.danger:hover {
  color: var(--el-color-danger);
}

@media (max-width: 768px) {
  .search-toolbar,
  .search-area {
    flex-direction: column;
    align-items: stretch;
  }
  .action-buttons {
    justify-content: space-between;
  }
}
</style>
