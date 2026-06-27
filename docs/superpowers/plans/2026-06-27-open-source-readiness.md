# M6 开源就绪里程碑 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 vue-admin 从"内部基座"升级到"可开源就绪"，达到开源治理最小标准并发布 v0.1.0。

**Architecture:** 两条相对独立的执行线索合并为单一 plan。线索 A（治理文件 + CI/CD 基础设施）风险低、可独立交付；线索 B（依赖升级 4 批）风险高、按批次独立 commit + 单批可 revert。最终通过端到端发布演练（tag v0.1.0-rc.1）完成里程碑。

**Tech Stack:** Node 22 LTS / pnpm 9 / Vue 3.5 / Vite 7 / TypeScript 5 / Vitest 3 / ESLint 9 / husky 9 / lint-staged 17 / git-cliff / @commitlint / GitHub Actions / Codecov / c8 coverage

## Global Constraints

- **License**：MIT（package.json `"license": "MIT"` + LICENSE 文件 MIT 全文）
- **作者署名**：如水 <rushui@qq.com>（LICENSE 版权行 + package.json `author`）
- **GitHub owner**：`rushui/vue-admin`（homepage / repository / bugs 三处 URL）
- **文档语言**：仅中文（README / CONTRIBUTING / SECURITY / CHANGELOG / Issue/PR 模板全部中文）
- **Node engines**：`"node": ">=22.0.0 <23.0.0"`
- **pnpm engines**：`"pnpm": ">=9.0.0"`
- **packageManager**：`"pnpm@9.15.0"`
- **首版**：0.1.0（package.json version `0.0.1` → `0.1.0`）
- **移除 `"private": true`**（开源不发 npm，但需让 metadata 可读）
- **不发 npm**：package.json 不含 `publishConfig`
- **commit 规范**：`@commitlint/config-conventional` + 关闭 subject-case（中文）+ type enum feat/fix/docs/style/refactor/perf/test/build/ci/chore/revert
- **CHANGELOG 工具**：git-cliff（GitHub Action `orhun/git-cliff-action@v3`），配置 `cliff.toml`
- **Coverage**：c8 provider + lcov reporter + Codecov 上传（首发期 `fail_ci_if_error: false`，不卡 thresholds）
- **CI 触发**：push 到 main / feat/* / fix/* + PR 到 main
- **Release 触发**：push tag `v*`
- **依赖版本目标**：typescript `^5` / vue `^3.5` / vite `^7` / vitest `^3` / lint-staged `^17` / element-plus `^2.8+` / pinia `^2.2+` / vue-router `^4.4+` / @vueuse/core `^11+` / vue-tsc `^2` / @types/node `^22`
- **Git 操作约束**：用户未明确要求时不要执行 git 提交；plan 内每个 Task 的 commit 步骤须由用户确认或在 executing-plans / SDD 流程中执行

---

## 阶段总览

| 阶段 | Tasks | 风险 | 可独立交付 |
|---|---|---|---|
| **A1：开源元信息** | Task 1-2 | 🟢 低 | 是 |
| **A2：commit 规范 + CHANGELOG 自动化** | Task 3-4 | 🟢 低 | 是 |
| **A3：治理文档 + 模板** | Task 5-6 | 🟢 低 | 是 |
| **A4：Coverage + CI 基础设施** | Task 7-9 | 🟡 中（依赖外部 secret） | 是 |
| **B：依赖升级 4 批** | Task 10-13 | 🔴 高 | 否（4 批顺序耦合） |
| **C：端到端发布演练** | Task 14 | 🟡 中 | 是 |

---

## Task 1: package.json 元信息变更

**Files:**
- Modify: `package.json`（仅 metadata 字段，不动依赖版本）

**Interfaces:**
- Produces: package.json 含 `license` / `author` / `repository` / `homepage` / `bugs` / `keywords` / `engines` / `packageManager` 字段；版本 `0.1.0`；移除 `private`

- [ ] **Step 1: 修改 package.json 顶层字段**

将 package.json 顶部从：
```json
{
  "name": "vue-admin",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": { ... }
```
改为：
```json
{
  "name": "vue-admin",
  "version": "0.1.0",
  "type": "module",
  "license": "MIT",
  "author": "如水 <rushui@qq.com>",
  "homepage": "https://github.com/rushui/vue-admin",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/rushui/vue-admin.git"
  },
  "bugs": {
    "url": "https://github.com/rushui/vue-admin/issues",
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
  "packageManager": "pnpm@9.15.0",
  "scripts": { ... }
```

注意：删除 `"private": true` 行；scripts / dependencies / devDependencies 整体保留不变。

- [ ] **Step 2: 验证 package.json JSON 合法**

Run: `node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8')); console.log('OK')"`
Expected: `OK`

- [ ] **Step 3: 验证 metadata 字段齐全**

Run: `node -e "const p=require('./package.json'); ['license','author','homepage','repository','bugs','keywords','engines','packageManager'].forEach(k=>console.log(k+': '+JSON.stringify(p[k])))"`
Expected: 8 行输出，全部非 `undefined`，且：
- license: `"MIT"`
- author: `"如水 <rushui@qq.com>"`
- homepage: `"https://github.com/rushui/vue-admin"`
- engines.node: `">=22.0.0 <23.0.0"`
- packageManager: `"pnpm@9.15.0"`

- [ ] **Step 4: 验证 private 字段已移除**

Run: `node -e "const p=require('./package.json'); console.log('private:', p.private)"`
Expected: `private: undefined`

- [ ] **Step 5: 验证 lint 仍通过**

Run: `pnpm lint`
Expected: 0 errors 0 warnings

- [ ] **Step 6: Commit**

```bash
git add package.json
git commit -m "chore(pkg): add open-source metadata and bump version to 0.1.0"
```

---

## Task 2: LICENSE 文件 + README badges

**Files:**
- Create: `LICENSE`
- Modify: `README.md`（顶部加 3 badge，底部加 License 章节）

**Interfaces:**
- Consumes: Task 1 的 `license: MIT` 和 `author` 字段
- Produces: LICENSE 文件 MIT 全文；README 含 license/CI/coverage 三个 badge

- [ ] **Step 1: 创建 LICENSE 文件**

完整 MIT License 文本（替换版权行为"如水"）：
```
MIT License

Copyright (c) 2026 如水 <rushui@qq.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 2: 验证 LICENSE 内容**

Run: `grep -E "^MIT License$|Copyright.*如水.*rushui@qq\.com|PMISSION|WARRANTY OF ANY KIND" LICENSE`
Expected: 至少 3 行匹配（MIT License 行 + Copyright 行 + WARRANTY 行）

- [ ] **Step 3: 在 README.md 顶部第一行（H1 之前）加 badges**

在 README.md 文件最顶部插入（H1 `# Vue Admin` 之前）：
```markdown
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/rushui/vue-admin/blob/main/LICENSE)
[![CI](https://github.com/rushui/vue-admin/actions/workflows/ci.yml/badge.svg)](https://github.com/rushui/vue-admin/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/rushui/vue-admin/graph/badge.svg)](https://codecov.io/gh/rushui/vue-admin)

```

- [ ] **Step 4: 在 README.md 末尾追加 License 章节**

在 README.md 末尾追加：
```markdown

## License

[MIT](./LICENSE) © 2026 如水 <rushui@qq.com>
```

- [ ] **Step 5: 验证 README badges 与 License 章节存在**

Run: `grep -E "License-MIT-yellow|workflows/ci.yml|codecov.io/gh/rushui/vue-admin" README.md | wc -l`
Expected: `3`

Run: `grep -E "^## License$" README.md`
Expected: 一行匹配

- [ ] **Step 6: Commit**

```bash
git add LICENSE README.md
git commit -m "docs(license): add MIT LICENSE and README badges"
```

---

## Task 3: commitlint + husky commit-msg 钩子

**Files:**
- Create: `commitlint.config.js`
- Create: `.husky/commit-msg`
- Modify: `package.json`（devDependencies 加 `@commitlint/cli` / `@commitlint/config-conventional`）

**Interfaces:**
- Consumes: 现有 `.husky/pre-commit` 已就位
- Produces: 不规范 commit message 被 husky 拒绝

- [ ] **Step 1: 安装 commitlint 依赖**

Run:
```bash
pnpm add -D @commitlint/cli@^19 @commitlint/config-conventional@^19
```
Expected: 安装成功，package.json devDependencies 含两个新包

- [ ] **Step 2: 创建 `commitlint.config.js`（项目根目录）**

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
        'revert',
      ],
    ],
    'subject-case': [0],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [0],
  },
}
```

- [ ] **Step 3: 创建 `.husky/commit-msg` 钩子**

文件内容：
```bash
pnpm exec commitlint --edit "$1"
```

设置可执行权限：
```bash
chmod +x .husky/commit-msg
```

- [ ] **Step 4: 验证不规范 commit 被拒绝**

写一个临时文件制造可 commit 的差异：
```bash
echo "// test" > /tmp/_test_commit_msg.txt
git add /tmp/_test_commit_msg.txt 2>/dev/null || echo "" >> .gitignore && echo "/tmp/_test_commit_msg.txt" >> .gitignore
echo "test marker $(date +%s)" >> COMMITLINT_TEST_MARKER.tmp
git add COMMITLINT_TEST_MARKER.tmp
```

尝试不规范 commit（应失败）：
```bash
git commit -m "随便写的中文消息" 2>&1 | tee /tmp/commitlint_test.out
```
Expected: 退出码非 0，输出含 `commitlint` 报错或 `✖` 标记

- [ ] **Step 5: 验证规范 commit 通过（但不真的提交）**

dry-run 模式测试：
```bash
echo "feat(test): 验证 commitlint 规范通过" | pnpm exec commitlint 2>&1 | tee /tmp/commitlint_pass.out
```
Expected: 退出码 0，输出空或 `✔` 标记

- [ ] **Step 6: 清理临时标记**

```bash
git reset COMMITLINT_TEST_MARKER.tmp 2>/dev/null
rm -f COMMITLINT_TEST_MARKER.tmp /tmp/_test_commit_msg.txt /tmp/commitlint_test.out /tmp/commitlint_pass.out
```

- [ ] **Step 7: 验证 lint 不被破坏**

Run: `pnpm lint`
Expected: 0 errors 0 warnings

- [ ] **Step 8: Commit**

```bash
git add commitlint.config.js .husky/commit-msg package.json pnpm-lock.yaml
git commit -m "chore(commit): add commitlint and husky commit-msg hook"
```

---

## Task 4: git-cliff 配置 + CHANGELOG 初始化 + scripts

**Files:**
- Create: `cliff.toml`
- Create: `CHANGELOG.md`
- Modify: `package.json`（scripts 加 changelog / changelog:latest / release:dry）

**Interfaces:**
- Consumes: Task 3 的 commitlint 规范（conventional commits 是 cliff 解析基础）
- Produces: `pnpm changelog` 可输出未发布条目；CHANGELOG.md 含 0.1.0 占位

- [ ] **Step 1: 创建 `cliff.toml`（项目根目录）**

```toml
# git-cliff configuration
# https://git-cliff.org/docs/configuration

[changelog]
header = """
# 变更日志\\n\\n
所有显著变更均记录在此文件中。\\n
本格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。\\n
"""
body = """
{% if version %}\\
    ## [{{ version | trim_start_matches(pat="v") }}] - {{ timestamp | date(format="%Y-%m-%d") }}
{% else %}\\
    ## [未发布]
{% endif %}\\
{% for group, commits in commits | group_by(attribute="group") %}
    ### {{ group | upper_first }}
    {% for commit in commits %}
        - {{ commit.message | upper_first }}\\
    {% endfor %}
{% endfor %}\\
"""
trim = true
footer = """
<!-- generated by git-cliff -->
"""

[git]
conventional_commits = true
filter_unconventional = true
split_commits = false
commit_parsers = [
    { message = "^feat", group = "Features" },
    { message = "^fix", group = "Bug Fixes" },
    { message = "^doc", group = "Documentation" },
    { message = "^perf", group = "Performance" },
    { message = "^refactor", group = "Refactor" },
    { message = "^style", group = "Styling" },
    { message = "^test", group = "Tests" },
    { message = "^build", group = "Build" },
    { message = "^ci", group = "CI/CD" },
    { message = "^chore", group = "Miscellaneous" },
    { message = "^revert", group = "Reverts" },
]
filter_commits = false
tag_pattern = "v[0-9].*"
sort_commits = "newest"
```

- [ ] **Step 2: 在 package.json scripts 加 3 个 changelog 脚本**

在 `"prepare": "husky"` 之后插入：
```json
    "changelog": "git-cliff -o CHANGELOG.md --unreleased",
    "changelog:latest": "git-cliff -o CHANGELOG.md latest",
    "release:dry": "git-cliff --unreleased --strip header",
```

- [ ] **Step 3: 安装 git-cliff（CI 通过 Action，本地按需）**

本地不需要全局安装。CI 由 `orhun/git-cliff-action@v3` 拉起。但为了本地能跑 `pnpm changelog`，安装 npm 包装：
```bash
pnpm add -D @git-cliff/cli@^1
```
Expected: 安装成功

- [ ] **Step 4: 首次生成 CHANGELOG.md（占位）**

由于尚未发布任何 tag，先生成未发布段落：
```bash
pnpm changelog
```
Expected: 生成 `CHANGELOG.md` 文件，含 header + `## [未发布]` 段落 + 本次工作累积的 commits（按 conventional 类型分组）

- [ ] **Step 5: 验证 CHANGELOG.md 存在且非空**

Run: `test -s CHANGELOG.md && head -20 CHANGELOG.md`
Expected: 文件存在、非空、前 20 行可见 header

- [ ] **Step 6: 验证 cliff.toml 配置可解析**

Run: `pnpm exec git-cliff --config cliff.toml --unreleased --strip header | head -10`
Expected: 输出未发布段落的 markdown 列表（exit 0）

- [ ] **Step 7: 验证 lint 不被破坏**

Run: `pnpm lint`
Expected: 0 errors 0 warnings

- [ ] **Step 8: Commit**

```bash
git add cliff.toml CHANGELOG.md package.json pnpm-lock.yaml
git commit -m "chore(changelog): add git-cliff config and initial CHANGELOG"
```

---

## Task 5: 治理文档（CONTRIBUTING + COC + SECURITY）

**Files:**
- Create: `CONTRIBUTING.md`
- Create: `CODE_OF_CONDUCT.md`
- Create: `SECURITY.md`

**Interfaces:**
- Consumes: Task 3 的 commitlint type 表（CONTRIBUTING 第 5 章节引用）
- Produces: README / Issue 模板可链接到的治理文档

- [ ] **Step 1: 创建 `CONTRIBUTING.md`**

完整内容（10 章节）：
```markdown
# 贡献指南

感谢你对 vue-admin 的关注！本文档说明如何参与贡献。

## 1. 快速开始

```bash
git clone https://github.com/rushui/vue-admin.git
cd vue-admin
pnpm install
pnpm dev          # 启动开发服务器（含 vite-plugin-mock）
```

测试账号：

| 用户名 | 密码 | 角色 |
|---|---|---|
| admin | 123456 | super_admin（全权限） |
| user | 123456 | user（仅 user:read） |

## 2. 开发环境要求

- Node.js 22.x LTS（参见 `engines.node`）
- pnpm 9+（启用 corepack：`corepack enable`）
- 推荐编辑器：VS Code + Volar 扩展

## 3. 项目结构

参见 [docs/standards/01-ARCHITECTURE.md](./docs/standards/01-ARCHITECTURE.md)。

四层架构：`lib/`（基础设施）→ `app/`（组装）→ `modules/`（业务领域）→ `shared/`（跨模块）。`lib/` 与 `shared/` 不允许反向依赖 `app/` / `modules/`。

## 4. 分支策略

- `main`：受保护主干，仅通过 PR 合入
- 特性分支命名：`feat/<short-desc>` / `fix/<short-desc>` / `docs/<short-desc>` / `chore/<short-desc>`

## 5. Commit 规范

本仓库使用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/)，由 commitlint 强制。type 取值：

| type | 含义 |
|---|---|
| feat | 新功能 |
| fix | 修复 bug |
| docs | 文档变更 |
| style | 代码格式（不影响功能） |
| refactor | 重构（非 feat 非 fix） |
| perf | 性能优化 |
| test | 测试相关 |
| build | 构建系统/依赖 |
| ci | CI 配置 |
| chore | 杂项（不修改 src 或 test） |
| revert | 回滚 |

格式：`<type>(<scope>): <subject>`，subject 可中文。例：
- `feat(auth): 新增 OAuth2 登录`
- `fix(router): 修复动态路由 404 兜底`
- `docs(readme): 更新 badge`

header 长度上限 100 字符。

## 6. 代码质量门

PR 必须全部通过：
- `pnpm lint`（0 错误 0 警告）
- `pnpm type-check`
- `pnpm test`
- `pnpm build`

提交时 husky 自动运行 lint-staged 修复暂存文件。

## 7. PR 流程

1. 从 `main` 切出特性分支
2. 实现变更并补充测试
3. 自检清单（见 PR 模板）
4. 提交 PR，目标分支为 `main`
5. 至少 1 位 reviewer 通过
6. 使用 Squash Merge，commit message 用 PR 标题（也需符合 Conventional Commits）

## 8. Issue 规范

- Bug 报告：使用 Bug Report 模板
- 功能请求：使用 Feature Request 模板
- 使用问题：到 [Discussions](https://github.com/rushui/vue-admin/discussions) 讨论

## 9. 行为准则

参与本社区即代表你同意遵守 [Code of Conduct](./CODE_OF_CONDUCT.md)。

## 10. 联系方式

- 安全问题：rushui@qq.com（参见 [SECURITY.md](./SECURITY.md)）
- 一般讨论：[GitHub Discussions](https://github.com/rushui/vue-admin/discussions)
- Bug 报告：[GitHub Issues](https://github.com/rushui/vue-admin/issues)
```

- [ ] **Step 2: 创建 `CODE_OF_CONDUCT.md`**

采用 Contributor Covenant 2.1 中文版（标准官方翻译）。完整内容：
```markdown
# 贡献者公约行为准则

## 我们的承诺

为了营造一个开放和热情的环境，我们作为贡献者和维护者承诺：无论年龄、体型、可见或不可见的残疾、族裔、性征、性别认同和表达、经验水平、教育、社会经济地位、国籍、个人外貌、种族、宗教或性取向，参与我们项目和社区的每个人都将获得无骚扰的体验。

我们承诺以促进开放、包容、多元化、健康社区的方式行动和互动。

## 我们的准则

营造正面环境的行为示例：

* 对他人展现同理心和善意
* 尊重不同意见、观点和经验
* 给予建设性反馈，也优雅地接受反馈
* 承担责任，向受我们错误影响的人道歉，并从中学习
* 关注的不仅是我们个人，而是整个社区的整体

不可接受的行为示例：

* 性化语言或 imagery、以及任何形式的性关注或骚扰
* 钓鱼、侮辱或贬损的评论、人身或政治攻击
* 公开或私下的骚扰
* 未经明确许可发布他人的私人信息
* 其他在专业环境下可被认定为不当的行为

## 强制执行责任

社区维护者负责阐明和执行本行为准则的标准，并将对其认为不当、威胁、冒犯或有害的任何行为采取适当且公平的纠正措施。

## 适用范围

本行为准则适用于所有社区空间，并在个人在公共空间正式代表社区时同样适用。

## 执行

辱骂、骚扰或其他不可接受的行为可通过私密联系 rushui@qq.com 举报。所有投诉都将得到及时和公平的审查和调查。

所有社区领导者都有义务尊重隐私和举报者的安全。

## 归属

本行为准则改编自 [Contributor Covenant][homepage] 2.1 版，<https://www.contributor-covenant.org/version/2/1/code_of_conduct.html>。

[homepage]: https://www.contributor-covenant.org

社区影响指南受 [Mozilla 的强制执行阶梯](https://github.com/mozilla/diversity) 启发。
```

- [ ] **Step 3: 创建 `SECURITY.md`**

完整内容：
```markdown
# 安全策略

## 支持的版本

本项目目前仅对以下版本提供安全更新：

| 版本 | 支持状态 |
|---|---|
| 0.1.x | :white_check_mark: |
| < 0.1.0 | :x: |

## 报告漏洞

**请不要在 GitHub 公开 Issue 中报告安全漏洞。**

发现漏洞请发送邮件至 **rushui@qq.com**，包含：

- 受影响版本
- 复现步骤（最小可复现示例最佳）
- 影响评估
- 建议的修复方案（可选）

## 响应时间

| 阶段 | SLA |
|---|---|
| 确认收到 | 48 小时内 |
| 初步评估 | 7 天内 |
| 修复发布 | 90 天内（视严重程度） |

## 披露策略

我们遵循 [Coordinated Disclosure](https://github.com/disclose/disclosed)。漏洞修复后将在 90 天内公开披露。

## 悬赏

本项目是开源非盈利项目，**不提供现金漏洞悬赏**。报告者可在修复后的披露公告中获得鸣谢（除非要求匿名）。
```

- [ ] **Step 4: 验证 3 个文件存在且非空**

Run: `for f in CONTRIBUTING.md CODE_OF_CONDUCT.md SECURITY.md; do echo "$f: $(test -s $f && echo OK || echo MISSING)"; done`
Expected: 3 行全部 `OK`

- [ ] **Step 5: 验证关键内容存在**

Run: `grep -l "Conventional Commits" CONTRIBUTING.md && grep -l "Contributor Covenant" CODE_OF_CONDUCT.md && grep -l "rushui@qq.com" SECURITY.md`
Expected: 3 个文件名都打印出来

- [ ] **Step 6: Commit**

```bash
git add CONTRIBUTING.md CODE_OF_CONDUCT.md SECURITY.md
git commit -m "docs(governance): add CONTRIBUTING, CODE_OF_CONDUCT, SECURITY"
```

---

## Task 6: Issue 模板 + PR 模板

**Files:**
- Create: `.github/ISSUE_TEMPLATE/bug_report.yml`
- Create: `.github/ISSUE_TEMPLATE/feature_request.yml`
- Create: `.github/ISSUE_TEMPLATE/config.yml`
- Create: `.github/PULL_REQUEST_TEMPLATE.md`

**Interfaces:**
- Consumes: Task 5 的治理文档作为引用
- Produces: GitHub 自动加载的 Issue / PR 模板

- [ ] **Step 1: 创建 `.github/ISSUE_TEMPLATE/bug_report.yml`**

```yaml
name: 🐛 Bug 报告
description: 报告一个可复现的问题
title: "[BUG] "
labels: ["bug", "needs-triage"]
body:
  - type: markdown
    attributes:
      value: |
        感谢你抽出时间报告 bug！请先搜索 [已有 Issue](https://github.com/rushui/vue-admin/issues?q=is%3Aissue) 避免重复。
  - type: textarea
    id: what-happened
    attributes:
      label: Bug 描述
      description: 简要描述发生了什么问题
    validations:
      required: true
  - type: textarea
    id: reproduce
    attributes:
      label: 复现步骤
      description: 详细步骤让我们能复现问题
      placeholder: |
        1. 进入页面 '...'
        2. 点击 '...'
        3. 看到 '...'
    validations:
      required: true
  - type: textarea
    id: expected
    attributes:
      label: 期望行为
    validations:
      required: true
  - type: textarea
    id: actual
    attributes:
      label: 实际行为
    validations:
      required: true
  - type: input
    id: version
    attributes:
      label: Vue Admin 版本
      placeholder: "0.1.0"
    validations:
      required: true
  - type: input
    id: node
    attributes:
      label: Node 版本
      placeholder: "22.x"
    validations:
      required: true
  - type: input
    id: browser
    attributes:
      label: 浏览器
      placeholder: "Chrome 126"
  - type: textarea
    id: logs
    attributes:
      label: 控制台/日志输出
      render: shell
  - type: textarea
    id: screenshots
    attributes:
      label: 截图
      description: 如适用，粘贴截图或 GIF
  - type: checkboxes
    id: pr-offer
    attributes:
      label: 我愿意提交 PR
      options:
        - label: 我愿意为该问题提交 PR
          required: false
```

- [ ] **Step 2: 创建 `.github/ISSUE_TEMPLATE/feature_request.yml`**

```yaml
name: ✨ 特性请求
description: 提出一个新功能建议
title: "[FEAT] "
labels: ["enhancement", "needs-triage"]
body:
  - type: markdown
    attributes:
      value: |
        感谢你的建议！请先搜索 [已有 Issue](https://github.com/rushui/vue-admin/issues?q=is%3Aissue) 避免重复。
  - type: textarea
    id: problem
    attributes:
      label: 你想解决什么问题
      description: 描述当前遇到的不便或缺失能力
    validations:
      required: true
  - type: textarea
    id: solution
    attributes:
      label: 你期望的解决方案
      description: 描述你希望看到的能力或行为
    validations:
      required: true
  - type: textarea
    id: alternatives
    attributes:
      label: 备选方案
      description: 你考虑过的其他方案
  - type: checkboxes
    id: pr-offer
    attributes:
      label: 我愿意提交 PR
      options:
        - label: 我愿意为该特性提交 PR
          required: false
```

- [ ] **Step 3: 创建 `.github/ISSUE_TEMPLATE/config.yml`**

```yaml
blank_issues_enabled: false
contact_links:
  - name: 💬 提问与讨论
    url: https://github.com/rushui/vue-admin/discussions
    about: 使用问题、最佳实践等请到 Discussions 讨论
  - name: 🔒 安全漏洞
    url: https://github.com/rushui/vue-admin/security/policy
    about: 安全问题请勿公开报告，请参阅 SECURITY.md
```

- [ ] **Step 4: 创建 `.github/PULL_REQUEST_TEMPLATE.md`**

```markdown
## 变更说明

<!-- 这次 PR 做了什么？为什么需要这个变更？ -->

## 变更类型

- [ ] feat: 新功能
- [ ] fix: bug 修复
- [ ] docs: 文档
- [ ] refactor: 重构（非 feat 非 fix）
- [ ] perf: 性能优化
- [ ] test: 测试
- [ ] build / ci / chore: 工程化

## 自检清单

- [ ] 已运行 `pnpm lint`
- [ ] 已运行 `pnpm type-check`
- [ ] 已运行 `pnpm test` 且全部通过
- [ ] 新增/修改的功能已有对应测试覆盖
- [ ] 已更新相关文档（如有）
- [ ] commit message 符合 Conventional Commits 规范（见 CONTRIBUTING.md）

## 关联 Issue

<!-- Closes #123 -->

## 截图 / 演示（可选）

<!-- 如适用，粘贴截图或 GIF -->
```

- [ ] **Step 5: 验证 4 个文件存在且非空**

Run: `for f in .github/ISSUE_TEMPLATE/bug_report.yml .github/ISSUE_TEMPLATE/feature_request.yml .github/ISSUE_TEMPLATE/config.yml .github/PULL_REQUEST_TEMPLATE.md; do echo "$f: $(test -s $f && echo OK || echo MISSING)"; done`
Expected: 4 行全部 `OK`

- [ ] **Step 6: 验证 YAML 语法合法**

Run: `node -e "for (const f of ['.github/ISSUE_TEMPLATE/bug_report.yml','.github/ISSUE_TEMPLATE/feature_request.yml','.github/ISSUE_TEMPLATE/config.yml']) { const y=require('fs').readFileSync(f,'utf8'); console.log(f+': '+(y.length>0?'OK':'EMPTY')); }"`
Expected: 3 行 `OK`

- [ ] **Step 7: Commit**

```bash
git add .github/ISSUE_TEMPLATE/ .github/PULL_REQUEST_TEMPLATE.md
git commit -m "chore(templates): add Issue and PR templates"
```

---

## Task 7: vitest coverage 配置

**Files:**
- Modify: `vitest.config.ts`（加 coverage 配置）
- Modify: `package.json`（devDependencies 加 `@vitest/coverage-c8`）

**Interfaces:**
- Consumes: 现有 vitest 1.6 配置
- Produces: `pnpm test --coverage` 可产出 `coverage/lcov.info`

**注意**：本任务在 vitest 1.x 上配置 c8；Task 13 升级到 vitest 3 后会切换到 v8 provider（vitest 3 已内置 v8，移除 c8 依赖）。

- [ ] **Step 1: 安装 c8 coverage provider（vitest 1.x）**

Run: `pnpm add -D @vitest/coverage-c8@^1`
Expected: 安装成功

- [ ] **Step 2: 修改 `vitest.config.ts` 加 coverage 配置**

将文件从：
```ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```
改为：
```ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      // 首发不设 thresholds，后续逐步引入
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

- [ ] **Step 3: 运行 test --coverage 验证**

Run: `pnpm test --coverage 2>&1 | tail -20`
Expected:
- 全部测试通过（51/51）
- 输出含 coverage 表格（行/分支/函数/语句 列）
- 生成 `coverage/lcov.info` 文件

- [ ] **Step 4: 验证 lcov.info 存在**

Run: `test -f coverage/lcov.info && wc -l coverage/lcov.info`
Expected: 行数 > 0

- [ ] **Step 5: 验证 .gitignore 已含 coverage（应已就位，跳过新增）**

Run: `grep "^coverage$" .gitignore`
Expected: 至少一行匹配（已存在则无需修改）

- [ ] **Step 6: 验证 lint 不被破坏**

Run: `pnpm lint`
Expected: 0 errors 0 warnings

- [ ] **Step 7: Commit**

```bash
git add vitest.config.ts package.json pnpm-lock.yaml
git commit -m "test(coverage): add c8 coverage provider for CI reporting"
```

---

## Task 8: GitHub Actions ci.yml

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: Task 7 的 coverage 配置（CI 上 `pnpm test --coverage`）
- Produces: push + PR 时 CI 跑 4 件套 + Codecov 上传

**前置说明**：Codecov token 需在仓库 Settings → Secrets and variables → Actions 中配置 `CODECOV_TOKEN`。本任务假定 secret 已配置；若未配置则首发期 `fail_ci_if_error: false` 容错。

- [ ] **Step 1: 创建 `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main, 'feat/**', 'fix/**']
  pull_request:
    branches: [main]

# 同一 PR/分支多次 push 时取消旧的运行
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
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
      - run: pnpm lint

  type-check:
    name: Type Check
    runs-on: ubuntu-latest
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
      - run: pnpm type-check

  test:
    name: Test
    runs-on: ubuntu-latest
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
      - run: pnpm test --coverage
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: false
        env:
          CODECOV_TOKEN: ${{ secrets.CODECOV_TOKEN }}

  build:
    name: Build
    runs-on: ubuntu-latest
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
      - run: pnpm build
      - name: Upload dist artifact
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 7
```

- [ ] **Step 2: 验证 YAML 语法合法**

Run: `node -e "const y=require('fs').readFileSync('.github/workflows/ci.yml','utf8'); console.log('size:', y.length)"`
Expected: `size:` 输出 > 500

可选：本地用 `actionlint` 验证（若已安装）：
```bash
which actionlint && actionlint .github/workflows/ci.yml || echo "actionlint 未安装，跳过"
```

- [ ] **Step 3: 验证 lint 不被破坏**

Run: `pnpm lint`
Expected: 0 errors 0 warnings

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add lint/type-check/test/build jobs with Codecov upload"
```

- [ ] **Step 5: 提示用户配置 Codecov token**

**这一步需要用户手动操作**：
1. 访问 https://about.codecov.io/ 用 GitHub 登录
2. 启用 `rushui/vue-admin` 仓库
3. 在 https://app.codecov.io/gh/rushui/vue-admin/settings 拿到 token
4. 在 GitHub 仓库 Settings → Secrets and variables → Actions → New repository secret，名称 `CODECOV_TOKEN`，值为上一步 token

未配置时：CI 仍可跑（`fail_ci_if_error: false`），但 README coverage badge 会显示 `unknown`。

---

## Task 9: GitHub Actions release.yml

**Files:**
- Create: `.github/workflows/release.yml`

**Interfaces:**
- Consumes: Task 4 的 cliff.toml 配置
- Produces: push tag `v*` 时自动生成 GitHub Release + 更新 CHANGELOG.md

- [ ] **Step 1: 创建 `.github/workflows/release.yml`**

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: write

jobs:
  release:
    name: Generate Changelog and Release
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # git-cliff 需要完整历史

      - name: Generate changelog
        id: changelog
        uses: orhun/git-cliff-action@v3
        with:
          config: cliff.toml
          args: --latest --strip header
        env:
          OUTPUT: CHANGES.md
          GITHUB_REPO: ${{ github.repository }}

      - name: Set env
        run: |
          echo "RELEASE_VERSION=${GITHUB_REF#refs/*/}" >> $GITHUB_ENV

      - name: Commit updated CHANGELOG.md to main
        run: |
          # 生成完整 CHANGELOG（含历史），提交回 main
          git-cliff --config cliff.toml -o CHANGELOG.md || true
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add CHANGELOG.md
          git commit -m "docs(changelog): update for ${{ env.RELEASE_VERSION }}" || exit 0
          git push

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          body: ${{ steps.changelog.outputs.content }}
          tag_name: ${{ env.RELEASE_VERSION }}
          generate_release_notes: false
