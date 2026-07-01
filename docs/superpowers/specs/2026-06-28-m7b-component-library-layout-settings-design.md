# M7-B 通用组件库 + Layout 配置中心设计

**日期：** 2026-06-28
**里程碑：** M7（功能完善 + 开源标准）
**前置：** M7-A 已完成（架构迁移 + 8 模块标准化 + Smoke Test）
**后续：** M7-C（业务页面闭环验证）、M5.3（MSW 迁移）

## 一、背景

M7-A 收尾后，盘点业务代码发现两个待解问题：

### 1.1 业务页面巨量重复

4 个 List.vue 平均 780 行（总计 3568 行），结构 80% 相同：

```
搜索区（el-input + el-select + 搜索/重置按钮）
操作按钮栏（新增 + 批量删除）
el-table（12-15 列 + 操作列编辑/删除）
el-pagination
ref: searchForm / tableData / loading / pagination
函数: handleSearch / handleReset / handleCreate / handleEdit / handleDelete / handleBatchDelete / openDrawer
```

每个 List.vue 都自己实现这套骨架，DRY 严重违反。新增一个业务列表要复制 800 行模板。

### 1.2 Layout 不可配置

- TagsView / Breadcrumb / Logo 全部写死，用户无法关闭
- 暗黑模式切换只在 Header 有个图标，无设置面板
- 对照 vben / pure-admin / soybean-admin 都有完整的 layout settings drawer

### 1.3 已有的局部抽象

- `DictFormDrawer.vue` 339 行——已用 drawer 模式做表单，但仅 dict 模块用，未抽象
- `app/stores/theme.ts` / `sidebar.ts`——已存在，可扩展

## 二、目标

1. **建通用组件库**：SearchTable / FormDrawer / PageContainer 三件套，让 CRUD 页面从 800 行降到 200 行以内
2. **建 layout 配置中心**：settings store + Header 设置按钮 + drawer，支持 TagsView / Breadcrumb / Logo / 侧边栏 / 主题色 / 组件尺寸 切换
3. **试点重构**：选 1 个 List.vue 用新组件重构，验证抽象可行性；其余留 M7-C 闭环时一并重构
4. **不破坏现有 smoke**：3 个 smoke 测试保持绿，新增 layout settings 的 smoke 用例

## 三、关键决策（3 选 1 推荐）

### 3.1 SearchTable API 设计

| 方案                 | 描述                                                                                                   | 评估                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| A 配置驱动           | schema 数组定义列 + 搜索字段，`<SearchTable :schema="..." />` 一行渲染                                 | 高抽象，类似 vben；但 Vue 3 setup 风格下过度配置会失去类型推导 |
| **B 组合式（推荐）** | 提供 `SearchTable` / `SearchToolbar` / `TablePagination` 子组件 + `useCrud` composable，业务用组合拼装 | 灵活，类型友好，符合 Vue 3 习惯；类似 naive-ui-admin           |
| C 插槽为主           | 只提供骨架，业务用插槽填内容                                                                           | 低抽象，重复度仍高                                             |

**推荐 B**：Vue 3 + setup + TypeScript 最适合组合式 API。配置驱动在 TS 下类型推导困难，且业务页面字段差异大时配置比模板更难写。

### 3.2 Layout 配置中心形态

| 方案                                                | 描述                                                                     | 评估                                     |
| --------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------- |
| **A 独立 store + Header 设置按钮 + drawer（推荐）** | `app/stores/layout.ts` 存配置，Header 右上角加齿轮按钮，点开 drawer 调整 | 主流框架标准做法，用户体验好             |
| B 仅 store 无 UI                                    | 用户通过代码改 store                                                     | 开发期方便，运行期不可调，不适合开源演示 |
| C store + 简单 popover                              | 用 el-popover 替代 drawer                                                | 配置项多时 popover 太挤                  |

**推荐 A**：开源项目演示价值高，drawer 容纳更多配置项，与 vben/pure-admin 对齐。

