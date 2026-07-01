# M6 开源就绪里程碑设计

> **状态**：设计稿（待用户审阅 → 转 writing-plans）
> **日期**：2026-06-27
> **作者**：如水 <rushui@qq.com>
> **范围**：仅 M6（开源治理）。M7（技术债务）/ M8（业务联调）后续单独立项。

## 目标

把 vue-admin 从"内部基座"升级到"可开源就绪"，达到开源治理最小标准。完成后发布 v0.1.0（开源预览版）。

## 架构与决策摘要

| 决策点         | 选择                                                                                         |
| -------------- | -------------------------------------------------------------------------------------------- |
| Spec 范围      | 只做 M6 开源就绪，M7/M8 后续单独立项                                                         |
| 文档语言       | 仅中文                                                                                       |
| License        | MIT                                                                                          |
| 作者署名       | 如水 <rushui@qq.com>                                                                         |
| GitHub owner   | vue-admin/vue-admin                                                                          |
| CI 矩阵        | lint + type-check + test + build（4 件套）                                                   |
| Coverage       | Codecov 上报（首发不卡阈值）                                                                 |
| CHANGELOG 工具 | git-cliff（GitHub Action `orhun/git-cliff-action`）                                          |
| 发布流程       | 半自动（手动改版本号 + tag，CI 自动生成 CHANGELOG 和 Release）                               |
| 治理文件       | LICENSE + CONTRIBUTING + CODE_OF_CONDUCT + SECURITY + CHANGELOG + Issue/PR 模板 + commitlint |
| 首版本号       | 0.1.0                                                                                        |
| Node 版本      | 22 LTS（`engines: ">=22 <23"`）                                                              |
| 依赖升级       | M6 内一并升级到最新稳定版（4 批 + 每批独立 commit + 可 revert）                              |

## 文件清单（共 19 项新增/修改）

### 新增文件

| 路径                                         | 职责                                                                       |
| -------------------------------------------- | -------------------------------------------------------------------------- |
| `LICENSE`                                    | MIT 协议全文 + 版权声明（如水 / rushui@qq.com / 2026）                     |
| `.github/workflows/ci.yml`                   | push + PR 触发，4 件套 jobs + Codecov 上传                                 |
| `.github/workflows/release.yml`              | push tag `v*` 触发，git-cliff 生成 CHANGELOG + GitHub Release              |
| `cliff.toml`                                 | git-cliff 配置（conventional commits 解析、中文模板、keepachangelog 兼容） |
| `commitlint.config.js`                       | `@commitlint/config-conventional` + 中文 type 映射                         |
| `.husky/commit-msg`                          | husky 钩子调用 commitlint                                                  |
| `.github/ISSUE_TEMPLATE/bug_report.yml`      | Bug 上报表单                                                               |
| `.github/ISSUE_TEMPLATE/feature_request.yml` | 特性请求表单                                                               |
| `.github/ISSUE_TEMPLATE/config.yml`          | Issue 引导配置（关闭 blank issues，引导 Discussions）                      |
| `.github/PULL_REQUEST_TEMPLATE.md`           | PR 自检清单                                                                |
| `CONTRIBUTING.md`                            | 贡献指南（10 章节）                                                        |
| `CODE_OF_CONDUCT.md`                         | Contributor Covenant 2.1 中文版                                            |
| `SECURITY.md`                                | 漏洞披露流程（无现金 bounty）                                              |
| `CHANGELOG.md`                               | git-cliff 首次生成，含 0.1.0 条目                                          |

### 修改文件

| 路径                 | 变更点                                                                                                                                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`       | 加 `license: MIT` / `author` / `repository` / `homepage` / `bugs` / `keywords` / `engines` / `packageManager`；移除 `"private": true`；版本 `0.0.1` → `0.1.0`；加 3 个 scripts（changelog 等）；依赖大升级 |
| `README.md`          | 顶部加 3 个 badge（license / CI / coverage）；底部加 License 章节                                                                                                                                          |
| `vitest.config.ts`   | 加 `coverage` 配置（c8 provider / lcov reporter）                                                                                                                                                          |
| `.gitignore`         | 加 `coverage/`                                                                                                                                                                                             |
| `.lintstagedrc.json` | 适配 lint-staged 17（如配置 API 变化）                                                                                                                                                                     |
| `eslint.config.js`   | 适配 ESLint 9.x（如必要，应为已最新无需动）                                                                                                                                                                |

### YAGNI 明确排除

- FUNDING.yml（无打赏计划）
- dependabot.yml / renovate.json（依赖更新后续单独立项）
- stale.yml（Issue 自动失效，社区规模起来再加）
- 多语言 README（决策仅中文）
- deploy preview（决策排除）
- E2E 测试 / Lighthouse / Bundle size CI / a11y 审计（M8+ 引入）

## CI 流水线设计

### `.github/workflows/ci.yml`

**触发**：

```yaml
on:
  push:
    branches: [main, 'feat/**', 'fix/**']
  pull_request:
    branches: [main]
