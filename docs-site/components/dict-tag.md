# DictTag

把字典编码值渲染为带颜色的 `el-tag`，由调用方传入字典列表（`options`），组件按 `value` 查表得到 `label` 与颜色 `type`。

::: tip 何时用
后端返回的是字典项的 value（如 `'0'` / `'1'`），需要在前端展示成「男 / 女」「启用 / 禁用」等可读标签时使用。字典列表通常来自 `useDict` 或模块内一次性拉取。
:::

::: warning 与 StatusTag 的区别
`StatusTag` 内置一套通用状态映射，直接传 `status` 即可；`DictTag` 不内置任何映射，必须由调用方通过 `options` 提供字典项，适合「业务字典」场景。
:::

## 基础用法

传入 `options` 字典列表与 `value` 当前值：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { DictTag } from '@/app/components'

const genderOptions = [
  { value: 0, label: '男', type: 'primary' },
  { value: 1, label: '女', type: 'danger' },
  { value: 2, label: '未知', type: 'info' }
]
const value = ref<number>(0)
</script>

<template>
  <DictTag :value="value" :options="genderOptions" />
</template>
```

## 在表格列中使用

`DictTag` 的 `size` 默认为 `small`，正好适合塞进 `el-table` 列：

```vue
<el-table-column label="状态" prop="status">
  <template #default="{ row }">
    <DictTag :value="row.status" :options="statusOptions" />
  </template>
</el-table-column>
```

```ts
const statusOptions = [
  { value: 'active', label: '启用', type: 'success' },
  { value: 'inactive', label: '禁用', type: 'info' }
]
```

## 字典项未命中时

当 `value` 在 `options` 中找不到时，`type` 回退为 `info`，文本回退为 `String(value)`，保证不空白。

## API

### Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `value` | `string \| number` | — | **必填**。字典值，用于在 `options` 中查找 |
| `options` | `DictItem[]` | — | **必填**。字典列表 |
| `size` | `'large' \| 'default' \| 'small'` | `'small'` | 标签尺寸，透传 `el-tag` |

`DictItem` 结构：

```ts
interface DictItem {
  value: string | number  // 字典值
  label: string           // 显示文本
  type?: string           // el-tag 类型：success / info / warning / danger / primary，缺省 'info'
}
```

### Events

无。

### Slots

无。
