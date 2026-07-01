# 新增业务模块

Vue Admin 的业务按域拆分为 `modules/<domain>/`。本节说明如何从零新增一个业务模块，涵盖脚手架、目录约定、菜单注册、列表页模板与 Mock/测试。

## 脚手架生成

项目提供交互式脚手架生成模块骨架：

```bash
pnpm gen:module
```

脚本会依次询问三项输入：

| 提示             | 说明                                   | 示例         |
| ---------------- | -------------------------------------- | ------------ |
| 模块英文标识     | 用作目录名与 API 路径，kebab/lower     | `order`      |
| 模块中文名称     | 菜单标题                               | `订单管理`   |
| 父模块           | 留空为顶级模块；填则放到该父模块下     | `system`     |

确认后脚手架会生成以下文件，并自动在 `src/router/menus.ts` 追加一条静态路由：

```
src/modules/order/
├── api.ts                          # 领域 API（接口类型 + fetch/create/update/delete）
└── views/
    ├── List.vue                    # 列表页（PageContainer + SearchTable + useCrud）
    └── OrderFormDrawer.vue         # 表单抽屉（FormDrawer，add/edit/view 三态）
src/mock/apis/order.ts              # Mock API（CRUD + 导出）
```

::: tip 脚手架是起点，不是终点
生成代码基于通用模板，字段、查询条件、列定义都需按业务调整。生成后请重点修改：`api.ts` 的接口字段、`List.vue` 的 `columns` 与 `#search` 插槽、`OrderFormDrawer.vue` 的 `fields`。
:::

## 目录约定

参考 `src/modules/system/user/` 等现有模块，约定如下：

| 路径                   | 职责                                                                 |
| ---------------------- | -------------------------------------------------------------------- |
| `modules/<domain>/api.ts` | 领域所有对外接口，统一用 `lib/http/client` 的 `api`，禁止 `axios.create()` |
| `modules/<domain>/views/` | 页面组件。列表页命名 `List.vue`，表单抽屉命名 `<Name>FormDrawer.vue` |
| `modules/<domain>/components/` | 模块私有组件（如有）                                            |
| `app/stores/<domain>.ts` | 模块级全局状态。**store 不放在 `modules/` 下**，统一放 `app/stores/`，setup 风格 `defineStore` |

::: warning 没有模块级 store.ts
脚手架不生成 `store.ts`。按架构约定，Pinia store 统一放 `app/stores/`（全局）而非 `modules/<domain>/`。多数纯 CRUD 模块用 `useCrud` 管理列表状态即可，无需单独 store。
:::

`api.ts` 标准结构（以 `order` 为例）：

```ts
// order 领域 API。
import { api } from '@/lib/http/client'

export interface OrderInfo {
  id: string
  name: string
  status: 'active' | 'inactive'
  createTime: string
  updateTime: string
}

export interface OrderSearchRequest {
  keyword: string
  status: string
  page: number
  size: number
}

export interface OrderSearchResponse {
  records: OrderInfo[]
  total: number
  current: number
  size: number
}

export const fetchOrderList = (params: OrderSearchRequest) =>
  api.get<OrderSearchResponse>('/api/order', { params })

export const fetchOrderDetail = (id: string) =>
  api.get<OrderInfo>(`/api/order/${id}`)

export const createOrder = (data: OrderCreateRequest) =>
  api.post<OrderInfo>('/api/order', data)

export const updateOrder = (id: string, data: Partial<OrderCreateRequest>) =>
  api.put<OrderInfo>(`/api/order/${id}`, data)

export const deleteOrder = (id: string) =>
  api.del<boolean>(`/api/order/${id}`)

export const batchDeleteOrders = (ids: string[]) =>
  api.del<boolean>('/api/order', { data: { ids } })

export const exportOrders = () =>
  api.get<string>('/api/order/export')
```

## 注册菜单

菜单分两套，按是否需要权限控制选择：

### 1. 静态路由（无权限要求）

放 `src/router/menus.ts`。脚手架会自动追加，适用于首页、增删改查演示这类所有登录用户可见的入口：

```ts
{
  path: '/order',
  name: 'order',
  component: () => import('@/modules/order/views/List.vue'),
  meta: {
    title: '订单管理',
    icon: 'Document',
    showMenu: true
  }
}
```

### 2. 后端下发菜单（带权限）

