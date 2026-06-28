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

<script setup>
import SearchTableDemoBasic from './demos/SearchTableDemoBasic.vue'
import SearchTableDemoLoading from './demos/SearchTableDemoLoading.vue'
import SearchTableDemoSelectable from './demos/SearchTableDemoSelectable.vue'
</script>
