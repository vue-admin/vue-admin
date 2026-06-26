# 架构规范

> 本文档规定项目的**目录结构、组件分层、依赖方向**。命名细节见 [04-NAMING.md](./04-NAMING.md)。

## 一、四层目录

```
src/
├── lib/         # 基础设施：与业务无关（http、auth、router、error、monitor）
├── app/         # 应用骨架：组装层（main.ts、stores、directives）
├── modules/     # 业务领域：按 domain 聚合（auth、system 等）
└── shared/      # 跨模块共享：类型、常量
```

其余历史目录：

| 目录 | 状态 | 备注 |
|------|------|------|
| `src/assets/` | 保留 | 会被构建处理的资源 |
| `src/components/` | 保留 | 跨页面公共组件 |
| `src/layout/` | 保留 | 布局组件 |
| `src/mock/` | 保留 | Mock API（开发环境用） |
| `src/router/` | 保留 | 静态路由表 + router 实例 |
| `src/views/` | **历史** | M5 后续将迁移至 `src/modules/<domain>/views/` |
| `src/apis/` | **历史** | M5 后续将迁移至 `src/modules/<domain>/api.ts` |
| `src/stores/` | **历史** | 已迁至 `src/app/stores/` |
| `src/utils/` | **历史** | 待评估合并至 `src/lib/` 或删除 |

## 二、依赖方向

```
modules ──→ app ──→ lib
              ▲
shared  ──────┘
```

依赖单向：`modules` 可依赖 `app` 与 `lib`；`app` 可依赖 `lib`；`shared` 只能被依赖、不能依赖任何业务层或基础设施层。

### 边界强制

- **`lib/` 禁止** import `@/app/*`、`@/modules/*`、`@/views/*`、`@/apis/*`、`@/router/*`、`@/stores/*`、`@/layout/*`、`@/components/*`
- **`shared/` 禁止** import `@/app/*`、`@/modules/*`、`@/views/*`、`@/apis/*`、`@/router/*`、`@/stores/*`、`@/layout/*`、`@/components/*`、`@/lib/*`
- 例外：`src/lib/router/guards.ts` 反向 import `@/app/stores/*` 是允许的（路由守卫需要拉取 user/permission store 完成权限检查；**禁止**的是依赖 `@/modules/*` 业务模块）
- 由 `eslint.config.js` 的 `no-restricted-imports` 规则强制

## 三、`src/modules/` 业务领域

每个 domain 一个目录：

```
src/modules/
├── auth/                    # 认证领域
│   ├── views/
│   │   └── Login.vue
│   └── api.ts               # （可选）模块内 API 封装
├── system/                  # 系统管理领域
│   ├── views/
│   │   ├── admin/
│   │   ├── dict/
│   │   └── role/
│   └── store.ts             # （可选）仅模块内使用的 store
└── <domain>/                # 其他业务域
```

模块内文件按需新增：`views/`、`api.ts`、`store.ts`、`types.ts`、`hooks/`。

## 四、`src/lib/` 基础设施

| 子目录 | 职责 |
|--------|------|
| `lib/http/` | HTTP 客户端（`http` 单例 + `api` 辅助函数 + 拦截器 + ProblemDetail 解析 + ElMessage 通知） |
| `lib/auth/` | 认证服务（`authService` 单例 + `AuthProvider` 接口 + `TokenStorage` 接口 + JwtAuthProvider） |
| `lib/router/` | 路由工具（动态路由装载 + 守卫 + MenuDTO 类型） |
| `lib/error/` | 错误处理（`HttpError` + `Monitor` 接口 + `ErrorBoundary.vue` + 控制台 Monitor 默认实现） |

`lib/` 内部代码必须**与业务无关**，可被任何业务模块复用。

## 五、`src/app/` 应用骨架

| 子目录 | 职责 |
|--------|------|
| `app/main.ts` | 应用入口：注册插件、指令、守卫、provide monitor |
| `app/App.vue` | 根组件：包裹 ErrorBoundary |
| `app/stores/` | 全局 Pinia store：`user.ts`、`permission.ts` |
| `app/directives/` | 全局指令：`v-permission` |

## 六、`src/shared/` 共享层

跨模块共享的**纯类型**与**纯常量**。

- 类型：领域 DTO、枚举、共享 interface
- 常量：跨模块用的 magic string / number

**禁止**放业务逻辑、Vue 响应式代码、依赖任何业务层。

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

禁止 Options API、禁止 `any`、禁止 `as unknown as T` 双重断言（路由 RecordRaw 等第三方类型联合体除外，须加注释说明）。

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

### 7.5 复杂页面拆分红线

| 信号 | 动作 |
|------|------|
| `.vue` 文件 > 300 行 | 考虑拆 |
| `.vue` 文件 > 500 行 | **必须拆**，PR 不通过 |
| template > 100 行 | 抽 sub-component |
| 3+ 独立交互区 | 拆为容器 + 子视图 |

拆分模板：

```
<Page>.vue                 # 容器
<Feature>.vue              # 子视图
<Feature>Drawer.vue        # 弹窗
<Feature>Form.vue          # 表单
hooks/use<Feature>.ts      # 业务逻辑（与 UI 解耦）
types.ts                   # 仅当类型定义 > 50 行时拆出
```

## 八、禁止

- `src/lib/` 出现业务领域代码（user/system/auth 等具体业务）
- `src/shared/` 出现业务逻辑或 Vue 响应式代码
- `src/modules/<domain>/api.ts` 出现 UI 提示（`ElMessage`）—— 错误提示只在 `lib/http` 拦截器层
- 任何业务代码直接 `import axios` —— 必须通过 `lib/http/client` 导出的 `http` / `api`
- 任何目录出现"暂存"、"备份"性质的文件（`xxx.bak.vue`、`old-xxx.ts`）
