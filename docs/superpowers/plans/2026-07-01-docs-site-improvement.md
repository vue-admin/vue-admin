# Vue Admin 文档站完善实施计划

> **For agentic workers:** REQUIRED SUB-TOOL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完善 `docs-site/` 文档站，加入 logo、补充组件 API 参考、新增 FAQ/模块开发/服务/贡献指南，并调整部署文档受众。

**Architecture:** 所有新增页面使用 VitePress Markdown + `@include` 复用 `docs/standards/` 规范；组件文档使用现有 `docs-site/components/demos/` 演示模式；通过 `themeConfig.logo` 和 `search: { provider: 'local' }` 增强站点体验。

**Tech Stack:** VitePress 1.6, Vue 3, Markdown, `@include`

## Global Constraints

- 仅修改 `docs-site/` 目录下文件，不影响应用源码
- 所有新增文档必须使用简体中文
- 组件 API 表格必须来源于真实 `.vue` / `types.ts` 定义
- 每次任务完成后必须运行 `pnpm docs:build` 验证
- 最终交付前必须运行 `pnpm docs:preview` 目视检查

---

## 文件结构

| 文件/目录 | 责任 |
|---|---|
| `docs-site/public/logo.svg` | 导航栏与首页 logo 静态资源 |
| `docs-site/.vitepress/config.ts` | 导航、侧边栏、logo、搜索配置 |
| `docs-site/index.md` | 首页 hero + logo |
| `docs-site/guide/getting-started.md` | 快速上手（修正 URL） |
| `docs-site/guide/deploy.md` | 部署原理说明（移除内部运维细节） |
| `docs-site/guide/faq.md` | 常见问题 |
| `docs-site/guide/module-development.md` | 新增业务模块指南 |
| `docs-site/guide/changelog.md` | 更新日志 |
| `docs-site/guide/contributing.md` | 贡献指南 |
| `docs-site/components/status-tag.md` | StatusTag 组件文档 |
| `docs-site/components/dict-tag.md` | DictTag 组件文档 |
| `docs-site/components/error-boundary.md` | ErrorBoundary 组件文档 |
| `docs-site/components/services.md` | loading/confirm/download 服务文档 |
| `docs-site/components/search-table.md` | 补充完整 API 表格 |
| `docs-site/components/form-drawer.md` | 补充完整 API 表格 |
| `docs-site/components/page-container.md` | 补充完整 API 表格 |
| `docs-site/components/selectors.md` | 补充完整 API 表格 |

---

## Task 1: 添加 Logo

**Files:**
- Create: `docs-site/public/logo.svg`
- Modify: `docs-site/.vitepress/config.ts`
- Modify: `docs-site/index.md`

**Interfaces:**
- Consumes: `src/assets/logo.svg`
- Produces: 导航栏左上角 logo、首页 hero logo

- [ ] **Step 1: 复制 logo 到 VitePress public 目录**

```bash
cp src/assets/logo.svg docs-site/public/logo.svg
```

- [ ] **Step 2: 配置导航栏 logo**

在 `docs-site/.vitepress/config.ts` 的 `themeConfig` 中增加 `logo`：

```ts
themeConfig: {
  logo: '/logo.svg',
  // ... existing config
}
```

- [ ] **Step 3: 在首页 hero 显示 logo**

编辑 `docs-site/index.md`，在 frontmatter 的 `hero` 中增加 `image`：

```yaml
hero:
  name: Vue Admin
  text: 企业级后台管理前端基座
  tagline: Vue 3 + Vite + TypeScript + Element Plus，约束明确，可直接投产
  image:
    src: /logo.svg
    alt: Vue Admin logo
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/overview
    - theme: alt
      text: GitHub
      link: https://github.com/vue-admin/vue-admin
```

- [ ] **Step 4: 构建验证**

```bash
pnpm docs:build
```

Expected: 构建成功，无错误。

- [ ] **Step 5: 提交**

```bash
git add docs-site/public/logo.svg docs-site/.vitepress/config.ts docs-site/index.md
git commit -m "docs: add logo to docs-site nav and hero"
```

---

## Task 2: 修正快速上手 URL

**Files:**
- Modify: `docs-site/guide/getting-started.md`

**Interfaces:**
- Consumes: 现有 getting-started 内容
- Produces: 正确的 dev 服务器 URL

- [ ] **Step 1: 修正浏览器打开地址**

编辑 `docs-site/guide/getting-started.md`，将：

