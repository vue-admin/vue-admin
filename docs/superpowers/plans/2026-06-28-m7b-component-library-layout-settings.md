# M7-B 通用组件库 + Layout 配置中心实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建 SearchTable / FormDrawer / PageContainer 三件套 + useCrud composable，让 CRUD 页面从 800 行降到 200 行；建 layout 配置中心（store + SettingsDrawer），支持 TagsView/Breadcrumb/Logo/Footer 显隐 + 主题色 + 组件大小；试点重构 user/List.vue 验证抽象。

**Architecture:** 12 步 TDD 节奏。先建 composable 与组件（带单测），再试点重构验证，再做 layout 配置中心，最后扩展 smoke + 同步文档。每步独立 commit + smoke 验证。

**Tech Stack:** Vue 3.5 + setup / Element Plus 2.11 / Pinia 2.2 / VueUse 11 / TypeScript 5.9 / Vitest 1.6 / Playwright 1.61

## Global Constraints

- Node 必须是 v22.22.0（husky lint-staged 依赖 listr2 要求 Node 22+）
- 包管理器 pnpm 9.15.0，仓库根目录 `/Users/wangtao/data/github.com/vue-admin/vue-admin`
- 业务路径白名单：`@/lib/*` `@/app/*` `@/modules/<domain>/*` `@/layout/*`，禁止 `@/apis` `@/stores` `@/utils` `@/components`（M7-A 已强制）
- HTTP 客户端统一用 `@/lib/http/client` 的 `http` / `api`
- Store 必须 setup 风格：`defineStore('<domain>', () => {...})`
- 响应式解构必须 `storeToRefs`
- 测试账号：admin/123456（super_admin）
- dev server 启停（smoke 验证用）：
  - 启：`nohup pnpm dev --host 127.0.0.1 --strictPort > /tmp/vite-dev.log 2>&1 &`
  - 等待：`for i in $(seq 1 30); do curl -sf http://127.0.0.1:5173/ > /dev/null && break; sleep 1; done`
  - 跑：`pnpm smoke`
  - 关：`lsof -ti:5173 | xargs kill 2>/dev/null || true`
- commit 时如 husky 报 Node 21 错，用 `PATH="/Users/wangtao/.nvm/versions/node/v22.22.0/bin:$PATH" git commit ...`

---

## Task 1: 建目录骨架 + 导出占位

**Files:**

- Create: `src/app/components/index.ts`
- Create: `src/app/components/SearchTable/index.vue`（占位）
- Create: `src/app/components/FormDrawer/index.vue`（占位）
- Create: `src/app/components/PageContainer/index.vue`（占位）
- Create: `src/app/composables/index.ts`
- Create: `src/app/composables/useCrud.ts`（占位）

**Interfaces:**

- Produces: `@/app/components` 与 `@/app/composables` 路径别名可用，导出占位符号

- [ ] **Step 1: 创建目录与占位文件**

`src/app/components/index.ts`:

```ts
export { default as SearchTable } from './SearchTable/index.vue'
export { default as FormDrawer } from './FormDrawer/index.vue'
export { default as PageContainer } from './PageContainer/index.vue'
```

`src/app/components/SearchTable/index.vue`（占位）:

```vue
<template>
  <div class="search-table-placeholder">SearchTable (待实现)</div>
</template>

<script lang="ts" setup>
// Task 3 实现
</script>
```

`src/app/components/FormDrawer/index.vue`（占位）:

```vue
<template>
  <div>FormDrawer (待实现)</div>
</template>

<script lang="ts" setup>
// Task 4 实现
</script>
```

`src/app/components/PageContainer/index.vue`（占位）:

```vue
<template>
  <div class="page-container-placeholder">
    <slot />
  </div>
</template>

<script lang="ts" setup>
// Task 3 实现
</script>
```

`src/app/composables/index.ts`:

```ts
export { useCrud } from './useCrud'
```

`src/app/composables/useCrud.ts`（占位）:

```ts
// Task 2 实现
export function useCrud() {
  throw new Error('useCrud not implemented')
}
```

- [ ] **Step 2: 验证**

```bash
pnpm type-check && pnpm lint
```

- [ ] **Step 3: Commit**

```bash
git add src/app/components src/app/composables
git commit -m "feat(app): scaffold app/components and app/composables directories"
```

---

## Task 2: useCrud composable + 单测

**Files:**

- Modify: `src/app/composables/useCrud.ts`（完整实现）
- Create: `test/app/composables/useCrud.spec.ts`

**Interfaces:**

- Produces: `useCrud<T>(options)` 返回 `{ listData, loading, pagination, searchForm, selectedRows, fetchList, handleSearch, handleReset, handlePageChange, handleSelectionChange, handleDelete, handleBatchDelete }`

