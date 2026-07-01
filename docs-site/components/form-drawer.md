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

## API

### Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `modelValue` | `boolean` | — | 是否显示抽屉，v-model（必填） |
| `title` | `string` | — | 抽屉标题（必填） |
| `formData` | `Record<string, unknown>` | — | 表单数据对象，字段值双向引用（必填） |
| `fields` | `FormField[]` | — | 字段定义（必填） |
| `rules` | `Record<string, FormFieldRule[]>` | — | el-form 级校验规则 |
| `loading` | `boolean` | `false` | 提交 loading，控制确认按钮与字段禁用 |
| `width` | `string` | `'500px'` | 抽屉宽度 |
| `mode` | `'add' \| 'edit' \| 'view'` | `'add'` | 抽屉模式；`view` 时全字段禁用且 footer 仅显示「关闭」 |

### Events

| 事件名 | 参数 | 说明 |
| --- | --- | --- |
| `update:modelValue` | `(value: boolean)` | 抽屉显隐变化 |
| `submit` | `(data: Record<string, unknown>)` | 点击「确认」且表单校验通过后触发，`data` 为 `formData` 的浅拷贝 |

### Slots

| 名称 | 说明 |
| --- | --- |
| `field-<prop>` | 自定义某个字段的控件，`<prop>` 对应 `FormField.prop`；作用域参数：`field: FormField` |

::: tip
组件 footer 由内部根据 `mode` 渲染（`view` 仅「关闭」，其余为「取消」「确认」），未对外暴露 footer 插槽。
:::

### 暴露方法

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `validateField` | `(prop: string) => Promise<void>` | 手动触发某字段校验，用于联动后重校验关联字段 |

### FormField 类型

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `prop` | `string` | — | 字段名（必填） |
| `label` | `string` | — | 标签（必填） |
| `type` | `FormFieldType` | — | 控件类型（必填），见下 |
| `options` | `FormFieldOption[]` | — | `select` / `radio` 的选项 |
| `treeData` | `TreeNodeData[]` | — | `treeSelect` 的树形数据 |
| `treeProps` | `{ label: string; children: string; disabled?: string }` | — | `treeSelect` 的节点 props |
| `placeholder` | `string` | — | 占位文案，默认走 i18n |
| `default` | `unknown` | — | 字段默认值 |
| `span` | `number` | `24` | el-col span |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `dependencies` | `FormFieldDependency[]` | — | 声明式联动；所有 `dependency.show` 返回 `true` 时字段才可见 |
| `rules` | `FormFieldRule[]` | — | 字段级校验规则，透传到 `el-form-item` |

`FormFieldType` 取值：`input` / `textarea` / `number` / `select` / `radio` / `checkbox` / `switch` / `date` / `password` / `treeSelect` / `cascader`。

### FormFieldDependency 类型

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `trigger` | `string` | 触发字段名 |
| `show` | `(values: Record<string, unknown>, ctx: { mode: FormDrawerMode }) => boolean` | 返回 `true` 时字段可见，`values` 为 `formData` |

<script setup>
import FormDrawerDemoAdd from './demos/FormDrawerDemoAdd.vue'
import FormDrawerDemoEdit from './demos/FormDrawerDemoEdit.vue'
import FormDrawerDemoView from './demos/FormDrawerDemoView.vue'
import FormDrawerDemoDeps from './demos/FormDrawerDemoDeps.vue'
</script>