```

**说明**：`orhun/git-cliff-action@v3` 会安装 git-cliff 二进制到 runner，后续 `git-cliff` 命令直接可用。

- [ ] **Step 2: 验证 YAML 语法合法**

Run: `node -e "const y=require('fs').readFileSync('.github/workflows/release.yml','utf8'); console.log('size:', y.length)"`
Expected: `size:` 输出 > 500

- [ ] **Step 3: 验证 lint 不被破坏**

Run: `pnpm lint`
Expected: 0 errors 0 warnings

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "ci: add release.yml for tag-triggered CHANGELOG and GitHub Release"
```

---

## Task 10: 依赖升级批 1（TypeScript 5 + vue-tsc 2 + @types/node 22）

**Files:**
- Modify: `package.json`（devDependencies）
- Modify: `tsconfig.json`（如 TS 5 需要调整）

**Interfaces:**
- Consumes: 现有 TS 4.8 配置
- Produces: TypeScript 5.x + vue-tsc 2.x 可用；`pnpm type-check` 通过

- [ ] **Step 1: 升级 TypeScript 与配套**

Run:
```bash
pnpm add -D typescript@^5 vue-tsc@^2 @types/node@^22
```
Expected: 安装成功，无 peer dependency 警告（如有需评估）

- [ ] **Step 2: 运行 type-check（可能报新错）**

