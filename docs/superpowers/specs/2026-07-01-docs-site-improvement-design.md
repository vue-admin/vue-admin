# Vue Admin 文档站完善设计

## 背景

`docs-site/` 已基于 VitePress 搭建，包含首页、工程规范、快速上手、部署指南和 4 个通用组件演示页。但缺少项目 logo，且组件文档未提供完整 API 参考，对使用组件的开发者不够友好。

## 目标

1. 在文档站中加入 Vue Admin 项目 logo。
2. 为现有 4 个组件文档补充 Props / Events / Slots 表格。
3. 微调首页与快速上手文档，确保 URL 与开发实际一致。

## 方案

### Logo

- 源文件：`src/assets/logo.svg`
- 复制到：`docs-site/public/logo.svg`（VitePress 静态资源目录）
- 配置：`docs-site/.vitepress/config.ts` 中设置 `themeConfig.logo = '/logo.svg'`
- 首页：在 `index.md` 的 hero 配置中加入 `image: { src: '/logo.svg', alt: 'Vue Admin logo' }`

### 组件 API 文档

从对应组件的 `.vue` / `types.ts` 中抽取真实定义，补充到以下页面：

| 页面 | 组件源 | 类型源 |
|---|---|---|
| `components/search-table.md` | `src/app/components/SearchTable/index.vue` | `src/app/components/SearchTable/types.ts` |
| `components/form-drawer.md` | `src/app/components/FormDrawer/index.vue` | `src/app/components/FormDrawer/types.ts` |
| `components/page-container.md` | `src/app/components/PageContainer/index.vue` | 组件内 Props |
| `components/selectors.md` | `src/app/components/Selectors/*.vue` | 组件内 Props |

每个组件文档补充：
- **Props**：名称、类型、默认值、说明
- **Events**：事件名、参数、说明
- **Slots**：插槽名、说明

### 首页与快速上手微调

- `index.md`：hero 加 logo；features 保持不变。
- `guide/getting-started.md`：将"浏览器打开 `http://localhost:5173/vue-admin/`"修正为 dev 模式实际 URL `http://localhost:5173/`。

### 部署文档受众调整

`guide/deploy.md` 当前包含大量项目内部运维细节（GitHub Actions 工作流、云主机 Nginx 配置、SSH Secrets 等），不适合对外文档站。调整为面向使用者的部署原理说明：

- 保留并简化：构建产物说明、`VITE_BASE` 的作用、SPA fallback 原理、反向代理 `/api/` 消除跨域
- 移除或迁移到内部 wiki：具体服务器路径、GitHub Secrets 配置、CI/CD 步骤、certbot 命令
- 给出最小可运行的 Nginx/Docker/Node 示例即可，不绑定项目实际域名和目录

## 验证

- `pnpm docs:build` 成功
- `pnpm docs:preview` 中 logo 正常显示，组件 API 表格渲染正确

## 扩展项（全部纳入本次实施）

### 高优先级

1. **FAQ / 常见问题**
   - 本地 mock 不生效怎么办
   - `pnpm build` 报错 `Cannot find module '@/'`
   - 权限不足看不到菜单如何排查
   - smoke 测试失败如何处理

2. **新增业务模块指南**
   - `pnpm gen:module <name>` 生成结构说明
   - 模块目录约定（`api.ts`、`views/`、`store.ts`）
   - 如何在 Sidebar 注册菜单
   - 如何写 mock 和单元测试

### 中优先级

3. **更多通用组件文档**
   - `StatusTag`、`DictTag`
   - `ErrorBoundary`
   - `loadingService`、`confirmService`、`downloadService`

4. **更新日志 / 贡献指南**
   - 引用根目录 `CHANGELOG.md`
   - 贡献者如何本地验证、如何提 PR

### 低优先级

5. **VitePress 体验增强**
   - 开启本地搜索 `search: { provider: 'local' }`
   - 调整 outline 层级

## 影响范围

仅修改 `docs-site/` 目录下的文件，不影响应用代码。
