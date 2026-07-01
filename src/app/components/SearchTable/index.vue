<template>
  <div class="search-table">
    <el-card
      shadow="never"
      class="content-card"
    >
      <!-- 搜索栏 -->
      <div
        v-if="$slots.search"
        class="search-toolbar"
      >
        <div class="search-area">
          <slot name="search" />
          <el-button
            type="primary"
            :icon="Search"
            @click="$emit('search')"
          >
            {{ t('common.action.search') }}
          </el-button>
          <el-button
            :icon="Refresh"
            @click="$emit('reset')"
          >
            {{ t('common.action.reset') }}
          </el-button>
        </div>
      </div>

      <!-- 标题栏 -->
      <div
        v-if="title || $slots.actions || showColumnSettings"
        class="title-toolbar"
      >
        <h3
          v-if="title"
          class="table-title"
        >
          {{ title }}
        </h3>
        <div class="action-buttons">
          <slot name="actions" />
          <el-popover
            v-if="showColumnSettings"
            placement="bottom-end"
            :width="220"
            trigger="click"
          >
            <template #reference>
              <el-button :icon="Setting">
                {{ t('common.table.columnSettings') }}
              </el-button>
            </template>
            <div class="col-settings">
              <div class="col-settings-header">
                <span>{{ t('common.table.visibleFields') }}</span>
                <el-button
                  v-if="hasHidden"
                  link
                  type="primary"
                  @click="showAll"
                >
                  {{ t('common.table.showAll') }}
                </el-button>
              </div>
              <el-checkbox-group v-model="visibleProps">
                <div
                  v-for="col in hideableColumns"
                  :key="col.prop"
                  class="col-settings-item"
                >
                  <el-checkbox :value="col.prop">
                    {{ col.label }}
                  </el-checkbox>
                </div>
              </el-checkbox-group>
            </div>
          </el-popover>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="data"
        :row-key="rowKey"
        :tree-props="treeProps"
        :default-expand-all="defaultExpandAll"
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
          v-for="col in visibleColumns"
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
import { computed, ref, watch } from 'vue'
import { t } from '@/lib/i18n'
import { Search, Refresh, Setting } from '@element-plus/icons-vue'
import type { SearchTableProps } from './types'

const props = withDefaults(defineProps<SearchTableProps>(), {
  selectable: false,
  rowKey: 'id',
  showColumnSettings: true,
})

const emit = defineEmits<{
  search: []
  reset: []
  pageChange: [page: number, size: number]
  selectionChange: [rows: Record<string, unknown>[]]
}>()

// 可被隐藏的列：hideable !== false
const hideableColumns = computed(() =>
  props.columns.filter((c) => c.hideable !== false)
)

const STORAGE_PREFIX = 'search-table:cols:'

const defaultVisible = (): string[] =>
  props.columns
    .filter((c) => c.hideable !== false && c.defaultHidden !== true)
    .map((c) => c.prop)

const loadStored = (): string[] | null => {
  if (!props.columnSettingsKey) return null
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + props.columnSettingsKey)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.every((p) => typeof p === 'string')) {
      // 过滤掉已删除的 prop，保留仍存在的
      const validSet = new Set(hideableColumns.value.map((c) => c.prop))
      return parsed.filter((p) => validSet.has(p))
    }
  } catch {
    /* ignore corrupt storage */
  }
  return null
}

const visibleProps = ref<string[]>(loadStored() ?? defaultVisible())

watch(visibleProps, (val) => {
  if (!props.columnSettingsKey) return
  try {
    localStorage.setItem(
      STORAGE_PREFIX + props.columnSettingsKey,
      JSON.stringify(val)
    )
  } catch {
    /* ignore quota errors */
  }
})

// 列表变化时同步：新列默认显示，已删列移除
watch(
  () => hideableColumns.value.map((c) => c.prop).join('|'),
  () => {
    const validSet = new Set(hideableColumns.value.map((c) => c.prop))
    const current = new Set(visibleProps.value)
    // 加入新增的可隐藏列
    for (const c of hideableColumns.value) {
      if (!current.has(c.prop) && c.defaultHidden !== true) {
        visibleProps.value = [...visibleProps.value, c.prop]
        return
      }
    }
    // 移除已不存在但还在 visibleProps 的项
    const cleaned = visibleProps.value.filter((p) => validSet.has(p))
    if (cleaned.length !== visibleProps.value.length) {
      visibleProps.value = cleaned
    }
  }
)

const visibleSet = computed(() => new Set(visibleProps.value))

// 保持 columns 原始顺序，过滤出当前应显示的列：
// 1) hideable===false 的列强制显示；2) 否则按 visibleProps 判断
const visibleColumns = computed(() =>
  props.columns.filter(
    (c) => c.hideable === false || visibleSet.value.has(c.prop)
  )
)

const hasHidden = computed(
  () => hideableColumns.value.some((c) => !visibleSet.value.has(c.prop))
)

const showAll = () => {
  visibleProps.value = hideableColumns.value.map((c) => c.prop)
}

const onSelectionChange = (rows: Record<string, unknown>[]) =>
  emit('selectionChange', rows)
const onPageChange = (page: number) =>
  emit('pageChange', page, props.pagination.size)
const onSizeChange = (size: number) => emit('pageChange', 1, size)
</script>

<style lang="scss" scoped>
.search-table {
  .content-card {
    .search-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      padding-bottom: 12px;
      margin-bottom: 12px;
      border-bottom: 1px solid var(--el-border-color-lighter);
    }
    .search-area {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .title-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      .table-title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }
      .action-buttons {
        display: flex;
        gap: 8px;
      }
    }
    .pagination-wrapper {
      margin-top: 16px;
      display: flex;
      justify-content: flex-end;
    }
  }
}

.col-settings {
  max-height: 320px;
  overflow-y: auto;

  .col-settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    padding-bottom: 8px;
    margin-bottom: 8px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .col-settings-item {
    padding: 4px 0;
  }
}
</style>
