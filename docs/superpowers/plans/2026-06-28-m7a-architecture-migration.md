# M7-A 架构迁移 + 模块标准化 + Smoke Test 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 清除 M2/M3 遗留架构债（删除 `src/apis/` 与 `src/stores/`），按主流开源框架标准重组 8 个业务模块，引入 Playwright smoke test 与 CI smoke job，杜绝"CI 全绿但应用空白"的回归。

**Architecture:** 14 步 TDD 节奏。先建 smoke test 防护网，再按"模块标准化 → API 迁移 → Store 迁移 → 杂项归位 → 删除旧目录 → ESLint 强制 → CI 接入 → 文档同步"顺序推进。每步独立 commit，每步用 smoke + 单测双重验证。

**Tech Stack:** Vue 3.5 / Vite 7 / TypeScript 5.9 / Element Plus 2.11 / Pinia 2.2 / Vue Router 4.4 / Vitest 1.6 / @playwright/test 1.48+ / Node 22 / pnpm 9.15

## Global Constraints

- 测试账号：`admin` / `123456`（super_admin），`user` / `123456`（user 角色）
- HTTP 客户端统一用 `@/lib/http/client` 导出的 `http` / `api`，禁止 `import axios`
- Store 必须 setup 风格：`defineStore('<domain>', () => {...})`
- 响应式解构必须 `storeToRefs`
- 业务路径仅：`@/lib/*` `@/app/*` `@/modules/<domain>/*` `@/layout/*`，禁止 `@/apis` `@/stores` `@/utils` `@/components`
- 生产 base：`/vue-admin/`
- 不做 git 提交/分支操作（用户全局指令）—— 所有 commit step 由 subagent 在其 sandbox 内执行；如控制器是用户 session，需用户显式批准 commit
- ESLint flat config，目录边界强制（`eslint.config.js`）

---

## Task 1: 安装 Playwright 与配置

**Files:**

- Create: `playwright.config.ts`
- Create: `test/smoke/.gitkeep`
- Modify: `package.json`（devDependencies + scripts）
- Modify: `.gitignore`（加 `test-results/` `playwright-report/` `playwright/.cache/`）

**Interfaces:**

- Produces: `pnpm smoke` 命令、`SMOKE_BASE_URL` 环境变量约定（默认 `http://localhost:5173/`，dev server）

- [ ] **Step 1: 安装依赖**

```bash
pnpm add -D @playwright/test@^1.48
pnpm exec playwright install chromium
```

- [ ] **Step 2: 写 `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './test/smoke',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.SMOKE_BASE_URL || 'http://localhost:5173/',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
})
```

- [ ] **Step 3: 改 `package.json` scripts**

```jsonc
{
  "scripts": {
    // 既有脚本保留...
    "smoke": "playwright test",
    "smoke:ui": "playwright test --ui"
  }
}
```

- [ ] **Step 4: 改 `.gitignore`，加 3 行**

```
test-results/
playwright-report/
playwright/.cache/
```

- [ ] **Step 5: 创建 `test/smoke/.gitkeep` 占位（下一步会删）**

- [ ] **Step 6: 验证**

```bash
pnpm smoke --help
```

Expected: 输出 playwright 帮助文本，无错误。

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml playwright.config.ts .gitignore test/smoke/.gitkeep
git commit -m "test(smoke): install playwright and configure base setup"
```

---

## Task 2: 第一个失败 smoke test —— 未登录跳转

**Files:**

- Create: `test/smoke/auth.spec.ts`
- Delete: `test/smoke/.gitkeep`

**Interfaces:**

- Consumes: Task 1 的 `playwright.config.ts`
- Produces: smoke 测试基线，后续任务都依赖此文件可运行

- [ ] **Step 1: 写失败测试 `test/smoke/auth.spec.ts`**

```ts
import { test, expect } from '@playwright/test'