```markdown
浏览器打开 `http://localhost:5173/vue-admin/`。
```

替换为：

```markdown
浏览器打开 `http://localhost:5173/`。
```

- [ ] **Step 2: 构建验证**

```bash
pnpm docs:build
```

Expected: 构建成功。

- [ ] **Step 3: 提交**

```bash
git add docs-site/guide/getting-started.md
git commit -m "docs: fix dev server URL in getting-started"
```

---

## Task 3: 调整部署文档受众

**Files:**
- Modify: `docs-site/guide/deploy.md`

**Interfaces:**
- Consumes: 现有 deploy.md 内容
- Produces: 面向使用者的部署原理文档

- [ ] **Step 1: 重写 deploy.md**

将 `docs-site/guide/deploy.md` 替换为以下内容：

```markdown
# 部署指南

Vue Admin 构建后产出纯静态文件，可部署到任何支持静态资源托管的服务器或 PaaS 平台。

## 构建产物

```bash
pnpm i
pnpm build          # 输出到 dist/
```

生产构建默认不含 mock，部署前需确保后端 API 已就绪。

## 部署路径（base）

`vite.config.ts` 中 `base` 默认生产环境为 `/vue-admin/`（适配 GitHub Pages 子路径）。若部署到域名根路径，需覆盖：

```bash
VITE_BASE=/ pnpm build
```

## SPA 路由 fallback

Vue Admin 使用 `createWebHistory`，刷新子路由时需要服务器返回 `index.html`。Nginx 示例：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/vue-admin;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 反向代理后端 API

将 `/api/` 转发到后端服务可消除跨域：

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
}
```

前端 `baseURL` 设为 `/api`（相对路径）即可。

## 常见部署问题

| 问题 | 原因 | 解决 |
|---|---|---|
| 刷新子路由 404 | 未配置 SPA fallback | 加 `try_files $uri $uri/ /index.html;` |
| 资源 404 | `VITE_BASE` 与实际路径不符 | 用 `VITE_BASE=/` 覆盖 |
| 接口跨域 | 前后端不同域 | Nginx 反向代理 `/api/` |
| 发版后缓存 | index.html 被浏览器缓存 | 配置 `no-cache` |

> 内部 CI/CD、云主机详细配置属于项目维护信息，不在这里展开。
```

- [ ] **Step 2: 构建验证**

```bash
pnpm docs:build
```

Expected: 构建成功。

- [ ] **Step 3: 提交**

```bash
git add docs-site/guide/deploy.md
git commit -m "docs: adjust deploy guide audience to end users"
```

---

## Task 4: 为现有 4 个组件补充 API 表格

**Files:**
- Modify: `docs-site/components/search-table.md`
- Modify: `docs-site/components/form-drawer.md`
- Modify: `docs-site/components/page-container.md`
- Modify: `docs-site/components/selectors.md`

**Interfaces:**
- Consumes: `src/app/components/SearchTable/types.ts`, `src/app/components/FormDrawer/types.ts`, 各组件 `.vue` 的 props/emits/slots
- Produces: 组件 API 参考表格

- [ ] **Step 1: SearchTable API 表格**

在 `docs-site/components/search-table.md` 末尾追加：

```markdown
## API

### Props

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `loading` | `boolean` | — | 表格加载状态 |
| `data` | `Record<string, unknown>[]` | — | 表格数据 |
| `columns` | `ColumnDef[]` | — | 列定义 |
| `pagination` | `{ page: number; size: number; total: number }` | — | 分页信息 |
| `selectedRows` | `Record<string, unknown>[]` | `[]` | 已选中行 |
| `selectable` | `boolean` | `false` | 是否显示多选列 |
| `rowKey` | `string` | `'id'` | 行唯一标识字段 |
| `title` | `string` | — | 标题 |
| `treeProps` | `object` | — | 树形表格配置 |
| `defaultExpandAll` | `boolean` | `false` | 默认展开所有行 |
| `columnSettingsKey` | `string` | — | 列设置 localStorage key |
| `showColumnSettings` | `boolean` | `true` | 是否显示列设置入口 |

### Events

| 事件名 | 参数 | 说明 |
|---|---|---|
| `search` | — | 点击搜索按钮 |
| `reset` | — | 点击重置按钮 |
| `page-change` | `(page: number, size: number)` | 分页变化 |
| `selection-change` | `(rows: Record<string, unknown>[])` | 选择变化 |

### Slots

| 名称 | 说明 |
|---|---|
| `search` | 搜索栏内容 |
| `actions` | 标题栏右侧操作按钮 |
| `col-<name>` | 自定义列渲染，`name` 对应 `ColumnDef.slot` |
```

