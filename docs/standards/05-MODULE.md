# 模块开发规范

> 本文档规定业务模块的目录结构、代码组织、组件开发流程。

## 目录结构

### 标准业务模块

```
src/modules/{domain}/
├── api.ts                    # API 接口定义（必选）
├── store.ts                  # 状态管理（可选）
├── composables/              # 可组合函数（可选）
│   └── use{Feature}.ts
├── components/               # 可复用组件（可选）
│   └── {Component}.vue
└── views/                    # 页面组件
    ├── List.vue              # 列表页
    ├── {Entity}FormDrawer.vue  # 表单抽屉
    └── Detail.vue            # 详情页（可选）
```

### system 子模块

```
src/modules/system/
├── {subdomain}/
│   ├── api.ts
│   └── views/
│       ├── List.vue
│       └── {Entity}FormDrawer.vue
```

已存在的子模块：`user`、`role`、`permission`、`menu`、`dict`、`dept`、`log`、`notice`。

## 新建模块流程

### 步骤 1：生成模块骨架

使用脚手架命令快速生成标准模块：

```bash
pnpm gen:module
```

按提示输入：
- 模块英文标识（如：`product`）
- 模块中文名称（如：`产品管理`）
- 父模块（留空表示顶级模块，如：`system`）

### 步骤 2：定义 API 接口

编辑 `api.ts`：

```typescript
import { api } from '@/lib/http/client'

// 1. 定义类型
export interface ProductInfo {
  id: string
  name: string
  // ... 其他字段
}

export interface ProductSearchRequest {
  keyword: string
  page: number
  size: number
}

export interface ProductCreateRequest {
  name: string
  // ... 其他字段
}

export interface ProductSearchResponse {
  records: ProductInfo[]
  total: number
  current: number
  size: number
}

// 2. 定义方法
export const fetchProductList = (params: ProductSearchRequest) =>
  api.get<ProductSearchResponse>('/api/product', { params })

export const fetchProductDetail = (id: string) =>
  api.get<ProductInfo>(`/api/product/${id}`)

export const createProduct = (data: ProductCreateRequest) =>
  api.post<ProductInfo>('/api/product', data)

export const updateProduct = (id: string, data: Partial<ProductCreateRequest>) =>
  api.put<ProductInfo>(`/api/product/${id}`, data)

export const deleteProduct = (id: string) =>
  api.del<boolean>(`/api/product/${id}`)

export const batchDeleteProducts = (ids: string[]) =>
  api.del<boolean>('/api/product', { data: { ids } })
```

### 步骤 3：开发列表页

编辑 `views/List.vue`，使用 **M7-C 四件套**：

```vue
<template>
  <PageContainer title="产品管理">
    <SearchTable
      :loading="loading"
      :data="tableData"
      :columns="columns"
      :pagination="pagination"
      :selected-rows="tableSelectedRows"
      selectable
      row-key="id"
      @search="handleSearch"
      @reset="handleReset"
      @page-change="handlePageChange"
      @selection-change="onSelectionChange"
    >
      <template #search>
        <!-- 搜索栏 -->
      </template>

      <template #actions>
        <!-- 操作按钮 -->
      </template>

      <template #col-{field}="{ row }">
        <!-- 自定义列渲染 -->
      </template>

      <template #col-actions="{ row }">
        <!-- 行操作按钮 -->
      </template>
    </SearchTable>

    <ProductFormDrawer
      v-model="drawerVisible"
      :mode="drawerMode"
      :data="editingRow"
      @success="onFormSuccess"
    />
  </PageContainer>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { Plus, Delete, Refresh } from '@element-plus/icons-vue'
import { SearchTable, PageContainer } from '@/app/components'
import { useCrud } from '@/app/composables/useCrud'
import { formatDate } from '@/lib/format'
import type { ColumnDef } from '@/app/components/SearchTable/types'
import {
  fetchProductList,
  deleteProduct,
  batchDeleteProducts,
  type ProductInfo,
  type ProductSearchRequest,
} from '../api'
import ProductFormDrawer from './ProductFormDrawer.vue'

// 1. useCrud 接管列表状态
const {
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
  handleBatchDelete,
} = useCrud<ProductInfo>({
  fetch: (params) => fetchProductList(params as unknown as ProductSearchRequest),
  remove: deleteProduct,
  batchRemove: batchDeleteProducts,
  defaultSearchForm: { keyword: '' },
  pageSize: 20,
})

// 2. SearchTable emit 类型转换
const onSelectionChange = (rows: Record<string, unknown>[]) => {
  handleSelectionChange(rows as unknown as ProductInfo[])
}

const tableData = computed(() => listData.value as unknown as Record<string, unknown>[])
const tableSelectedRows = computed(() => selectedRows.value as unknown as Record<string, unknown>[])

// 3. 列定义
const columns: ColumnDef[] = [
  { prop: 'name', label: '名称', minWidth: 150 },
  // ... 更多列
  { prop: 'createTime', label: '创建时间', minWidth: 180, slot: 'createTime' },
  { prop: 'actions', label: '操作', width: 200, fixed: 'right', slot: 'actions' },
]

// 4. 抽屉控制
const drawerVisible = ref(false)
const drawerMode = ref<'add' | 'edit' | 'view'>('add')
const editingRow = ref<ProductInfo | null>(null)

const openDrawer = (mode: 'add' | 'edit' | 'view', row?: ProductInfo) => {
  drawerMode.value = mode
  editingRow.value = row ?? null
  drawerVisible.value = true
}

const onFormSuccess = () => {
  drawerVisible.value = false
  fetchList()
}

onMounted(fetchList)
</script>
```