### 3.3 重构范围

| 方案                                | 描述                               | 评估                               |
| ----------------------------------- | ---------------------------------- | ---------------------------------- |
| A 建组件 + 重构 4 个 List.vue       | 一次性完成                         | 风险集中，4 个页面同时改易引入回归 |
| **B 建组件 + 1 个试点重构（推荐）** | 选 user/List.vue 试点，其余留 M7-C | 控制风险，试点验证抽象后再批量推   |
| C 仅建组件不重构                    | 纯增量                             | 现有 800 行重复仍在，M7-C 也要改   |

**推荐 B**：M7-C 本来就要做业务闭环（user/role/dict CRUD 端到端），届时一并重构剩余 3 个 List.vue 自然衔接。本里程碑先用 user/List.vue 验证抽象正确性。

## 四、文件结构设计

### 4.1 通用组件库

```
src/app/components/                  # 全局通用组件层（新增）
├── SearchTable/
│   ├── index.vue                    # 主组件：搜索栏 + 表格 + 分页 骨架
│   ├── SearchToolbar.vue            # 搜索字段 + 操作按钮插槽
│   └── types.ts                     # SearchTableProps / ColumnDef 等
├── FormDrawer/
│   ├── index.vue                    # el-drawer + el-form 骨架
│   └── types.ts                     # FormField / FormDrawerProps
├── PageContainer/
│   └── index.vue                    # el-card + 标题 + 工具栏插槽
└── index.ts                         # 统一导出
```

**为什么放 `app/components/`**：

- 不放 `src/components/`（已删除，ESLint 禁止引用）
- 不放 `src/lib/`（lib 是无 Vue 依赖的基础设施）
- `app/components/` 表示「应用级通用组件」，符合四层架构（lib → app → modules → shared）
- modules 内组件通过 `@/app/components/` 引用

### 4.2 CRUD composable

```
src/app/composables/                 # 全局 composable（新增）
└── useCrud.ts                       # 通用 CRUD 逻辑：list/create/update/delete/batchDelete
```

`useCrud` 封装：

- `listData: Ref<T[]>` / `loading: Ref<boolean>` / `pagination: Reactive<{page, size, total}>`
- `searchForm: Reactive<{}>` / `fetchList()` / `handleSearch()` / `handleReset()`
- `handleDelete(id)` / `handleBatchDelete(ids)` （调 ElMessageBox.confirm）
- 泛型参数 `<T>` 支持业务类型

### 4.3 Layout 配置中心

```
src/app/stores/layout.ts             # 新增：layout 配置 store
src/layout/components/SettingsDrawer.vue  # 新增：设置 drawer
src/layout/components/Header/Index.vue    # 修改：加设置按钮
```

**layout store 字段**：

```ts
interface LayoutState {
  showTagsView: boolean // 默认 true
  showBreadcrumb: boolean // 默认 true
  showLogo: boolean // 默认 true
  showFooter: boolean // 默认 false
  sidebarCollapsed: boolean // 复用 sidebar store，不重复
  theme: 'light' | 'dark' | 'auto' // 复用 theme store
  primaryColor: string // Element Plus 主题色
  componentSize: 'large' | 'default' | 'small'
}
```

**持久化**：用 VueUse `useStorage` 持久化到 localStorage（key: `layout-settings`）。

### 4.4 试点重构

```
src/modules/system/user/views/List.vue  # 修改：从 801 行重构到 < 200 行
```

## 五、SearchTable 组合式 API 设计

### 5.1 用法示例（试点 user/List.vue）

