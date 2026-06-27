# M7-A 架构迁移收尾 + Smoke Test 设计

**日期：** 2026-06-28
**里程碑：** M7（功能完善 + 开源标准）
**前置：** M6 已完成（开源治理 + CI/Release 流水线）

## 一、背景

M6 收尾发布 `v0.1.0-rc.1` 时发现两个运行时 bug：

1. `/login` 路由缺 `meta.public` → 守卫死循环 → 浏览器空白
2. Vite dev server 仅绑 IPv6 → Chrome 走 IPv4 连不上 → 标签转圈

两个 bug CI 4 件套（lint / type-check / test / build）全部漏过。同时盘点仓库发现 M2/M3 标榜"完成"的模块化迁移**实际只完成了规范文档**，代码层新旧并存：

```
src/apis/*           ← 旧 API 调用层，9 个文件，被 7 个业务页面引用
src/stores/*         ← 旧 store，6 个文件，被 layout 5 处 + Login 1 处引用
src/apis/client/service.ts ← 旧 HTTP 客户端，与 src/lib/http/client 并存
src/app/stores/      ← 新全局 store（仅 user/permission，是 M3 为 router 加的）
src/lib/http/client  ← 新 HTTP 客户端（仅 router guard 在用）
```

15 处业务代码用 `@/apis`，0 处用 `@/modules/<x>/api`。CLAUDE.md 第 1 条架构约束**形同虚设**。

## 二、目标

1. **根治架构债**：删除 `src/apis/` 与 `src/stores/`，业务代码全部走 `@/modules/<domain>/api` 与 `@/app/stores/*`
2. **架构约束强制化**：ESLint `no-restricted-imports` 拦截任何对旧路径的引用，防止回归
3. **补 smoke test**：用 Playwright 验证关键运行时路径，CI 加入 smoke job，杜绝"CI 全绿但应用空白"
4. **达成开源硬标准**：仓库结构清晰、约束可执行、回归可发现

## 三、文件迁移矩阵

### 3.1 API 层迁移

> 模块标准化决策：原 `user` 模块合并入 `system/user`（详见 §3.4）。下表已按新归属排列。

| 旧路径 | 新路径 | 引用处 |
|---|---|---|
| `src/apis/user/index.ts` | `src/modules/system/user/api.ts` | `modules/system/user/views/List.vue` |
| `src/apis/user/info.ts` | 合并入 `src/modules/system/user/api.ts` | 检查实际引用 |
| `src/apis/user/login.ts` | 合并入 `src/modules/auth/api.ts`（仅保留必要部分） | 检查实际引用 |
| `src/apis/admin/index.ts` | `src/modules/system/admin/api.ts` | `modules/system/admin/views/List.vue` |
| `src/apis/role/index.ts` | `src/modules/system/role/api.ts` | `modules/system/role/views/List.vue` |
| `src/apis/permission/index.ts` | `src/modules/system/permission/api.ts` | `modules/system/permission/views/List.vue` |
| `src/apis/dict/index.ts` | `src/modules/system/dict/api.ts` | `modules/system/dict/hooks/useDictTree.ts`、`modules/crud/views/Detail.vue` |
| `src/apis/crud/index.ts` | `src/modules/crud/api.ts` | `modules/crud/views/Index.vue`、`Detail.vue` |
| `src/apis/client/service.ts` | **删除**（业务统一用 `@/lib/http/client` 的 `http` / `api`） | 旧 api 内部用 |

### 3.2 Store 层迁移

| 旧 store | 新归属 | 理由 |
|---|---|---|
| `src/stores/user.ts` | 合并入 `src/app/stores/user.ts` | 全局用户状态，已存在新版 |
| `src/stores/collapse.ts` | `src/app/stores/sidebar.ts` | UI 全局状态 |
| `src/stores/dark.ts` | `src/app/stores/theme.ts` | UI 全局状态 |
| `src/stores/tagsView.ts` | `src/app/stores/tagsView.ts`（迁移时在 `ContextMenu.vue` 补「关闭当前」菜单项，闭环 5 项操作：刷新/关闭当前/关闭右侧/关闭其他/关闭全部） | UI 全局状态 |
| `src/stores/storage.ts` | `src/lib/storage/index.ts`（若纯工具）或 `src/app/stores/storage.ts` | 看实现性质 |
| `src/stores/counter.ts` | **删除** | Vue 脚手架示例，无引用 |

