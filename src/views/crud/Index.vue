<template>
  <div
    style="
      border-bottom: 1px solid #ebeef5;
      margin-bottom: 10px;
      padding-bottom: 10px;
    "
  >
    <el-input
      v-model="input"
      style="width: 360px"
      placeholder="请输入搜索内容"
      clearable
    >
      <template #prepend>
        <el-select
          v-model="select"
          clearable
          placeholder="--请选择分类--"
          style="width: 138px"
        >
          <el-option label="用户" value="1" />
          <el-option label="文档" value="2" />
          <el-option label="案例案例案例案例案例案例案例" value="3" />
        </el-select>
      </template>
      <template #append>
        <el-button :icon="Search" />
      </template>
    </el-input>
  </div>
  <!-- 表格 header 按钮 -->
  <div style="padding-bottom: 15px">
    <el-button type="primary" @click="openDrawer('add')">新增</el-button>
  </div>
  <!-- 表格 -->
  <el-table
    :data="tableData"
    header-cell-class-name="table-header"
    style="width: 100%"
    border
    stripe
  >
    <el-table-column fixed prop="name" label="Name" width="200" />
    <el-table-column prop="city" label="City" width="200" />
    <el-table-column prop="address" label="Address" width="600" />
    <el-table-column prop="zip" label="Zip" width="120" />
    <el-table-column prop="date" label="Date" width="150" />
    <el-table-column fixed="right" label="操作" width="120">
      <template #default="scope">
        <el-button
          link
          type="primary"
          size="small"
          @click="handleView(scope.id)"
          >查看</el-button
        >
        <el-button
          link
          type="primary"
          size="small"
          @click="handleEdit(scope.id)"
          >编辑</el-button
        >
      </template>
    </el-table-column>
  </el-table>
  <!-- 分页 -->
  <el-pagination
    v-model:current-page="currentPage4"
    v-model:page-size="pageSize4"
    :page-sizes="[10, 20, 50, 100, 200]"
    layout="total, prev, pager, next, sizes"
    :total="400"
    @size-change="handleSizeChange"
    @current-change="handleCurrentChange"
    style="padding-top: 15px"
  />
  <!-- 详情 弹窗 -->
  <detail
    v-model:visible="drawerVisible"
    :mode="drawerMode"
    :record-id="selectedId"
  />
</template>

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
.table-header1 {
  background-color: Transparent !important;
}
</style>

<script lang="ts" setup>
import { fetchCrud, item } from '@/apis/crud'
import { ref, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import detail from './detail.vue'
const input = ref('')
const tableData = ref<item[]>([])
const currentPage4 = ref(1)
const pageSize4 = ref(10)
const select = ref('')
onMounted(async () => {
  try {
    const res = await fetchCrud({ name: '123' })
    tableData.value = res.data.records
    currentPage4.value = res.data.current
    pageSize4.value = res.data.size
    console.log(res.data)
  } catch (error) {
    console.error(error)
  }
})
const handleSizeChange = () => {}
const handleCurrentChange = () => {}

// 父组件状态
const drawerVisible = ref(false)
const drawerMode = ref('add')
const selectedId = ref(0)

const openDrawer = (mode: string, id?: number) => {
  drawerMode.value = mode
  id && (selectedId.value = id)
  drawerVisible.value = true
}

// 列表行点击处理
const handleView = (id: number) => {
  openDrawer('view', id)
}

const handleEdit = (id: number) => {
  openDrawer('edit', id)
}
</script>
