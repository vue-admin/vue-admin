<template>
  <el-menu-item
    v-if="!hasChildren && m.data.meta?.['showMenu'] !== false"
    :key="m.data.path"
    :index="m.data.path"
  >
    <el-icon v-if="m.data.meta?.['icon']">
      <component :is="m.data.meta?.['icon']" />
    </el-icon>
    <template #title>
      {{ ' ' + m.data.meta?.['title'] }}
    </template>
  </el-menu-item>
  <el-sub-menu
    v-else-if="m.data.meta?.['showMenu'] !== false"
    :index="m.data.path"
  >
    <template #title>
      <el-icon v-if="m.data.meta?.['icon']">
        <component :is="m.data.meta?.['icon']" />
      </el-icon>
      <span> {{ m.data.meta?.['title'] }} </span>
    </template>
    <MenuItem
      v-for="item in m.data.children"
      :key="item.path"
      :data="item"
    />
  </el-sub-menu>
</template>
<script lang="ts" setup>
import { computed } from 'vue'
import type { MenuDTO } from '@/lib/router/types-menu'

const props = defineProps<{ data: MenuDTO }>()
const m = props

const hasChildren = computed(() => {
  return Boolean(m.data.children && m.data.children.length > 0)
})
</script>