- [ ] **Step 2: FormDrawer API 表格**

读取 `src/app/components/FormDrawer/types.ts` 后，在 `docs-site/components/form-drawer.md` 末尾追加 Props/Events/Slots 表格。内容包括 `modelValue`、`mode`、`title`、`fields`、`rules`、`dependencies`、`submit` 事件、`success` 事件、`footer` 插槽等。

- [ ] **Step 3: PageContainer API 表格**

在 `docs-site/components/page-container.md` 末尾追加：

```markdown
## API

### Props

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `title` | `string` | — | 页面标题 |
| `subtitle` | `string` | — | 副标题 |
| `showBack` | `boolean` | `false` | 是否显示返回按钮 |
| `showBreadcrumb` | `boolean` | — | 是否显示面包屑 |
| `actions` | 插槽 | — | 标题右侧操作区 |

### Slots

| 名称 | 说明 |
|---|---|
| `default` | 页面主内容 |
| `actions` | 标题右侧操作 |
```

- [ ] **Step 4: Selectors API 表格**

在 `docs-site/components/selectors.md` 末尾追加 `RoleSelector`、`UserSelector`、`DeptSelector` 共同的 Props 表格：

```markdown
## API

### Props（通用）

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `modelValue` | `string \| string[]` | — | 选中值 |
| `multiple` | `boolean` | `false` | 是否多选 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `clearable` | `boolean` | `true` | 是否可清空 |
| `placeholder` | `string` | — | 占位文本 |
| `onlyActive` | `boolean` | `false` | 仅显示启用项 |

### Events

| 事件名 | 参数 | 说明 |
|---|---|---|
| `update:modelValue` | `(value: string \| string[])` | 选中值变化 |

### UserSelector 特有

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `remoteSearch` | `boolean` | `true` | 是否启用远程搜索 |
```

- [ ] **Step 5: 构建验证**

```bash
pnpm docs:build
```

Expected: 构建成功。

- [ ] **Step 6: 提交**

```bash
git add docs-site/components/
git commit -m "docs: add API reference tables for existing components"
```

---

## Task 5: 新增业务模块开发指南

**Files:**
- Create: `docs-site/guide/module-development.md`

**Interfaces:**
- Consumes: `scripts/gen-module.mjs`、`src/modules/system/user/` 等现有模块结构
- Produces: 模块开发指南页面

- [ ] **Step 1: 创建模块开发指南**

创建 `docs-site/guide/module-development.md`：

```markdown
# 新增业务模块

Vue Admin 的业务按域拆分为 `modules/<domain>/`。本节说明如何从零新增一个模块。

## 脚手架生成

```bash
pnpm gen:module order
```

生成目录结构：

```
src/modules/order/
├── api.ts              # 领域 API
├── store.ts            # Pinia store（可选）
└── views/
    └── List.vue        # 列表页
```

## 目录约定

- `api.ts`：所有对外接口，使用 `lib/http/client` 的 `http` / `api`
- `views/`：页面组件，列表页用 `SearchTable` + `useCrud`
- `store.ts`：模块级状态，setup 风格 `defineStore`
- `components/`：模块私有组件

## 注册菜单

在 `src/mock/apis/menu.ts` 的 `ALL_MENUS` 中新增叶子节点：

```ts
{
  path: '/order/list',
  name: 'orderList',
  component: 'order/views/List',
  meta: {
    title: '订单管理',
    icon: 'Document',
    showMenu: true,
    permissions: { any: ['order:read', '*'] }
  }
}
```

图标必须使用 PascalCase，且全局唯一。

## 列表页模板

```vue
<template>
  <SearchTable
    title="订单管理"
    :loading="loading"
    :data="tableData"
    :columns="columns"
    :pagination="pagination"
    @search="handleSearch"
    @reset="handleReset"
    @page-change="handlePageChange"
  >
    <template #search>
      <el-input v-model="searchForm.keyword" placeholder="订单号/客户名" />
    </template>
  </SearchTable>
</template>
```

配合 `useCrud` 管理列表状态。

## Mock 与测试

- 在 `src/mock/apis/` 新增 `order.ts`
- 单元测试放在 `test/unit/modules/order/`
- smoke 测试在 `test/smoke/business.spec.ts` 补充闭环用例
```

- [ ] **Step 2: 注册到侧边栏**

在 `docs-site/.vitepress/config.ts` 的 `/guide/` sidebar 中，在「工程规范」分组后新增：

