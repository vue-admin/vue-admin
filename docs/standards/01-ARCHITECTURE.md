# 架构规范

> 本文档规定项目的**目录结构、组件分层、依赖方向**。命名细节见 [04-NAMING.md](./04-NAMING.md)。

## 一、顶层目录

```
vue-admin/
├── docs/                 # 所有文档
│   └── standards/        # 规范文档集（本目录）
├── public/               # 静态资源（直接拷贝）
├── src/
│   ├── apis/             # API 接口封装（按业务域分目录）
│   ├── assets/           # 会被构建处理的资源
│   ├── components/       # 跨页面公共组件
│   ├── layout/           # 布局组件
│   ├── mock/             # Mock API
│   ├── router/           # 路由配置
│   ├── stores/           # Pinia store
│   ├── utils/            # 纯函数工具
│   ├── views/            # 业务页面
│   ├── App.vue
│   └── main.ts
├── .github/              # CI / Issue 模板
├── CLAUDE.md             # AI 工程上下文索引
├── CONTRIBUTING.md       # 贡献指南
└── README.md
```

## 二、`src/apis/` 业务域划分

每个业务域一个目录，**禁止**所有 API 平铺在根下。

```
src/apis/
├── client/               # HTTP 客户端（仅 service 单例）
│   ├── service.ts        # 业务级 HTTP 客户端
│   └── request.ts        # 仅类型定义
├── common.ts             # 全局通用类型
└── <domain>/             # 业务域：user / role / dict / ...
    └── index.ts
```

API 函数命名：`fetch / create / update / delete / batchDelete` + `<Domain>`。详见 [02-API.md](./02-API.md)。

## 三、`src/components/` 公共组件分层

按"功能域"分子目录，**不**按"页面归属"。

| 子目录 | 职责 | 可依赖 |
|--------|------|--------|
| `base/` | 通用 UI 原子（Form、Table、Search） | Element Plus、utils |
| `business/` | 跨页面复用的业务块 | 基础组件、apis、stores |
| `icons/` | SVG / 图标封装 | - |

依赖方向：**业务 → 基础**，禁止反向。基础组件禁止 `import service`。

## 四、`src/views/` 业务页面

按业务域分子目录，复杂页面拆分。

```
src/views/
├── system/
│   ├── user/
│   ├── role/
│   └── dict/
│       ├── List.vue          # 列表容器（编排）
│       ├── DictTree.vue      # 子视图
│       ├── DictDetail.vue
│       ├── DictFormDrawer.vue
│       └── hooks/
│           └── useDictTree.ts
└── Login.vue
```

### 复杂页面拆分红线

| 信号 | 动作 |
|------|------|
| `.vue` 文件 > 300 行 | 考虑拆 |
| `.vue` 文件 > 500 行 | **必须拆**，PR 不通过 |
| template > 100 行 | 抽 sub-component |
| 3+ 独立交互区 | 拆为容器 + 子视图 |

拆分模板：

```
List.vue                  # 容器
<Feature>.vue             # 子视图
<Feature>Drawer.vue       # 弹窗
<Feature>Form.vue         # 表单
hooks/use<Feature>.ts     # 业务逻辑（与 UI 解耦）
types.ts                  # 仅当类型定义 > 50 行时拆出
```

## 五、`src/stores/` 状态管理

一个业务域一个 store 文件，命名 `use<Domain>Store`。

详见 [03-STATE.md](./03-STATE.md)。

## 六、`src/utils/` 工具函数

只放**纯函数**：无副作用、不依赖 Vue 响应式、可被任何上下文调用。

需要响应式的工具放 `src/composables/`（待建）。

## 七、组件设计原则

### 7.1 必须使用 `<script setup>` + TypeScript

```vue
<script lang="ts" setup>
interface Props {
  data: User[]
  loading?: boolean
}
const props = withDefaults(defineProps<Props>(), { loading: false })

const emit = defineEmits<{
  (e: 'update', value: User): void
}>()
</script>
```

禁止 Options API、禁止 `any`、禁止 `as unknown as T` 双重断言。

### 7.2 文件内顺序

```vue
<template> ... </template>
<style scoped> ... </style>
<script lang="ts" setup> ... </script>
```

> 当前项目沿用此顺序，**新文件保持一致**。

### 7.3 单向数据流

- 子组件 **不得直接修改** props
- "双向绑定"用 `v-model`：`defineEmits<{ 'update:modelValue': [string] }>()`

### 7.4 `defineExpose` 仅限

- 表单组件暴露 `validate` / `resetFields`
- 列表组件暴露 `refresh` / `clearSelection`

其他场景禁止暴露内部状态，破坏封装。

### 7.5 容器 vs 展示

- **容器组件**（页面/业务）：管理数据、调 API、与 store 交互
- **展示组件**（基础）：纯 UI，数据全靠 props

不严格分离，但**避免基础组件里直接 import service**。

### 7.6 列表/表单页标准结构

参考 `src/views/crud/Index.vue`、`src/views/system/dict/`：

```
[搜索区域 Card]  — 搜索表单 + 操作按钮
[表格区域 Card]  — 数据表格 + 分页
[详情/编辑 Drawer] — 新增/编辑/查看共用
```

### 7.7 加载与错误态

- 列表/详情必须有 `loading` 状态
- 接口失败必须 `ElMessage.error`（除非 `silent: true`）
- 空数据用 `<el-empty>`

## 八、禁止

- `src/utils/` / `src/components/` 出现特定页面专属代码
- `src/apis/` 出现 UI 提示（`ElMessage`）—— 错误提示只在 `service` 层
- `src/views/` 出现直接的 `axios` 调用 —— 必须通过 `apis/` 封装
- 任何目录出现"暂存"、"备份"性质的文件（`xxx.bak.vue`、`old-xxx.ts`）