- [ ] **Step 1: 写失败测试 `test/app/composables/useCrud.spec.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCrud } from '@/app/composables/useCrud'

interface TestItem {
  id: string
  name: string
}

describe('useCrud', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('fetchList 加载数据并更新 pagination.total', async () => {
    const fetch = vi.fn().mockResolvedValue({
      records: [{ id: '1', name: 'a' }],
      total: 1,
      current: 1,
      size: 10
    })
    const { listData, loading, pagination, fetchList } = useCrud<TestItem>({
      fetch
    })

    expect(loading.value).toBe(false)
    const promise = fetchList()
    expect(loading.value).toBe(true)
    await promise

    expect(loading.value).toBe(false)
    expect(listData.value).toHaveLength(1)
    expect(listData.value[0].name).toBe('a')
    expect(pagination.total).toBe(1)
    expect(fetch).toHaveBeenCalledWith({
      page: 1,
      size: 10,
      keyword: undefined,
      role: undefined,
      status: undefined
    })
  })

  it('handleSearch 重置 page 到 1 后 fetchList', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({ records: [], total: 0, current: 1, size: 10 })
    const { pagination, handleSearch } = useCrud<TestItem>({ fetch })

    pagination.page = 3
    await handleSearch()
    expect(pagination.page).toBe(1)
    expect(fetch).toHaveBeenCalled()
  })

  it('handleReset 清空 searchForm 并重置 page', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({ records: [], total: 0, current: 1, size: 10 })
    const { searchForm, pagination, handleReset } = useCrud<TestItem>({
      fetch,
      defaultSearchForm: { keyword: '', role: '' }
    })

    searchForm.keyword = 'abc'
    pagination.page = 3
    await handleReset()

    expect(searchForm.keyword).toBe('')
    expect(pagination.page).toBe(1)
  })

  it('handleDelete 调 remove 并刷新列表', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({ records: [], total: 0, current: 1, size: 10 })
    const remove = vi.fn().mockResolvedValue(undefined)
    const { handleDelete, fetchList } = useCrud<TestItem>({ fetch, remove })
    const spy = vi.spyOn({ fetchList }, 'fetchList')

    // mock ElMessageBox.confirm
    vi.mock('element-plus', () => ({
      ElMessageBox: { confirm: vi.fn().mockResolvedValue('confirm') },
      ElMessage: { success: vi.fn() }
    }))

    await handleDelete('1')
    expect(remove).toHaveBeenCalledWith('1')
  })

  it('handleBatchDelete 调 batchRemove with selectedRows ids', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({ records: [], total: 0, current: 1, size: 10 })
    const batchRemove = vi.fn().mockResolvedValue(undefined)
    const { selectedRows, handleBatchDelete } = useCrud<TestItem>({
      fetch,
      batchRemove
    })

    selectedRows.value = [
      { id: '1', name: 'a' },
      { id: '2', name: 'b' }
    ]

    vi.mock('element-plus', () => ({
      ElMessageBox: { confirm: vi.fn().mockResolvedValue('confirm') },
      ElMessage: { success: vi.fn() }
    }))

    await handleBatchDelete()
    expect(batchRemove).toHaveBeenCalledWith(['1', '2'])
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
pnpm test useCrud
```

Expected: FAIL（useCrud 是占位 throw）

- [ ] **Step 3: 实现 useCrud**

`src/app/composables/useCrud.ts`:

```ts
import { ref, reactive } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'

export interface UseCrudOptions<T> {
  fetch: (
    params: any
  ) => Promise<{ records: T[]; total: number; current: number; size: number }>
  remove?: (id: string) => Promise<any>
  batchRemove?: (ids: string[]) => Promise<any>
  defaultSearchForm?: Record<string, any>
  pageSize?: number
}

export function useCrud<T extends { id: string }>(options: UseCrudOptions<T>) {
  const {
    fetch,
    remove,
    batchRemove,
    defaultSearchForm = {},
    pageSize = 10
  } = options

  const listData = ref<T[]>([]) as Ref<T[]>
  const loading = ref(false)
  const pagination = reactive({
    page: 1,
    size: pageSize,
    total: 0
  })
  const searchForm = reactive<Record<string, any>>({ ...defaultSearchForm })
  const selectedRows = ref<T[]>([]) as Ref<T[]>

  const fetchList = async () => {
    loading.value = true
    try {
      const params = {
        page: pagination.page,
        size: pagination.size,
        ...searchForm
      }
      const res = await fetch(params)
      listData.value = res.records
      pagination.total = res.total
    } catch (e) {
      // 错误由 http 拦截器提示，这里不重复处理
    } finally {
      loading.value = false
    }
  }

  const handleSearch = () => {
    pagination.page = 1
    return fetchList()
  }

  const handleReset = () => {
    Object.keys(searchForm).forEach((key) => {
      searchForm[key] = defaultSearchForm[key] ?? ''
    })
    pagination.page = 1
    return fetchList()
  }

  const handlePageChange = (page: number, size: number) => {
    pagination.page = page
    pagination.size = size
    return fetchList()
  }

  const handleSelectionChange = (rows: T[]) => {
    selectedRows.value = rows
  }

  const handleDelete = async (id: string) => {
    if (!remove) throw new Error('useCrud: remove not provided')
    try {
      await ElMessageBox.confirm('确认删除该记录？', '提示', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch {
      return // 用户取消
    }
    await remove(id)
    ElMessage.success('删除成功')
    await fetchList()
  }

  const handleBatchDelete = async () => {
    if (!batchRemove) throw new Error('useCrud: batchRemove not provided')
    if (selectedRows.value.length === 0) {
      ElMessage.warning('请先选择记录')
      return
    }
    try {
      await ElMessageBox.confirm(
        `确认删除选中的 ${selectedRows.value.length} 条记录？`,
        '提示',
        { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }
      )
    } catch {
      return
    }
    const ids = selectedRows.value.map((r) => r.id)
    await batchRemove(ids)
    ElMessage.success('批量删除成功')
    selectedRows.value = []
    await fetchList()
  }

  return {
    listData,
    loading,
    pagination,
    searchForm,
    selectedRows,
    fetchList,
    handleSearch,
    handleReset,
    handlePageChange,
    handleSelectionChange,
    handleDelete,
    handleBatchDelete
  }
}
```

注意：`Ref` 类型从 vue 自动导入（项目配了 unplugin-auto-import）；如未自动导入需 `import { ref, reactive, type Ref } from 'vue'`。

- [ ] **Step 4: 运行测试确认通过**

```bash
pnpm test useCrud
```

Expected: 5 passed

- [ ] **Step 5: 验证全套**

```bash
pnpm type-check && pnpm lint && pnpm test
```

- [ ] **Step 6: Commit**

```bash
git add src/app/composables/useCrud.ts test/app/composables/useCrud.spec.ts
git commit -m "feat(composables): add useCrud composable with CRUD lifecycle and tests"
```

---

## Task 3: PageContainer + SearchTable 组件 + 单测

**Files:**

- Modify: `src/app/components/PageContainer/index.vue`（完整实现）
- Modify: `src/app/components/SearchTable/index.vue`（完整实现）
- Create: `src/app/components/SearchTable/types.ts`
- Create: `test/app/components/SearchTable.spec.ts`

**Interfaces:**