### 3.3 杂项

| 旧位置 | 新位置 | 理由 |
|---|---|---|
| `src/components/icons/IconLogo.vue` | `src/layout/components/Sidebar/IconLogo.vue` | 仅 Sidebar 引用 |
| `src/app/views/NotFound.vue` | `src/modules/about/views/NotFound.vue` | 业务页面归 modules |
| `src/utils/nprogress/index.ts` | `src/lib/nprogress/index.ts` | `utils/` 是旧脚手架路径，CLAUDE.md 标准是 `lib/` |
| `src/apis/.DS_Store` | **删除** + `.gitignore` 加 `**/.DS_Store` | macOS 残留 |

### 3.4 业务模块标准化（新增）

**对照 vue-element-admin / vue-vben-admin / naive-ui-admin / soybean-admin / vue-pure-admin 5 个主流框架验证后的最终清单**：

```
src/modules/
├── auth/             # 登录、token 管理（保留）
├── dashboard/        # 首页/工作台（原 home，重命名；5/5 框架都用 dashboard/workbench）
├── system/           # 系统管理（保留，子模块重组）
│   ├── user/         # 用户（原 modules/user 合并入 system/user）
│   ├── role/         # 角色（保留）
│   ├── permission/   # 权限（保留）
│   ├── menu/         # 菜单（新增；5/5 框架都有 menu 子项）
│   └── dict/         # 字典（保留）
├── profile/          # 个人中心（原 system/portrait 提到顶层并改名）
├── crud/             # CRUD 完整闭环示例（保留）
├── docs/             # 文档站嵌入（保留，开源加分项）
└── about/            # 关于（保留，404 也归此）
```

**操作清单**：

| 操作 | 旧位置 | 新位置 |
|---|---|---|
| 重命名 | `modules/home/` | `modules/dashboard/` |
| 合并 | `modules/user/` | `modules/system/user/` |
| 提升+改名 | `modules/system/views/portrait/` | `modules/profile/views/` |
| 新增 | —— | `modules/system/menu/`（含 views/List.vue + api.ts + mock 菜单数据） |
| 删除 | `modules/multi/` | ——（参考框架不做"为演示而演示"的多级菜单） |
| 删除 | `modules/system/views/config/` | ——（空壳，主流框架无对应概念） |

**菜单路由同步更新**（`src/router/menus.ts`）：
- `/` 仍指向 `dashboard/views/Home.vue`（保持根路径）
- 删除 `/multi/*` 整段
- 删除 `/system/config` 整段
- `/system/portrait` → `/profile`，`showMenu: false` 不变
- `/user/list` → `/system/user/list`
- 新增 `/system/menu`

**Mock 同步**（`src/mock/apis/`）：菜单接口返回结构按新模块清单调整（M4.6 已权限感知，沿用其结构）。

## 四、ESLint 强制规则

`eslint.config.js` 增量加入：

```js
// 禁止业务层引用旧 src/apis、src/stores
{
  files: ['src/modules/**/*', 'src/layout/**/*', 'src/app/**/*'],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        {
          group: ['@/apis', '@/apis/*'],
          message: '禁止引用旧 src/apis/，请改用 @/modules/<domain>/api 或 @/lib/http/client',
        },
        {
          group: ['@/stores', '@/stores/*'],
          message: '禁止引用旧 src/stores/，请改用 @/app/stores/* 或 @/modules/<domain>/store',
        },
      ],
    }],
  },
},
```

迁移完成后启用。任何新代码尝试引用旧目录立即 lint 报错。

## 五、Smoke Test 设计

### 5.1 技术栈

- `@playwright/test` + `@playwright/test-runner`
- 配置文件：`playwright.config.ts`
- 测试目录：`test/smoke/`
- npm script：`pnpm smoke`