放 `src/mock/apis/menu.ts` 的 `ALL_MENUS`。`system/*` 下所有业务菜单都走这条路径——由后端 API `/api/system/menus` 下发，前端按 `meta.permissions` 做访问控制。新增叶子节点：

```ts
{
  path: '/system/order',                 // 嵌套时带父路径前缀
  name: 'systemOrder',                   // 全局唯一，camelCase
  component: 'system/order/views/List',  // 相对 src/modules/ 的路径，无后缀
  meta: {
    title: '订单管理',
    icon: 'Document',                    // PascalCase，全局唯一
    showMenu: true,
    permissions: { any: ['order:read', '*'] }  // 任一权限命中即可见
  }
}
```

::: warning 图标约定
`icon` 必须是 PascalCase（如 `Document`、`OfficeBuilding`），小写不渲染；且全局唯一。可用图标见 Element Plus 图标库。菜单三级结构（访问控制 / 系统配置 / 日志管理）详见 `src/mock/apis/menu.ts`。
:::

顶级模块（无父模块）直接作为 `ALL_MENUS` 数组的一项；嵌套模块放进对应父节点的 `children`。

## 列表页模板

业务列表页必须用 **PageContainer + SearchTable + useCrud + FormDrawer** 四件套（见架构约定 #10）。脚手架生成的 `List.vue` 已遵循该模式，核心结构如下：

```vue
<template>
  <PageContainer title="订单管理">
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
        <el-input
          v-model="searchForm.keyword"
          placeholder="名称或描述"
          clearable
          style="width: 220px"
          @keyup.enter="handleSearch"
        />
        <el-select
          v-model="searchForm.status"
          clearable
          placeholder="状态"
          style="width: 120px"
        >
          <el-option label="启用" value="active" />
          <el-option label="禁用" value="inactive" />
        </el-select>
      </template>

      <template #actions>
        <el-button type="primary" :icon="Plus" @click="openDrawer('add')">
          新增
        </el-button>
        <el-button
          type="danger"
          :icon="Delete"
          :disabled="selectedRows.length === 0"
          @click="handleBatchDelete"
        >
          批量删除
        </el-button>
      </template>

      <template #col-status="{ row }">
        <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
          {{ row.status === 'active' ? '启用' : '禁用' }}
        </el-tag>
      </template>

      <template #col-actions="{ row }">
        <el-button link type="primary" size="small" @click="openDrawer('view', row)">查看</el-button>
        <el-button link type="primary" size="small" @click="openDrawer('edit', row)">编辑</el-button>
        <el-button link type="danger" size="small" @click="handleDelete(row.id)">删除</el-button>
      </template>
    </SearchTable>

    <OrderFormDrawer
      v-model="drawerVisible"
      :mode="drawerMode"
      :data="editingRow"
      @success="onFormSuccess"
    />
  </PageContainer>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { Plus, Delete } from '@element-plus/icons-vue'
import { SearchTable, PageContainer } from '@/app/components'
import { useCrud } from '@/app/composables/useCrud'
import { formatDate } from '@/lib/format'
import type { ColumnDef } from '@/app/components/SearchTable/types'
import {
  fetchOrderList,
  deleteOrder,
  batchDeleteOrders,
  type OrderInfo,
  type OrderSearchRequest
} from '../api'
import OrderFormDrawer from './OrderFormDrawer.vue'

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
  handleBatchDelete
} = useCrud<OrderInfo>({
  fetch: (params) => fetchOrderList(params as unknown as OrderSearchRequest),
  remove: deleteOrder,
  batchRemove: batchDeleteOrders,
  defaultSearchForm: { keyword: '', status: '' },
  pageSize: 10
})

const onSelectionChange = (rows: Record<string, unknown>[]) => {
  handleSelectionChange(rows as unknown as OrderInfo[])
}

const tableData = computed(() => listData.value as unknown as Record<string, unknown>[])
const tableSelectedRows = computed(() => selectedRows.value as unknown as Record<string, unknown>[])

const columns: ColumnDef[] = [
  { prop: 'name', label: '名称', minWidth: 140 },
  { prop: 'status', label: '状态', minWidth: 90, slot: 'status' },
  { prop: 'createTime', label: '创建时间', minWidth: 170, slot: 'createTime' },
  { prop: 'actions', label: '操作', width: 200, fixed: 'right', slot: 'actions' }
]

const drawerVisible = ref(false)
const drawerMode = ref<'add' | 'edit' | 'view'>('add')
const editingRow = ref<OrderInfo | null>(null)

const openDrawer = (mode: 'add' | 'edit' | 'view', row?: OrderInfo) => {
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

要点：

- `useCrud` 接管全部列表状态（`listData`/`loading`/`pagination`/`searchForm`/`selectedRows`）与 7 个 handler，禁止手写 `el-table` + `el-pagination` + 内联 drawer。
- `columns` 中需要自定义渲染的列声明 `slot`，在 `<template #col-<prop>>` 中渲染。
- 表单抽屉独立成 `<Name>FormDrawer.vue`，通过 `v-model` + `mode` + `data` 驱动，成功后 `emit('success')` 触发列表刷新。
- 复杂联动（如权限分配 el-tree）用独立 drawer，不塞进 FormDrawer。