```vue
<template>
  <PageContainer title="用户管理">
    <SearchTable
      :loading="loading"
      :data="listData"
      :columns="columns"
      :pagination="pagination"
      :selected-rows="selectedRows"
      @search="handleSearch"
      @reset="handleReset"
      @page-change="handlePageChange"
      @selection-change="handleSelectionChange"
    >
      <template #search>
        <el-input
          v-model="searchForm.keyword"
          placeholder="用户名/姓名/邮箱"
          clearable
        />
        <el-select v-model="searchForm.role" clearable placeholder="角色">
          <el-option label="管理员" value="admin" />
          <!-- ... -->
        </el-select>
      </template>

      <template #actions>
        <el-button type="primary" :icon="Plus" @click="openDrawer('add')"
          >新增用户</el-button
        >
        <el-button
          :icon="Delete"
          :disabled="!selectedRows.length"
          @click="handleBatchDelete"
          >批量删除</el-button
        >
      </template>

      <template #col-status="{ row }">
        <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
          {{ row.status === 'active' ? '启用' : '禁用' }}
        </el-tag>
      </template>

      <template #col-actions="{ row }">
        <el-button link @click="handleEdit(row)">编辑</el-button>
        <el-button link type="danger" @click="handleDelete(row.id)"
          >删除</el-button
        >
      </template>
    </SearchTable>

    <UserFormDrawer
      v-model="drawerVisible"
      :mode="drawerMode"
      :data="currentRow"
      @success="fetchList"
    />
  </PageContainer>
</template>

<script setup lang="ts">
import { SearchTable, PageContainer } from '@/app/components'
import { useCrud } from '@/app/composables/useCrud'
import {
  fetchUserList,
  deleteUser,
  batchDeleteUsers,
  type UserInfo
} from '../api'

const columns = [
  { prop: 'username', label: '用户名', width: 120 },
  { prop: 'nickname', label: '姓名', width: 120 },
  { prop: 'role', label: '角色', width: 100 },
  { prop: 'status', label: '状态', slot: 'status', width: 100 },
  { prop: 'createTime', label: '创建时间', width: 180 },
  {
    prop: 'actions',
    label: '操作',
    slot: 'actions',
    fixed: 'right',
    width: 150
  }
]

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
} = useCrud<UserInfo>({
  fetch: fetchUserList,
  remove: deleteUser,
  batchRemove: batchDeleteUsers
})

const drawerVisible = ref(false)
const drawerMode = ref<'add' | 'edit'>('add')
const currentRow = ref<UserInfo | null>(null)

const openDrawer = (mode: 'add' | 'edit', row?: UserInfo) => {
  drawerMode.value = mode
  currentRow.value = row ?? null
  drawerVisible.value = true
}

const handleEdit = (row: UserInfo) => openDrawer('edit', row)

onMounted(fetchList)
</script>
```

**预期行数**：模板 ~40 行 + script ~40 行 = ~80 行（原 801 行，降 90%）。

### 5.2 SearchTableProps 类型

```ts
export interface ColumnDef {
  prop: string
  label: string
  width?: number | string
  minWidth?: number | string
  fixed?: 'left' | 'right'
  align?: 'left' | 'center' | 'right'
  slot?: string // 自定义单元格插槽名
  formatter?: (row: any, col: any, value: any) => string
}

export interface SearchTableProps<T = any> {
  loading: boolean
  data: T[]
  columns: ColumnDef[]
  pagination: { page: number; size: number; total: number }
  selectedRows?: T[]
  selectable?: boolean
  rowKey?: string // 默认 'id'
}
```

### 5.3 useCrud 签名

```ts
export interface UseCrudOptions<T> {
  fetch: (
    params: any
  ) => Promise<{ records: T[]; total: number; current: number; size: number }>
  remove?: (id: string) => Promise<any>
  batchRemove?: (ids: string[]) => Promise<any>
  defaultSearchForm?: Record<string, any>
  pageSize?: number // 默认 10
}

export function useCrud<T>(options: UseCrudOptions<T>): {
  listData: Ref<T[]>
  loading: Ref<boolean>
  pagination: Reactive<{ page: number; size: number; total: number }>
  searchForm: Reactive<Record<string, any>>
  selectedRows: Ref<T[]>
  fetchList: () => Promise<void>
  handleSearch: () => void
  handleReset: () => void
  handlePageChange: (page: number, size: number) => void
  handleSelectionChange: (rows: T[]) => void
  handleDelete: (id: string) => Promise<void>
  handleBatchDelete: () => Promise<void>
}
```