- Produces: `<PageContainer title="..." />` 与 `<SearchTable :loading :data :columns :pagination ... />` 可用

- [ ] **Step 1: 写 SearchTable types**

`src/app/components/SearchTable/types.ts`:

```ts
export interface ColumnDef {
  prop: string
  label: string
  width?: number | string
  minWidth?: number | string
  fixed?: 'left' | 'right'
  align?: 'left' | 'center' | 'right'
  slot?: string
  formatter?: (row: any, col: any, value: any) => string
}

export interface SearchTableProps {
  loading: boolean
  data: any[]
  columns: ColumnDef[]
  pagination: { page: number; size: number; total: number }
  selectedRows?: any[]
  selectable?: boolean
  rowKey?: string
}
```

- [ ] **Step 2: 实现 PageContainer**

`src/app/components/PageContainer/index.vue`:

```vue
<template>
  <div class="page-container">
    <el-card v-if="title || $slots.header" shadow="never" class="page-header">
      <div class="page-header__inner">
        <h3 v-if="title" class="page-title">{{ title }}</h3>
        <div class="page-header__extra">
          <slot name="header" />
        </div>
      </div>
    </el-card>
    <el-card shadow="never" class="page-body">
      <slot />
    </el-card>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  title?: string
}>()
</script>

<style lang="scss" scoped>
.page-container {
  .page-header {
    margin-bottom: 12px;
    .page-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }
    .page-header__inner {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
}
</style>
```

- [ ] **Step 3: 实现 SearchTable**

`src/app/components/SearchTable/index.vue`:

```vue
<template>
  <div class="search-table">
    <el-card shadow="never" class="search-card">
      <div class="search-toolbar">
        <div class="search-area">
          <slot name="search" />
          <el-button type="primary" :icon="Search" @click="$emit('search')"
            >搜索</el-button
          >
          <el-button :icon="Refresh" @click="$emit('reset')">重置</el-button>
        </div>
        <div v-if="$slots.actions" class="action-buttons">
          <slot name="actions" />
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="table-card">
      <el-table
        v-loading="loading"
        :data="data"
        :row-key="rowKey"
        border
        stripe
        @selection-change="onSelectionChange"
      >
        <el-table-column v-if="selectable" type="selection" width="48" />
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
          <template v-if="col.slot" #default="scope">
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
  selectionChange: [rows: any[]]
}>()

const onSelectionChange = (rows: any[]) => emit('selectionChange', rows)
const onPageChange = (page: number) =>
  emit('pageChange', page, props.pagination.size)
const onSizeChange = (size: number) => emit('pageChange', 1, size)
</script>

<style lang="scss" scoped>
.search-table {
  .search-card {
    margin-bottom: 12px;
  }
  .search-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }
  .search-area {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .pagination-wrapper {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
```

- [ ] **Step 4: 写单测 `test/app/components/SearchTable.spec.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SearchTable from '@/app/components/SearchTable/index.vue'
import ElementPlus from 'element-plus'

const global = { plugins: [ElementPlus] }

describe('SearchTable', () => {
  it('渲染搜索/重置按钮', () => {
    const wrapper = mount(SearchTable, {
      props: {
        loading: false,
        data: [],
        columns: [],
        pagination: { page: 1, size: 10, total: 0 }
      },
      global
    })
    expect(wrapper.text()).toContain('搜索')
    expect(wrapper.text()).toContain('重置')
  })

  it('点击搜索按钮 emit search', async () => {
    const wrapper = mount(SearchTable, {
      props: {
        loading: false,
        data: [],
        columns: [],
        pagination: { page: 1, size: 10, total: 0 }
      },
      global
    })
    await wrapper.find('button.el-button--primary').trigger('click')
    expect(wrapper.emitted('search')).toBeTruthy()
  })

  it('columns 渲染 el-table-column', () => {
    const wrapper = mount(SearchTable, {
      props: {
        loading: false,
        data: [{ id: '1', name: 'a' }],
        columns: [
          { prop: 'name', label: '名称' },
          { prop: 'actions', label: '操作', slot: 'actions' }
        ],
        pagination: { page: 1, size: 10, total: 1 }
      },
      slots: {
        'col-actions': '<button class="edit-btn">编辑</button>'
      },
      global
    })
    expect(wrapper.text()).toContain('名称')
    expect(wrapper.find('.edit-btn').exists()).toBe(true)
  })
})
```

- [ ] **Step 5: 运行测试**

```bash
pnpm test SearchTable
```

Expected: 3 passed

- [ ] **Step 6: 验证全套**

```bash
pnpm type-check && pnpm lint && pnpm test
```

- [ ] **Step 7: Commit**

```bash
git add src/app/components/PageContainer src/app/components/SearchTable test/app/components
git commit -m "feat(components): implement PageContainer and SearchTable with tests"
```

---

## Task 4: FormDrawer 组件 + 单测

**Files:**

- Modify: `src/app/components/FormDrawer/index.vue`（完整实现）
- Create: `src/app/components/FormDrawer/types.ts`
- Create: `test/app/components/FormDrawer.spec.ts`

**Interfaces:**

- Produces: `<FormDrawer v-model title :form-data :fields :rules @submit />` 可用

- [ ] **Step 1: 写 FormDrawer types**

`src/app/components/FormDrawer/types.ts`:

```ts
export type FormFieldType =
  | 'input'
  | 'textarea'
  | 'number'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'switch'
  | 'date'

export interface FormFieldOption {
  label: string
  value: string | number | boolean
}

export interface FormField {
  prop: string
  label: string
  type: FormFieldType
  options?: FormFieldOption[]
  placeholder?: string
  default?: any
  span?: number
  disabled?: boolean
}

export interface FormDrawerProps {
  modelValue: boolean
  title: string
  formData: Record<string, any>
  fields: FormField[]
  rules?: Record<string, any>
  loading?: boolean
  width?: string
}
```

- [ ] **Step 2: 实现 FormDrawer**

`src/app/components/FormDrawer/index.vue`:

