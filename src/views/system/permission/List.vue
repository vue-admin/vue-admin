<template>
  <!-- 搜索和工具栏区域 -->
  <el-card shadow="never" class="search-card">
    <div class="search-toolbar">
      <!-- 搜索区域 -->
      <div class="search-area">
        <el-input
          v-model="searchForm.keyword"
          placeholder="请输入权限名称、代码或描述"
          clearable
          style="width: 200px"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select
          v-model="searchForm.module"
          clearable
          placeholder="模块"
          style="width: 100px"
          @clear="handleSearch"
        >
          <el-option label="系统管理" value="system" />
          <el-option label="用户管理" value="user" />
          <el-option label="角色管理" value="role" />
          <el-option label="权限管理" value="permission" />
          <el-option label="字典管理" value="dict" />
          <el-option label="系统配置" value="config" />
        </el-select>
        <el-select
          v-model="searchForm.status"
          clearable
          placeholder="状态"
          style="width: 100px"
          @clear="handleSearch"
        >
          <el-option label="启用" value="active" />
          <el-option label="禁用" value="inactive" />
        </el-select>
        <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      </div>

      <!-- 操作按钮栏 -->
      <div class="action-buttons">
        <el-button type="primary" :icon="Plus" @click="openDrawer('add')">
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
      <el-table-column prop="name" label="权限名称" min-width="120" show-overflow-tooltip />
      <el-table-column prop="code" label="权限代码" min-width="120" show-overflow-tooltip />
      <el-table-column prop="module" label="模块" min-width="100">
        <template #default="scope">
          <el-tag :type="getModuleType(scope.row.module)" size="small">{{ getModuleName(scope.row.module) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
      <el-table-column prop="status" label="状态" min-width="100">
        <template #default="scope">
          <el-tag
            :type="scope.row.status === 'active' ? 'success' : 'danger'"
            size="small"
          >
            {{ scope.row.status === 'active' ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" min-width="180">
        <template #default="scope">
          {{ formatDate(scope.row.createTime) }}
        </template>
      </el-table-column>
      <el-table-column prop="updateTime" label="更新时间" min-width="180">
        <template #default="scope">
          {{ formatDate(scope.row.updateTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="180" fixed="right">
        <template #default="scope">
          <el-button
            link
            type="primary"
            size="small"
            @click="handleView(scope.row)"
            >查看</el-button
          >
          <el-button
            link
            type="primary"
            size="small"
            @click="handleEdit(scope.row)"
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

  <!-- 新增/编辑/查看权限抽屉 -->
  <el-drawer
    v-model="drawerVisible"
    :title="drawerMode === 'add' ? '新增权限' : drawerMode === 'edit' ? '编辑权限' : '查看权限'"
    size="50%"
    :close-on-click-modal="false"
  >
    <el-form
      ref="permissionFormRef"
      :model="permissionForm"
      :rules="formRules"
      label-width="100px"
      class="permission-form"
      :disabled="drawerMode === 'view'"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="权限名称" prop="name">
            <el-input v-model="permissionForm.name" placeholder="请输入权限名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="权限代码" prop="code">
            <el-input v-model="permissionForm.code" placeholder="请输入权限代码" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="模块" prop="module">
            <el-select v-model="permissionForm.module" placeholder="请选择模块">
              <el-option label="系统管理" value="system" />
              <el-option label="用户管理" value="user" />
              <el-option label="角色管理" value="role" />
              <el-option label="权限管理" value="permission" />
              <el-option label="字典管理" value="dict" />
              <el-option label="系统配置" value="config" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-select v-model="permissionForm.status" placeholder="请选择状态">
              <el-option label="启用" value="active" />
              <el-option label="禁用" value="inactive" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="描述" prop="description">
            <el-input v-model="permissionForm.description" placeholder="请输入权限描述" type="textarea" :rows="3" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item v-if="drawerMode !== 'view'">
        <el-button type="primary" @click="handleFormSubmit">
          {{ drawerMode === 'add' ? '创建' : '保存' }}
        </el-button>
        <el-button @click="drawerVisible = false">取消</el-button>
      </el-form-item>
      <el-form-item v-if="drawerMode === 'view'">
        <el-button @click="drawerVisible = false">关闭</el-button>
      </el-form-item>
    </el-form>
  </el-drawer>
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
import type { FormInstance, FormRules } from 'element-plus'
import {
  fetchPermissionList,
  deletePermission,
  batchDeletePermissions,
  exportPermissions,
  fetchPermissionDetail,
  createPermission,
  updatePermission,
  type PermissionInfo,
  type PermissionSearchRequest,
  type PermissionCreateRequest,
} from '@/apis/permission'

// 搜索表单
const searchForm = reactive<PermissionSearchRequest>({
  keyword: '',
  module: '',
  status: '',
  page: 1,
  size: 10,
})

// 表格数据
const tableData = ref<PermissionInfo[]>([])
const tableLoading = ref(false)
const selectedRows = ref<PermissionInfo[]>([])

// 分页
const currentPage4 = ref(1)
const pageSize4 = ref(10)
const totalCount = ref(0)

// 抽屉状态
const drawerVisible = ref(false)
const drawerMode = ref<'add' | 'edit' | 'view'>('add')

// 权限表单数据
const permissionForm = reactive<PermissionCreateRequest>({
  name: '',
  code: '',
  module: '',
  description: '',
  status: 'active',
})

// 表单验证规则
const formRules = reactive<FormRules>({
  name: [
    { required: true, message: '请输入权限名称', trigger: 'blur' },
    { min: 2, max: 20, message: '权限名称长度应在2-20个字符之间', trigger: 'blur' },
  ],
  code: [
    { required: true, message: '请输入权限代码', trigger: 'blur' },
    { min: 2, max: 20, message: '权限代码长度应在2-20个字符之间', trigger: 'blur' },
  ],
  module: [
    { required: true, message: '请选择模块', trigger: 'change' },
  ],
  description: [
    { max: 200, message: '描述长度不能超过200个字符', trigger: 'blur' },
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' },
  ],
})

// 获取表格数据
const getTableData = async () => {
  tableLoading.value = true
  try {
    const res = await fetchPermissionList({
      ...searchForm,
      page: currentPage4.value,
      size: pageSize4.value,
    })
    tableData.value = res.data.records
    totalCount.value = res.data.total
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
  searchForm.module = ''
  searchForm.status = ''
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
const handleSelectionChange = (rows: PermissionInfo[]) => {
  selectedRows.value = rows
}

// 格式化日期
const formatDate = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

// 获取模块类型
const getModuleType = (module: string) => {
  const moduleTypes: Record<string, string> = {
    system: 'primary',
    user: 'success',
    role: 'warning',
    permission: 'info',
    dict: 'danger',
    config: 'primary',
  }
  return moduleTypes[module] || 'info'
}

// 获取模块名称
const getModuleName = (module: string) => {
  const moduleNames: Record<string, string> = {
    system: '系统管理',
    user: '用户管理',
    role: '角色管理',
    permission: '权限管理',
    dict: '字典管理',
    config: '系统配置',
  }
  return moduleNames[module] || module
}

// 打开抽屉
const openDrawer = (mode: 'add' | 'edit' | 'view', permission?: PermissionInfo) => {
  drawerMode.value = mode
  // 重置表单
  permissionForm.name = ''
  permissionForm.code = ''
  permissionForm.module = ''
  permissionForm.description = ''
  permissionForm.status = 'active'

  if (mode === 'view' && permission) {
    // 查看模式
    permissionForm.name = permission.name
    permissionForm.code = permission.code
    permissionForm.module = permission.module
    permissionForm.description = permission.description
    permissionForm.status = permission.status
  } else if (mode === 'edit' && permission) {
    // 编辑模式
    permissionForm.name = permission.name
    permissionForm.code = permission.code
    permissionForm.module = permission.module
    permissionForm.description = permission.description
    permissionForm.status = permission.status
  }

  drawerVisible.value = true
}

// 列表行点击处理
const handleView = (permission: PermissionInfo) => {
  openDrawer('view', permission)
}

const handleEdit = (permission: PermissionInfo) => {
  openDrawer('edit', permission)
}

// 删除操作
const handleDelete = async (id: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这条记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deletePermission(id)
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
    await batchDeletePermissions(selectedRows.value.map(row => row.id))
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

// 表单操作成功回调
const handleFormSuccess = () => {
  drawerVisible.value = false
  getTableData()
}

// 表单提交
const handleFormSubmit = async () => {
  const formRef = (window as any).permissionFormRef
  if (!formRef) return

  try {
    await formRef.validate()

    if (drawerMode.value === 'add') {
      await createPermission(permissionForm)
      ElMessage.success('创建成功')
    } else if (drawerMode.value === 'edit') {
      await updatePermission(selectedRows.value[0].id, permissionForm)
      ElMessage.success('更新成功')
    }

    drawerVisible.value = false
    getTableData()
  } catch (error) {
    console.error(error)
  }
}
</script>