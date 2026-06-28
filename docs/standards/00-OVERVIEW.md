# Vue Admin 演进路线

> 本文档描述框架的战略定位与分阶段演进路线，所有规范、工具、依赖选型必须服务于这个方向。

## 一、定位

**Vue 3 + Element Plus 企业级后台管理前端基座**。

不是：
- 一个学习用 demo（虽然代码风格保持易读）
- 一个万能 UI 库（基于 Element Plus，不重造轮子）
- 一个低代码平台
- 一个前后端一体化项目（本项目只关注前端，后端由调用方自行实现）

是：
- 一套**约束明确、可直接投产**的 Vue 3 后台前端起点
- 内置业界标准的**登录、鉴权、权限、菜单、字典、HTTP 客户端**等基础模块
- 后续作为 **vadm 脚手架**的官方业务模板

## 二、三阶段路线

### L1 规范化（基础，2 周内）

让仓库可被外部协作、可被社区信任。

- [x] HTTP 客户端单一化为 `service`
- [x] 字典页 / 标签页 store 模块化、Pinia setup 化
- [x] CLAUDE.md 工程上下文
- [x] ESLint flat config（严格规则）
- [x] husky + lint-staged（pre-commit 拦截）
- [x] GitHub Actions CI（type-check + lint + build）
- [x] 规范文档集（本目录）
- [x] CONTRIBUTING.md + Code of Conduct
- [x] LICENSE
- [x] 依赖升级到最新主版本（Vue 3.5 / Vite 7 / TS 5.9 / Element Plus 2.11 / VueUse 11 / Vitest 3）

### L2 工程化（投产，1-2 月）

补齐"开箱即用"的业务能力。

- [x] 权限系统：路由级（守卫） + 按钮级（`v-permission` 指令）
- [x] 菜单系统：动态路由 + 服务端下发 + meta 驱动
- [x] 用户/角色/字典 CRUD 全闭环
- [x] 通用组件库：`SearchTable`、`FormDrawer`、`PageContainer`
- [x] 主题系统：CSS Variables 规范化（主色派生色算法 + 命名修复，暗黑模式已有）
- [x] 国际化（vue-i18n）骨架（lib/i18n 单例 + locale 持久化 + SettingsDrawer 切换器，业务页面渐进迁移）
- [x] 错误边界 + 全局 loading + 确认对话框组件

### L3 平台化（生态，3-6 月）

向外辐射、可复用。

- [ ] Monorepo 拆分：`@vue-admin/core` / `@vue-admin/components` / `@vue-admin/utils` / `admin-app`
- [ ] 与 **vadm** 脚手架对接：`pnpm create vadm` 选模板 → 派生本项目
- [x] 文档站点（VitePress）—— `docs-site/` 复用 `docs/standards/` 内容，`pnpm docs:dev/build/preview`，CI 部署 GitHub Pages
- [ ] 组件预览（Storybook 或 Histoire）
- [ ] 在线 Demo + 一键部署模板（Vercel/Netlify）

## 三、依赖治理原则

**每个新依赖必须给出 ROI 说明**，回答三个问题：
1. 解决什么问题（不能是"看起来好用"）
2. 体积成本（gzip 后 KB）
3. 是否有更轻方案（或可手写 < 50 行实现）

**禁止**：
- UI 库混用（只允许 Element Plus）
- 多套 HTTP 客户端（只允许 `service`）
- 多套状态管理（只允许 Pinia）
- 重复的工具函数（先看 VueUse 是否已有）

## 四、不做的事（YAGNI）

- 不做 SSR（NUXT/Slim）—— Admin 不需要 SEO
- 不做移动端适配（除已有响应式断点）
- 不做低代码可视化拖拽
- 不做 schema 驱动表单引擎（除非 L2 末确实需要）
- 不在 L1 阶段拆 Monorepo