```ts
{
  text: '开发实践',
  items: [
    { text: '新增业务模块', link: '/guide/module-development' },
    { text: '常见问题', link: '/guide/faq' }
  ]
}
```

- [ ] **Step 3: 构建验证**

```bash
pnpm docs:build
```

Expected: 构建成功。

- [ ] **Step 4: 提交**

```bash
git add docs-site/guide/module-development.md docs-site/.vitepress/config.ts
git commit -m "docs: add module development guide"
```

---

## Task 6: 新增 FAQ

**Files:**
- Create: `docs-site/guide/faq.md`

**Interfaces:**
- Consumes: 项目常见问题
- Produces: FAQ 页面

- [ ] **Step 1: 创建 FAQ 页面**

创建 `docs-site/guide/faq.md`：

```markdown
# 常见问题

## 本地 mock 不生效

1. 确认启动命令是 `pnpm dev`（vite-plugin-mock 只在 dev 模式注入）
2. 检查请求 URL 与 `src/mock/apis/` 下的 mock 配置一致
3. 浏览器 DevTools Network 中查看请求是否 404

## 构建报错 `Cannot find module '@/'`

Vite 别名 `@` 指向 `src/`。若类型检查报错：

1. 确认 `tsconfig.json` 中 `"paths": { "@/*": ["./src/*"] }`
2. 重启 VS Code / TypeScript 服务

## 登录后看不到菜单

1. 检查 `src/mock/apis/menu.ts` 返回的菜单数据
2. 确认 token 包含 `_admin_`（admin 账号才返回全部菜单）
3. 浏览器控制台查看 `/api/system/menus` 响应

## 新增页面 404

1. 确认菜单 `component` 字段对应真实的 `.vue` 文件路径
2. 确认 `registerDynamicRoutes` 能匹配到该文件
3. 检查路由守卫是否成功 bootstrap 菜单

## smoke 测试失败

1. 先单独启动 `pnpm dev`
2. 再运行 `pnpm smoke`
3. 查看 `test-results/` 中的截图和 trace
```

- [ ] **Step 2: 构建验证**

```bash
pnpm docs:build
```

Expected: 构建成功。

- [ ] **Step 3: 提交**

```bash
git add docs-site/guide/faq.md docs-site/.vitepress/config.ts
git commit -m "docs: add FAQ page"
```

---

## Task 7: 新增更多通用组件/服务文档

**Files:**
- Create: `docs-site/components/status-tag.md`
- Create: `docs-site/components/dict-tag.md`
- Create: `docs-site/components/error-boundary.md`
- Create: `docs-site/components/services.md`
- Modify: `docs-site/.vitepress/config.ts`

**Interfaces:**
- Consumes: `src/app/components/StatusTag/Index.vue`, `src/app/components/DictTag/Index.vue`, `src/lib/error/ErrorBoundary.vue`, `src/lib/loading/loadingService.ts`, `src/lib/confirm/confirmService.ts`, `src/lib/file/downloadService.ts`
- Produces: 新组件/服务文档页面

- [ ] **Step 1: StatusTag 文档**

创建 `docs-site/components/status-tag.md`：

```markdown
# StatusTag

用于展示状态枚举，自动映射为带颜色的标签。

## 基础用法

```vue
<StatusTag status="active" />
<StatusTag status="inactive" />
```

## API

### Props

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `status` | `string` | — | 状态值 |
| `statusMap` | `Record<string, { label: string; type: string }>` | 内置通用映射 | 自定义状态映射 |
```

- [ ] **Step 2: DictTag 文档**

类似创建 `docs-site/components/dict-tag.md`，包含 `dictType`、`value`、`multiple` 等 Props。

- [ ] **Step 3: ErrorBoundary 文档**

创建 `docs-site/components/error-boundary.md`：

```markdown
# ErrorBoundary

捕获子组件渲染错误并展示 fallback UI。

## API

### Props

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `title` | `string` | `'页面出错了'` | 错误标题 |
| `message` | `string` | — | 错误描述 |
| `maxRetries` | `number` | `3` | 最大重试次数 |
```

- [ ] **Step 4: Services 文档**

创建 `docs-site/components/services.md`：

```markdown
# 通用服务

## loadingService

```ts
import { loadingService } from '@/lib/loading/loadingService'

loadingService.show('加载中...')
loadingService.close()

await loadingService.withLoading(async () => {
  await fetchData()
})
```

## confirmService

```ts
import { confirmService } from '@/lib/confirm/confirmService'