```vue
<template>
  <el-drawer
    :model-value="modelValue"
    :title="title"
    :size="width"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      v-loading="loading"
    >
      <el-row :gutter="16">
        <el-col
          v-for="field in fields"
          :key="field.prop"
          :span="field.span || 24"
        >
          <el-form-item :label="field.label" :prop="field.prop">
            <slot :name="`field-${field.prop}`" :field="field">
              <component
                :is="resolveComponent(field.type)"
                v-model="formData[field.prop]"
                :placeholder="field.placeholder || `请输入${field.label}`"
                :disabled="field.disabled || loading"
                v-bind="resolveExtraProps(field)"
              >
                <template v-if="field.type === 'select'">
                  <el-option
                    v-for="opt in field.options"
                    :key="String(opt.value)"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </template>
                <template v-if="field.type === 'radio-group'">
                  <el-radio
                    v-for="opt in field.options"
                    :key="String(opt.value)"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </el-radio>
                </template>
              </component>
            </slot>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleConfirm"
        >确认</el-button
      >
    </template>
  </el-drawer>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import type { FormInstance } from 'element-plus'
import type { FormDrawerProps, FormField } from './types'

const props = withDefaults(defineProps<FormDrawerProps>(), {
  loading: false,
  width: '500px'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [data: Record<string, any>]
}>()

const formRef = ref<FormInstance>()

const resolveComponent = (type: FormField['type']) => {
  const map: Record<string, string> = {
    input: 'el-input',
    textarea: 'el-input',
    number: 'el-input-number',
    select: 'el-select',
    radio: 'el-radio-group',
    checkbox: 'el-checkbox-group',
    switch: 'el-switch',
    date: 'el-date-picker'
  }
  return map[type] || 'el-input'
}

const resolveExtraProps = (field: FormField) => {
  if (field.type === 'textarea') return { type: 'textarea', rows: 3 }
  return {}
}

const handleCancel = () => emit('update:modelValue', false)

const handleConfirm = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    emit('submit', { ...props.formData })
  } catch {
    // 校验失败，element-plus 会显示错误
  }
}
</script>
```

- [ ] **Step 3: 写单测 `test/app/components/FormDrawer.spec.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FormDrawer from '@/app/components/FormDrawer/index.vue'
import ElementPlus from 'element-plus'

const global = { plugins: [ElementPlus] }

describe('FormDrawer', () => {
  it('关闭时不渲染表单', () => {
    const wrapper = mount(FormDrawer, {
      props: {
        modelValue: false,
        title: '测试',
        formData: {},
        fields: []
      },
      global
    })
    // drawer 关闭时内容不可见（el-drawer 默认 v-show）
    expect(wrapper.find('.el-drawer').exists()).toBe(true)
  })

  it('渲染 fields 定义的字段', () => {
    const wrapper = mount(FormDrawer, {
      props: {
        modelValue: true,
        title: '测试',
        formData: { name: '' },
        fields: [{ prop: 'name', label: '名称', type: 'input' as const }]
      },
      global
    })
    expect(wrapper.text()).toContain('名称')
  })

  it('点取消 emit update:modelValue false', async () => {
    const wrapper = mount(FormDrawer, {
      props: {
        modelValue: true,
        title: '测试',
        formData: {},
        fields: []
      },
      global
    })
    const buttons = wrapper.findAll('button')
    const cancelBtn = buttons.find((b) => b.text().includes('取消'))
    await cancelBtn?.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })
})
```

- [ ] **Step 4: 运行测试**

```bash
pnpm test FormDrawer
```

Expected: 3 passed

- [ ] **Step 5: 验证全套**

```bash
pnpm type-check && pnpm lint && pnpm test
```

- [ ] **Step 6: Commit**

```bash
git add src/app/components/FormDrawer test/app/components/FormDrawer.spec.ts
git commit -m "feat(components): implement FormDrawer with config-driven fields and tests"
```

---

## Task 5: 试点重构 user/List.vue

**Files:**

- Modify: `src/modules/system/user/views/List.vue`（801 行 → < 200 行）
- Create: `src/modules/system/user/views/UserFormDrawer.vue`（从 List.vue 内联 drawer 抽出）

**Interfaces:**

- Consumes: SearchTable / FormDrawer / PageContainer / useCrud
- Produces: user/List.vue 行数 < 200，功能与原版一致

- [ ] **Step 1: 读现有 List.vue 理解功能**

```bash
cat src/modules/system/user/views/List.vue
```

记录功能清单：

- 搜索：keyword / role / status
- 列：username / nickname / role / status / email / phone / createTime / actions
- 操作：新增 / 编辑 / 删除 / 批量删除
- 表单字段：参考内联 drawer 实现

- [ ] **Step 2: 抽出 UserFormDrawer.vue**

参考原 List.vue 的 drawer 部分，抽成独立组件：