### 步骤 4：开发表单抽屉

编辑 `views/{Entity}FormDrawer.vue`：

```vue
<template>
  <FormDrawer
    v-model="visible"
    :title="drawerTitle"
    :mode="mode"
    :form-data="formData"
    :fields="fields"
    :rules="rules"
    :loading="submitting"
    width="500px"
    @submit="handleSubmit"
  />
</template>

<script lang="ts" setup>
import { ref, watch, reactive, computed } from 'vue'
import { FormDrawer } from '@/app/components'
import type { FormField, FormDrawerMode } from '@/app/components/FormDrawer/types'
import { ElMessage } from 'element-plus'
import {
  createProduct,
  updateProduct,
  type ProductInfo,
  type ProductCreateRequest,
} from '../api'

const props = defineProps<{
  modelValue: boolean
  mode: FormDrawerMode
  data: ProductInfo | null
}>()

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  success: []
}>()

const visible = ref(props.modelValue)
const submitting = ref(false)

watch(() => props.modelValue, (v) => {
  visible.value = v
  if (v) initForm()
})
watch(visible, (v) => emit('update:modelValue', v))

const formData = reactive<ProductCreateRequest>({
  name: '',
  // ... 其他字段
})

const drawerTitle = computed(() => {
  if (props.mode === 'add') return '新增产品'
  if (props.mode === 'edit') return '编辑产品'
  return '查看产品'
})

const fields: FormField[] = [
  { prop: 'name', label: '名称', type: 'input' },
  // ... 更多字段
]

const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
}

const initForm = () => {
  if (props.mode === 'edit' && props.data) {
    Object.assign(formData, {
      name: props.data.name,
      // ... 其他字段
    })
  } else {
    Object.assign(formData, {
      name: '',
      // ... 重置默认值
    })
  }
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    if (props.mode === 'add') {
      await createProduct(formData)
      ElMessage.success('新增成功')
    } else {
      await updateProduct(props.data!.id, formData)
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

### 步骤 5：注册路由

在 `src/router/menus.ts` 中添加路由配置：

```typescript
{
  path: '/system/product',
  name: 'systemProduct',
  component: () => import('@/modules/system/product/views/List.vue'),
  meta: {
    title: '产品管理',
    icon: 'Goods',
    showMenu: true
  }
}
```

### 步骤 6：创建 Mock API

在 `src/mock/apis/product.ts` 中创建 Mock 数据：

```typescript
import Mock from 'mockjs'

const dataList: any[] = []

for (let i = 1; i <= 50; i++) {
  dataList.push(Mock.mock({
    id: '@guid',
    name: '@ctitle(5, 10)',
    // ... 其他字段
    createTime: '@datetime("yyyy-MM-dd HH:mm:ss")',
    updateTime: '@datetime("yyyy-MM-dd HH:mm:ss")',
  }))
}

export default [
  {
    url: '/api/product',
    method: 'GET',
    response: ({ query }) => {
      // 实现分页、搜索、过滤逻辑
    },
  },
  // ... 其他端点
]
```

## FormDrawer 字段类型

| 类型 | 说明 | 配置示例 |
|------|------|----------|
| input | 文本输入框 | `{ prop: 'name', label: '名称', type: 'input' }` |
| number | 数字输入框 | `{ prop: 'sort', label: '排序', type: 'number' }` |
| textarea | 多行文本 | `{ prop: 'desc', label: '描述', type: 'textarea' }` |
| select | 下拉选择 | `{ prop: 'status', label: '状态', type: 'select', options: [...] }` |
| radio | 单选按钮组 | `{ prop: 'priority', label: '优先级', type: 'radio', options: [...] }` |
| date | 日期选择器 | `{ prop: 'date', label: '日期', type: 'date' }` |
| treeSelect | 树形选择器 | `{ prop: 'parentId', label: '上级', type: 'treeSelect', treeData: [...], treeProps: {...} }` |
| password | 密码输入框 | `{ prop: 'password', label: '密码', type: 'password' }` |

## 通用组件库

所有业务模块应优先使用 `@/app/components` 中的通用组件：

| 组件 | 用途 | 文档 |
|------|------|------|
| `SearchTable` | 带搜索、分页、批量操作的表格 | `docs-site/components/search-table.md` |
| `FormDrawer` | 声明式表单抽屉 | `docs-site/components/form-drawer.md` |
| `PageContainer` | 页面容器 | `docs-site/components/page-container.md` |

## 权限控制

### 指令控制

```vue
<el-button v-permission="'product:create'" type="primary">
  新增
</el-button>
```

### 代码控制

```typescript
import { usePermissionStore } from '@/app/stores/permission'

const { hasPermission } = usePermissionStore()

if (hasPermission('product:delete')) {
  // 执行操作
}
```

## 最佳实践

1. **优先使用 useCrud**：所有列表页必须使用 `useCrud` 接管状态，禁止手写重复的分页、搜索逻辑
2. **类型安全**：API 接口必须定义完整的 TypeScript 类型，禁止使用 `any`
3. **单一职责**：每个文件职责单一，API 定义在 `api.ts`，页面在 `views/`，通用组件在 `components/`
4. **复用组件**：优先使用 `@/app/components` 的通用组件，避免重复造轮子
5. **错误处理**：使用 `try-catch` 处理 HTTP 错误，必要时使用 `_silent: true` 关闭全局提示
