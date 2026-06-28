# CLAUDE.md

> 本文件是 Claude Code 的**工程上下文索引**。详细内容见 `docs/standards/`，本文不重复。

## 项目概述

Vue Admin —— Vue 3 + Vite + TypeScript + Element Plus 的企业级后台管理前端基座。

定位与演进路线见 [docs/standards/00-OVERVIEW.md](./docs/standards/00-OVERVIEW.md)。

## 常用命令

```bash
pnpm i              # 安装
pnpm dev            # 启动开发服务器（含 vite-plugin-mock）
pnpm build          # 构建（含 type-check）
pnpm build-only     # 仅构建（不 type-check）
pnpm type-check     # vue-tsc 类型检查
pnpm lint           # ESLint flat config 检查
pnpm lint:fix       # ESLint 自动修复
pnpm test           # Vitest 单次运行
pnpm test:watch     # Vitest watch 模式
pnpm smoke          # Playwright smoke 测试（需先启动 dev server）
pnpm smoke:ui       # Playwright smoke UI 模式
pnpm preview        # 预览生产构建
```

## 技术栈

- Vue 3.4 + `<script setup>`
- Vite 4.5 + TypeScript 4.8（待升级到最新主版本）
- Element Plus 2.5 + 完整图标自动注册
- Pinia 2.1（setup 风格 store）
- Vue Router 4.3
- Axios（统一通过 `lib/http/client` 导出的 `http` / `api` 使用）
- VueUse 10.8 + SCSS
- Vitest 1.6 + jsdom + @vue/test-utils
- ESLint 9 flat config（强制目录边界）

## 工程上下文指引

| 想做什么 | 看哪里 |
|---------|--------|
| 写新代码 | [01-ARCHITECTURE.md](./docs/standards/01-ARCHITECTURE.md) |
| 写新 API | [02-API.md](./docs/standards/02-API.md) |
| 写新 store | [03-STATE.md](./docs/standards/03-STATE.md) |
| 起名 / 起文件名 | [04-NAMING.md](./docs/standards/04-NAMING.md) |
| 了解战略方向 | [00-OVERVIEW.md](./docs/standards/00-OVERVIEW.md) |

## 关键架构约定（高频引用）

1. **四层目录**：`lib/`（基础设施）→ `app/`（骨架）→ `modules/`（业务领域）→ `shared/`（共享）。lib/shared **禁止** 反向依赖 app/modules。由 `eslint.config.js` 的 `no-restricted-imports` 强制（例外：`lib/router/guards.ts` 允许 import `app/stores/*`，plan M4.4 已确认）。

2. **单一 HTTP 客户端**：业务代码必须用 `src/lib/http/client.ts` 导出的 `http` 实例或 `api` 辅助函数。禁止 `import axios`、禁止 `axios.create()`。

3. **错误契约（RFC 7807）**：成功 HTTP 200 + `{code:0, data, msg}`；失败 HTTP 4xx/5xx + `ProblemDetail`。拦截器把失败响应包成 `HttpError` 抛出。过渡形态 HTTP 200 + `code !== 0` 在 M5.3 MSW 迁移前容忍。

4. **Store 必须用 setup 风格**：`defineStore('<domain>', () => { ... })`，禁止 Options 风格。全局 store 放 `app/stores/`，模块 store 放 `modules/<domain>/store.ts`。

5. **响应式解构必须 `storeToRefs`**：`const { profile } = storeToRefs(userStore)`。

6. **错误处理三层**：lib/http 拦截器（全局 ElMessage 提示）→ modules api 函数（不提示，透传 HttpError）→ views / 组件（检查 HttpError 做领域内反馈）。`_silent: true` 反转默认提示。

7. **目录扁平**：业务页面按域分子目录，单 `.vue` 文件不超过 500 行。当前 8 个模块：`auth` / `dashboard` / `system`（含 `admin`/`user`/`role`/`permission`/`menu`/`dict` 6 子项）/ `profile` / `crud` / `docs` / `about`。

