<template>
  <div class="search-table">
    <el-card
      shadow="never"
      class="search-card"
    >
      <div class="search-toolbar">
        <div class="search-area">
          <slot name="search" />
          <el-button
            type="primary"
            :icon="Search"
            @click="$emit('search')"
          >
            搜索
          </el-button>
          <el-button
            :icon="Refresh"
            @click="$emit('reset')"
          >
            重置
          </el-button>
        </div>
        <div
          v-if="$slots.actions"
          class="action-buttons"
        >
          <slot name="actions" />
        </div>
      </div>
    </el-card>

    <el-card
      shadow="never"
      class="table-card"
    >
      <el-table
        v-loading="loading"
        :data="data"
        :row-key="rowKey"
        border
        stripe
        @selection-change="onSelectionChange"
      >
        <el-table-column
          v-if="selectable"
          type="selection"
          width="48"
        />
        <el-table-column
          v-for="col in columns"
          :key="col.prop"
          :prop="col.prop"
          :label="col.label"
          :width="col.width"
          :min-width="col.minWidth"
          :fixed="col.fixed"
          :align="col.align || 'left'"
          :formatter="col.formatter"
        >
          <template
            v-if="col.slot"
            #default="scope"
          >
            <slot
              :name="`col-${col.slot}`"
              :row="scope.row"
              :index="scope.$index"
            />
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          :current-page="pagination.page"
          :page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="onPageChange"
          @size-change="onSizeChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { Search, Refresh } from '@element-plus/icons-vue'
import type { SearchTableProps } from './types'

const props = withDefaults(defineProps<SearchTableProps>(), {
  selectable: false,
  rowKey: 'id'
})

const emit = defineEmits<{
  search: []
  reset: []
  pageChange: [page: number, size: number]
  selectionChange: [rows: Record<string, unknown>[]]
}>()

const onSelectionChange = (rows: Record<string, unknown>[]) => emit('selectionChange', rows)
const onPageChange = (page: number) => emit('pageChange', page, props.pagination.size)
const onSizeChange = (size: number) => emit('pageChange', 1, size)
</script>

<style lang="scss" scoped>
.search-table {
  .search-card { margin-bottom: 12px; }
  .search-toolbar {
    display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;
  }
  .search-area { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .pagination-wrapper {
    margin-top: 16px; display: flex; justify-content: flex-end;
  }
}
</style>
