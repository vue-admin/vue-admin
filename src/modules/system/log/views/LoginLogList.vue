<template>
  <SearchTable
    title="登录日志"
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
        placeholder="用户名或IP"
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

    <template #col-username="{ row }">
      <el-tag
        :type="row.status === 'success' ? 'success' : 'danger'"
        size="small"
      >
        {{ row.username }}
      </el-tag>
    </template>

    <template #col-status="{ row }">
      <el-tag
        :type="row.status === 'success' ? 'success' : 'danger'"
        size="small"
      >
        {{ row.status === 'success' ? '成功' : '失败' }}
      </el-tag>
    </template>

    <template #col-loginTime="{ row }">
      {{ formatDate(row.loginTime) }}
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
  fetchLoginLogList,
  deleteLoginLog,
  batchDeleteLoginLogs,
  clearLoginLogs,
  exportLoginLogs,
  type LoginLogInfo,
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
} = useCrud<LoginLogInfo>({
  fetch: (params) => fetchLoginLogList(params as unknown as LogSearchRequest),
  remove: deleteLoginLog,
  batchRemove: batchDeleteLoginLogs,
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
  await ElMessageBox.confirm('确定要清空所有登录日志吗？', '提示', {
    type: 'warning',
  })
  await clearLoginLogs()
  ElMessage.success('清空成功')
  fetchList()
}

const handleExport = async () => {
  try {
    const csv = await exportLoginLogs()
    downloadCsv(csv, '登录日志.csv')
    ElMessage.success('导出成功')
  } catch {
    ElMessage.error('导出失败')
  }
}

const onSelectionChange = (rows: Record<string, unknown>[]) => {
  handleSelectionChange(rows as unknown as LoginLogInfo[])
}

const tableData = computed(() => listData.value as unknown as Record<string, unknown>[])
const tableSelectedRows = computed(() => selectedRows.value as unknown as Record<string, unknown>[])

const columns: ColumnDef[] = [
  { prop: 'username', label: '用户名', minWidth: 120, slot: 'username' },
  { prop: 'ip', label: 'IP地址', minWidth: 140 },
  { prop: 'location', label: '登录地点', minWidth: 150 },
  { prop: 'browser', label: '浏览器', minWidth: 140 },
  { prop: 'os', label: '操作系统', minWidth: 120 },
  { prop: 'status', label: '状态', minWidth: 90, slot: 'status' },
  { prop: 'message', label: '提示信息', minWidth: 180 },
  { prop: 'loginTime', label: '登录时间', minWidth: 180, slot: 'loginTime' },
]

onMounted(fetchList)
</script>