const ok = await confirmService.showConfirm('确认删除？', '提示')
if (ok) { /* ... */ }
```

## downloadService

```ts
import { downloadCsv } from '@/lib/file/downloadService'

downloadCsv(csvText, 'users.csv')
```
```

- [ ] **Step 5: 注册到侧边栏**

在 `docs-site/.vitepress/config.ts` 的 `/components/` sidebar 中新增：

```ts
{ text: 'StatusTag', link: '/components/status-tag' },
{ text: 'DictTag', link: '/components/dict-tag' },
{ text: 'ErrorBoundary', link: '/components/error-boundary' },
{ text: '通用服务', link: '/components/services' }
```

- [ ] **Step 6: 构建验证**

```bash
pnpm docs:build
```

Expected: 构建成功。

- [ ] **Step 7: 提交**

```bash
git add docs-site/components/
git commit -m "docs: add status-tag, dict-tag, error-boundary and services docs"
```

---

## Task 8: 更新日志与贡献指南

**Files:**
- Create: `docs-site/guide/changelog.md`
- Create: `docs-site/guide/contributing.md`
- Modify: `docs-site/.vitepress/config.ts`

**Interfaces:**
- Consumes: 根目录 `CHANGELOG.md`
- Produces: changelog / contributing 页面

- [ ] **Step 1: 更新日志页面**

创建 `docs-site/guide/changelog.md`：

```markdown
# 更新日志

<!-- @include: ../../CHANGELOG.md -->
```

- [ ] **Step 2: 贡献指南页面**

创建 `docs-site/guide/contributing.md`：

```markdown
# 贡献指南

感谢你对 Vue Admin 的关注！

## 开发环境

```bash
pnpm i
pnpm dev
```

## 提交前检查

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm smoke   # 需先启动 dev server
```

## Commit 规范

使用 Conventional Commits：

```
feat: 新增功能
fix: 修复问题
docs: 文档更新
refactor: 重构
chore: 构建/工具
```

## PR 流程

1. Fork 仓库
2. 从 `main` 切出功能分支
3. 提交 PR 前确保 CI 通过
4. 简要描述改动原因和影响范围
```

- [ ] **Step 3: 注册到侧边栏**

在 `docs-site/.vitepress/config.ts` 的 `/guide/` sidebar 中，在「开发实践」分组后新增：

```ts
{
  text: '项目',
  items: [
    { text: '更新日志', link: '/guide/changelog' },
    { text: '贡献指南', link: '/guide/contributing' }
  ]
}
```

- [ ] **Step 4: 构建验证**

```bash
pnpm docs:build
```

Expected: 构建成功。

- [ ] **Step 5: 提交**

```bash
git add docs-site/guide/changelog.md docs-site/guide/contributing.md docs-site/.vitepress/config.ts
git commit -m "docs: add changelog and contributing pages"
```

---

## Task 9: VitePress 体验增强

**Files:**
- Modify: `docs-site/.vitepress/config.ts`

**Interfaces:**
- Produces: 本地搜索、更好的 outline 配置

- [ ] **Step 1: 开启本地搜索**

编辑 `docs-site/.vitepress/config.ts`，在 `themeConfig` 中增加：

```ts
search: {
  provider: 'local'
}
```

- [ ] **Step 2: 调整 outline 层级**

确认 `themeConfig.outline` 已配置：

```ts
outline: { level: [2, 3] }
```

（当前配置已满足，无需修改。）

- [ ] **Step 3: 构建验证**

```bash
pnpm docs:build
```

Expected: 构建成功。

- [ ] **Step 4: 提交**

```bash
git add docs-site/.vitepress/config.ts
git commit -m "docs: enable VitePress local search"
```

---

## Final Verification

- [ ] Run `pnpm docs:build` — expected success
- [ ] Run `pnpm docs:preview` — visually inspect logo, sidebar, search, all new pages
- [ ] Run `pnpm lint` — expected no errors
- [ ] Run `pnpm type-check` — expected no errors

---

## Spec Coverage Check

| Spec 要求 | 对应 Task |
|---|---|
| 文档站加 logo | Task 1 |
| 4 个组件 API 表格 | Task 4 |
| getting-started URL 修正 | Task 2 |
| deploy 文档受众调整 | Task 3 |
| FAQ | Task 6 |
| 模块开发指南 | Task 5 |
| StatusTag/DictTag/ErrorBoundary/services 文档 | Task 7 |
| 更新日志/贡献指南 | Task 8 |
| VitePress 本地搜索 | Task 9 |