```

**Job 矩阵**（全部 ubuntu-latest + Node 22.x）：

| Job          | 关键步骤                                                              | 失败影响 |
| ------------ | --------------------------------------------------------------------- | -------- |
| `lint`       | `pnpm install --frozen-lockfile` → `pnpm lint`                        | ❌ 阻塞  |
| `type-check` | `pnpm type-check`                                                     | ❌ 阻塞  |
| `test`       | `pnpm test --coverage` → `codecov/codecov-action@v4` 上传             | ❌ 阻塞  |
| `build`      | `pnpm build` → `actions/upload-artifact@v4` 上传 `dist/`（保留 7 天） | ❌ 阻塞  |

**关键设计**：

- Node 22.x 单版本（engines 锁定 `>=22 <23`）
- 包管理：`pnpm/action-setup@v3` + `actions/setup-node@v4` with `cache: pnpm`
- lockfile 冻结：`--frozen-lockfile`
- Codecov `fail_ci_if_error: false`（首发容错）
- coverage 不卡阈值

**vitest.config.ts 新增 coverage 配置**：

```ts
coverage: {
  provider: 'c8',
  reporter: ['text', 'lcov', 'html'],
  reportsDirectory: './coverage',
  // 首发不设 thresholds
}
```

### `.github/workflows/release.yml`

**触发**：`push tags: ['v*']`

**步骤**：

1. checkout（fetch-depth: 0）
2. setup Node 22
3. `orhun/git-cliff-action@v3` 生成最新 tag 的 CHANGELOG 段落
4. commit CHANGELOG 更新到 main（github-actions[bot]）
5. `softprops/action-gh-release@v2` 创建 GitHub Release，body 用 cliff 输出

## Commit 规范与 CHANGELOG 联动

### commitlint 配置（`commitlint.config.js`）

```js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert'
      ]
    ],
    'subject-case': [0], // 关闭大小写校验（中文 subject）
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [0] // 中文段落
  }
}
```

**type 中文用途映射**（CONTRIBUTING.md 同步）：
feat=新功能 / fix=修复 bug / docs=文档 / style=格式 / refactor=重构 / perf=性能 / test=测试 / build=构建 / ci=CI 配置 / chore=杂项 / revert=回滚

### husky 钩子（`.husky/commit-msg`）

```bash
pnpm exec commitlint --edit "$1"
```

### git-cliff 配置（`cliff.toml`）

- 解析 conventional commits（与 commitlint 同源）
- keepachangelog 格式
- 中文 section 标题
- 分组：Features / Bug Fixes / Documentation / Refactor / Performance / Test / Miscellaneous / Reverts

### package.json scripts

```json
{
  "changelog": "git-cliff -o CHANGELOG.md --unreleased",
  "changelog:latest": "git-cliff -o CHANGELOG.md latest",
  "release:dry": "git-cliff --unreleased --strip header"
}
```

### 半自动发布流程

```
1. pnpm changelog 预览未发布条目
2. git add CHANGELOG.md && git commit -m "docs(changelog): update for v0.1.0"
3. 修改 package.json 版本 → 0.1.0
4. git commit -m "chore(release): v0.1.0"
5. git tag v0.1.0
6. git push origin main --tags
7. release.yml 自动：cliff 生成最终 CHANGELOG + gh release create v0.1.0
```

## package.json 元信息

```json
{
  "name": "vue-admin",
  "version": "0.1.0",
  "type": "module",
  "license": "MIT",
  "author": "如水 <rushui@qq.com>",
  "homepage": "https://github.com/vue-admin/vue-admin",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/vue-admin/vue-admin.git"
  },
  "bugs": {
    "url": "https://github.com/vue-admin/vue-admin/issues",
    "email": "rushui@qq.com"
  },
  "keywords": [
    "vue3",
    "vite",
    "typescript",
    "element-plus",
    "admin",
    "admin-dashboard",
    "rbac",
    "starter",
    "boilerplate",
    "pinia",
    "vue-router"
  ],
  "engines": {
    "node": ">=22.0.0 <23.0.0",
    "pnpm": ">=9.0.0"
  },
  "packageManager": "pnpm@9.15.0"
  // ❌ 移除 "private": true
}
```

## 依赖升级清单

| 包                                    | 当前    | 目标       | 风险      |
| ------------------------------------- | ------- | ---------- | --------- |
| Node                                  | 21.5.0  | 22.x LTS   | 🟢 低     |
| vue                                   | ^3.4.19 | ^3.5.x     | 🟢 低     |
| vite                                  | ^4.5    | ^7.x       | 🔴 高     |
| @vitejs/plugin-vue                    | ^4.6.2  | ^5.x       | 🟡 中     |
| @vitejs/plugin-vue-jsx                | ^3.1.0  | ^4.x       | 🟡 中     |
| typescript                            | ^4.8    | ^5.x       | 🟡 中     |
| vue-tsc                               | 当前    | ^2.x       | 🟡 中     |
| element-plus                          | ^2.5.6  | ^2.8+      | 🟢 低     |
| pinia                                 | ^2.1.7  | ^2.2+      | 🟢 低     |
| vue-router                            | ^4.3.0  | ^4.4+      | 🟢 低     |
| vitest                                | ^1.6.1  | ^3.x       | 🔴 高     |
| @vue/test-utils                       | ^2.4.11 | ^2.4+      | 🟢 低     |
| eslint                                | ^9      | ^9         | ✅ 已最新 |
| @typescript-eslint/*                  | ^8      | ^8         | ✅ 已最新 |
| husky                                 | ^9.1.7  | ^9.x       | ✅ 已最新 |
| lint-staged                           | ^15.5.2 | ^17.x      | 🟡 中     |
| jsdom                                 | 当前    | ^25+       | 🟢 低     |
| vite-plugin-mock                      | 当前    | 最新兼容版 | 🔴 高     |
| unplugin-auto-import / vue-components | 当前    | 最新       | 🟡 中     |
| axios                                 | ^1.6.7  | ^1.7+      | 🟢 低     |
| @vueuse/core                          | ^10.8.0 | ^11+       | 🟡 中     |
| @types/node                           | ^18     | ^22        | 🟢 低     |
| globals                               | 已装    | 同步       | 🟢 低     |

### 升级执行策略（4 批 + 每批独立 commit + 可 revert）

| 批次 | 范围                                                 | 验证命令                              |
| ---- | ---------------------------------------------------- | ------------------------------------- |
| 批 1 | TypeScript 5 + vue-tsc 2 + types/node 22             | `pnpm type-check`                     |
| 批 2 | Vue 3.5 + Pinia + Vue Router + Element Plus + VueUse | `pnpm dev` + 关键页跳转 + `pnpm test` |
| 批 3 | Vite 7 + 配套 plugin                                 | `pnpm build` + `pnpm preview`         |
| 批 4 | Vitest 3 + c8 coverage                               | `pnpm test --coverage`                |

**vite-plugin-mock 高风险处理预案**：

- 方案 a：找替代（msw 提前迁移）
- 方案 b：临时降级 + 标注 M6.5/M7 处理
- 决策时机：批 3 升级时验证，若不兼容按方案 b 处理

## 治理文件内容大纲

### CONTRIBUTING.md（10 章节）

1. 快速开始（pnpm install + pnpm dev + 测试账号）
2. 开发环境要求（Node 22+ / pnpm 9+ / Volar）
3. 项目结构速览（链接 docs/standards/01-ARCHITECTURE.md）
4. 分支策略（main 受保护 / feat/* fix/* docs/* chore/*）
5. Commit 规范（conventional commits type 表 + 示例）
6. 代码质量门（lint / type-check / test / pre-commit hook）
7. PR 流程（切分支 → 自检 → PR 模板 → 1 review → squash merge）
8. Issue 规范（链接 Bug / Feature 模板）
9. 行为准则（链接 CODE_OF_CONDUCT.md）
10. 联系方式（rushui@qq.com + GitHub Issues）

### CODE_OF_CONDUCT.md

采用 Contributor Covenant 2.1 官方中文版，不自行改写。

### SECURITY.md

1. 支持的版本表（0.1.x ✅）
2. 报告漏洞：邮件 rushui@qq.com（不要公开 Issue）
3. 响应 SLA：48h 确认 / 7d 初评 / 90d 修复
4. 披露策略：修复后 90 天 Coordinated Disclosure
5. 明确无现金 bounty

### Issue 模板

**bug_report.yml**：标题 / 复现步骤 / 期望 / 实际 / 环境 / 截图 / 是否愿意提交 PR
**feature_request.yml**：问题陈述 / 期望方案 / 备选方案 / 是否愿意提交 PR
**config.yml**：

```yaml
blank_issues_enabled: false
contact_links:
  - name: 💬 提问与讨论
    url: https://github.com/vue-admin/vue-admin/discussions
    about: 使用问题请到 Discussions 讨论
