# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Vue Admin 是一个基于 Vue 3 + Vite + TypeScript 的后台管理系统模板，使用 Element Plus 作为 UI 组件库。

## 常用命令

```bash
# 安装依赖
pnpm i

# 启动开发服务器
pnpm dev

# 构建生产环境
pnpm build

# 仅构建（不进行类型检查）
pnpm build-only

# 类型检查
pnpm type-check

# 预览生产构建
pnpm preview
```

## 技术栈

- **框架**: Vue 3.4+ (Composition API)
- **构建工具**: Vite 4.5+
- **语言**: TypeScript 4.8+
- **UI 组件库**: Element Plus 2.5+
- **状态管理**: Pinia 2.1+
- **路由**: Vue Router 4.3+
- **HTTP 客户端**: Axios
- **工具库**: VueUse 10.8+
- **CSS 预处理器**: SCSS/Sass
- **Mock 数据**: vite-plugin-mock + mockjs

## 项目架构

### 目录结构

```
src/
├── apis/           # API 接口封装
│   ├── client/     # HTTP 客户端封装
│   ├── crud/       # CRUD 通用接口
│   ├── user/       # 用户相关接口
│   ├── admin/      # 管理员接口
│   ├── role/       # 角色管理接口
│   ├── permission/ # 权限管理接口
│   └── dict/       # 字典管理接口
├── components/     # 公共组件
├── layout/         # 布局组件
├── mock/           # Mock 数据
│   └── apis/       # Mock API 定义
├── router/         # 路由配置
│   ├── index.ts    # 路由入口
│   └── menus.ts    # 菜单路由配置
├── stores/         # Pinia 状态管理
├── utils/          # 工具函数
├── views/          # 页面视图
│   ├── crud/       # CRUD 示例
│   ├── system/     # 系统管理模块
│   ├── user/       # 用户模块
│   └── multi/      # 多级菜单示例
├── App.vue
└── main.ts
```

### 核心架构设计

#### 1. 双 HTTP 客户端架构

项目同时存在两套 HTTP 请求封装：

**Request 类** (`src/apis/client/request.ts`):
- 基于 axios 封装的通用请求类
- 自动添加 Authorization token
- 统一的 HTTP 错误处理（400-505 状态码）
- 导出单例 `new Request({})`

**Service 类** (`src/apis/client/service.ts`):
- 业务级 HTTP 客户端
- 处理业务状态码（code !== 0 时显示错误消息）
- 支持 `silent` 配置静默错误提示
- 自动处理登录过期（reload: true 时清空 localStorage 并跳转登录）

**使用建议**: 新项目模块优先使用 `service`（`src/apis/client/service.ts`），它提供了更完善的业务错误处理。

#### 2. 路由与菜单系统

- 路由定义在 `src/router/menus.ts`，采用嵌套结构支持多级菜单
- 菜单通过 `meta.showMenu` 控制是否在侧边栏显示
- Layout 组件作为根布局，所有页面作为其子路由
- 支持动态图标（Element Plus Icons）

#### 3. Mock 数据机制

使用 `vite-plugin-mock` 在开发环境提供 Mock API：
- Mock 文件位于 `src/mock/apis/`
- 在 `vite.config.ts` 中启用 `enable: true`
- 支持热更新（`watchFiles: true`）

#### 4. CRUD 页面模式

标准 CRUD 页面结构（参考 `src/views/crud/Index.vue`）：
- 搜索区域（Search Card）：包含搜索表单和操作按钮
- 表格区域（Table Card）：展示数据列表
- 详情弹窗（Detail Drawer）：新增/编辑/查看共用组件
- 分页组件：底部右侧对齐

### API 接口规范

#### 接口响应结构

```typescript
interface ApiResult<T> {
  code: number      // 0 表示成功，其他表示错误
  data: T           // 业务数据
  msg: string       // 错误消息
}
```

#### 接口定义模式

每个模块的 API 文件（如 `src/apis/crud/index.ts`）包含：
- Request/Response 接口定义
- API 函数（使用 service 客户端）
- 支持 `silent` 选项控制错误提示

### 状态管理

使用 Pinia + VueUse 的 `useStorage` 实现持久化：
- `stores/user.ts`: 用户信息（自动持久化到 localStorage）
- `stores/dark.ts`: 暗黑模式状态
- `stores/tagsView.ts`: 标签页状态
- `stores/collapse.ts`: 侧边栏折叠状态

### 自动导入配置

Vite 配置中已启用自动导入：
- `unplugin-auto-import`: 自动导入 Vue API（ref, reactive, computed 等）
- `unplugin-vue-components`: 自动导入 Element Plus 组件
- 组件类型定义在 `components.d.ts`

## 开发注意事项

### 路径别名

- `@/` 指向 `src/` 目录
- 已在 `vite.config.ts` 和 `tsconfig.json` 中配置

### 构建配置

- 生产环境基础路径：`/vue-admin/`
- 代码分割：Element Plus、Vue 相关、第三方库分别打包
- 压缩：使用 terser，移除 console 和 debugger

### 类型定义

- 全局类型在 `env.d.ts`
- 组件自动导入类型在 `components.d.ts`
- API 接口类型与业务模块放同一文件
