# StatusTag

用于展示状态枚举，自动把状态值映射为带颜色的 `el-tag`，避免在业务页面反复写 `v-if` 判断状态色。

::: tip 何时用
任何需要把 `active/inactive`、`1/0`、`success/failed` 等状态枚举渲染成标签的场景。内置 15+ 常见状态映射，未命中时回退为 `info` 色并显示原值。
:::

## 基础用法

直接传 `status`，命中内置映射即自动着色：

```vue
<script setup lang="ts">
import { StatusTag } from '@/app/components'
</script>

<template>
  <StatusTag status="active" />
  <StatusTag status="inactive" />
  <StatusTag status="pending" />
  <StatusTag status="failed" />
</template>
```

## 支持的状态类型

`status` 支持 `string | number | boolean`，内置映射覆盖：

| 类型 | 取值 | 标签色 | 显示文本 |
| --- | --- | --- | --- |
| 启用/禁用 | `active` / `inactive` | success / info | 启用 / 禁用 |
| 布尔 | `true` / `false` | success / info | 是 / 否 |
| 数字 | `1` / `0` | success / info | 启用 / 禁用 |
| 通用状态 | `success` / `failed` / `error` / `pending` / `processing` / `completed` / `cancelled` / `deleted` | success / danger / danger / warning / primary / success / info / danger | 成功 / 失败 / 错误 / 待处理 / 处理中 / 已完成 / 已取消 / 已删除 |
| 用户角色 | `admin` / `user` / `vip` | danger / primary / warning | 管理员 / 普通用户 / VIP |

未命中的状态值回退为 `info` 色，文本显示原值。

## 自定义映射

通过 `statusMap` 扩展或覆盖内置映射，`statusMap` 会与默认映射合并（同名 key 覆盖默认）：

```vue
<script setup lang="ts">
import { StatusTag } from '@/app/components'

const statusMap = {
  running: { type: 'primary', text: '运行中' },
  stopped: { type: 'info', text: '已停止' },
  // 覆盖内置 active
  active: { type: 'success', text: '在线' }
}
</script>

<template>
  <StatusTag status="running" :status-map="statusMap" />
  <StatusTag status="stopped" :status-map="statusMap" />
</template>
```

## 自定义文本

`text` 优先级最高，传后不再查映射表：

```vue
<StatusTag status="active" text="正常" />
```

## 尺寸与效果

`size` 与 `effect` 透传给 `el-tag`：

```vue
<StatusTag status="active" size="default" effect="dark" />
<StatusTag status="pending" size="large" effect="plain" />
```

## API

### Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `status` | `string \| number \| boolean` | `''` | 状态值，用于查映射表决定颜色与文本 |
| `statusMap` | `Record<string, { type: string; text: string }>` | `{}` | 自定义状态映射，与内置映射合并（同名 key 覆盖默认） |
| `text` | `string` | `''` | 自定义显示文本；非空时优先于映射表 |
| `size` | `'large' \| 'default' \| 'small'` | `'small'` | 标签尺寸，透传 `el-tag` |
| `effect` | `'dark' \| 'light' \| 'plain'` | `'light'` | 标签主题，透传 `el-tag` |

### Events

无。

### Slots

无。
