# ErrorBoundary

捕获子组件树渲染期间抛出的错误，展示 fallback UI 并支持重试，避免单个组件崩溃导致整页白屏。

::: tip 何时用
包裹「可能抛错」的子树，例如第三方图表、动态加载的复杂面板、依赖外部数据的局部 UI。错误会被捕获并上报到 `monitor`（通过 `inject('monitor')` 注入），不会冒泡到全局错误处理。
:::

## 基础用法

用 `ErrorBoundary` 包裹任意子组件：

```vue
<script setup lang="ts">
import ErrorBoundary from '@/lib/error/ErrorBoundary.vue'
import RiskyChart from './RiskyChart.vue'
</script>

<template>
  <ErrorBoundary>
    <RiskyChart :data="data" />
  </ErrorBoundary>
</template>
```

子组件渲染出错时，`ErrorBoundary` 会显示 `el-result` 错误页与「重试」按钮，替代默认插槽内容。

## 自定义文案

通过 `title` 与 `message` 覆盖默认错误文案；`message` 不传时回退为捕获到的 `error.message`：

```vue
<ErrorBoundary
  title="图表加载失败"
  message="数据格式异常，请稍后重试"
>
  <RiskyChart :data="data" />
</ErrorBoundary>
```

## 重试防循环

`maxRetries` 控制同一错误的最大重试次数（默认 `3`）：

- 同一错误（`name + message` 相同）每抛出一次，内部计数 `+1`
- 计数达到 `maxRetries` 后「重试」按钮禁用，并提示「错误反复发生，请刷新页面或联系管理员」
- 切换到不同的错误会重置计数为 `1`

```vue
<ErrorBoundary :max-retries="5">
  <RiskyChart :data="data" />
</ErrorBoundary>
```

## 错误上报

组件内部通过 `inject('monitor')` 获取监控实例，在 `onErrorCaptured` 中调用 `monitor.captureException(errObj)` 上报。`monitor` 通常在 `main.ts` 通过 `provide('monitor', monitorInstance)` 注入。

::: warning 阻断冒泡
`onErrorCaptured` 返回 `false`，错误不会继续向父组件或全局 `app.config.errorHandler` 冒泡，确保局部错误只影响局部 UI。
:::

## API

### Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | `'页面出错了'` | 错误页标题 |
| `message` | `string` | — | 错误描述；不传时回退为捕获到的 `error.message`，再为空字符串 |
| `maxRetries` | `number` | `3` | 同一错误的最大重试次数；达到后禁用重试按钮 |

### Events

无。

### Slots

| 名称 | 说明 |
| --- | --- |
| `default` | 正常渲染的子树；发生错误时被 fallback UI 替换 |

### Exposed（defineExpose）

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `error` | `Ref<Error \| null>` | 当前捕获到的错误，无错误时为 `null` |
| `retryCount` | `Ref<number>` | 当前错误的重试计数 |