```vue
<!-- src/modules/system/user/views/UserFormDrawer.vue -->
<template>
  <FormDrawer
    v-model="visible"
    :title="mode === 'add' ? '新增用户' : '编辑用户'"
    :form-data="formData"
    :fields="fields"
    :rules="rules"
    :loading="submitting"
    @submit="handleSubmit"
  />
</template>

<script lang="ts" setup>
import { ref, watch, reactive } from 'vue'
import { FormDrawer } from '@/app/components'
import { ElMessage } from 'element-plus'
import {
  createUser,
  updateUser,
  type UserInfo,
  type UserCreateRequest
} from '../api'

const props = defineProps<{
  modelValue: boolean
  mode: 'add' | 'edit'
  data: UserInfo | null
}>()

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  success: []
}>()

const visible = ref(props.modelValue)
watch(
  () => props.modelValue,
  (v) => {
    visible.value = v
    if (v) initForm()
  }
)
watch(visible, (v) => emit('update:modelValue', v))

const submitting = ref(false)
const formData = reactive<UserCreateRequest>({
  username: '',
  nickname: '',
  role: 'user',
  status: 'active',
  email: '',
  phone: '',
  password: ''
})

const fields = [
  { prop: 'username', label: '用户名', type: 'input' as const, span: 24 },
  { prop: 'nickname', label: '姓名', type: 'input' as const, span: 24 },
  {
    prop: 'role',
    label: '角色',
    type: 'select' as const,
    span: 24,
    options: [
      { label: '管理员', value: 'admin' },
      { label: '普通用户', value: 'user' },
      { label: 'VIP用户', value: 'vip' }
    ]
  },
  {
    prop: 'status',
    label: '状态',
    type: 'select' as const,
    span: 24,
    options: [
      { label: '启用', value: 'active' },
      { label: '禁用', value: 'inactive' }
    ]
  },
  { prop: 'email', label: '邮箱', type: 'input' as const, span: 24 },
  { prop: 'phone', label: '电话', type: 'input' as const, span: 24 },
  {
    prop: 'password',
    label: '密码',
    type: 'input' as const,
    span: 24,
    placeholder: '编辑时留空表示不修改'
  }
]

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  nickname: [{ required: true, message: '请输入姓名', trigger: 'blur' }]
}

const initForm = () => {
  if (props.mode === 'edit' && props.data) {
    Object.assign(formData, props.data)
    formData.password = ''
  } else {
    Object.assign(formData, {
      username: '',
      nickname: '',
      role: 'user',
      status: 'active',
      email: '',
      phone: '',
      password: ''
    })
  }
}

const handleSubmit = async (data: Record<string, any>) => {
  submitting.value = true
  try {
    if (props.mode === 'add') {
      await createUser(data as UserCreateRequest)
      ElMessage.success('新增成功')
    } else {
      await updateUser(props.data!.id, data as UserCreateRequest)
      ElMessage.success('更新成功')
    }
    emit('success')
    emit('update:modelValue', false)
  } finally {
    submitting.value = false
  }
}
</script>
```

- [ ] **Step 3: 重写 List.vue**

参考 spec §5.1 用法示例。核心要点：

- import { SearchTable, PageContainer } from '@/app/components'
- import { useCrud } from '@/app/composables/useCrud'
- import { fetchUserList, deleteUser, batchDeleteUsers, type UserInfo } from '../api'
- columns 数组定义列
- useCrud 接管 listData/loading/pagination/searchForm/selectedRows/各 handler
- UserFormDrawer 替代内联 drawer

预期行数：模板 ~50 + script ~50 = ~100 行。

- [ ] **Step 4: 验证 smoke + 手动冒烟**

```bash
pnpm type-check && pnpm lint && pnpm test && pnpm build
nohup pnpm dev --host 127.0.0.1 --strictPort > /tmp/vite-dev.log 2>&1 &
for i in $(seq 1 30); do curl -sf http://127.0.0.1:5173/ > /dev/null && break; sleep 1; done
pnpm smoke
```

smoke 3 测试应保持绿（第 3 个测试访问 /system/user 触发新 List.vue）。

**手动冒烟（用 Playwright MCP 或人工）**：

- [ ] 进入 /system/user 表格渲染
- [ ] 输入 keyword 点搜索，表格刷新
- [ ] 点重置，搜索条件清空
- [ ] 点新增用户，drawer 打开，填表提交成功
- [ ] 点编辑，drawer 打开带数据，修改提交成功
- [ ] 点删除，confirm 后删除成功
- [ ] 勾选多行，点批量删除，confirm 后删除成功
- [ ] 翻页 / 改 page size 正常

如有任何功能缺失，回到 Step 3 补齐。

- [ ] **Step 5: 关闭 dev server**

```bash
lsof -ti:5173 | xargs kill 2>/dev/null || true
```

- [ ] **Step 6: Commit**

```bash
git add src/modules/system/user/views/List.vue src/modules/system/user/views/UserFormDrawer.vue
git commit -m "refactor(user): rewrite List.vue with SearchTable and useCrud (801 -> ~150 lines)"
```

---

## Task 6: layout 配置 store

**Files:**

- Create: `src/app/stores/layout.ts`
- Create: `test/app/stores/layout.spec.ts`

**Interfaces:**

- Produces: `useLayoutStore` 含 6 个持久化字段

- [ ] **Step 1: 写失败测试 `test/app/stores/layout.spec.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useLayoutStore } from '@/app/stores/layout'

describe('layout store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('默认值正确', () => {
    const s = useLayoutStore()
    expect(s.showTagsView).toBe(true)
    expect(s.showBreadcrumb).toBe(true)
    expect(s.showLogo).toBe(true)
    expect(s.showFooter).toBe(false)
    expect(s.primaryColor).toBe('#409EFF')
    expect(s.componentSize).toBe('default')
  })

  it('setter 修改字段', () => {
    const s = useLayoutStore()
    s.setShowTagsView(false)
    expect(s.showTagsView).toBe(false)
    s.setPrimaryColor('#13C2C2')
    expect(s.primaryColor).toBe('#13C2C2')
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
pnpm test layout.spec
```

Expected: FAIL（store 不存在）

- [ ] **Step 3: 实现 layout store**

`src/app/stores/layout.ts`:

```ts
import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'

export const useLayoutStore = defineStore('layout', () => {
  const showTagsView = useStorage('layout:showTagsView', true)
  const showBreadcrumb = useStorage('layout:showBreadcrumb', true)
  const showLogo = useStorage('layout:showLogo', true)
  const showFooter = useStorage('layout:showFooter', false)
  const primaryColor = useStorage('layout:primaryColor', '#409EFF')
  const componentSize = useStorage<'large' | 'default' | 'small'>(
    'layout:componentSize',
    'default'
  )

  const setShowTagsView = (v: boolean) => {
    showTagsView.value = v
  }
  const setShowBreadcrumb = (v: boolean) => {
    showBreadcrumb.value = v
  }
  const setShowLogo = (v: boolean) => {
    showLogo.value = v
  }
  const setShowFooter = (v: boolean) => {
    showFooter.value = v
  }
  const setPrimaryColor = (v: string) => {
    primaryColor.value = v
  }
  const setComponentSize = (v: 'large' | 'default' | 'small') => {
    componentSize.value = v
  }

  return {
    showTagsView,
    showBreadcrumb,
    showLogo,
    showFooter,
    primaryColor,
    componentSize,
    setShowTagsView,
    setShowBreadcrumb,
    setShowLogo,
    setShowFooter,
    setPrimaryColor,
    setComponentSize
  }
})
```

