<template>
  <PageContainer title="权限管理">
    <SearchTable
      :loading="loading"
      :data="tableData"
      :columns="columns"
      :pagination="pagination"
      :selected-rows="tableSelectedRows"
      selectable
      row-key="id"
      @search="handleSearch"
      @reset="handleReset"
      @page-change="handlePageChange"
      @selection-change="onSelectionChange"
    >
      <template #search>
        <el-input
          v-model="searchForm.keyword"
          placeholder="权限名称、代码或描述"
          clearable
          style="width: 220px"
          @keyup.enter="handleSearch"
        />
        <el-select
          v-model="searchForm.module"
          clearable
          placeholder="模块"
          style="width: 140px"
        >
          <el-option
            label="系统管理"
            value="system"
          />
          <el-option
            label="用户管理"
            value="user"
          />
          <el-option
            label="角色管理"
            value="role"
          />
          <el-option
            label="权限管理"
            value="permission"
          />
          <el-option
            label="字典管理"
            value="dict"
          />
          <el-option
            label="系统配置"
            value="config"
          />
        </el-select>
        <el-select
          v-model="searchForm.status"
          clearable
          placeholder="状态"
          style="width: 120px"
        >
          <el-option
            label="启用"
            value="active"
          />
          <el-option
            label="禁用"
            value="inactive"
          />
        </el-select>
      </template>

      <template #actions>
        <el-button
          type="primary"
          :icon="Plus"
          @click="openDrawer('add')"
        >
          新增权限
        </el-button>
        <el-button
          type="danger"
          :icon="Delete"
          :disabled="selectedRows.length === 0"
          @click="handleBatchDelete"
        >
          批量删除
        </el-button>
        <el-button
          :icon="Refresh"
          @click="fetchList"
        >
          刷新
        </el-button>
      </template>

      <template #col-module="{ row }">
        <el-tag size="small">
          {{ MODULE_LABELS[row.module] || row.module }}
        </el-tag>
      </template>

      <template #col-status="{ row }">
        <el-tag
          :type="row.status === 'active' ? 'success' : 'danger'"
          size="small"
        >
          {{ row.status === 'active' ? '启用' : '禁用' }}
        </el-tag>
      </template>

      <template #col-createTime="{ row }">
        {{ formatDate(row.createTime) }}
      </template>

      <template #col-updateTime="{ row }">
        {{ formatDate(row.updateTime) }}
      </template>

      <template #col-actions="{ row }">
        <el-button
          link
          type="primary"
          size="small"
          @click="openDrawer('view', row)"
        >
          查看
        </el-button>
        <el-button
          link
          type="primary"
          size="small"
          @click="openDrawer('edit', row)"
        >
          编辑
        </el-button>
        <el-button
          link
          type="danger"
          size="small"
          @click="handleDelete(row.id)"
        >
          删除
        </el-button>
      </template>
    </SearchTable>

    <PermissionFormDrawer
      v-model="drawerVisible"
      :mode="drawerMode"
      :data="editingRow"
      @success="onFormSuccess"
    />
  </PageContainer>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { Plus, Delete, Refresh } from '@element-plus/icons-vue'
import { SearchTable, PageContainer } from '@/app/components'
import { useCrud } from '@/app/composables/useCrud'
import type { ColumnDef } from '@/app/components/SearchTable/types'
import {
  fetchPermissionList,
  deletePermission,
  batchDeletePermissions,
  type PermissionInfo,
  type PermissionSearchRequest,
} from '../../permission/api'
import PermissionFormDrawer from './PermissionFormDrawer.vue'

const MODULE_LABELS: Record<string, string> = {
  system: '系统管理',
  user: '用户管理',
  role: '角色管理',
  permission: '权限管理',
  dict: '字典管理',
  config: '系统配置',
}

const {
  listData,
  loading,
  pagination,
  searchForm,
  selectedRows,
  fetchList,
  handleSearch,
  handleReset,
  handlePageChange,
  handleSelectionChange,
  handleDelete,
  handleBatchDelete,
} = useCrud<PermissionInfo>({
  fetch: (params) => fetchPermissionList(params as unknown as PermissionSearchRequest),
  remove: deletePermission,
  batchRemove: batchDeletePermissions,
  defaultSearchForm: { keyword: '', module: '', status: '' },
  pageSize: 10,
})

// SearchTable emit 的 selectionChange 类型是 Record<string, unknown>[]，需断言回 PermissionInfo[]
const onSelectionChange = (rows: Record<string, unknown>[]) => {
  handleSelectionChange(rows as unknown as PermissionInfo[])
}

// SearchTable 的 data/selectedRows prop 类型是 Record<string, unknown>[]，
// PermissionInfo 接口无索引签名，需 unknown 中转断言
const tableData = computed(() => listData.value as unknown as Record<string, unknown>[])
const tableSelectedRows = computed(() => selectedRows.value as unknown as Record<string, unknown>[])

const columns: ColumnDef[] = [
  { prop: 'name', label: '权限名称', minWidth: 140 },
  { prop: 'code', label: '权限代码', minWidth: 140 },
  { prop: 'module', label: '模块', minWidth: 110, slot: 'module' },
  { prop: 'description', label: '描述', minWidth: 200 },
  { prop: 'status', label: '状态', minWidth: 90, slot: 'status' },
  { prop: 'createTime', label: '创建时间', minWidth: 170, slot: 'createTime' },
  { prop: 'updateTime', label: '更新时间', minWidth: 170, slot: 'updateTime' },
  { prop: 'actions', label: '操作', width: 200, fixed: 'right', slot: 'actions' },
]

const drawerVisible = ref(false)
const drawerMode = ref<'add' | 'edit' | 'view'>('add')
const editingRow = ref<PermissionInfo | null>(null)

const openDrawer = (mode: 'add' | 'edit' | 'view', row?: PermissionInfo) => {
  drawerMode.value = mode
  editingRow.value = row ?? null
  drawerVisible.value = true
}

const onFormSuccess = () => {
  drawerVisible.value = false
  fetchList()
}

const formatDate = (date: string): string => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(fetchList)
</script>