test('未登录访问根路径 → 跳转 /login', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/login/)
  // Login.vue 用 el-form-item label 包裹 el-input，无 placeholder，需用 label 文本定位
  await expect(
    page.locator('.el-form-item', { hasText: '用户名' })
  ).toBeVisible()
})
```

- [ ] **Step 2: 启动 dev server 验证失败**

> **架构约束（2026-06-28 修订）**：smoke 跑 dev server 而非 preview，因为 `vite-plugin-mock` 仅在 `configureServer` 钩子（dev only）注入 middleware。详见 spec §5.3。

```bash
nohup pnpm dev --host 127.0.0.1 --strictPort > /tmp/vite-dev.log 2>&1 &
for i in $(seq 1 30); do curl -sf http://127.0.0.1:5173/ > /dev/null && break; sleep 1; done
pnpm smoke
```

Expected: 1 passed（守卫已支持 `/login` public 跳转，M6 已修复）。若失败需立即排查守卫逻辑。

- [ ] **Step 3: 关闭 dev server**

```bash
lsof -ti:5173 | xargs kill 2>/dev/null || true
```

- [ ] **Step 4: Commit**

```bash
git add test/smoke/auth.spec.ts
git rm test/smoke/.gitkeep
git commit -m "test(smoke): add unauthenticated redirect to /login"
```

---

## Task 3: 补齐登录与列表 smoke test

**Files:**

- Modify: `test/smoke/auth.spec.ts`

**Interfaces:**

- Produces: 3 个 smoke 用例全绿（auth-redirect / login / list-render）

- [ ] **Step 1: 追加两个测试到 `auth.spec.ts`**

```ts
test.describe.serial('登录态流程', () => {
  test('admin 登录 → 进入首页 + 侧边栏可见', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[placeholder*="用户名"]', 'admin')
    await page.fill('input[placeholder*="密码"]', '123456')
    await page.click('button:has-text("登录")')
    await expect(page).toHaveURL(/\/(home)?/)
    await expect(page.locator('.el-menu')).toBeVisible()
  })

  test('登录后访问 user 列表 → 表格渲染', async ({ page }) => {
    // 复用登录态：每个 test 均重新登录（serial 模式下顺序保证）
    await page.goto('/login')
    await page.fill('input[placeholder*="用户名"]', 'admin')
    await page.fill('input[placeholder*="密码"]', '123456')
    await page.click('button:has-text("登录")')
    await page.goto('/user/list') // Task 7 完成 user 模块合并后改为 /system/user/list
    await expect(page.locator('.el-table')).toBeVisible()
  })
})
```

> **注意**：当前用 `/user/list`（路由现状）；Task 7 完成 user 模块合并后此处同步改为 `/system/user/list`。

- [ ] **Step 2: 验证 3 个测试全绿**

```bash
nohup pnpm dev --host 127.0.0.1 --strictPort > /tmp/vite-dev.log 2>&1 &
for i in $(seq 1 30); do curl -sf http://127.0.0.1:5173/ > /dev/null && break; sleep 1; done
pnpm smoke
lsof -ti:5173 | xargs kill 2>/dev/null || true
```

Expected: 3 passed。

- [ ] **Step 3: Commit**

```bash
git add test/smoke/auth.spec.ts
git commit -m "test(smoke): cover login and list rendering"
```

---

## Task 4: 模块标准化 - 删除 multi 与 system/config

**Files:**

- Delete: `src/modules/multi/`（递归）
- Delete: `src/modules/system/views/config/`
- Modify: `src/router/menus.ts`（删除 `/multi/*` 与 `/system/config` 整段）

**Interfaces:**

- Consumes: Task 3 smoke 基线
- Produces: 路由清单少 2 项

- [ ] **Step 1: 删除目录**

```bash
git rm -r src/modules/multi
git rm -r src/modules/system/views/config
```

- [ ] **Step 2: 修改 `src/router/menus.ts`，删除两段**

删除 `/multi` 整段（约第 74-105 行）与 `/system/config` 整段（约第 155-164 行）。

- [ ] **Step 3: 验证**

```bash
pnpm type-check
pnpm lint
nohup pnpm dev --host 127.0.0.1 --strictPort > /tmp/vite-dev.log 2>&1 &
for i in $(seq 1 30); do curl -sf http://127.0.0.1:5173/ > /dev/null && break; sleep 1; done
pnpm smoke
lsof -ti:5173 | xargs kill 2>/dev/null || true
```

Expected: 全绿，3 smoke 通过。

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor(modules): remove demo multi-menu and empty system/config"
```

---

## Task 5: 模块标准化 - portrait 提升为 profile

**Files:**

- Move: `src/modules/system/views/portrait/Portrait.vue` → `src/modules/profile/views/Profile.vue`
- Modify: `src/router/menus.ts`（`/system/portrait` → `/profile`）

**Interfaces:**

- Produces: `modules/profile/` 顶层模块、路由 `/profile`

- [ ] **Step 1: 创建目录并移动**

```bash
mkdir -p src/modules/profile/views
git mv src/modules/system/views/portrait/Portrait.vue src/modules/profile/views/Profile.vue
rmdir src/modules/system/views/portrait 2>/dev/null || true
```

- [ ] **Step 2: 修改 `src/router/menus.ts`**

把 `/system/portrait` 子项从 system.children 中移出，提到 menus 顶层：

```ts
{
  path: '/profile',
  name: 'profile',
  component: () => import('@/modules/profile/views/Profile.vue'),
  meta: {
    title: '个人中心',
    icon: 'User',
    showMenu: false
  }
}
```

并从 `system.children` 数组中删除原 `systemPortrait` 项。

- [ ] **Step 3: 验证**

```bash
pnpm type-check && pnpm lint
nohup pnpm dev --host 127.0.0.1 --strictPort > /tmp/vite-dev.log 2>&1 &
for i in $(seq 1 30); do curl -sf http://127.0.0.1:5173/ > /dev/null && break; sleep 1; done
pnpm smoke
lsof -ti:5173 | xargs kill 2>/dev/null || true
```

Expected: 全绿。

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor(modules): promote portrait to top-level profile module"
```

---

## Task 6: 模块标准化 - home 重命名为 dashboard

**Files:**

- Move: `src/modules/home/` → `src/modules/dashboard/`
- Modify: `src/router/menus.ts`（import 路径）
- Modify: 任何引用 `@/modules/home` 的位置（grep 验证）

**Interfaces:**

- Produces: `modules/dashboard/` 模块

- [ ] **Step 1: 检查引用**

```bash
rg -n "@/modules/home" --type ts --type vue
```

Expected: 仅 `src/router/menus.ts` 一处。若有其他引用，一并更新。

- [ ] **Step 2: 移动**

```bash
git mv src/modules/home src/modules/dashboard
```

- [ ] **Step 3: 修改 `src/router/menus.ts` 第 7 行**

```ts
component: () => import('@/modules/dashboard/views/Home.vue'),
```

文件名 `Home.vue` 暂保留（避免连带改名）；如需统一可在独立 commit 中改为 `Dashboard.vue`，此处不做。

- [ ] **Step 4: 验证**

```bash
pnpm type-check && pnpm lint && pnpm build
# 然后启 dev server 跑 smoke（启停片段同 Task 2 Step 2-3）
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(modules): rename home to dashboard to match OSS conventions"
```

---

## Task 7: 模块标准化 - user 合并入 system/user

**Files:**

- Move: `src/modules/user/` 内容 → `src/modules/system/user/`
- Modify: `src/router/menus.ts`（删除独立 `/user` 顶层，改为 `system.children` 子项 `/system/user/list`）
- Modify: `test/smoke/auth.spec.ts`（列表 URL 改为 `/system/user/list`）

**Interfaces:**

- Consumes: Task 11（API 迁移）尚未完成，本任务仅做物理移动；user api 文件保留旧 import，等 Task 11 处理
- Produces: `modules/system/user/` 子模块、路由 `/system/user/list`

- [ ] **Step 1: 移动**

```bash
mkdir -p src/modules/system/user
git mv src/modules/user/views src/modules/system/user/views
# 若 modules/user 下还有其他文件（如 store.ts），一并移动
ls src/modules/user 2>/dev/null
rmdir src/modules/user 2>/dev/null || true
```

- [ ] **Step 2: 修改 `src/router/menus.ts`**

删除 `/user` 顶层段（第 54-73 行），在 `system.children` 中新增：

```ts
{
  path: '/system/user',
  name: 'systemUser',
  component: () => import('@/modules/system/user/views/List.vue'),
  meta: {
    title: '用户管理',
    icon: 'User',
    showMenu: true
  }
}
```

- [ ] **Step 3: 修改 `test/smoke/auth.spec.ts`**

将 `await page.goto('/user/list')` 改为 `await page.goto('/system/user/list')`。

- [ ] **Step 4: 验证**

```bash
pnpm type-check && pnpm lint && pnpm build && pnpm smoke
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(modules): merge user module into system/user"
```

---

## Task 8: 模块标准化 - 新增 system/menu 模块（占位）

**Files:**

- Create: `src/modules/system/menu/views/List.vue`
- Create: `src/mock/apis/menu-admin.ts`（仅当需要 mock 数据时；可能复用既有 menu mock）
- Modify: `src/router/menus.ts`

**Interfaces:**

- Produces: `/system/menu` 路由，占位页面（仅展示"菜单管理 - 待实现"）
- 注：完整 CRUD 留 M7-C，本任务只占位

- [ ] **Step 1: 写占位页面 `src/modules/system/menu/views/List.vue`**

```vue
<template>
  <div class="menu-placeholder">
    <el-empty description="菜单管理（M7-C 实现）" />
  </div>
</template>

<script lang="ts" setup>
// 占位组件，CRUD 留 M7-C
</script>
```

- [ ] **Step 2: 在 `src/router/menus.ts` 的 `system.children` 加一项**

```ts
{
  path: '/system/menu',
  name: 'systemMenu',
  component: () => import('@/modules/system/menu/views/List.vue'),
  meta: {
    title: '菜单管理',
    icon: 'Menu',
    showMenu: true
  }
}
```

- [ ] **Step 3: 验证**

```bash
pnpm type-check && pnpm lint && pnpm build && pnpm smoke
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(modules): add system/menu placeholder for OSS standard coverage"
```

---

## Task 9: API 层迁移 - user/system（合并到 modules/system/<x>/api.ts）

**Files:**

- Create: `src/modules/system/user/api.ts`（合并 `src/apis/user/index.ts` + `info.ts`）
- Create: `src/modules/system/admin/api.ts`（迁移自 `src/apis/admin/index.ts`）
- Create: `src/modules/system/role/api.ts`
- Create: `src/modules/system/permission/api.ts`
- Create: `src/modules/system/dict/api.ts`
- Modify: 对应 views 文件中的 import

**Interfaces:**

- Consumes: `@/lib/http/client` 的 `http` / `api`
- Produces: 每个 system 子模块自带 `api.ts`，views 改 import 来源

- [ ] **Step 1: 读旧实现确定签名**

```bash
cat src/apis/user/index.ts src/apis/admin/index.ts src/apis/role/index.ts src/apis/permission/index.ts src/apis/dict/index.ts
```

记录每个导出函数名、参数、返回类型。

- [ ] **Step 2: 写 5 个新 api.ts**

以 `src/modules/system/user/api.ts` 为例（合并 user/index.ts + user/info.ts）：

```ts
import { http } from '@/lib/http/client'

export interface UserProfile {
  id: number
  username: string
  // ... 字段沿用旧定义
}

export const getUserList = (params: Record<string, unknown>) =>
  http.get<UserProfile[]>('/user/list', { params })

export const getUserInfo = () => http.get<UserProfile>('/user/info')

// 其余函数按旧文件原样搬过来，把 axios.create 客户端替换为 http
```

**关键约束**：

- 函数签名与返回类型必须与旧实现**完全一致**（避免改 views 调用）
- 若旧实现返回 `{ data, error?, response? }` 形态，需在 views 调用处一并改为标准 `data`（参考旧 `apis/client/service.ts` 的适配层逻辑）
- 把所有 `service.get/post/put/delete(url, data, options)` 改为 `http.get/post/put/delete(url, { params/data, ...options })`

- [ ] **Step 3: 改 views import**

每个 `modules/system/<x>/views/List.vue` 中：

- 删除 `import ... from '@/apis/<x>'`
- 改为 `import { ... } from './api'` 或 `'../api'`

同时检查 `modules/system/dict/hooks/useDictTree.ts` 与 `modules/crud/views/Detail.vue` 是否引用旧 dict api。

- [ ] **Step 4: 验证**

```bash
pnpm type-check && pnpm lint && pnpm test
nohup pnpm dev --host 127.0.0.1 --strictPort > /tmp/vite-dev.log 2>&1 &
for i in $(seq 1 30); do curl -sf http://127.0.0.1:5173/ > /dev/null && break; sleep 1; done
pnpm smoke
lsof -ti:5173 | xargs kill 2>/dev/null || true
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(api): migrate system domain apis to modules/system/<x>/api.ts"
```

---

## Task 10: API 层迁移 - crud 与 auth/login

**Files:**

- Create: `src/modules/crud/api.ts`
- Create/Modify: `src/modules/auth/api.ts`（合并 `src/apis/user/login.ts` 的必要部分）

**Interfaces:**

- Consumes: Task 9 的迁移模式
- Produces: crud 模块与 auth 模块自带 api

- [ ] **Step 1: 迁移 crud api**

参照 Task 9 模式，把 `src/apis/crud/index.ts` 搬到 `src/modules/crud/api.ts`，改 views 引用。

- [ ] **Step 2: 合并 login api 到 auth**

读 `src/apis/user/login.ts`，区分两类函数：

- 登录/登出/token 刷新 → 放 `src/modules/auth/api.ts`
- 用户信息查询（应已在 Task 9 迁到 system/user）→ 不重复

如果 `lib/auth/authService.ts` 已经接管了登录逻辑（M3 应该做了），可能 login.ts 大部分已废弃，仅保留少量辅助函数。

- [ ] **Step 3: 验证**

```bash
pnpm type-check && pnpm lint && pnpm test && pnpm smoke
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor(api): migrate crud api and merge login api into auth module"
```

---

## Task 11: Store 层迁移 - layout 5 个引用改 app/stores

**Files:**

- Modify: `src/layout/components/Header/Index.vue`（dark/collapse）
- Modify: `src/layout/components/Sidebar/Index.vue`（collapse）
- Modify: `src/layout/components/TagsView/Index.vue`（tagsView）
- Modify: `src/layout/components/TagsView/ContextMenu.vue`（tagsView）
- Modify: 任何 layout 引用 `@/stores/*` 的位置（grep 验证）

**Interfaces:**

- Consumes: `src/stores/*`（旧）的导出签名
- Produces: layout 改用 `@/app/stores/sidebar` `@/app/stores/theme` `@/app/stores/tagsView`
- 注：app/stores/* 在 Task 12 才创建。本任务**先把新 store 文件创建出来**（复制旧实现），让本任务自洽

**修正**：调整为**先创建新 store（Task 12），再改 layout 引用（Task 13）**。本 Task 11 删除，并入 Task 12/13。

> **任务调整**：Task 11 与 Task 12 合并为新 Task 11「Store 全量迁移」。

---

## Task 11 (合并后): Store 全量迁移

**Files:**

- Create: `src/app/stores/sidebar.ts`（迁移自 `src/stores/collapse.ts`）
- Create: `src/app/stores/theme.ts`（迁移自 `src/stores/dark.ts`）
- Create: `src/app/stores/tagsView.ts`（迁移自 `src/stores/tagsView.ts`，含「关闭当前」菜单项支持）
- Merge: `src/stores/user.ts` → `src/app/stores/user.ts`（字段差异需 diff 对比，逐字段合并）
- Create or Move: `src/stores/storage.ts` → `src/lib/storage/index.ts`（若纯工具）或 `src/app/stores/storage.ts`
- Modify: layout 5 处 store 引用
- Modify: Login.vue store 引用
- Modify: `src/layout/components/TagsView/ContextMenu.vue` 加「关闭当前」菜单项

**Interfaces:**

- Produces: 所有 store 在 `app/stores/`，layout/views 通过 `@/app/stores/*` 引用

- [ ] **Step 1: 读旧 store 实现**

```bash
cat src/stores/collapse.ts src/stores/dark.ts src/stores/tagsView.ts src/stores/user.ts src/stores/storage.ts
cat src/app/stores/user.ts  # 新版，对比字段差异
```

- [ ] **Step 2: 创建 sidebar store**

`src/app/stores/sidebar.ts`（保持旧 collapse.ts 的对外 API 兼容，仅改路径）：

```ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSidebarStore = defineStore('sidebar', () => {
  const collapsed = ref(false)
  const toggleCollapsed = () => {
    collapsed.value = !collapsed.value
  }
  const setCollapsed = (v: boolean) => {
    collapsed.value = v
  }
  return { collapsed, toggleCollapsed, setCollapsed }
})
```

如果旧 `collapse.ts` 用的是 VueUse `useStorage` 持久化，保留持久化逻辑。

- [ ] **Step 3: 创建 theme store**

`src/app/stores/theme.ts`（沿用旧 dark.ts 实现，仅改路径）：

```ts
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(false)
  const toggleDark = () => {
    isDark.value = !isDark.value
  }
  watch(
    isDark,
    (val) => {
      document.documentElement.classList.toggle('dark', val)
    },
    { immediate: true }
  )
  return { isDark, toggleDark }
})
```

**注意**：保留旧实现里 `html.dark` class 切换、Element Plus dark css 等副作用，不要简化。

- [ ] **Step 4: 创建 tagsView store（含关闭当前支持）**

`src/app/stores/tagsView.ts`，完整搬旧实现，并在 `removeTagsView` 中确认 `type: 'index'` 已支持（旧实现已有，对应关闭单个 = 关闭当前）：

```ts
// 与 src/stores/tagsView.ts 实现一致，路径变更
// 已有 type: 'index' 分支，ContextMenu.vue 调用即可
```

- [ ] **Step 5: 合并 user store**

读两个版本（旧 `stores/user.ts` 与新 `app/stores/user.ts`）的字段/方法清单，逐项合并：

- token、profile、permissions、roles、login、logout、fetchProfile 等字段，新版优先，缺的从旧版补
- 登录调用最终改走 `lib/auth/authService`（M3 已实现），不要保留旧 axios 直调

- [ ] **Step 6: 处理 storage**

```bash
cat src/stores/storage.ts
```

若纯工具函数（封装 localStorage/sessionStorage）：移到 `src/lib/storage/index.ts`。
若是 Pinia store：移到 `src/app/stores/storage.ts`。

- [ ] **Step 7: 改 layout 5 处引用**

```bash
rg -n "@/stores/" src/layout src/modules/auth/views/Login.vue
```

逐处把 `@/stores/collapse` → `@/app/stores/sidebar`、`@/stores/dark` → `@/app/stores/theme` 等。注意 store 名称变化（`useCollapseStore` → `useSidebarStore`）需在调用处一并改。

- [ ] **Step 8: TagsView「关闭当前」菜单项**

修改 `src/layout/components/TagsView/ContextMenu.vue`，在「刷新」与「关闭右侧」之间插入：

```vue
<template>
  <ul class="context-menu-container">
    <li @click="onRefreshClick">刷新</li>
    <li @click="onCloseCurrentClick">关闭当前</li>
    <!-- 新增 -->
    <li @click="onCloseRightClick">关闭右侧</li>
    <li @click="onCloseOtherClick">关闭其他</li>
    <li @click="onCloseAllClick">关闭全部</li>
  </ul>
</template>

<script lang="ts" setup>
// 既有的 onCloseRightClick 等保留...

const onCloseCurrentClick = () => {
  removeTagsView({
    type: 'index',
    index: props.index
  })
  // 关闭当前后跳到相邻 tag（参考 Index.vue 的 onCloseClick 逻辑）
  router.go(-1)
}
</script>
```

**精确逻辑**：参考 `Index.vue` 第 70-84 行 `onCloseClick`，关闭后路由跳到上一项或首页。把这段逻辑提到 store 或共用 util，避免双份。

- [ ] **Step 9: 验证**

```bash
pnpm type-check && pnpm lint && pnpm test && pnpm build
# 然后启 dev server 跑 smoke（启停片段同 Task 2 Step 2-3）
```

Expected: 全绿，3 smoke 通过，包括 TagsView 右键菜单 5 项可见（手动抽样）。

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "refactor(state): migrate stores to app/stores and close tagsview menu loop"
```

---

## Task 12: 杂项迁移 - IconLogo / NotFound / nprogress

**Files:**

- Move: `src/components/icons/IconLogo.vue` → `src/layout/components/Sidebar/IconLogo.vue`
- Move: `src/app/views/NotFound.vue` → `src/modules/about/views/NotFound.vue`
- Move: `src/utils/nprogress/index.ts` → `src/lib/nprogress/index.ts`
- Modify: 引用上述文件的 3 处位置

**Interfaces:**

- Produces: `src/components/icons/` 与 `src/utils/` 清空

- [ ] **Step 1: 移动 IconLogo**

```bash
git mv src/components/icons/IconLogo.vue src/layout/components/Sidebar/IconLogo.vue
```

查找引用：

```bash
rg -n "components/icons/IconLogo"
```

改为相对路径或 `@/layout/components/Sidebar/IconLogo.vue`。

- [ ] **Step 2: 移动 NotFound**

```bash
git mv src/app/views/NotFound.vue src/modules/about/views/NotFound.vue
```

修改 `src/router/menus.ts` 第 178-181 行：

```ts
{
  path: '/404',
  name: 'notFound',
  component: () => import('@/modules/about/views/NotFound.vue')
}
```

- [ ] **Step 3: 移动 nprogress**

```bash
mkdir -p src/lib/nprogress
git mv src/utils/nprogress/index.ts src/lib/nprogress/index.ts
```

修改 `src/router/index.ts` 第 3 行：

```ts
import nprogress from '@/lib/nprogress'
```

（检查 `src/app/main.ts` 是否也引用 nprogress CSS，一并改路径）

- [ ] **Step 4: 验证**

```bash
pnpm type-check && pnpm lint && pnpm test && pnpm build
# 然后启 dev server 跑 smoke（启停片段同 Task 2 Step 2-3）
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: relocate IconLogo, NotFound, nprogress to canonical paths"
```

---

## Task 13: 删除旧目录 + ESLint no-restricted-imports

**Files:**

- Delete: `src/apis/`（整目录）
- Delete: `src/stores/`（整目录，含 `counter.ts`）
- Delete: `src/components/icons/`（空目录）
- Delete: `src/utils/`（空目录）
- Delete: `src/apis/.DS_Store` + `.gitignore` 加 `**/.DS_Store`
- Modify: `eslint.config.js`（新增 no-restricted-imports 块）

**Interfaces:**

- Produces: ESLint 强制规则生效，新代码尝试 import 旧路径立即报错

- [ ] **Step 1: grep 验证零引用**

```bash
rg -n "@/apis|@/stores|@/utils|@/components" src/
```

Expected: 0 matches。若有，回到对应任务修复。

- [ ] **Step 2: 删除目录**

```bash
git rm -r src/apis src/stores src/components src/utils
```

（若 `src/components` 还有非 icons 内容则保留，仅删 icons 子目录）

- [ ] **Step 3: `.gitignore` 加一行**

```
**/.DS_Store
```

- [ ] **Step 4: 修改 `eslint.config.js`，加 no-restricted-imports 块**

```js
{
  files: ['src/modules/**/*', 'src/layout/**/*', 'src/app/**/*'],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        {
          group: ['@/apis', '@/apis/*'],
          message: '禁止引用旧 src/apis/，请改用 @/modules/<domain>/api 或 @/lib/http/client'
        },
        {
          group: ['@/stores', '@/stores/*'],
          message: '禁止引用旧 src/stores/，请改用 @/app/stores/* 或 @/modules/<domain>/store'
        },
        {
          group: ['@/utils', '@/utils/*'],
          message: '禁止引用旧 src/utils/，请改用 @/lib/*'
        },
        {
          group: ['@/components', '@/components/*'],
          message: '禁止引用旧 src/components/，请改用 @/layout/components/* 或 @/modules/<x>/components/*'
        }
      ]
    }]
  }
}
```

- [ ] **Step 5: 验证**

```bash
pnpm lint
pnpm type-check && pnpm test && pnpm build
# 然后启 dev server 跑 smoke（启停片段同 Task 2 Step 2-3）
```

Expected: lint 全绿（强制规则启用后旧路径已不存在，不触发）。

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove legacy apis/stores/utils/components and enforce via eslint"
```

