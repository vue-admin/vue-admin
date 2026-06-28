<template>
  <!-- 搜索和工具栏区域 -->
  <el-card
    shadow="never"
    class="search-card"
  >
    <div class="search-toolbar">
      <!-- 搜索区域 -->
      <div class="search-area">
        <el-input
          v-model="searchForm.keyword"
          placeholder="请输入用户名、姓名、邮箱或电话"
          clearable
          style="width: 200px"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select
          v-model="searchForm.role"
          clearable
          placeholder="角色"
          style="width: 100px"
          @clear="handleSearch"
        >
          <el-option
            label="管理员"
            value="admin"
          />
          <el-option
            label="普通用户"
            value="user"
          />
          <el-option
            label="VIP用户"
            value="vip"
          />
        </el-select>
        <el-select
          v-model="searchForm.status"
          clearable
          placeholder="状态"
          style="width: 100px"
          @clear="handleSearch"
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

      <!-- 操作按钮栏 -->
      <div class="action-buttons">
        <el-button
          type="primary"
          :icon="Plus"
          @click="openDrawer('add')"
        >
          新增用户
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
          :icon="Download"
          @click="handleExport"
        >
          导出
        </el-button>
        <el-button
          :icon="RefreshRight"
          @click="getTableData"
        >
          刷新
        </el-button>
        <el-text
          v-if="selectedRows.length > 0"
          class="selected-info"
        >
          已选择 {{ selectedRows.length }} 项
        </el-text>
      </div>
    </div>
  </el-card>

  <!-- 表格 -->
  <el-card
    shadow="never"
    class="table-card"
  >
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
      <el-table-column
        type="selection"
        width="55"
      />
      <el-table-column
        prop="username"
        label="用户名"
        min-width="120"
        show-overflow-tooltip
      />
      <el-table-column
        prop="realName"
        label="姓名"
        min-width="100"
        show-overflow-tooltip
      />
      <el-table-column
        prop="email"
        label="邮箱"
        min-width="180"
        show-overflow-tooltip
      />
      <el-table-column
        prop="phone"
        label="电话"
        min-width="130"
        show-overflow-tooltip
      />
      <el-table-column
        prop="role"
        label="角色"
        min-width="100"
      >
        <template #default="scope">
          <el-tag
            :type="getRoleType(scope.row.role)"
            size="small"
          >
            {{ getRoleLabel(scope.row.role) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        prop="status"
        label="状态"
        min-width="100"
      >
        <template #default="scope">
          <el-tag
            :type="scope.row.status === 'active' ? 'success' : 'danger'"
            size="small"
          >
            {{ scope.row.status === 'active' ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        prop="createTime"
        label="创建时间"
        min-width="180"
      >
        <template #default="scope">
          {{ formatDate(scope.row.createTime) }}
        </template>
      </el-table-column>
      <el-table-column
        prop="lastLoginTime"
        label="最后登录"
        min-width="180"
      >
        <template #default="scope">
          {{ formatDate(scope.row.lastLoginTime) }}
        </template>
      </el-table-column>
      <el-table-column
        label="操作"
        min-width="180"
        fixed="right"
      >
        <template #default="scope">
          <el-button
            link
            type="primary"
            size="small"
            @click="handleView(scope.row)"
          >
            查看
          </el-button>
          <el-button
            link
            type="primary"
            size="small"
            @click="handleEdit(scope.row)"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            size="small"
            @click="handleDelete(scope.row.id)"
          >
            删除
          </el-button>
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

  <!-- 新增/编辑/查看用户抽屉 -->
  <el-drawer
    v-model="drawerVisible"
    :title="drawerMode === 'add' ? '新增用户' : drawerMode === 'edit' ? '编辑用户' : '查看用户'"
    size="50%"
    :close-on-click-modal="false"
  >
    <el-form
      ref="userFormRef"
      :model="userForm"
      :rules="formRules"
      label-width="100px"
      class="user-form"
      :disabled="drawerMode === 'view'"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item
            label="用户名"
            prop="username"
          >
            <el-input
              v-model="userForm.username"
              placeholder="请输入用户名"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item
            label="姓名"
            prop="realName"
          >
            <el-input
              v-model="userForm.realName"
              placeholder="请输入姓名"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item
            label="邮箱"
            prop="email"
          >
            <el-input
              v-model="userForm.email"
              placeholder="请输入邮箱"
              type="email"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item
            label="电话"
            prop="phone"
          >
            <el-input
              v-model="userForm.phone"
              placeholder="请输入电话"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item
            label="角色"
            prop="role"
          >
            <el-select
              v-model="userForm.role"
              placeholder="请选择角色"
            >
              <el-option
                label="管理员"
                value="admin"
              />
              <el-option
                label="普通用户"
                value="user"
              />
              <el-option
                label="VIP用户"
                value="vip"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item
            label="状态"
            prop="status"
          >
            <el-select
              v-model="userForm.status"
              placeholder="请选择状态"
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
          </el-form-item>
        </el-col>
      </el-row>
      <el-row
        v-if="drawerMode === 'add' || (drawerMode === 'edit' && showPassword)"
        :gutter="20"
      >
        <el-col :span="12">
          <el-form-item
            label="密码"
            prop="password"
          >
            <el-input
              v-model="userForm.password"
              placeholder="请输入密码"
              type="password"
              show-password
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item
            label="确认密码"
            prop="confirmPassword"
          >
            <el-input
              v-model="userForm.confirmPassword"
              placeholder="请确认密码"
              type="password"
              show-password
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row v-if="drawerMode === 'edit'">
        <el-col :span="24">
          <el-form-item>
            <el-checkbox v-model="showPassword">
              修改密码
            </el-checkbox>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item v-if="drawerMode !== 'view'">
        <el-button
          type="primary"
          @click="handleFormSubmit"
        >
          {{ drawerMode === 'add' ? '创建' : '保存' }}
        </el-button>
        <el-button @click="drawerVisible = false">
          取消
        </el-button>
      </el-form-item>
      <el-form-item v-if="drawerMode === 'view'">
        <el-button @click="drawerVisible = false">
          关闭
        </el-button>
      </el-form-item>
    </el-form>
  </el-drawer>
</template>

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
  fetchUserList,
  deleteUser,
  batchDeleteUsers,
  createUser,
  updateUser,
  type UserInfo,
  type UserSearchRequest,
  type UserCreateRequest,
} from '@/apis/user'

// 搜索表单
const searchForm = reactive<UserSearchRequest>({
  keyword: '',
  role: '',
  status: '',
  page: 1,
  size: 10,
})

// 表格数据
const tableData = ref<UserInfo[]>([])
const tableLoading = ref(false)
const selectedRows = ref<UserInfo[]>([])

// 分页
const currentPage4 = ref(1)
const pageSize4 = ref(10)
const totalCount = ref(0)

// 抽屉状态
const drawerVisible = ref(false)
const drawerMode = ref<'add' | 'edit' | 'view'>('add')
const showPassword = ref(false)
const userFormRef = ref<FormInstance>()

// 用户表单数据
const userForm = reactive<UserCreateRequest & { confirmPassword?: string }>({
  username: '',
  realName: '',
  email: '',
  phone: '',
  role: 'user',
  status: 'active',
  password: '',
  confirmPassword: '',
})

// 表单验证规则
const formRules = reactive<FormRules>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度应在3-20个字符之间', trigger: 'blur' },
  ],
  realName: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '姓名长度应在2-20个字符之间', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: ['blur', 'change'] },
  ],
  phone: [
    { required: true, message: '请输入电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号', trigger: ['blur', 'change'] },
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' },
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' },
  ],
  password: [
    { required: drawerMode.value === 'add' || (drawerMode.value === 'edit' && showPassword.value), message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    {
      required: drawerMode.value === 'add' || (drawerMode.value === 'edit' && showPassword.value),
      message: '请确认密码',
      trigger: 'blur',
    },
    {
      validator: (rule, value, callback) => {
        if (value !== userForm.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
})

// 获取表格数据
const getTableData = async () => {
  tableLoading.value = true
  try {
    const res = await fetchUserList({
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
  searchForm.role = ''
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
const handleSelectionChange = (rows: UserInfo[]) => {
  selectedRows.value = rows
}

// 格式化日期
const formatDate = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

// 获取角色类型
const getRoleType = (role: string) => {
  const roleTypes: Record<string, string> = {
    admin: 'danger',
    user: 'info',
    vip: 'success',
  }
  return roleTypes[role] || 'info'
}

// 获取角色标签
const getRoleLabel = (role: string) => {
  const roleLabels: Record<string, string> = {
    admin: '管理员',
    user: '普通用户',
    vip: 'VIP用户',
  }
  return roleLabels[role] || role
}

// 打开抽屉
const openDrawer = (mode: 'add' | 'edit' | 'view', user?: UserInfo) => {
  drawerMode.value = mode
  showPassword.value = false
  // 重置表单
  userForm.username = ''
  userForm.realName = ''
  userForm.email = ''
  userForm.phone = ''
  userForm.role = 'user'
  userForm.status = 'active'
  userForm.password = ''
  userForm.confirmPassword = ''

  if (mode === 'view' && user) {
    // 查看模式
    userForm.username = user.username
    userForm.realName = user.realName
    userForm.email = user.email
    userForm.phone = user.phone
    userForm.role = user.role
    userForm.status = user.status
  } else if (mode === 'edit' && user) {
    // 编辑模式
    userForm.username = user.username
    userForm.realName = user.realName
    userForm.email = user.email
    userForm.phone = user.phone
    userForm.role = user.role
    userForm.status = user.status
  }

  drawerVisible.value = true
}

// 列表行点击处理
const handleView = (user: UserInfo) => {
  openDrawer('view', user)
}

const handleEdit = (user: UserInfo) => {
  openDrawer('edit', user)
}

// 删除操作
const handleDelete = async (id: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这条记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteUser(id)
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
    await batchDeleteUsers(selectedRows.value.map(row => row.id))
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

// TODO: M5+ 抽屉表单组件接入后挂到 emit success
const _handleFormSuccess = () => {
  drawerVisible.value = false
  getTableData()
}

// 表单提交
const handleFormSubmit = async () => {
  if (!userFormRef.value) return

  try {
    await userFormRef.value.validate()

    if (drawerMode.value === 'add') {
      await createUser(userForm)
      ElMessage.success('创建成功')
    } else if (drawerMode.value === 'edit') {
      // 如果不修改密码，移除密码字段
      const submitData = { ...userForm }
      if (!showPassword.value) {
        delete submitData.password
        delete submitData.confirmPassword
      }
      await updateUser(selectedRows.value[0].id, submitData)
      ElMessage.success('更新成功')
    }

    drawerVisible.value = false
    getTableData()
  } catch (error) {
    console.error(error)
  }
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
  .search-area {
    flex-direction: column;
    align-items: stretch;
  }

  .search-area .el-input,
  .search-area .el-select {
    width: 100% !important;
  }

  .action-buttons {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .pagination-wrapper {
    justify-content: center;
  }
}
</style>