- [ ] **Step 4: 运行测试确认通过**

```bash
pnpm test layout.spec
```

Expected: 2 passed

- [ ] **Step 5: 验证全套**

```bash
pnpm type-check && pnpm lint && pnpm test
```

- [ ] **Step 6: Commit**

```bash
git add src/app/stores/layout.ts test/app/stores/layout.spec.ts
git commit -m "feat(state): add layout settings store with persistence"
```

---

## Task 7: SettingsDrawer 组件 + Header 接入

**Files:**

- Create: `src/layout/components/SettingsDrawer.vue`
- Modify: `src/layout/components/Header/Index.vue`（加设置按钮）

**Interfaces:**

- Produces: Header 右上角齿轮按钮，点开 SettingsDrawer

- [ ] **Step 1: 实现 SettingsDrawer**

参考 spec §7.2。完整代码：

```vue
<template>
  <el-drawer
    :model-value="modelValue"
    title="布局设置"
    size="320px"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <el-divider>界面显示</el-divider>
    <div class="setting-item">
      <span>显示 TagsView</span>
      <el-switch
        :model-value="layoutStore.showTagsView"
        @update:model-value="layoutStore.setShowTagsView"
      />
    </div>
    <div class="setting-item">
      <span>显示面包屑</span>
      <el-switch
        :model-value="layoutStore.showBreadcrumb"
        @update:model-value="layoutStore.setShowBreadcrumb"
      />
    </div>
    <div class="setting-item">
      <span>显示 Logo</span>
      <el-switch
        :model-value="layoutStore.showLogo"
        @update:model-value="layoutStore.setShowLogo"
      />
    </div>
    <div class="setting-item">
      <span>显示页脚</span>
      <el-switch
        :model-value="layoutStore.showFooter"
        @update:model-value="layoutStore.setShowFooter"
      />
    </div>

    <el-divider>主题</el-divider>
    <div class="setting-item">
      <span>主题色</span>
      <el-color-picker
        :model-value="layoutStore.primaryColor"
        @update:model-value="layoutStore.setPrimaryColor"
      />
    </div>
    <div class="setting-item">
      <span>组件大小</span>
      <el-radio-group
        :model-value="layoutStore.componentSize"
        size="small"
        @update:model-value="layoutStore.setComponentSize"
      >
        <el-radio-button value="large">大</el-radio-button>
        <el-radio-button value="default">默认</el-radio-button>
        <el-radio-button value="small">小</el-radio-button>
      </el-radio-group>
    </div>
  </el-drawer>
</template>

<script lang="ts" setup>
import { useLayoutStore } from '@/app/stores/layout'

defineProps<{ modelValue: boolean }>()
defineEmits<{ 'update:modelValue': [v: boolean] }>()

const layoutStore = useLayoutStore()
</script>

<style lang="scss" scoped>
.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  font-size: 14px;
}
</style>
```

- [ ] **Step 2: Header 接入**

读 `src/layout/components/Header/Index.vue`，在主题切换按钮旁加设置按钮：

```vue
<el-icon class="cursor-pointer" @click="settingsVisible = true">
  <Setting />
</el-icon>
<SettingsDrawer v-model="settingsVisible" />
```

script 加：

```ts
import { Setting } from '@element-plus/icons-vue'
import SettingsDrawer from '../SettingsDrawer.vue'
const settingsVisible = ref(false)
```

- [ ] **Step 3: 验证**

```bash
pnpm type-check && pnpm lint && pnpm test && pnpm build
nohup pnpm dev --host 127.0.0.1 --strictPort > /tmp/vite-dev.log 2>&1 &
for i in $(seq 1 30); do curl -sf http://127.0.0.1:5173/ > /dev/null && break; sleep 1; done
pnpm smoke
```

smoke 3 测试保持绿（设置 drawer 不影响现有流程）。

- [ ] **Step 4: 手动冒烟（MCP 或人工）**

- [ ] 登录后点 Header 齿轮图标
- [ ] drawer 打开显示「布局设置」
- [ ] 切换「显示 TagsView」开关，TagsView 立即消失/出现
- [ ] 切换「显示面包屑」「显示 Logo」开关，对应元素响应
- [ ] 切换主题色，Element Plus 主色变化
- [ ] 切换组件大小，按钮/输入框尺寸变化
- [ ] 关闭 drawer 再打开，配置保持（持久化）

- [ ] **Step 5: 关闭 dev server + commit**

```bash
lsof -ti:5173 | xargs kill 2>/dev/null || true
git add src/layout/components/SettingsDrawer.vue src/layout/components/Header/Index.vue
git commit -m "feat(layout): add SettingsDrawer and wire to Header gear button"
```

---

## Task 8: layout 组件消费 store 实现显隐

**Files:**

- Modify: `src/layout/Index.vue`（TagsView/Footer v-if）
- Modify: `src/layout/components/Header/Index.vue`（Breadcrumb v-if）
- Modify: `src/layout/components/Sidebar/Index.vue`（Logo v-if）

**Interfaces:**

- Produces: 4 个 layout 区域响应 store 配置

- [ ] **Step 1: Layout/Index.vue 加 v-if**

读 `src/layout/Index.vue`，在 TagsView 与 Footer 外层加 `v-if`：

```vue
<TagsView v-if="layoutStore.showTagsView" />
<!-- ... -->
<Footer v-if="layoutStore.showFooter" />
```

script 加：

```ts
import { useLayoutStore } from '@/app/stores/layout'
const layoutStore = useLayoutStore()
```

- [ ] **Step 2: Header/Index.vue Breadcrumb v-if**

```vue
<Breadcrumb v-if="layoutStore.showBreadcrumb" />
```