8. **通用组件库（M7-B）**：新增列表/表单页必须优先用 `@/app/components` 导出的 `SearchTable` / `FormDrawer` / `PageContainer`，配合 `@/app/composables/useCrud` 接管列表状态（listData/loading/pagination/searchForm/selectedRows + 7 个 handler）。禁止重复手写 el-table + el-pagination + 内联 drawer 模板。

9. **Layout 配置中心（M7-B）**：`@/app/stores/layout` 提供 6 个持久化字段（showTagsView / showBreadcrumb / showLogo / showFooter / primaryColor / componentSize），由 `layout/components/SettingsDrawer.vue` 暴露给用户。Layout 组件（TagsView/Footer/Breadcrumb/IconLogo）通过 `v-if` 消费 store；main.ts watch `primaryColor` 设 `--el-color-primary`；App.vue 用 `el-config-provider` 注入 `componentSize`。

10. **业务页面标准（M7-C）**：所有 List 页面必须用 `SearchTable` + `useCrud` + `PageContainer` + `FormDrawer` 四件套。FormDrawer 支持 `mode`（add/edit/view）+ `dependencies`（声明式显隐联动）+ `rules`（field-level 校验）+ `password`/`treeSelect` 字段类型。复杂联动（如权限分配 el-tree）用独立 drawer，不塞进 FormDrawer。

11. **全局错误与交互（M8）**：`lib/error/ErrorBoundary.vue` 捕获组件渲染错误并显示 fallback，支持 `title`/`message`/`maxRetries` props 与重试防循环；`main.ts` 通过 `installGlobalErrorHandlers` 统一捕获 Vue runtime、`window.onerror`、`unhandledrejection` 并上报 monitor。`lib/loading/loadingService` 提供全局/嵌套 loading（`show`/`close`/`withLoading`）；`lib/confirm/confirmService` 统一确认对话框，返回 `Promise<boolean>`，业务代码不再直接调用 `ElMessageBox.confirm`。

## 认证 / 权限（M3 + M4 已实现）

- `lib/auth/authService` 工厂创建单例，含并发刷新保护（复用 `refreshPromise`）
- `lib/auth/TokenStorage` 抽象 token 存储，默认 `MemorySessionTokenStorage`
- `app/stores/permission.ts` 提供 `hasAnyPermission` / `hasAllPermissions` / `hasAnyRole` / `hasAllRoles`，`isSuperAdmin` 时短路
- `app/directives/permission.ts` 提供 `v-permission` 指令（不匹配时 `removeChild` 移除 DOM）
- `lib/router/guards.ts` 4 步守卫：白名单 → 认证 → bootstrap（profile + menus）→ 权限
- `lib/router/dynamic.ts` 按 `import.meta.glob('@/modules/**/*.vue')` 装载动态路由

## 自动导入

Vite 已配置：
- `unplugin-auto-import`：Vue API（ref / reactive / computed 等）无需手动 import
- `unplugin-vue-components`：Element Plus 组件按需自动注册
- Element Plus 图标：在 `main.ts` 全局注册

## 路径别名

`@/` → `src/`（已在 `vite.config.ts` 与 `tsconfig.json` 配置）。

## 构建配置

- 生产 `base`：`/vue-admin/`（建议改为可配置，见 00-OVERVIEW 待办）
- 代码分割：Element Plus / Vue / 第三方库分别打包
- 压缩：terser，移除 `console` 和 `debugger`

## Mock

- `vite-plugin-mock` 在开发环境提供 Mock API
- Mock 文件位于 `src/mock/apis/`
- Mock 响应必须与真实后端结构一致（`ApiResult` 包装）
- `auth.ts`（M3.6）+ `menu.ts`（M4.6）已权限感知；其他端点为 M2.7 过渡形态（M5.3 MSW 迁移）
- 测试账号：`admin` / `123456`（super_admin，全权限）；`user` / `123456`（user 角色，user:read）
