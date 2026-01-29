<template>
  <el-menu-item v-if="!m.data.children && m.data.meta?.['showMenu'] !== false" :key="m.data.path" :index="m.data.path">
    <el-icon v-if="m.data.meta?.['icon']">
      <component :is="m.data.meta?.['icon']"></component>
    </el-icon>
    <template #title> {{ ' ' + m.data.meta?.['title'] }}</template>
  </el-menu-item>
  <el-sub-menu v-else-if="m.data.meta?.['showMenu'] !== false" :index="m.data.path">
    <template #title>
      <el-icon v-if="m.data.meta?.['icon']">
        <component :is="m.data.meta?.['icon']"></component>
      </el-icon>
      <span> {{ m.data.meta?.['title'] }} </span>
    </template>
    <MenuItem v-for="item in m.data.children" :data="item" />
  </el-sub-menu>
</template>
<script lang="ts" setup>
import { RouteRecordRaw } from 'vue-router'
const m = defineProps<{ data: RouteRecordRaw }>()
</script>
