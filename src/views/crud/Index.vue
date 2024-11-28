<template>
  <!-- 表格 header 按钮 -->
  <div style="padding-bottom: 15px">
    <el-button type="primary" @click="drawer = true">新增</el-button>
  </div>
  <!-- 表格 -->
  <el-table
    :data="tableData"
    header-cell-class-name="table-header"
    style="width: 100%"
    border
    stripe
  >
    <el-table-column fixed prop="date" label="Date" width="150" />
    <el-table-column prop="name" label="Name" width="120" />
    <el-table-column prop="state" label="State" width="120" />
    <el-table-column prop="city" label="City" width="120" />
    <el-table-column prop="address" label="Address" width="600" />
    <el-table-column prop="zip" label="Zip" width="120" />
    <el-table-column fixed="right" label="操作" width="120">
      <template #default>
        <el-button link type="primary" size="small">查看</el-button>
        <el-button link type="primary" size="small">编辑</el-button>
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
  <!-- 新增 -->
  <el-drawer v-model="drawer" title="新增用户">
    <span>Hi there!</span>
  </el-drawer>
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
import { ref } from 'vue'
const drawer = ref(false)
const tableData = [
  {
    date: '2016-05-02',
    name: '王小虎',
    province: '上海',
    city: '普陀区',
    address: '上海市普陀区金沙江路 1518 弄',
    zip: 200333
  },
  {
    date: '2016-05-04',
    name: '王小虎',
    province: '上海',
    city: '普陀区',
    address: '上海市普陀区金沙江路 1517 弄',
    zip: 200333
  },
  {
    date: '2016-05-01',
    name: '王小虎',
    province: '上海',
    city: '普陀区',
    address: '上海市普陀区金沙江路 1519 弄',
    zip: 200333
  },
  {
    date: '2016-05-03',
    name: '王小虎',
    province: '上海',
    city: '普陀区',
    address: '上海市普陀区金沙江路 1516 弄',
    zip: 200333
  }
]
const currentPage4 = 1
const pageSize4 = 10
const handleSizeChange = () => {}
const handleCurrentChange = () => {}
</script>