Run: `pnpm type-check 2>&1 | tail -30`
Expected: 要么 PASS，要么输出因 TS 5 更严格而新出现的类型错误列表

- [ ] **Step 3: 修复 TS 5 引入的类型错误（如有）**

针对 type-check 输出的每个错误：
- 逐个文件定位
- 补充缺失类型、修复 strict 模式下的 implicit any / undefined 等
- **每个文件的修复单独 commit**（便于 review 与 revert）

常见 TS 5 breaking changes 修复要点：
- `ImplicitAny` 在 catch 子句：`catch (err)` → `catch (err: unknown)`
- `readonly` 更严格：检查 array/object 字面量
- `verbatimModuleSyntax`：`import type` 显式分离类型导入

- [ ] **Step 4: 再次运行 type-check 直至通过**

Run: `pnpm type-check`
Expected: 通过（exit 0）

- [ ] **Step 5: 运行 lint 与 test 仍通过**

Run: `pnpm lint && pnpm test`
Expected: lint 0 错误；test 全过

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml tsconfig.json src/  # 视实际改动文件
git commit -m "build(deps): upgrade TypeScript 5, vue-tsc 2, @types/node 22"
```

如有 TS 5 修复 commit，按主题拆分（如 `fix(types): adapt to TS 5 strict checks`）。

---

## Task 11: 依赖升级批 2（Vue 3.5 + Pinia + Vue Router + Element Plus + VueUse）

**Files:**
- Modify: `package.json`（dependencies + devDependencies）

**Interfaces:**
- Consumes: Task 10 的 TS 5 环境
- Produces: Vue 3.5 + 全家桶升级；dev 启动正常 + 关键页渲染 + test 全过

- [ ] **Step 1: 升级 Vue 全家桶**

Run:
```bash
pnpm add vue@^3.5 pinia@^2.2 vue-router@^4.4 element-plus@^2.8 @vueuse/core@^11 @element-plus/icons-vue@latest
```
Expected: 安装成功

- [ ] **Step 2: 启动 dev 服务器验证（手动）**

Run: `pnpm dev`
Expected: 启动无报错，浏览器打开 http://localhost:5173 显示登录页

**关键页验证清单**（手动）：
- [ ] 登录页 `/login`：admin/123456 登录成功
- [ ] 首页 `/home`：渲染正常
- [ ] 系统管理 `/system/admin` `/system/role` `/system/permission`：列表加载
- [ ] 用户管理 `/user/list`：列表加载
- [ ] 字典管理 `/system/dict`：树渲染
- [ ] 退出登录回到登录页

如有报错（控制台红错），定位原因：
- Element Plus 2.8 API 变化：查 [Element Plus changelog](https://github.com/element-plus/element-plus/blob/main/CHANGELOG.en-US.md)
- VueUse 11 breaking：查 VueUse migration guide
- Vue 3.5 私有 API 变化：检查自定义指令、生命周期使用

- [ ] **Step 3: 运行 test**

Run: `pnpm test`
Expected: 全部通过；如有失败修复对应测试

- [ ] **Step 4: 运行 type-check + lint**

Run: `pnpm type-check && pnpm lint`
Expected: 都通过

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml src/  # 视实际改动
git commit -m "build(deps): upgrade Vue 3.5, Pinia, Vue Router, Element Plus, VueUse"
```