- [ ] **Step 3: Sidebar/Index.vue Logo v-if**

```vue
<IconLogo v-if="layoutStore.showLogo" />
```

- [ ] **Step 4: 验证 smoke + 手动冒烟**

```bash
pnpm type-check && pnpm lint && pnpm test && pnpm build
nohup pnpm dev --host 127.0.0.1 --strictPort > /tmp/vite-dev.log 2>&1 &
for i in $(seq 1 30); do curl -sf http://127.0.0.1:5173/ > /dev/null && break; sleep 1; done
pnpm smoke
```

手动：打开 SettingsDrawer，逐个切换 4 个显隐开关，确认对应元素响应。

- [ ] **Step 5: 关闭 dev server + commit**

```bash
lsof -ti:5173 | xargs kill 2>/dev/null || true
git add src/layout/Index.vue src/layout/components/Header/Index.vue src/layout/components/Sidebar/Index.vue
git commit -m "feat(layout): wire layout components to settings store for visibility toggle"
```

---

## Task 9: main.ts 接 primaryColor 与 componentSize

**Files:**

- Modify: `src/app/main.ts`
- Modify: `src/app/App.vue`（用 el-config-provider 包裹）

**Interfaces:**

- Produces: Element Plus 主题色与组件大小响应 layout store

- [ ] **Step 1: main.ts 加 primaryColor watch**

读 `src/app/main.ts`，在 `app.mount('#app')` 之前加：

```ts
import { watch } from 'vue'
import { useLayoutStore } from '@/app/stores/layout'

const layoutStore = useLayoutStore()

// 主题色 CSS 变量
watch(
  () => layoutStore.primaryColor,
  (color) => {
    document.documentElement.style.setProperty('--el-color-primary', color)
    // 派生色（浅色 hover/active）
    document.documentElement.style.setProperty(
      '--el-color-primary-light-3',
      mixColor(color, '#ffffff', 0.3)
    )
    document.documentElement.style.setProperty(
      '--el-color-primary-light-5',
      mixColor(color, '#ffffff', 0.5)
    )
    document.documentElement.style.setProperty(
      '--el-color-primary-light-7',
      mixColor(color, '#ffffff', 0.7)
    )
    document.documentElement.style.setProperty(
      '--el-color-primary-light-9',
      mixColor(color, '#ffffff', 0.9)
    )
    document.documentElement.style.setProperty(
      '--el-color-primary-dark-2',
      mixColor(color, '#000000', 0.2)
    )
  },
  { immediate: true }
)

function mixColor(color1: string, color2: string, weight: number): string {
  // 简化版颜色混合，实际可用 element-plus 的色阶工具
  // ... 实现 hex 解析 + 混合
}
```

**简化方案**：不计算派生色，只设主色。Element Plus 部分组件派生色会 fallback。如需完整可引入 `element-plus/es/utils/color`。

简化版（推荐）：

```ts
watch(
  () => layoutStore.primaryColor,
  (color) => {
    document.documentElement.style.setProperty('--el-color-primary', color)
  },
  { immediate: true }
)
```

- [ ] **Step 2: App.vue 用 el-config-provider**

读 `src/app/App.vue`，用 `el-config-provider` 包裹 RouterView：

```vue
<template>
  <el-config-provider :locale="locale" :size="layoutStore.componentSize">
    <RouterView />
  </el-config-provider>
</template>

<script lang="ts" setup>
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { useLayoutStore } from '@/app/stores/layout'

const locale = zhCn
const layoutStore = useLayoutStore()
</script>
```

注意：原有 main.ts 里 `app.use(ElementPlus, { locale })` 的 locale 可保留或移除（el-config-provider 优先级更高）。建议保留 app.use 不变，App.vue 用 config-provider 覆盖 size。

- [ ] **Step 3: 验证 smoke + 手动冒烟**

```bash
pnpm type-check && pnpm lint && pnpm test && pnpm build
nohup pnpm dev --host 127.0.0.1 --strictPort > /tmp/vite-dev.log 2>&1 &
for i in $(seq 1 30); do curl -sf http://127.0.0.1:5173/ > /dev/null && break; sleep 1; done
pnpm smoke
```

手动：

- [ ] SettingsDrawer 切主题色，主按钮颜色变化
- [ ] 切组件大小，按钮/输入框尺寸变化
- [ ] 刷新页面，配置保持（持久化）

- [ ] **Step 4: 关闭 dev server + commit**

```bash
lsof -ti:5173 | xargs kill 2>/dev/null || true
git add src/app/main.ts src/app/App.vue
git commit -m "feat(app): wire primaryColor and componentSize to layout store"
```

---

## Task 10: 扩展 smoke 测试

**Files:**

- Create: `test/smoke/layout.spec.ts`
- Modify: `test/smoke/auth.spec.ts`（第 3 个测试可能需要调整，因为 user/List.vue 已重构）

**Interfaces:**

- Produces: 5 个 smoke 用例全绿

- [ ] **Step 1: 写 layout smoke 测试**

`test/smoke/layout.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

async function login(page: import('@playwright/test').Page) {
  await page.goto('login')
  await page.getByRole('textbox', { name: '用户名' }).fill('admin')
  await page.getByRole('textbox', { name: '密码' }).fill('123456')
  await page.getByRole('button', { name: '登录' }).click()
  await expect(page).toHaveURL(/\/(\?.*)?$/)
}

test.describe.serial('layout 配置', () => {
  test('SettingsDrawer 开关 TagsView', async ({ page }) => {
    await login(page)
    await expect(page.locator('.tags-view-container')).toBeVisible()

    // 点设置按钮（齿轮 icon）
    await page.locator('.el-icon').filter({ hasText: 'Setting' }).click()
    // 或用 accessible name：await page.getByRole('button', { name: '布局设置' }).click()

    await expect(page.getByText('布局设置')).toBeVisible()

    // 关闭 TagsView
    const switchItem = page
      .locator('.setting-item', { hasText: '显示 TagsView' })
      .locator('.el-switch')
    await switchItem.click()

    await expect(page.locator('.tags-view-container')).not.toBeVisible()
  })

  test('user 列表用 SearchTable 渲染', async ({ page }) => {
    await login(page)
    await page.goto('system/user')

    await expect(page.locator('.el-table')).toBeVisible()
    await expect(page.locator('.el-pagination')).toBeVisible()
    await expect(page.locator('.search-toolbar')).toBeVisible()
  })
})
```

