# FormDrawer

`FormDrawer` 是配置驱动的表单抽屉，支持 `add` / `edit` / `view` 三种模式、声明式 `dependencies` 联动、字段级 `rules` 校验。

## add 模式

新填表单，所有字段可编辑。

<div class="demo-block">
  <FormDrawerDemoAdd />
</div>

## edit 模式

预填值，字段可编辑。

<div class="demo-block">
  <FormDrawerDemoEdit />
</div>

## view 模式

只读，footer 仅显示「关闭」。

<div class="demo-block">
  <FormDrawerDemoView />
</div>

## 声明式联动

`dependencies` 配置字段显隐。

<div class="demo-block">
  <FormDrawerDemoDeps />
</div>

<script setup>
import FormDrawerDemoAdd from './demos/FormDrawerDemoAdd.vue'
import FormDrawerDemoEdit from './demos/FormDrawerDemoEdit.vue'
import FormDrawerDemoView from './demos/FormDrawerDemoView.vue'
import FormDrawerDemoDeps from './demos/FormDrawerDemoDeps.vue'
</script>