---

## Task 12: 依赖升级批 3（Vite 7 + 配套 plugin）

**Files:**
- Modify: `package.json`（devDependencies）
- Modify: `vite.config.ts`（如 Vite 7 配置 API 变化）
- Modify: `.lintstagedrc.json`（如 lint-staged 升级后配置 API 变化）

**Interfaces:**
- Consumes: Task 11 的 Vue 3.5
- Produces: Vite 7 + 配套 plugin 升级；`pnpm build` 完整产出

**高风险点**：`vite-plugin-mock` 可能不兼容 Vite 7。本任务 Step 2 含兼容性验证与降级预案。

- [ ] **Step 1: 升级 Vite 与配套 plugin**

Run:
```bash
pnpm add -D vite@^7 @vitejs/plugin-vue@^5 @vitejs/plugin-vue-jsx@^4 unplugin-auto-import@latest unplugin-vue-components@latest
```
Expected: 安装成功

- [ ] **Step 2: 验证 vite-plugin-mock 兼容性**

尝试启动 dev：
```bash
pnpm dev 2>&1 | head -40
```

**情况 A：启动成功** → 继续下一步
**情况 B：报错（vite-plugin-mock 与 Vite 7 不兼容）** → 执行降级方案：

方案 B 执行步骤：
1. 查询 vite-plugin-mock 最新版本是否支持 Vite 7：`pnpm view vite-plugin-mock versions --json | tail -20`
2. 如有支持版本：`pnpm add -D vite-plugin-mock@latest`
3. 如无支持版本：保留当前 vite-plugin-mock，**降级 Vite 到 ^5**（Vite 5 仍稳定且 vite-plugin-mock 支持）
4. 在 CHANGELOG.md 或 progress ledger 记录"vite-plugin-mock 不兼容 Vite 7，降级到 Vite 5；M6.5/M7 推进 MSW 迁移时一并升 Vite 7"