- [ ] **Step 2: 验证现有 auth.spec.ts 第 3 测试**

Task 5 重构了 user/List.vue，确认 auth.spec.ts 第 3 测试（访问 system/user + el-table 可见）仍通过。如有破坏性改动，调整断言。

- [ ] **Step 3: 运行全部 smoke**

```bash
nohup pnpm dev --host 127.0.0.1 --strictPort > /tmp/vite-dev.log 2>&1 &
for i in $(seq 1 30); do curl -sf http://127.0.0.1:5173/ > /dev/null && break; sleep 1; done
pnpm smoke
lsof -ti:5173 | xargs kill 2>/dev/null || true
```

Expected: 5 passed（原 3 + 新 2）

如 layout smoke 失败，调整选择器（设置按钮可能不是 `.el-icon` filter，用更稳定的 accessible name）。

- [ ] **Step 4: Commit**

```bash
git add test/smoke/layout.spec.ts test/smoke/auth.spec.ts
git commit -m "test(smoke): cover layout settings drawer and SearchTable rendering"
```

---

## Task 11: 文档同步

**Files:**

- Modify: `CLAUDE.md`
- Modify: `docs/standards/01-ARCHITECTURE.md`
- Modify: `README.md`

- [ ] **Step 1: CLAUDE.md**

加「通用组件」段落，说明 `@/app/components` 含 SearchTable / FormDrawer / PageContainer，`@/app/composables` 含 useCrud。新增页面应优先用这些组件。

加「layout 配置」段落，说明 `@/app/stores/layout` 字段与 SettingsDrawer 入口。

- [ ] **Step 2: docs/standards/01-ARCHITECTURE.md**

更新 `src/app/` 表格：

- `app/components/` 行：SearchTable / FormDrawer / PageContainer
- `app/composables/` 行：useCrud
- `app/stores/` 行：加 layout.ts

- [ ] **Step 3: README.md**

「架构与工程化」特性列表加：

- 🧩 通用组件库：SearchTable / FormDrawer / PageContainer + useCrud composable
- 🎨 Layout 配置中心：TagsView/Breadcrumb/Logo/Footer 显隐 + 主题色 + 组件大小

- [ ] **Step 4: 验证**

```bash
pnpm lint && pnpm type-check && pnpm test && pnpm build
nohup pnpm dev --host 127.0.0.1 --strictPort > /tmp/vite-dev.log 2>&1 &
for i in $(seq 1 30); do curl -sf http://127.0.0.1:5173/ > /dev/null && break; sleep 1; done
pnpm smoke
lsof -ti:5173 | xargs kill 2>/dev/null || true
```

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md docs/standards/01-ARCHITECTURE.md README.md
git commit -m "docs(m7b): sync component library and layout settings to docs"
```

---

## Task 12: 最终验证 + push

**Files:** 无（仅验证）

- [ ] **Step 1: 本地全量验证**

```bash
pnpm lint && pnpm type-check && pnpm test && pnpm build
nohup pnpm dev --host 127.0.0.1 --strictPort > /tmp/vite-dev.log 2>&1 &
for i in $(seq 1 30); do curl -sf http://127.0.0.1:5173/ > /dev/null && break; sleep 1; done
pnpm smoke
lsof -ti:5173 | xargs kill 2>/dev/null || true
```

Expected: 4 件套 + 5 smoke 全绿

- [ ] **Step 2: 手动冒烟全清单**

- [ ] 登录 / 跳转 / 退出
- [ ] user 列表（SearchTable 渲染）+ CRUD 5 项
- [ ] SettingsDrawer 6 个配置项全部响应
- [ ] 暗黑模式切换
- [ ] TagsView 5 项右键菜单
- [ ] 刷新页面配置持久化

- [ ] **Step 3: git log 确认 commit 序列**

```bash
git log --oneline da614ad..HEAD
```

预期 12 个 commit（Task 1-11 各一个 + 可能的修正）。

- [ ] **Step 4: push**

```bash
git push origin main
```

- [ ] **Step 5: CI 验证**

到 GitHub Actions 看 5 个 job（lint / type-check / test / build / smoke）全绿。

---

## 自检清单

完成所有任务后对照 spec §十 DoD：

- [ ] `app/components/` 含 SearchTable / FormDrawer / PageContainer，均有单测
- [ ] `app/composables/useCrud.ts` 有单测
- [ ] `app/stores/layout.ts` 含 6 字段持久化
- [ ] SettingsDrawer 接入 Header
- [ ] layout 组件消费 store 实现显隐
- [ ] main.ts 接 primaryColor + componentSize
- [ ] user/List.vue 重构后 < 200 行，功能完整
- [ ] smoke 5 用例全绿
- [ ] lint / type-check / test / build 全绿
- [ ] CI smoke job 跑通
- [ ] 文档同步

## 估算

| 任务                                      | 时长       |
| ----------------------------------------- | ---------- |
| Task 1 目录骨架                           | 0.5h       |
| Task 2 useCrud + 单测                     | 1h         |
| Task 3 PageContainer + SearchTable + 单测 | 2h         |
| Task 4 FormDrawer + 单测                  | 1h         |
| Task 5 user/List.vue 重构                 | 2h         |
| Task 6 layout store + 单测                | 0.5h       |
| Task 7 SettingsDrawer + Header            | 1h         |
| Task 8 layout 组件消费 store              | 0.5h       |
| Task 9 main.ts 主题接入                   | 0.5h       |
| Task 10 smoke 扩展                        | 0.5h       |
| Task 11 文档                              | 0.5h       |
| Task 12 最终验证 + push                   | 0.5h       |
| **合计**                                  | **~10.5h** |
