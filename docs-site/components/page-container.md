# PageContainer

`PageContainer` 是业务页面的标准容器，提供标题卡片 + 主体卡片两段式布局。

::: tip 何时用
所有 List / 详情页都应包裹 `PageContainer`，保证视觉一致性。
:::

## 基础用法

仅 `title` 属性。

<div class="demo-block">
  <PageContainerDemoBasic />
</div>

## 带工具栏

通过 `#header` slot 在标题右侧放置操作按钮。

<div class="demo-block">
  <PageContainerDemoHeader />
</div>

## 无标题

不传 `title` 时只渲染 body 卡片。

<div class="demo-block">
  <PageContainerDemoNoTitle />
</div>

<script setup>
import PageContainerDemoBasic from './demos/PageContainerDemoBasic.vue'
import PageContainerDemoHeader from './demos/PageContainerDemoHeader.vue'
import PageContainerDemoNoTitle from './demos/PageContainerDemoNoTitle.vue'
</script>
