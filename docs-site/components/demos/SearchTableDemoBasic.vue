<template>
  <SearchTable
    :loading="false"
    :data="data"
    :columns="columns"
    :pagination="{ page: 1, size: 10, total: 3 }"
  />
</template>

<script setup>
import SearchTable from '../../../src/app/components/SearchTable/index.vue'

const columns = [
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'name', label: '名称', minWidth: 120 },
  { prop: 'role', label: '角色', width: 120 },
  { prop: 'status', label: '状态', width: 100 }
]

const data = [
  { id: 1, name: '管理员', role: 'super_admin', status: '启用' },
  { id: 2, name: '张三', role: 'admin', status: '启用' },
  { id: 3, name: '李四', role: 'user', status: '禁用' }
]
</script>
