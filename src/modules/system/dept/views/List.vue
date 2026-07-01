<template>
  <SearchTable
    title="部门管理"
    :loading="loading"
    :data="tableData"
    :columns="columns"
    :pagination="pagination"
    :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
    default-expand-all
  >
    <template #search>
      <el-input
        v-model="searchForm.keyword"
        placeholder="部门名称"
        clearable
        style="width: 200px"
        @keyup.enter="fetchList"
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
        新增部门
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
        :type="row.status === 'active' ? 'success' : 'danger'"
        size="small"
      >
        {{ row.status === 'active' ? '启用' : '禁用' }}
      </el-tag>
    </template>

    <template #col-createTime="{ row }">
      {{ formatDate(row.createTime) }}
    </template>

    <template #col-actions="{ row }">
      <el-button
        link
        type="primary"
        size="small"
        @click="openDrawer('add', row)"
      >
        新增子部门
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

  <DeptFormDrawer
    v-model="drawerVisible"
    :mode="drawerMode"
    :data="editingRow"
    @success="onFormSuccess"
  />
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { SearchTable } from '@/app/components'
import { formatDate } from '@/lib/format'
import {
  fetchDeptTree,
  deleteDept,
  type DeptInfo,
  type DeptSearchRequest,
} from '../api'
import DeptFormDrawer from './DeptFormDrawer.vue'

const loading = ref(false)
const tableData = ref<DeptInfo[]>([])
const pagination = ref({ page: 1, size: 10, total: 0 })

const searchForm = reactive<DeptSearchRequest>({
  keyword: '',
  status: '',
})

const drawerVisible = ref(false)
const drawerMode = ref<'add' | 'edit'>('add')
const editingRow = ref<DeptInfo | null>(null)

const fetchList = async () => {
  loading.value = true
  try {
    const data = await fetchDeptTree(searchForm)
    tableData.value = data
  } finally {
    loading.value = false
  }
}

const openDrawer = (mode: 'add' | 'edit', row?: DeptInfo) => {
  drawerMode.value = mode
  editingRow.value = row ?? null
  drawerVisible.value = true
}

const onFormSuccess = () => {
  drawerVisible.value = false
  fetchList()
}

const handleDelete = async (id: string) => {
  await ElMessageBox.confirm('确定要删除该部门吗？删除后子部门也会被删除。', '提示', {
    type: 'warning',
  })
  await deleteDept(id)
  ElMessage.success('删除成功')
  fetchList()
}

const columns = [
  { prop: 'name', label: '部门名称', minWidth: 200 },
  { prop: 'leader', label: '负责人', minWidth: 120 },
  { prop: 'phone', label: '联系电话', minWidth: 150 },
  { prop: 'status', label: '状态', minWidth: 100, slot: 'status' },
  { prop: 'sort', label: '排序', minWidth: 100 },
  { prop: 'createTime', label: '创建时间', minWidth: 180, slot: 'createTime' },
  { prop: 'actions', label: '操作', minWidth: 250, slot: 'actions' },
]

onMounted(fetchList)
</script>
