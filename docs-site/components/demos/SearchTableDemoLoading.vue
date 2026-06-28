<template>
  <SearchTable
    :loading="true"
    :data="[]"
    :columns="columns"
    :pagination="{ page: 1, size: 10, total: 0 }"
  />
</template>

<script setup>
import SearchTable from '../../../src/app/components/SearchTable/index.vue'

const columns = [
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'name', label: '名称', minWidth: 120 },
]
</script>
