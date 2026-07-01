<template>
  <SearchTable
    title="操作日志"
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
        placeholder="用户名或模块"
        clearable
        style="width: 200px"
        @keyup.enter="handleSearch"
      />
      <el-select
        v-model="searchForm.status"
        clearable
        placeholder="状态"
        style="width: 120px"
      >
        <el-option
          label="成功"
          value="success"
        />
        <el-option
          label="失败"
          value="failed"
        />
      </el-select>
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        style="width: 260px"
        @change="handleDateChange"
      />
    </template>

    <template #actions>
      <el-button
        type="danger"
        :icon="Delete"
        :disabled="selectedRows.length === 0"
        @click="handleBatchDelete"
      >
        批量删除
      </el-button>
      <el-button
        type="warning"
        :icon="Delete"
        @click="handleClear"
      >
        清空日志
      </el-button>
      <el-button
        :icon="Download"
        @click="handleExport"
      >
        导出
      </el-button>
      <el-button
        :icon="Refresh"
        @click="fetchList"
      >
        刷新
      </el-button>
    </template>

    <template #col-status="{ row }">
      <el-tag
        :type="row.status === 'success' ? 'success' : 'danger'"
        size="small"
      >
        {{ row.status === 'success' ? '成功' : '失败' }}
      </el-tag>
    </template>

    <template #col-time="{ row }">
      {{ row.time }}ms
    </template>

    <template #col-operationTime="{ row }">
      {{ formatDate(row.operationTime) }}
    </template>
  </SearchTable>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { Delete, Refresh, Download } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { SearchTable } from '@/app/components'
import { useCrud } from '@/app/composables/useCrud'
import { formatDate } from '@/lib/format'
import { downloadCsv } from '@/lib/file'
import type { ColumnDef } from '@/app/components/SearchTable/types'
import {
  fetchOperationLogList,
  deleteOperationLog,
  batchDeleteOperationLogs,
  clearOperationLogs,
  exportOperationLogs,
  type OperationLogInfo,
  type LogSearchRequest,
} from '../api'

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
  handleBatchDelete,
} = useCrud<OperationLogInfo>({
  fetch: (params) => fetchOperationLogList(params as unknown as LogSearchRequest),
  remove: deleteOperationLog,
  batchRemove: batchDeleteOperationLogs,
  defaultSearchForm: { keyword: '', status: '', startTime: '', endTime: '' },
  pageSize: 20,
})

const dateRange = ref<[string, string] | null>(null)

const handleDateChange = (dates: [string, string] | null) => {
  const form = searchForm.value as Record<string, unknown>
  if (dates) {
    form.startTime = dates[0]
    form.endTime = dates[1]
  } else {
    form.startTime = ''
    form.endTime = ''
  }
}

const handleClear = async () => {
  await ElMessageBox.confirm('确定要清空所有操作日志吗？', '提示', {
    type: 'warning',
  })
  await clearOperationLogs()
  ElMessage.success('清空成功')
  fetchList()
}

const handleExport = async () => {
  try {
    const csv = await exportOperationLogs()
    downloadCsv(csv, '操作日志.csv')
    ElMessage.success('导出成功')
  } catch {
    ElMessage.error('导出失败')
  }
}

const onSelectionChange = (rows: Record<string, unknown>[]) => {
  handleSelectionChange(rows as unknown as OperationLogInfo[])
}

const tableData = computed(() => listData.value as unknown as Record<string, unknown>[])
const tableSelectedRows = computed(() => selectedRows.value as unknown as Record<string, unknown>[])

const columns: ColumnDef[] = [
  { prop: 'username', label: '用户名', minWidth: 120 },
  { prop: 'module', label: '模块', minWidth: 120 },
  { prop: 'operation', label: '操作', minWidth: 120 },
  { prop: 'method', label: '请求方式', minWidth: 100 },
  { prop: 'ip', label: 'IP地址', minWidth: 140 },
  { prop: 'location', label: '操作地点', minWidth: 150 },
  { prop: 'time', label: '耗时', minWidth: 90, slot: 'time' },
  { prop: 'status', label: '状态', minWidth: 90, slot: 'status' },
  { prop: 'operationTime', label: '操作时间', minWidth: 180, slot: 'operationTime' },
]

onMounted(fetchList)
</script>