### 5.2 测试用例（最小冒烟）

```ts
// test/smoke/app.spec.ts

import { test, expect } from '@playwright/test'

test('未登录访问根路径 → 跳转 /login', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/login/)
  await expect(page.locator('input[placeholder*="用户名"]')).toBeVisible()
})

test('admin 登录 → 进入首页 + 侧边栏可见', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[placeholder*="用户名"]', 'admin')
  await page.fill('input[placeholder*="密码"]', '123456')
  await page.click('button:has-text("登录")')
  await expect(page).toHaveURL(/\/(home)?/)
  await expect(page.locator('.el-menu')).toBeVisible()
})

test('登录后访问 user 列表 → 表格渲染', async ({ page }) => {
  // 复用登录态（test.useStorage 或 beforeEach）
  await page.goto('/system/admin')  // 或 /user，看实际路由
  await expect(page.locator('.el-table')).toBeVisible()
})
```

### 5.3 CI smoke job

`.github/workflows/ci.yml` 加：

```yaml
smoke:
  name: Smoke
  runs-on: ubuntu-latest
  needs: build  # 等 build 完成后复用 dist
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v3
      with:
        version: 9.15.0
    - uses: actions/setup-node@v4
      with:
        node-version: '22.x'
        cache: pnpm
    - run: pnpm install --frozen-lockfile
    - run: pnpm exec playwright install --with-deps chromium
    - run: nohup pnpm dev --host 127.0.0.1 --strictPort &
    - run: |
        for i in $(seq 1 30); do
          curl -sf http://127.0.0.1:5173/ > /dev/null && break
          sleep 1
        done
    - run: pnpm smoke
      env:
        SMOKE_BASE_URL: http://127.0.0.1:5173/
```

**关键决策（2026-06-28 修订）**：smoke 跑 **dev server**（`pnpm dev`），不跑 production preview。

**修订理由（Task 3 实施时发现）**：vite-plugin-mock 通过 Vite 的 `configureServer` 钩子注入 middleware，该钩子**只在 dev 模式触发**，`vite preview` 完全不调用。因此 preview server 下 `/api/*` 请求会被 SPA fallback 拦截返回 HTML 而非 JSON，所有依赖登录态的 smoke 测试（登录、列表渲染）物理上无法跑通。

**修订前的决策原意**：
- 更接近真实部署
- 避免 dev IPv6 only 问题再次漏过

**修订后这两点评估**：
- "更接近真实部署"的前提是 mock 在 prod 可达，当前过渡期（M5.3 MSW 迁移尚未实施）不成立
- IPv6 问题已在 M6 通过 `vite.config.ts` `server.host: true` 解决；dev 命令显式锁 `--host 127.0.0.1 --strictPort` 进一步消除端口漂移与协议歧义

**何时切回 prod preview**：M5.3 完成 MSW 或后端真实接入后，mock 不再依赖 vite-plugin-mock 的 dev 钩子，届时本节可切回 `pnpm preview`，并恢复 baseURL 为 `http://localhost:4173/vue-admin/`。

## 六、实施顺序（TDD 节奏）

