<template>
  <SearchTable
    title="角色管理"
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
        placeholder="角色名称、代码或描述"
        clearable
        style="width: 220px"
        @keyup.enter="handleSearch"
      />
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
        新增角色
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

    <template #col-status="{ row }">
      <StatusTag :status="row.status" />
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
        type="success"
        size="small"
        @click="openPermissionDrawer(row)"
      >
        权限
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

  <RoleFormDrawer
    v-model="drawerVisible"
    :mode="drawerMode"
    :data="editingRow"
    @success="onFormSuccess"
  />

  <RolePermissionDrawer
    v-model="permissionDrawerVisible"
    :role-id="currentRoleId"
  />
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { Plus, Delete, Refresh } from '@element-plus/icons-vue'
import { SearchTable, StatusTag } from '@/app/components'
import { useCrud } from '@/app/composables/useCrud'
import { formatDate } from '@/lib/format'
import type { ColumnDef } from '@/app/components/SearchTable/types'
import {
  fetchRoleList,
  deleteRole,
  batchDeleteRoles,
  type RoleInfo,
  type RoleSearchRequest,
} from '../../role/api'
import RoleFormDrawer from './RoleFormDrawer.vue'
import RolePermissionDrawer from './RolePermissionDrawer.vue'

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
} = useCrud<RoleInfo>({
  fetch: (params) => fetchRoleList(params as unknown as RoleSearchRequest),
  remove: deleteRole,
  batchRemove: batchDeleteRoles,
  defaultSearchForm: { keyword: '', status: '' },
  pageSize: 10,
})

// SearchTable emit 的 selectionChange 类型是 Record<string, unknown>[]，需断言回 RoleInfo[]
const onSelectionChange = (rows: Record<string, unknown>[]) => {
  handleSelectionChange(rows as unknown as RoleInfo[])
}

// SearchTable 的 data/selectedRows prop 类型是 Record<string, unknown>[]，
// RoleInfo 接口无索引签名，需 unknown 中转断言
const tableData = computed(() => listData.value as unknown as Record<string, unknown>[])
const tableSelectedRows = computed(() => selectedRows.value as unknown as Record<string, unknown>[])

const columns: ColumnDef[] = [
  { prop: 'name', label: '角色名称', minWidth: 140 },
  { prop: 'code', label: '角色代码', minWidth: 140 },
  { prop: 'description', label: '描述', minWidth: 200 },
  { prop: 'status', label: '状态', minWidth: 90, slot: 'status' },
  { prop: 'createTime', label: '创建时间', minWidth: 170, slot: 'createTime' },
  { prop: 'updateTime', label: '更新时间', minWidth: 170, slot: 'updateTime' },
  { prop: 'actions', label: '操作', width: 240, fixed: 'right', slot: 'actions' },
]

const drawerVisible = ref(false)
const drawerMode = ref<'add' | 'edit' | 'view'>('add')
const editingRow = ref<RoleInfo | null>(null)
const permissionDrawerVisible = ref(false)
const currentRoleId = ref<string | null>(null)

const openDrawer = (mode: 'add' | 'edit' | 'view', row?: RoleInfo) => {
  drawerMode.value = mode
  editingRow.value = row ?? null
  drawerVisible.value = true
}

const openPermissionDrawer = (row: RoleInfo) => {
  currentRoleId.value = row.id
  permissionDrawerVisible.value = true
}

const onFormSuccess = () => {
  drawerVisible.value = false
  fetchList()
}

onMounted(fetchList)
</script>