## 六、FormDrawer 设计

### 6.1 用法

```vue
<FormDrawer
  v-model="visible"
  :title="mode === 'add' ? '新增用户' : '编辑用户'"
  :form-data="formData"
  :fields="fields"
  :rules="rules"
  :loading="submitting"
  @submit="handleSubmit"
/>
```

### 6.2 FormField 类型

```ts
export interface FormField {
  prop: string
  label: string
  type:
    | 'input'
    | 'select'
    | 'radio'
    | 'checkbox'
    | 'switch'
    | 'date'
    | 'textarea'
    | 'number'
  options?: { label: string; value: any }[]
  placeholder?: string
  default?: any
  span?: number // 栅格，默认 24
}

export interface FormDrawerProps {
  modelValue: boolean
  title: string
  formData: Record<string, any>
  fields: FormField[]
  rules?: Record<string, any>
  loading?: boolean
  width?: string // 默认 '500px'
}
```

**取舍**：FormDrawer 用配置驱动（fields 数组）而非纯插槽。理由：表单字段类型有限，配置驱动比纯插槽更省代码；复杂字段仍可通过 slot 扩展（`#field-<prop>`）。

## 七、Layout 配置中心设计

### 7.1 layout store

```ts
// src/app/stores/layout.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useStorage } from '@vueuse/core'

export const useLayoutStore = defineStore('layout', () => {
  const showTagsView = useStorage('layout:showTagsView', true)
  const showBreadcrumb = useStorage('layout:showBreadcrumb', true)
  const showLogo = useStorage('layout:showLogo', true)
  const showFooter = useStorage('layout:showFooter', false)
  const primaryColor = useStorage('layout:primaryColor', '#409EFF')
  const componentSize = useStorage('layout:componentSize', 'default')

  const setShowTagsView = (v: boolean) => {
    showTagsView.value = v
  }
  // ... 其余 setter

  return {
    showTagsView,
    showBreadcrumb,
    showLogo,
    showFooter,
    primaryColor,
    componentSize,
    setShowTagsView // ...
  }
})
```

### 7.2 SettingsDrawer

```vue
<!-- src/layout/components/SettingsDrawer.vue -->
<template>
  <el-drawer v-model="visible" title="布局设置" size="320px">
    <el-divider>界面显示</el-divider>
    <div class="setting-item">
      <span>显示 TagsView</span>
      <el-switch v-model="layoutStore.showTagsView" />
    </div>
    <div class="setting-item">
      <span>显示面包屑</span>
      <el-switch v-model="layoutStore.showBreadcrumb" />
    </div>
    <div class="setting-item">
      <span>显示 Logo</span>
      <el-switch v-model="layoutStore.showLogo" />
    </div>
    <div class="setting-item">
      <span>显示页脚</span>
      <el-switch v-model="layoutStore.showFooter" />
    </div>

    <el-divider>主题</el-divider>
    <div class="setting-item">
      <span>主题色</span>
      <el-color-picker v-model="layoutStore.primaryColor" />
    </div>
    <div class="setting-item">
      <span>组件大小</span>
      <el-radio-group v-model="layoutStore.componentSize" size="small">
        <el-radio-button value="large">大</el-radio-button>
        <el-radio-button value="default">默认</el-radio-button>
        <el-radio-button value="small">小</el-radio-button>
      </el-radio-group>
    </div>
  </el-drawer>
</template>
```

### 7.3 Header 改造

`src/layout/components/Header/Index.vue` 加设置按钮：

```vue
<el-icon class="cursor-pointer" @click="settingsVisible = true">
  <Setting />
</el-icon>
<SettingsDrawer v-model="settingsVisible" />
```