---

## Task 14: CI smoke job + 文档同步

**Files:**

- Modify: `.github/workflows/ci.yml`（加 smoke job）
- Modify: `CLAUDE.md`
- Modify: `docs/standards/01-ARCHITECTURE.md`
- Modify: `README.md`

**Interfaces:**

- Produces: GitHub Actions smoke job 跑通、文档反映迁移后路径

- [ ] **Step 1: 加 CI smoke job**

读 `.github/workflows/ci.yml` 现有 jobs（lint/test/build），加：

```yaml
smoke:
  name: Smoke
  runs-on: ubuntu-latest
  needs: build
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
    - run: nohup pnpm dev --host 127.0.0.1 --strictPort > /tmp/vite-dev.log 2>&1 &
    - name: Wait for dev server
      run: |
        for i in $(seq 1 60); do
          curl -sf http://127.0.0.1:5173/ > /dev/null && break
          sleep 1
        done
        curl -sf http://127.0.0.1:5173/ > /dev/null || (cat /tmp/vite-dev.log && exit 1)
    - run: pnpm smoke
      env:
        SMOKE_BASE_URL: http://127.0.0.1:5173/
```

- [ ] **Step 2: 更新 `CLAUDE.md`**

把"业务页面按域分子目录"小节中的"9 个模块"改为"8 个模块（auth/dashboard/system/profile/crud/docs/about + system 含 user/role/permission/menu/dict 5 子项）"。

