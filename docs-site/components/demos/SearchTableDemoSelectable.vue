<template>
  <SearchTable
    :loading="false"
    :data="data"
    :columns="columns"
    :pagination="{ page: 1, size: 10, total: 3 }"
    :selectable="true"
    row-key="id"
  />
</template>

<script setup>
import SearchTable from '../../../src/app/components/SearchTable/index.vue'

const columns = [
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'name', label: '名称', minWidth: 120 },
]

const data = [
  { id: 1, name: '管理员' },
  { id: 2, name: '张三' },
  { id: 3, name: '李四' },
]
</script>