## Mock 与测试

### Mock API

在 `src/mock/apis/` 新增 `<domain>.ts`。Mock 由 `vite-plugin-mock` 通过 `mockPath: './src/mock/apis'` **自动加载**，无需手动注册导入。每个文件 `export default` 一个 `MockMethod[]`：

```ts
import type { MockMethod } from 'vite-plugin-mock'

let orderList = [
  { id: '1', name: '示例订单', status: 'active', createTime: '2024-01-01 10:00:00', updateTime: '2024-01-01 10:00:00' }
]

const success = <T>(data: T) => ({ code: 0, data, msg: 'success' })

export default [
  // GET /api/order - 列表（分页 + 过滤）
  {
    url: '/api/order',
    method: 'get',
    response: (req: { query?: { page?: number; size?: number; keyword?: string; status?: string } }) => {
      const { page = 1, size = 10, keyword = '', status = '' } = req.query || {}
      let filtered = orderList
      if (keyword) {
        const kw = String(keyword).toLowerCase()
        filtered = filtered.filter((item) => item.name.toLowerCase().includes(kw))
      }
      if (status) filtered = filtered.filter((item) => item.status === status)
      const start = (Number(page) - 1) * Number(size)
      return success({
        records: filtered.slice(start, start + Number(size)),
        total: filtered.length,
        current: Number(page),
        size: Number(size)
      })
    }
  },
  // GET /api/order/:id - 详情
  {
    url: '/api/order/:id',
    method: 'get',
    response: (req: { params?: { id: string } }) => {
      const item = orderList.find((d) => d.id === req.params?.id)
      return item ? success(item) : { code: 404, msg: '数据不存在' }
    }
  }
  // ... POST/PUT/DELETE 同理，参考 src/mock/apis/crud.ts
] as MockMethod[]
```

::: tip 响应契约
Mock 响应必须与真实后端一致：成功 `{ code: 0, data, msg }`，失败 `{ code: <非0>, msg }`。导出端点返回 CSV 文本（含表头），禁止返回 `'export success'` 占位。
:::

完整 CRUD Mock 范例见 `src/mock/apis/crud.ts`。

### 测试

| 类型       | 位置                          | 说明                                                                 |
| ---------- | ----------------------------- | -------------------------------------------------------------------- |
| 组件测试   | `test/app/components/`        | SearchTable / FormDrawer / Selectors 等通用组件                      |
| composable | `test/app/composables/`       | `useCrud.spec.ts` 等                                                |
| store 测试 | `test/app/stores/`            | layout / permission 等                                              |
| Mock 测试  | `test/mock/`                  | `apis.spec.ts`、`menu-manage.spec.ts`                              |
| smoke 测试 | `test/smoke/`                 | Playwright 端到端，`business.spec.ts` 覆盖业务闭环                  |

新增模块的端到端用例在 `test/smoke/business.spec.ts` 补充，参考现有 user/role 用例：登录 → 访问列表 → 打开查看 drawer → 校验渲染。

```bash
pnpm test           # Vitest 单次运行（单元 + mock）
pnpm smoke          # Playwright smoke（需先启动 pnpm dev）
```

## 检查清单

新增模块上线前确认：

- [ ] `api.ts` 用 `api` 辅助函数，无裸 `axios`
- [ ] 列表页用 `PageContainer` + `SearchTable` + `useCrud` + `FormDrawer` 四件套
- [ ] 菜单已注册（静态路由 `router/menus.ts` 或权限菜单 `mock/apis/menu.ts` ALL_MENUS）
- [ ] 图标 PascalCase 且全局唯一
- [ ] Mock 响应遵循 `{ code: 0, data, msg }` 契约，导出返回 CSV 文本
- [ ] smoke 用例已补充