### 7.4 应用配置

`src/app/main.ts` 用 layout store 的 `primaryColor` / `componentSize` 配置 Element Plus：

```ts
// 在 app.use(ElementPlus, { locale }) 后
const layoutStore = useLayoutStore()
watch(
  () => layoutStore.primaryColor,
  (color) => {
    document.documentElement.style.setProperty('--el-color-primary', color)
  },
  { immediate: true }
)

app.provide('elConfig', { size: computed(() => layoutStore.componentSize) })
```

在 App.vue 用 `el-config-provider` 包裹：

```vue
<el-config-provider :locale="locale" :size="elSize">
  <RouterView />
</el-config-provider>
```

### 7.5 layout 组件消费 store

- `Layout/Index.vue`：`v-if="layoutStore.showTagsView"` 包裹 TagsView
- `Header/Index.vue`：`v-if="layoutStore.showBreadcrumb"` 包裹 Breadcrumb
- `Sidebar/Index.vue`：`v-if="layoutStore.showLogo"` 包裹 Logo
- `Layout/Index.vue`：`v-if="layoutStore.showFooter"` 包裹 Footer

## 八、Smoke Test 扩展

新增 2 个 smoke 用例到 `test/smoke/auth.spec.ts`（或新建 `test/smoke/layout.spec.ts`）：

```ts
test('layout 设置 drawer 可开关 TagsView', async ({ page }) => {
  // 登录
  await page.goto('login')
  await page.getByRole('textbox', { name: '用户名' }).fill('admin')
  await page.getByRole('textbox', { name: '密码' }).fill('123456')
  await page.getByRole('button', { name: '登录' }).click()

  // 默认 TagsView 可见
  await expect(page.locator('.tags-view-container')).toBeVisible()

  // 打开设置 drawer
  await page.getByRole('button', { name: '布局设置' }).click()
  await expect(page.getByText('布局设置')).toBeVisible()

  // 关闭 TagsView
  await page
    .locator('.setting-item', { hasText: '显示 TagsView' })
    .locator('.el-switch')
    .click()

  // TagsView 消失
  await expect(page.locator('.tags-view-container')).not.toBeVisible()
})

test('user 列表用 SearchTable 渲染正常', async ({ page }) => {
  // 登录 + 进入 user 列表
  await page.goto('login')
  await page.getByRole('textbox', { name: '用户名' }).fill('admin')
  await page.getByRole('textbox', { name: '密码' }).fill('123456')
  await page.getByRole('button', { name: '登录' }).click()
  await page.goto('system/user')

  // SearchTable 渲染
  await expect(page.locator('.el-table')).toBeVisible()
  await expect(page.locator('.el-pagination')).toBeVisible()
  await expect(page.locator('.search-toolbar')).toBeVisible()
})
```

## 九、实施顺序（TDD 节奏）

| #   | 步骤                                                          | 验证             |
| --- | ------------------------------------------------------------- | ---------------- |
| 1   | 建 `app/components/` 与 `app/composables/` 目录骨架           | type-check 通过  |
| 2   | 写 `useCrud` composable + 单测                                | 单测绿           |
| 3   | 写 `PageContainer` 组件 + 单测                                | 单测绿           |
| 4   | 写 `SearchTable` 组件 + 单测                                  | 单测绿           |
| 5   | 写 `FormDrawer` 组件 + 单测                                   | 单测绿           |
| 6   | 试点重构 `user/List.vue` 用新组件                             | smoke + 手动验证 |
| 7   | 建 `app/stores/layout.ts`                                     | type-check       |
| 8   | 写 `SettingsDrawer.vue` + 接入 Header                         | smoke + 手动     |
| 9   | layout 组件消费 store（TagsView/Breadcrumb/Logo/Footer 显隐） | smoke + 手动     |
| 10  | main.ts 接 primaryColor / componentSize                       | 手动验证主题切换 |
| 11  | 扩展 smoke：layout 设置 + SearchTable 渲染                    | 5 smoke 全绿     |
| 12  | 同步文档：CLAUDE.md / ARCHITECTURE.md / README.md             | 文档一致         |