更新「常用命令」加 `pnpm smoke`。

- [ ] **Step 3: 更新 `docs/standards/01-ARCHITECTURE.md`**

更新四层目录示例，删除已不存在的 `src/apis/` `src/stores/` `src/utils/` `src/components/icons/`，补充 `src/lib/nprogress/` `src/lib/storage/` `src/modules/profile/` `src/modules/dashboard/` `src/modules/system/menu/`。

- [ ] **Step 4: 更新 `README.md`**

- 项目结构树同步更新
- 功能列表补"8 模块标准化布局 + Smoke Test 自动化"

- [ ] **Step 5: 本地最终验证**

```bash
pnpm lint && pnpm type-check && pnpm test && pnpm build
nohup pnpm dev --host 127.0.0.1 --strictPort > /tmp/vite-dev.log 2>&1 &
for i in $(seq 1 30); do curl -sf http://127.0.0.1:5173/ > /dev/null && break; sleep 1; done
pnpm smoke
lsof -ti:5173 | xargs kill 2>/dev/null || true
```

Expected: 4 件套 + 3 smoke 全绿。

- [ ] **Step 6: 手动浏览器冒烟**

启动 dev server，依次手动验证：

- [ ] 登录页可见
- [ ] admin 登录成功，跳转首页
- [ ] 侧边栏菜单显示 8 模块（auth 不显示，dashboard/system/profile/crud/docs/about + system 展开 5 子项）
- [ ] 进入 `/system/user/list` 表格渲染
- [ ] TagsView 显示，右键 5 项菜单齐全
- [ ] 暗黑模式切换生效
- [ ] 退出登录回到 `/login`

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "ci: add smoke job and sync docs after architecture migration"
```

---

## 自检清单

完成所有任务后，对照规范 §七 DoD 逐项打勾：

- [ ] `@/apis` `@/stores` `@/utils` `@/components` grep 零结果
- [ ] `src/apis/` `src/stores/` `src/utils/` `src/components/icons/` 目录不存在
- [ ] 8 模块清单：auth / dashboard / system(user/role/permission/menu/dict) / profile / crud / docs / about
- [ ] TagsView 右键菜单 5 项完整
- [ ] ESLint `no-restricted-imports` 4 条 pattern 生效
- [ ] `pnpm smoke` 本地 3 测试全绿
- [ ] GitHub Actions smoke job 在 PR/push 时跑通
- [ ] lint / type-check / test 51+ / build 全绿
- [ ] 手动冒烟 7 项全通过
- [ ] `CLAUDE.md` / `docs/standards/01-ARCHITECTURE.md` / `README.md` 同步

## 估算

| 任务                               | 时长      |
| ---------------------------------- | --------- |
| Task 1-3 Playwright 接入 + 3 smoke | 1.5h      |
| Task 4-8 模块标准化（5 个任务）    | 2h        |
| Task 9-10 API 层迁移               | 1.5h      |
| Task 11 Store 层迁移 + 关闭当前    | 1.5h      |
| Task 12 杂项归位                   | 0.5h      |
| Task 13 删除 + ESLint              | 0.5h      |
| Task 14 CI + 文档                  | 1h        |
| **合计**                           | **~8.5h** |

（比规范预估的 6.5h 多 2h，因新增了模块标准化 5 个子任务）
