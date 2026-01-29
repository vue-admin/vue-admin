<template>
  <!-- 搜索和工具栏区域 -->
  <el-card shadow="never" class="search-card">
    <div class="search-toolbar">
      <!-- 搜索区域 -->
      <div class="search-area">
        <el-input
          v-model="searchForm.keyword"
          placeholder="请输入搜索内容"
          clearable
          style="width: 200px"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select
          v-model="searchForm.category"
          clearable
          placeholder="分类"
          style="width: 120px"
          @clear="handleSearch"
        >
          <el-option label="用户" value="1" />
          <el-option label="文档" value="2" />
          <el-option label="案例案例案例案例案例案例案例" value="3" />
        </el-select>
        <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      </div>

      <!-- 操作按钮栏 -->
      <div class="action-buttons">
        <el-button type="primary" :icon="Plus" @click="openDrawer('add')">
          新增
        </el-button>
        <el-button
          type="danger"
          :icon="Delete"
          :disabled="selectedRows.length === 0"
          @click="handleBatchDelete"
        >
          批量删除
        </el-button>
        <el-button :icon="Download" @click="handleExport">导出</el-button>
        <el-button :icon="RefreshRight" @click="getTableData">刷新</el-button>
        <el-text class="selected-info" v-if="selectedRows.length > 0">
          已选择 {{ selectedRows.length }} 项
        </el-text>
      </div>
    </div>
  </el-card>
  <!-- 表格 -->
  <el-card shadow="never" class="table-card">
    <el-table
      :data="tableData"
      header-cell-class-name="table-header"
      style="width: 100%"
      border
      stripe
      row-key="id"
      :loading="tableLoading"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="name" label="姓名" min-width="150" show-overflow-tooltip />
      <el-table-column prop="city" label="城市" min-width="120" show-overflow-tooltip />
      <el-table-column prop="address" label="地址" min-width="300" show-overflow-tooltip />
      <el-table-column prop="zip" label="邮编" min-width="100" />
      <el-table-column prop="date" label="日期" min-width="180">
        <template #default="scope">
          {{ formatDate(scope.row.date) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="180" fixed="right">
        <template #default="scope">
          <el-button
            link
            type="primary"
            size="small"
            @click="handleView(scope.row.id)"
            >查看</el-button
          >
          <el-button
            link
            type="primary"
            size="small"
            @click="handleEdit(scope.row.id)"
            >编辑</el-button
          >
          <el-button
            link
            type="danger"
            size="small"
            @click="handleDelete(scope.row.id)"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="currentPage4"
        v-model:page-size="pageSize4"
        :page-sizes="[10, 20, 50, 100, 200]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="totalCount"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </el-card>
  <!-- 详情 弹窗 -->
  <detail
    v-model:visible="drawerVisible"
    :mode="drawerMode"
    :record-id="selectedId"
    @refresh="getTableData"
    @change-mode="changeDrawerMode"
  />
</template>

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

.search-area .el-input,
.search-area .el-select {
  flex-shrink: 0;
}

.selected-info {
  color: var(--el-color-primary);
  font-weight: 500;
}

.table-card {
  margin-bottom: 16px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.table-header {
  background-color: #f5f7fa !important;
  font-weight: 600;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .search-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-area {
    flex-direction: column;
    align-items: stretch;
  }

  .search-area .el-input,
  .search-area .el-select {
    width: 100% !important;
  }

  .action-buttons {
    justify-content: space-between;
  }

  .pagination-wrapper {
    justify-content: center;
  }
}
</style>

<script lang="ts" setup>
import { fetchCrud, type item } from '@/apis/crud'
import { ref, onMounted, reactive } from 'vue'
import {
  Search,
  Refresh,
  Plus,
  Delete,
  Download,
  RefreshRight,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import detail from './detail.vue'

// 搜索表单
const searchForm = reactive({
  keyword: '',
  category: '',
})

// 表格数据
const tableData = ref<item[]>([])
const tableLoading = ref(false)
const selectedRows = ref<item[]>([])

// 分页
const currentPage4 = ref(1)
const pageSize4 = ref(10)
const totalCount = ref(0)

// 获取表格数据
const getTableData = async () => {
  tableLoading.value = true
  try {
    const res = await fetchCrud({ name: searchForm.keyword })
    tableData.value = res.data.records
    currentPage4.value = res.data.current
    pageSize4.value = res.data.size
    totalCount.value = res.data.total || 400
  } catch (error) {
    console.error(error)
    ElMessage.error('获取数据失败')
  } finally {
    tableLoading.value = false
  }
}

onMounted(() => {
  getTableData()
})

// 搜索
const handleSearch = () => {
  currentPage4.value = 1
  getTableData()
}

// 重置搜索
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.category = ''
  currentPage4.value = 1
  getTableData()
}

// 分页变化
const handleSizeChange = (size: number) => {
  pageSize4.value = size
  getTableData()
}

const handleCurrentChange = (page: number) => {
  currentPage4.value = page
  getTableData()
}

// 表格选择变化
const handleSelectionChange = (rows: item[]) => {
  selectedRows.value = rows
}

// 格式化日期
const formatDate = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

// 详情弹窗
const drawerVisible = ref(false)
const drawerMode = ref<'add' | 'edit' | 'view'>('add')
const selectedId = ref('')

const openDrawer = (mode: 'add' | 'edit' | 'view', id?: string) => {
  drawerMode.value = mode
  selectedId.value = id ?? ''
  drawerVisible.value = true
}

const changeDrawerMode = (mode: string) => {
  if (mode === 'add' || mode === 'edit' || mode === 'view') {
    drawerMode.value = mode
  }
}

// 列表行点击处理
const handleView = (id: string) => {
  openDrawer('view', id)
}

const handleEdit = (id: string) => {
  openDrawer('edit', id)
}

// 删除操作
const handleDelete = async (id: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这条记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    ElMessage.success('删除成功')
    getTableData()
  } catch {
    ElMessage.info('已取消删除')
  }
}

// 批量删除
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 条记录吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    ElMessage.success('删除成功')
    selectedRows.value = []
    getTableData()
  } catch {
    ElMessage.info('已取消删除')
  }
}

// 导出
const handleExport = () => {
  ElMessage.info('导出功能开发中...')
}
</script>
