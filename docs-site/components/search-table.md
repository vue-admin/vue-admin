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

<script setup>
import SearchTableDemoBasic from './demos/SearchTableDemoBasic.vue'
import SearchTableDemoLoading from './demos/SearchTableDemoLoading.vue'
import SearchTableDemoSelectable from './demos/SearchTableDemoSelectable.vue'
</script>