每步独立 commit + smoke 验证。

## 十、DoD（完成定义）

- [ ] `app/components/` 含 SearchTable / FormDrawer / PageContainer 三组件，均有单测
- [ ] `app/composables/useCrud.ts` 含完整 CRUD 逻辑，有单测
- [ ] `app/stores/layout.ts` 含 6 个配置字段，持久化到 localStorage
- [ ] `SettingsDrawer.vue` 接入 Header，可开关 4 个显隐项 + 主题色 + 组件大小
- [ ] layout 组件（TagsView/Breadcrumb/Logo/Footer）消费 store 实现显隐
- [ ] main.ts 接 primaryColor（CSS 变量）+ componentSize（el-config-provider）
- [ ] `user/List.vue` 重构后 < 200 行，功能与原版一致（手动冒烟 5 项：列表加载/搜索/新增/编辑/删除）
- [ ] smoke 5 个用例全绿（原 3 + 新 2）
- [ ] lint / type-check / test / build 全绿
- [ ] CI smoke job 跑通
- [ ] 文档同步：CLAUDE.md / ARCHITECTURE.md / README.md 反映新组件与 layout 配置

## 十一、不做的事（YAGNI）

- **不**重构其余 3 个 List.vue（admin/role/permission）→ 留 M7-C 业务闭环时一并做
- **不**做主题色预设面板（多套配色切换）→ 留观察
- **不**做水印 / 多语言 / 面包屑图标 → 留观察
- **不**做 SearchTable 的列拖拽 / 列固定 / 列显隐 → 留观察
- **不**做 FormDrawer 的复杂联动（字段间依赖）→ 留观察
- **不**引入 Storybook / Histoire 展示组件 → 留 L3 平台化

## 十二、风险与对策

| 风险                                            | 对策                                                               |
| ----------------------------------------------- | ------------------------------------------------------------------ |
| `useCrud` 泛型与业务类型不匹配                  | 试点 user/List.vue 时暴露问题，及时调整签名                        |
| SearchTable 插槽设计不够灵活，试点页面塞不下    | 试点时若发现插槽不足，立即扩展插槽而非绕过                         |
| layout store 持久化与 SSR 冲突                  | 项目无 SSR，不预防；若未来加 SSR 用 `import.meta.client` 守卫      |
| primaryColor CSS 变量覆盖不全 Element Plus 组件 | 用 Element Plus 官方推荐的主题色变量 `--el-color-primary` + 派生色 |
| 试点重构破坏 user/List.vue 现有功能             | smoke + 手动冒烟 5 项逐一验证，回归立即回滚                        |

## 十三、工作量预估

| 项                                              | 时间          |
| ----------------------------------------------- | ------------- |
| useCrud composable + 单测                       | 1 小时        |
| PageContainer + SearchTable + FormDrawer + 单测 | 3 小时        |
| 试点重构 user/List.vue                          | 1.5 小时      |
| layout store + SettingsDrawer + Header 接入     | 1.5 小时      |
| layout 组件消费 store                           | 1 小时        |
| main.ts 主题色 / 组件大小接入                   | 0.5 小时      |
| smoke 扩展 + 文档                               | 1 小时        |
| **合计**                                        | **~9.5 小时** |

## 十四、后续里程碑

- **M7-C**：业务页面闭环验证
  - 重构 admin/role/permission/dict 4 个 List.vue 用 SearchTable
  - user/role/dict CRUD 端到端跑通（含表单校验、批量操作、导出）
  - system/menu CRUD 实现（M7-A 占位的页面）
  - 每个模块补 smoke 用例
- **M5.3**：MSW 迁移，smoke 切回 production preview
- **tag v0.1.0-rc.2**：M7-B + M7-C 验证稳定后打标签
