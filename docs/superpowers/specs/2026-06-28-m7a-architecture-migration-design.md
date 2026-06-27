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

| 旧路径 | 新路径 | 引用处 |
|---|---|---|
| `src/apis/user/index.ts` | `src/modules/user/api.ts` | `modules/user/views/List.vue` |
| `src/apis/user/info.ts` | 合并入 `src/modules/user/api.ts` | 检查实际引用 |
| `src/apis/user/login.ts` | 合并入 `src/modules/auth/api.ts`（仅保留必要部分） | 检查实际引用 |
| `src/apis/admin/index.ts` | `src/modules/system/api/admin.ts` | `modules/system/views/admin/List.vue` |
| `src/apis/role/index.ts` | `src/modules/system/api/role.ts` | `modules/system/views/role/List.vue` |
| `src/apis/permission/index.ts` | `src/modules/system/api/permission.ts` | `modules/system/views/permission/List.vue` |
| `src/apis/dict/index.ts` | `src/modules/system/api/dict.ts` | `modules/system/views/dict/hooks/useDictTree.ts`、`modules/crud/views/Detail.vue` |
| `src/apis/crud/index.ts` | `src/modules/crud/api.ts` | `modules/crud/views/Index.vue`、`Detail.vue` |
| `src/apis/client/service.ts` | **删除**（业务统一用 `@/lib/http/client` 的 `http` / `api`） | 旧 api 内部用 |

### 3.2 Store 层迁移

| 旧 store | 新归属 | 理由 |
|---|---|---|
| `src/stores/user.ts` | 合并入 `src/app/stores/user.ts` | 全局用户状态，已存在新版 |
| `src/stores/collapse.ts` | `src/app/stores/sidebar.ts` | UI 全局状态 |
| `src/stores/dark.ts` | `src/app/stores/theme.ts` | UI 全局状态 |
| `src/stores/tagsView.ts` | `src/app/stores/tagsView.ts` | UI 全局状态 |
| `src/stores/storage.ts` | `src/lib/storage/index.ts`（若纯工具）或 `src/app/stores/storage.ts` | 看实现性质 |
| `src/stores/counter.ts` | **删除** | Vue 脚手架示例，无引用 |

### 3.3 杂项

| 旧位置 | 新位置 | 理由 |
|---|---|---|
| `src/components/icons/IconLogo.vue` | `src/layout/components/Sidebar/IconLogo.vue` | 仅 Sidebar 引用 |
| `src/app/views/NotFound.vue` | `src/modules/about/views/NotFound.vue` 或保留 | 看路由配置决定 |
| `src/apis/.DS_Store` | **删除** + `.gitignore` 加 `**/.DS_Store` | macOS 残留 |

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
    - run: pnpm build
    - run: nohup pnpm preview &
    - run: sleep 3
    - run: pnpm smoke
      env:
        SMOKE_BASE_URL: http://localhost:4173/vue-admin/
```

**关键决策**：smoke 跑 **production build**（`pnpm preview`），不跑 dev server。理由：
- 更接近真实部署
- 避免本次"dev IPv6 only" 类问题再次漏过
- preview server 默认监听 0.0.0.0，CI 上无 IPv6 问题

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
- [ ] ESLint `no-restricted-imports` 规则生效
- [ ] 3 个 smoke test 本地全绿
- [ ] CI smoke job 在 GitHub Actions 上跑通
- [ ] lint / type-check / test 51+ / build 全绿
- [ ] 手动浏览器冒烟：登录 / 跳转 / 列表加载 / 暗黑切换 / 退出登录 全部通过
- [ ] 文档同步：`CLAUDE.md`、`docs/standards/01-ARCHITECTURE.md`、`README.md` 反映迁移后路径

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
