<template>
  <SearchTable
    title="公告管理"
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
        placeholder="公告标题"
        clearable
        style="width: 220px"
        @keyup.enter="handleSearch"
      />
      <el-select
        v-model="searchForm.type"
        clearable
        placeholder="类型"
        style="width: 120px"
      >
        <el-option
          label="公告"
          value="notice"
        />
        <el-option
          label="通知"
          value="notification"
        />
        <el-option
          label="待办"
          value="todo"
        />
      </el-select>
      <el-select
        v-model="searchForm.status"
        clearable
        placeholder="状态"
        style="width: 120px"
      >
        <el-option
          label="已发布"
          value="published"
        />
        <el-option
          label="草稿"
          value="draft"
        />
        <el-option
          label="已撤销"
          value="revoked"
        />
      </el-select>
    </template>

    <template #actions>
      <el-button
        type="primary"
        :icon="Plus"
        @click="openDrawer('add')"
      >
        新增公告
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

    <template #col-type="{ row }">
      <el-tag
        :type="row.type === 'notice' ? 'danger' : row.type === 'notification' ? 'warning' : 'info'"
        size="small"
      >
        {{ row.type === 'notice' ? '公告' : row.type === 'notification' ? '通知' : '待办' }}
      </el-tag>
    </template>

    <template #col-status="{ row }">
      <el-tag
        :type="row.status === 'published' ? 'success' : row.status === 'draft' ? 'info' : 'danger'"
        size="small"
      >
        {{ row.status === 'published' ? '已发布' : row.status === 'draft' ? '草稿' : '已撤销' }}
      </el-tag>
    </template>

    <template #col-priority="{ row }">
      <el-tag
        :type="row.priority === 'high' ? 'danger' : row.priority === 'medium' ? 'warning' : 'info'"
        size="small"
      >
        {{ row.priority === 'high' ? '高' : row.priority === 'medium' ? '中' : '低' }}
      </el-tag>
    </template>

    <template #col-publishTime="{ row }">
      {{ formatDate(row.publishTime) }}
    </template>

    <template #col-actions="{ row }">
      <el-button
        v-if="row.status === 'draft'"
        link
        type="success"
        size="small"
        @click="handlePublish(row.id)"
      >
        发布
      </el-button>
      <el-button
        v-if="row.status === 'published'"
        link
        type="warning"
        size="small"
        @click="handleRevoke(row.id)"
      >
        撤销
      </el-button>
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

  <NoticeFormDrawer
    v-model="drawerVisible"
    :mode="drawerMode"
    :data="editingRow"
    @success="onFormSuccess"
  />
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { Plus, Delete, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { SearchTable } from '@/app/components'
import { useCrud } from '@/app/composables/useCrud'
import { formatDate } from '@/lib/format'
import type { ColumnDef } from '@/app/components/SearchTable/types'
import {
  fetchNoticeList,
  deleteNotice,
  batchDeleteNotices,
  publishNotice,
  revokeNotice,
  type NoticeInfo,
  type NoticeSearchRequest,
} from '../api'
import NoticeFormDrawer from './NoticeFormDrawer.vue'

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
} = useCrud<NoticeInfo>({
  fetch: (params) => fetchNoticeList(params as unknown as NoticeSearchRequest),
  remove: deleteNotice,
  batchRemove: batchDeleteNotices,
  defaultSearchForm: { keyword: '', type: '', status: '' },
  pageSize: 10,
})

const onSelectionChange = (rows: Record<string, unknown>[]) => {
  handleSelectionChange(rows as unknown as NoticeInfo[])
}

const tableData = computed(() => listData.value as unknown as Record<string, unknown>[])
const tableSelectedRows = computed(() => selectedRows.value as unknown as Record<string, unknown>[])

const columns: ColumnDef[] = [
  { prop: 'title', label: '标题', minWidth: 240 },
  { prop: 'type', label: '类型', minWidth: 100, slot: 'type' },
  { prop: 'priority', label: '优先级', minWidth: 100, slot: 'priority' },
  { prop: 'status', label: '状态', minWidth: 100, slot: 'status' },
  { prop: 'publisher', label: '发布人', minWidth: 100 },
  { prop: 'publishTime', label: '发布时间', minWidth: 170, slot: 'publishTime' },
  { prop: 'actions', label: '操作', width: 220, fixed: 'right', slot: 'actions' },
]

const drawerVisible = ref(false)
const drawerMode = ref<'add' | 'edit' | 'view'>('add')
const editingRow = ref<NoticeInfo | null>(null)

const openDrawer = (mode: 'add' | 'edit' | 'view', row?: NoticeInfo) => {
  drawerMode.value = mode
  editingRow.value = row ?? null
  drawerVisible.value = true
}

const onFormSuccess = () => {
  drawerVisible.value = false
  fetchList()
}

const handlePublish = async (id: string) => {
  await ElMessageBox.confirm('确定发布该公告吗？', '提示', {
    type: 'warning',
  })
  await publishNotice(id)
  ElMessage.success('发布成功')
  fetchList()
}

const handleRevoke = async (id: string) => {
  await ElMessageBox.confirm('确定撤销该公告吗？', '提示', {
    type: 'warning',
  })
  await revokeNotice(id)
  ElMessage.success('撤销成功')
  fetchList()
}

onMounted(fetchList)
</script>
