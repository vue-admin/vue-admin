<template>
  <PageContainer title="管理员管理">
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
          placeholder="用户名、姓名、邮箱或电话"
          clearable
          style="width: 220px"
          @keyup.enter="handleSearch"
        />
        <el-select
          v-model="searchForm.role"
          clearable
          placeholder="角色"
          style="width: 140px"
        >
          <el-option
            label="超级管理员"
            value="super"
          />
          <el-option
            label="普通管理员"
            value="admin"
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
          新增管理员
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

      <template #col-role="{ row }">
        <el-tag
          :type="row.role === 'super' ? 'danger' : 'warning'"
          size="small"
        >
          {{ row.role === 'super' ? '超级管理员' : '普通管理员' }}
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

      <template #col-lastLoginTime="{ row }">
        {{ formatDate(row.lastLoginTime) }}
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

    <AdminFormDrawer
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
  fetchAdminList,
  deleteAdmin,
  batchDeleteAdmins,
  type AdminInfo,
  type AdminSearchRequest,
} from '../../admin/api'
import AdminFormDrawer from './AdminFormDrawer.vue'

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
} = useCrud<AdminInfo>({
  fetch: (params) => fetchAdminList(params as unknown as AdminSearchRequest),
  remove: deleteAdmin,
  batchRemove: batchDeleteAdmins,
  defaultSearchForm: { keyword: '', role: '', status: '' },
  pageSize: 10,
})

// SearchTable emit 的 selectionChange 类型是 Record<string, unknown>[]，需断言回 AdminInfo[]
const onSelectionChange = (rows: Record<string, unknown>[]) => {
  handleSelectionChange(rows as unknown as AdminInfo[])
}

// SearchTable 的 data/selectedRows prop 类型是 Record<string, unknown>[]，
// AdminInfo 接口无索引签名，需 unknown 中转断言
const tableData = computed(() => listData.value as unknown as Record<string, unknown>[])
const tableSelectedRows = computed(() => selectedRows.value as unknown as Record<string, unknown>[])

const columns: ColumnDef[] = [
  { prop: 'username', label: '用户名', minWidth: 120 },
  { prop: 'realName', label: '姓名', minWidth: 100 },
  { prop: 'email', label: '邮箱', minWidth: 180 },
  { prop: 'phone', label: '电话', minWidth: 130 },
  { prop: 'role', label: '角色', minWidth: 110, slot: 'role' },
  { prop: 'status', label: '状态', minWidth: 90, slot: 'status' },
  { prop: 'createTime', label: '创建时间', minWidth: 170, slot: 'createTime' },
  { prop: 'lastLoginTime', label: '最后登录', minWidth: 170, slot: 'lastLoginTime' },
  { prop: 'actions', label: '操作', width: 200, fixed: 'right', slot: 'actions' },
]

const drawerVisible = ref(false)
const drawerMode = ref<'add' | 'edit' | 'view'>('add')
const editingRow = ref<AdminInfo | null>(null)

const openDrawer = (mode: 'add' | 'edit' | 'view', row?: AdminInfo) => {
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
