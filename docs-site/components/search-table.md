# SearchTable

`SearchTable` 是列表页通用组件，封装了「搜索栏 + 表格 + 分页」三段式布局，配合 `useCrud` composable 接管状态。

## 基础列表

最小可用：data + columns + pagination。

<div class="demo-block">
  <SearchTableDemoBasic />
</div>

## loading 状态

切换 `loading` 展示骨架屏。

<div class="demo-block">
  <SearchTableDemoLoading />
</div>

## 可勾选

`selectable` 启用复选列。

<div class="demo-block">
  <SearchTableDemoSelectable />
</div>

## 列设置（字段显隐）

SearchTable 自带列设置入口（工具栏「列设置」按钮），用户可勾选每列是否显示，并提供「全部显示」快捷重置。

| 配置 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `showColumnSettings` | `boolean` | `true` | 是否显示「列设置」入口 |
| `columnSettingsKey` | `string` | — | 传入后，列显隐将按此 key 持久化到 `localStorage` |

列定义 `ColumnDef` 增加两个可选字段：

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `hideable` | `boolean` | `true` | 设为 `false` 则该列始终显示，不出现在列设置中（如主操作列） |
| `defaultHidden` | `boolean` | `false` | 初次加载（且无 localStorage 记忆）时是否默认隐藏 |

```ts
const columns = [
  { prop: 'name', label: '名称' },
  { prop: 'email', label: '邮箱', defaultHidden: true }, // 默认隐藏，可手动开启
  { prop: 'actions', label: '操作', hideable: false }     // 始终显示
]
```

建议为每个使用页传入唯一的 `columnSettingsKey`（如 `'system-user-list'`），让用户的列偏好跨会话保留。

## API

### Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `loading` | `boolean` | — | 表格加载状态（必填） |
| `data` | `Record<string, unknown>[]` | — | 表格数据（必填） |
| `columns` | `ColumnDef[]` | — | 列定义（必填） |
| `pagination` | `{ page: number; size: number; total: number }` | — | 分页信息（必填） |
| `selectedRows` | `Record<string, unknown>[]` | — | 已选中行（声明于类型，组件通过 `selection-change` 事件向外同步） |
| `selectable` | `boolean` | `false` | 是否显示多选列 |
| `rowKey` | `string` | `'id'` | 行唯一标识字段 |
| `title` | `string` | — | 表格标题 |
| `treeProps` | `{ children?: string; hasChildren?: string }` | — | 树形表格配置 |
| `defaultExpandAll` | `boolean` | `false` | 默认展开所有行 |
| `columnSettingsKey` | `string` | — | 列设置持久化 key，传入后列显隐记忆到 `localStorage` |
| `showColumnSettings` | `boolean` | `true` | 是否显示「列设置」入口 |

### Events

| 事件名 | 参数 | 说明 |
| --- | --- | --- |
| `search` | — | 点击搜索按钮 |
| `reset` | — | 点击重置按钮 |
| `page-change` | `(page: number, size: number)` | 当前页或每页条数变化 |
| `selection-change` | `(rows: Record<string, unknown>[])` | 行选择变化 |

::: tip 事件名写法
组件以 `defineEmits` 声明为 camelCase（`pageChange` / `selectionChange`），模板监听可用 kebab-case（`@page-change` / `@selection-change`）或 camelCase，二者等价。
:::

### Slots

| 名称 | 说明 |
| --- | --- |
| `search` | 搜索栏内容，组件自动追加「搜索」「重置」按钮 |
| `actions` | 标题栏右侧操作区，位于「列设置」按钮之前 |
| `col-<name>` | 自定义列单元格渲染，`<name>` 对应 `ColumnDef.slot`；作用域参数：`row`、`index` |

### ColumnDef 类型

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `prop` | `string` | — | 字段名（必填） |
| `label` | `string` | — | 列标题（必填） |
| `width` | `number \| string` | — | 列宽 |
| `minWidth` | `number \| string` | — | 最小列宽 |
| `fixed` | `'left' \| 'right'` | — | 固定列 |
| `align` | `'left' \| 'center' \| 'right'` | `'left'` | 对齐方式 |
| `slot` | `string` | — | 自定义渲染的插槽名（渲染到 `col-<slot>` 插槽） |
| `formatter` | `(row, col, value) => string` | — | 格式化函数 |
| `hideable` | `boolean` | `true` | 设为 `false` 则该列始终显示，不进入列设置 |
| `defaultHidden` | `boolean` | `false` | 初次加载（且无 localStorage 记忆）时是否默认隐藏 |

<script setup>
import SearchTableDemoBasic from './demos/SearchTableDemoBasic.vue'
import SearchTableDemoLoading from './demos/SearchTableDemoLoading.vue'
import SearchTableDemoSelectable from './demos/SearchTableDemoSelectable.vue'
</script>