| # | 步骤 | 验证 |
|---|------|------|
| 1 | 安装 Playwright，写 `playwright.config.ts`，写第一个失败 smoke test | smoke 跑通 |
| 2 | 补齐 3 个 smoke test（登录、user 列表） | 3 个测试绿 |
| 3 | 迁移 `user` 模块 api（src/apis/user/* → modules/user/api.ts） | smoke + 单元测试绿 |
| 4 | 迁移 `system` 模块 api（admin/role/permission/dict） | 同上 |
| 5 | 迁移 `crud` 模块 api | 同上 |
| 6 | 迁移 `auth` 模块（合并 login api） | 同上 |
| 7 | 迁移 `layout` 5 个组件的 store 引用 | smoke 绿 |
| 8 | 合并 `src/stores/user.ts` 到 `src/app/stores/user.ts` | smoke + 单元测试绿 |
| 9 | 迁移 `collapse/dark/tagsView/storage` 到 `app/stores/` 或 `lib/storage/` | smoke 绿 |
| 10 | 删除 `src/apis/` `src/stores/` `counter.ts` `.DS_Store` | smoke 绿 |
| 11 | 启用 ESLint `no-restricted-imports` 规则 | lint 绿 |
| 12 | 移 `IconLogo` / `NotFound` 到合适位置 | smoke 绿 |
| 13 | CI 加 smoke job | GitHub Actions smoke 绿 |
| 14 | 同步更新 `CLAUDE.md` / `docs/standards/01-ARCHITECTURE.md` / README | 文档一致 |

每步独立 commit + smoke 验证。出现回归立即定位回滚。

## 七、DoD（完成定义）

- [ ] 所有 `@/apis` / `@/stores` 引用清零（grep 验证）
- [ ] `src/apis/` 与 `src/stores/` 目录删除
- [ ] `src/utils/` 与 `src/components/icons/` 目录清空（迁移至 `lib/` 与 `layout/`）
- [ ] 业务模块清单为 8 个（auth/dashboard/system/profile/crud/docs/about + system 含 5 子项）
- [ ] `modules/multi/` `modules/system/views/config/` 删除
- [ ] TagsView 右键菜单 5 项完整（含「关闭当前」）
- [ ] ESLint `no-restricted-imports` 规则生效
- [ ] 3 个 smoke test 本地全绿
- [ ] CI smoke job 在 GitHub Actions 上跑通
- [ ] lint / type-check / test 51+ / build 全绿
- [ ] 手动浏览器冒烟：登录 / 跳转 / 列表加载 / 暗黑切换 / 退出登录 全部通过
- [ ] 文档同步：`CLAUDE.md`、`docs/standards/01-ARCHITECTURE.md`、`README.md` 反映迁移后路径与模块清单

## 八、不做的事（YAGNI）

- **不**做深度 e2e（CRUD 创建/编辑/删除） → 留 M8
- **不**重写 api / store 实现 → 仅迁移路径与归属
- **不**补缺失业务模块（如 user 编辑表单） → 留 M7-C
- **不**引入 Storybook / Histoire → 留 L3 平台化
- **不**做 i18n → 留待用户决策（M7-B 候选）

## 九、风险与对策

| 风险 | 对策 |
|---|---|
| 迁移过程中漏改某个 import 导致 build 失败 | 每步独立 commit + smoke，回归立即定位 |
| `app/stores/user.ts` 与 `stores/user.ts` 字段/方法名不一致 | 合并前 diff 对比，逐字段合并 |
| layout 旧 store 有特殊副作用（如 dark mode 切换 DOM 操作） | 迁移时保留原实现，仅改路径，行为不变 |
| smoke test 在 CI 上 flaky | 用 `test.describe.configure({ mode: 'serial' })`，加重试 |
| Playwright 浏览器在 Ubuntu runner 上装包失败 | 用官方 `pnpm exec playwright install --with-deps chromium` |

## 十、工作量预估

| 项 | 时间 |
|---|---|
| Playwright 接入 + 3 smoke test | 1.5 小时 |
| 迁移 user 模块 | 30 分钟 |
| 迁移 system 模块（4 个 api） | 1 小时 |
| 迁移 crud + auth 模块 | 30 分钟 |
| 迁移 layout 5 个 store 引用 | 1 小时 |
| 合并 stores/user + 拆 collapse/dark/tagsView/storage | 1 小时 |
| ESLint 规则 + 清理 + IconLogo/NotFound 迁移 | 30 分钟 |
| CI smoke job + 文档同步 | 30 分钟 |
| **合计** | **~6.5 小时** |

## 十一、后续里程碑

- **M7-B**：通用组件库（SearchTable / FormDrawer / PageContainer）
- **M7-C**：业务页面闭环验证（user/role/dict CRUD 真的端到端跑通）

M7-A 完成且 tag `v0.1.0-rc.2` 验证后，再依次推进 M7-B 与 M7-C，最终发 `v0.1.0` 正式版。