```

### PR 模板（.github/PULL_REQUEST_TEMPLATE.md）

- 变更说明
- 变更类型 checkbox（feat/fix/docs/refactor/perf/test/build-ci-chore）
- 自检清单（lint / type-check / test / 测试覆盖 / 文档 / commit 规范）
- 关联 Issue

## 验收标准（Definition of Done）

### 一、版本与元信息

- [ ] `package.json` version = `0.1.0`
- [ ] 含全部 7 个 metadata 字段
- [ ] 移除 `"private": true`
- [ ] 新增 3 个 scripts

### 二、协议与文档

- [ ] `LICENSE` 文件存在（MIT + 如水 + 2026）
- [ ] `README.md` 顶部 3 个 badge
- [ ] `README.md` 底部 License 章节
- [ ] 4 个治理文档齐全

### 三、CI/CD 基础设施

- [ ] `ci.yml` 在 push 和 PR 触发
- [ ] 4 件套 job 全过
- [ ] Codecov 上传
- [ ] `release.yml` 在 push tag `v*` 触发

### 四、commit 规范与 CHANGELOG

- [ ] `commitlint.config.js` 存在
- [ ] `.husky/commit-msg` 钩子存在
- [ ] **本地验证**：不规范 commit 被拒绝 / 规范 commit 通过
- [ ] `cliff.toml` 存在
- [ ] **本地验证**：`pnpm changelog` 输出未发布条目

### 五、Issue/PR 模板

- [ ] 3 个 Issue 模板存在
- [ ] PR 模板存在

### 六、依赖升级（4 批）

- [ ] 批 1：TypeScript 5 + vue-tsc 2 → type-check 通过
- [ ] 批 2：Vue 3.5 + 全家桶 → dev 启动 + 关键页面渲染 + test 全过
- [ ] 批 3：Vite 7 → build 产出 + preview 正常
- [ ] 批 4：Vitest 3 + coverage → test --coverage 全过

### 七、质量门（每批升级后）

- [ ] `pnpm lint`：0 错误 0 警告
- [ ] `pnpm type-check`：通过
- [ ] `pnpm test`：全部通过
- [ ] `pnpm build`：产出 dist/
- [ ] `node --version`：v22.x

## 端到端验证场景

1. **commit 规范**：写不规范 commit 应被 husky 拒绝
2. **CHANGELOG 生成**：`pnpm changelog` 输出未发布条目
3. **CI 全绿**：PR 页面 4 个 check 全绿 + Codecov bot 评论
4. **发布演练**：tag `v0.1.0-rc.1` → release.yml 触发 → GitHub Release 创建 → 验证后清理

## 风险登记

| 风险                             | 概率 | 影响             | 缓解                                            |
| -------------------------------- | ---- | ---------------- | ----------------------------------------------- |
| Vite 7 + vite-plugin-mock 不兼容 | 高   | Mock 全失效      | 提前查兼容性；不兼容则临时降级 + 标注 M6.5 处理 |
| Vitest 3 API breaking            | 高   | 测试大量失败     | 留充足时间到批 4；查阅 migration guide          |
| TS 5 类型更严格                  | 中   | 现有代码报新错   | 升级后跑 type-check 逐个修，单独 commit         |
| Codecov 配置不当                 | 中   | badge unknown    | 首发期 `fail_ci_if_error: false` 容错           |
| git-cliff Action 不稳定          | 低   | release.yml 失败 | 用 orhun/git-cliff-action + fallback 手动 cliff |

## 范围外（明确不做）

- 业务功能开发（M8）
- MSW 迁移（M7）
- menusRegistered 重置 / 路由 404 兜底（M7）
- OAuth2/OIDC（plan future work）
- npm publish（应用项目不发）
- E2E / 性能 / a11y / Lighthouse CI（M8+）
- 多语言 README
- dependabot / renovate
