# Selectors 选择器族

业务表单中频繁出现的「选角色 / 选用户 / 选部门」场景，已沉淀为三个统一封装的选择器组件，均从 `@/app/components` 导出：

- `RoleSelector` —— 角色选择（一次加载全量）
- `UserSelector` —— 用户选择（远程搜索，懒加载）
- `DeptSelector` —— 部门选择（el-tree-select 树形）

## 统一接口

三个组件共享一致的 props，遵循 `v-model` 双向绑定：

| Prop | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `modelValue` | `string \| string[] \| undefined` | — | v-model 绑定值，单选为 id，多选为 id 数组 |
| `multiple` | `boolean` | `false` | 是否多选 |
| `disabled` | `boolean` | `false` | 禁用 |
| `clearable` | `boolean` | `true` | 可清空 |
| `placeholder` | `string` | 各组件默认 | 占位文案 |
| `onlyActive` | `boolean` | `false` | 仅展示/可选启用项（inactive 禁用或过滤） |

事件：`update:modelValue` / `change`。

## 用法

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { RoleSelector, UserSelector, DeptSelector } from '@/app/components'

const roleId = ref<string>()
const userIds = ref<string[]>([])
const deptId = ref<string>()
</script>

<template>
  <RoleSelector v-model="roleId" />
  <UserSelector v-model="userIds" multiple />
  <DeptSelector v-model="deptId" only-active />
</template>
```

## 组件差异

### RoleSelector

角色数量通常较少且更新频率低，挂载时一次性拉取（`size=200`），`filterable` 本地过滤。`onlyActive` 时请求参数带 `status=active`。

### UserSelector

用户量大，采用**远程搜索**：

- 挂载后预加载首页（`page=1, size=20`），首次展开若未加载则触发
- 输入关键词经 `useDebounceFn` 300ms 防抖后发起 `keyword` 查询
- label 形如 `姓名（用户名）`，inactive 用户禁用

### DeptSelector

部门是树形结构，封装为 `el-tree-select`：

- 挂载时拉取 `fetchDeptTree`，`onlyActive` 时 inactive 节点置灰
- 支持 `multiple`（显示 checkbox，父子联动）

## 在 FormDrawer 中使用

利用 FormDrawer 的 `field-${prop}` 插槽，可在声明式字段中嵌入 Selector，免去手动加载树/列表：

```vue
<FormDrawer :fields="fields" :form-data="formData">
  <template #field-parentId>
    <DeptSelector v-model="formData.parentId" :disabled="mode === 'view'" />
  </template>
</FormDrawer>
```

对应字段占位声明（仅用于 label/span 计算）：

```ts
{ prop: 'parentId', label: '上级部门', type: 'treeSelect' }
```

## API

### 通用 Props

`RoleSelector` / `UserSelector` / `DeptSelector` 三个组件共享以下 props：

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `modelValue` | `string \| string[] \| undefined` | — | v-model 绑定值，单选为 id，多选为 id 数组 |
| `multiple` | `boolean` | `false` | 是否多选 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `clearable` | `boolean` | `true` | 是否可清空 |
| `placeholder` | `string` | — | 占位文案；未传时分别走 `selectRole` / `selectUser` / `selectDept` 的 i18n 默认 |
| `onlyActive` | `boolean` | `false` | 仅展示/可选启用项；`RoleSelector` / `UserSelector` 请求带 `status=active`，`DeptSelector` 将 inactive 节点置灰 |

### 通用 Events

| 事件名 | 参数 | 说明 |
| --- | --- | --- |
| `update:modelValue` | `(value: string \| string[] \| undefined)` | 选中值变化（v-model） |
| `change` | `(value: string \| string[] \| undefined)` | 选中值变化 |

### 组件特有 Props

#### UserSelector

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `pageSize` | `number` | `20` | 远程搜索每页条数 |

`RoleSelector` 与 `DeptSelector` 无特有 props。

::: tip 远程搜索
`UserSelector` 远程搜索为内置行为（`remote` 固定为 `true`，关键词经 300ms 防抖），无对外开关；如需控制每页返回量，调整 `pageSize`。
:::
