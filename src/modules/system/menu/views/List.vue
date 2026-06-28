<template>
  <PageContainer title="菜单管理">
    <template #header>
      <el-button
        type="primary"
        :icon="Plus"
        @click="openDrawer('add', null)"
      >
        新增顶级菜单
      </el-button>
      <el-button
        :icon="Refresh"
        @click="loadTree"
      >
        刷新
      </el-button>
    </template>

    <el-card
      v-loading="loading"
      shadow="never"
    >
      <el-tree
        ref="treeRef"
        :data="treeData"
        :props="{ label: 'name', children: 'children' }"
        node-key="id"
        default-expand-all
        draggable
        @node-drop="handleDrop"
      >
        <template #default="{ data }">
          <div class="tree-node">
            <span class="tree-node__label">
              <el-icon v-if="data.icon">
                <component :is="resolveIcon(data.icon)" />
              </el-icon>
              {{ data.name }}
              <el-tag
                size="small"
                :type="data.status === 'active' ? 'success' : 'info'"
              >
                {{ data.status === 'active' ? '启用' : '禁用' }}
              </el-tag>
              <span class="tree-node__path">{{ data.path }}</span>
            </span>
            <span class="tree-node__actions">
              <el-button
                link
                type="primary"
                size="small"
                @click.stop="openDrawer('add', data)"
              >
                新增子菜单
              </el-button>
              <el-button
                link
                type="primary"
                size="small"
                @click.stop="openDrawer('edit', data)"
              >
                编辑
              </el-button>
              <el-button
                link
                type="danger"
                size="small"
                @click.stop="handleDelete(data)"
              >
                删除
              </el-button>
            </span>
          </div>
        </template>
      </el-tree>
    </el-card>

    <MenuFormDrawer
      v-model="drawerVisible"
      :mode="drawerMode"
      :data="editingNode"
      :parent="parentForAdd"
      :tree-data="treeData"
      @success="onFormSuccess"
    />
  </PageContainer>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { Plus, Refresh } from '@element-plus/icons-vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import type { Component } from 'vue'
import { ElMessage } from 'element-plus'
import { confirmService } from '@/lib/confirm'
import type { ElTree } from 'element-plus'
import { PageContainer } from '@/app/components'
import MenuFormDrawer from './MenuFormDrawer.vue'
import {
  fetchMenuTree,
  deleteMenu,
  updateMenuSort,
  type MenuInfo,
} from '../api'

interface TreeNodeDropEvent {
  data: MenuInfo
}

const treeRef = ref<InstanceType<typeof ElTree>>()
const treeData = ref<MenuInfo[]>([])
const loading = ref(false)

const drawerVisible = ref(false)
const drawerMode = ref<'add' | 'edit' | 'view'>('add')
const editingNode = ref<MenuInfo | null>(null)
const parentForAdd = ref<MenuInfo | null>(null)

// 解析图标组件名（Element Plus 图标全局注册）
const resolveIcon = (name: string): Component | null => {
  const icons = ElementPlusIconsVue as unknown as Record<string, Component>
  return icons[name] || null
}

const loadTree = async () => {
  loading.value = true
  try {
    treeData.value = await fetchMenuTree()
  } catch {
    ElMessage.error('加载菜单树失败')
  } finally {
    loading.value = false
  }
}

const openDrawer = (mode: 'add' | 'edit', data: MenuInfo | null) => {
  drawerMode.value = mode
  if (mode === 'add') {
    parentForAdd.value = data
    editingNode.value = null
  } else {
    editingNode.value = data
    parentForAdd.value = null
  }
  drawerVisible.value = true
}

const onFormSuccess = () => {
  drawerVisible.value = false
  loadTree()
}

const handleDelete = async (data: MenuInfo) => {
  const confirmed = await confirmService.showConfirm(
    `确认删除菜单「${data.name}」？子菜单将一并删除。`,
    '提示',
    { confirmButtonText: '确认', cancelButtonText: '取消' }
  )
  if (!confirmed) return
  try {
    await deleteMenu(data.id)
    ElMessage.success('删除成功')
    loadTree()
  } catch {
    ElMessage.error('删除失败')
  }
}

// el-tree node-drop 事件：拖拽完成后回调
const handleDrop = async (
  draggingNode: TreeNodeDropEvent,
  targetNode: TreeNodeDropEvent,
  position: 'before' | 'after' | 'inner'
) => {
  try {
    await updateMenuSort({
      draggingId: draggingNode.data.id,
      targetId: targetNode.data.id,
      position,
    })
    ElMessage.success('排序已更新')
    loadTree()
  } catch {
    ElMessage.error('排序失败')
    loadTree()
  }
}

onMounted(loadTree)
</script>

<style lang="scss" scoped>
.tree-node {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-right: 8px;

  &__label {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__path {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    margin-left: 8px;
  }

  &__actions {
    display: none;
  }
}

:deep(.el-tree-node__content:hover) .tree-node__actions {
  display: inline-flex;
}
</style>