- [ ] **Step 3: 升级 lint-staged 到 17（Node 22 已就位）**

Run:
```bash
pnpm add -D lint-staged@^17
```

验证配置兼容：
```bash
echo "test" > /tmp/_lintstaged_test.ts
git add /tmp/_lintstaged_test.ts
pnpm exec lint-staged --debug
```
Expected: lint-staged 正常调用 eslint；如配置 API 变化（如不再支持对象简写），按报错调整 `.lintstagedrc.json`。

清理：
```bash
git reset /tmp/_lintstaged_test.ts 2>/dev/null
rm -f /tmp/_lintstaged_test.ts
```

- [ ] **Step 4: 运行 build**

Run: `pnpm build 2>&1 | tail -30`
Expected:
- type-check 通过
- vite build 成功产出 dist/
- 无错误

如有错误：
- 配置 API 变化：查 [Vite 7 migration guide](https://vite.dev/guide/migration)
- unplugin API 变化：查对应 plugin 文档

- [ ] **Step 5: 启动 preview 验证产物**

Run: `pnpm preview &`
打开浏览器 http://localhost:4173 验证关键页（同 Task 11 清单）
完成后 kill preview 进程：`pkill -f "vite preview"`

- [ ] **Step 6: 运行 lint + test + type-check**

Run: `pnpm lint && pnpm test && pnpm type-check`
Expected: 全部通过

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml vite.config.ts .lintstagedrc.json
git commit -m "build(deps): upgrade Vite 7, plugins, lint-staged 17"
```

---

## Task 13: 依赖升级批 4（Vitest 3 + coverage 切 v8）

**Files:**
- Modify: `package.json`（devDependencies）
- Modify: `vitest.config.ts`（provider c8 → v8）

**Interfaces:**
- Consumes: Task 7 的 coverage 配置（c8）；Task 12 的 Node 22
- Produces: Vitest 3 + v8 coverage；`pnpm test --coverage` 全过

- [ ] **Step 1: 升级 Vitest 与配套**

Run:
```bash
pnpm add -D vitest@^3 @vue/test-utils@latest jsdom@latest
pnpm remove @vitest/coverage-c8
pnpm add -D @vitest/coverage-v8@^3
```
Expected: 安装成功，`@vitest/coverage-c8` 移除

- [ ] **Step 2: 修改 `vitest.config.ts` 切换 coverage provider**

将 `coverage.provider` 从 `'c8'` 改为 `'v8'`：
```ts
coverage: {
  provider: 'v8',
  reporter: ['text', 'lcov', 'html'],
  reportsDirectory: './coverage',
},
```

- [ ] **Step 3: 运行 test 验证（Vitest 3 可能有 breaking）**

Run: `pnpm test 2>&1 | tail -30`

如有失败：
- API 变化：查 [Vitest 3 migration guide](https://vitest.dev/guide/migration)
- 常见：`vi.mock` 行为变化、`describe`/`it` import 路径
- 逐个修复测试文件，每个修复单独 commit

Expected: 全部通过

- [ ] **Step 4: 运行 test --coverage 验证 lcov 产出**

Run: `pnpm test --coverage`
Expected:
- 全部测试通过
- `coverage/lcov.info` 文件存在且非空
- 控制台输出 coverage 表格

- [ ] **Step 5: 运行 lint + type-check**

Run: `pnpm lint && pnpm type-check`
Expected: 通过

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts test/  # 视实际改动
git commit -m "build(deps): upgrade Vitest 3 and switch coverage to v8 provider"
```

---

## Task 14: 端到端发布演练（tag v0.1.0-rc.1）

**Files:** 无新增/修改。本任务全部为验证操作。

**Interfaces:**
- Consumes: Task 1-13 全部产出
- Produces: GitHub Release v0.1.0-rc.1 + 自动更新的 CHANGELOG

**前置条件**：Task 1-13 全部完成并 commit；本地 lint/type-check/test/build 全过；package.json version = `0.1.0`。

**用户确认点**：本任务涉及 git tag 与 push，**必须用户明确授权后执行**。

- [ ] **Step 1: 最终本地验证**

Run:
```bash
pnpm lint && pnpm type-check && pnpm test --coverage && pnpm build
node --version  # 应输出 v22.x
```
Expected: 全部通过，无任何错误

- [ ] **Step 2: 检查 working tree 干净**

Run: `git status --short`
Expected: 空输出（无未提交变更）

- [ ] **Step 3: 验证 commitlint 实际生效（最后一次）**

写一个临时文件制造可 commit 差异，但故意用不规范消息：
```bash
echo "// marker" > /tmp/rc_marker.txt
echo "$(date)" > RC_TEST.tmp
git add RC_TEST.tmp
git commit -m "随便写" 2>&1 | tail -5
```
Expected: husky 拒绝，输出 commitlint 错误

清理：
```bash
git reset RC_TEST.tmp 2>/dev/null
rm -f RC_TEST.tmp /tmp/rc_marker.txt
```

- [ ] **Step 4: 验证 changelog 生成**

Run: `pnpm changelog 2>&1 | tail -30`
Expected: CHANGELOG.md 顶部新增 `## [未发布]` 段落，列出本次工作累积的 commit（按 Features / Bug Fixes / Build 等分组）

- [ ] **Step 5: 提交 CHANGELOG 更新**

```bash
git add CHANGELOG.md
git commit -m "docs(changelog): refresh for v0.1.0-rc.1"
```

- [ ] **Step 6: ⚠️ 用户授权后打 tag 并推送**

```bash
git tag v0.1.0-rc.1
git push origin main --tags
```

**这一步在用户明确确认后才执行**。

- [ ] **Step 7: 验证 release.yml 触发**

访问 `https://github.com/rushui/vue-admin/actions/workflows/release.yml`
Expected: 看到一次新的 workflow run，状态由 in-progress → completed（约 1-3 分钟）

如有失败：
- 查 workflow 日志
- 修复 `.github/workflows/release.yml` 或 `cliff.toml`
- 删除远程 tag：`git push origin :refs/tags/v0.1.0-rc.1` + 本地 `git tag -d v0.1.0-rc.1`
- 回到 Step 6 重新触发

- [ ] **Step 8: 验证 GitHub Release 创建**

访问 `https://github.com/rushui/vue-admin/releases`
Expected: 看到 `v0.1.0-rc.1` Release，body 含 git-cliff 生成的 markdown 段落（Features / Build / Chore 等分组）

- [ ] **Step 9: 验证 CHANGELOG 自动提交**

Run: `git pull --rebase origin main && head -40 CHANGELOG.md`
Expected: CHANGELOG.md 含 `## [0.1.0-rc.1] - YYYY-MM-DD` 段落（github-actions[bot] 提交）

- [ ] **Step 10: 验证 README badges 在线状态**

访问 `https://github.com/rushui/vue-admin`
Expected:
- License badge 显示 `MIT`
- CI badge 显示 `passing`（最近一次 main push 通过）
- Codecov badge 显示覆盖率百分比或 `unknown`（若 token 未配置）

如 Codecov 仍 `unknown`：补 Task 8 Step 5 的 token 配置；下个 tag 推送后即生效。

- [ ] **Step 11: 清理 rc tag（如不保留）**

若不保留 rc 发布：
```bash
gh release delete v0.1.0-rc.1 --yes
git push origin :refs/tags/v0.1.0-rc.1
git tag -d v0.1.0-rc.1
```

若保留：跳过本步，等 M6 验收完成后正式 tag `v0.1.0`。

---

## Self-Review

### 1. Spec Coverage Check

| Spec 节 | 对应 Task |
|---|---|
| 元信息（package.json metadata + 移除 private + 版本 0.1.0） | Task 1 ✅ |
| LICENSE + README badges + License 章节 | Task 2 ✅ |
| commitlint + husky commit-msg | Task 3 ✅ |
| cliff.toml + CHANGELOG.md + scripts | Task 4 ✅ |
| CONTRIBUTING + COC + SECURITY | Task 5 ✅ |
| Issue + PR 模板 | Task 6 ✅ |
| vitest coverage 配置 | Task 7 ✅ |
| ci.yml（4 件套 + Codecov） | Task 8 ✅ |
| release.yml（git-cliff action） | Task 9 ✅ |
| 依赖升级批 1（TS 5） | Task 10 ✅ |
| 依赖升级批 2（Vue 3.5） | Task 11 ✅ |
| 依赖升级批 3（Vite 7） | Task 12 ✅ |
| 依赖升级批 4（Vitest 3） | Task 13 ✅ |
| 端到端发布演练 | Task 14 ✅ |
| DoD 验收清单 | Task 14 全部 step ✅ |

无遗漏。

### 2. Placeholder Scan

- 无 TBD / TODO / "实现稍后"
- 依赖升级 Task 中允许"如失败按报错修复"，但给了具体修复要点 + 文档链接，不算 placeholder
- vite-plugin-mock 风险给了明确的方案 A/B 决策路径

### 3. Type Consistency

- `coverage.provider`：Task 7 = `'c8'`，Task 13 改为 `'v8'` —— 一致（Task 13 显式修改）
- `engines.node`：Task 1 设 `>=22 <23`，Task 8/9 CI 用 `22.x` —— 一致
- `packageManager`：Task 1 设 `pnpm@9.15.0`，Task 8/9 CI 用 `version: 9.15.0` —— 一致
- Codecov token：Task 8 设 `fail_ci_if_error: false`，Task 14 Step 10 容错 —— 一致
- Commit message：Task 1-13 全部符合 commitlint 规范 —— 一致

### 4. 风险与回滚

| 风险 | 影响 Task | 回滚策略 |
|---|---|---|
| Task 10 TS 5 报大量新错 | 10 | 单文件 commit 可逐个 revert；最坏 `git revert` 整个 Task |
| Task 11 Vue 3.5 引入运行时错误 | 11 | 单 commit revert |
| Task 12 vite-plugin-mock 不兼容 | 12 | 方案 B 降级到 Vite 5 |
| Task 13 Vitest 3 API breaking | 13 | 单测试文件修复 + revert |
| Task 14 release.yml 失败 | 14 | 删远程 tag 重新触发 |

### 5. 全局顺序依赖

```
Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6 → Task 7 → Task 8 → Task 9
                                                                              ↓
                                                                  Task 10 → Task 11 → Task 12 → Task 13
                                                                                                          ↓
                                                                                                    Task 14
```

Task 1-9（治理部分）顺序依赖较弱，可重排；Task 10-13（依赖升级）严格顺序；Task 14 全局末端。

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-06-27-open-source-readiness.md`. Two execution options:**

**1. Subagent-Driven (推荐)** - 每个 Task 派发新 subagent + 任务审查 + 最终全分支审查。快速迭代、上下文隔离。

**2. Inline Execution** - 在当前 session 按 executing-plans 批量执行，带 checkpoint 让你审阅。

**Which approach?**
