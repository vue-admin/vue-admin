# 贡献指南

感谢你对 Vue Admin 的关注！本文档面向在文档站了解如何参与贡献的使用者，列出本地验证、Commit 规范与 PR 流程。完整版见仓库根目录 [CONTRIBUTING.md](https://github.com/vue-admin/vue-admin/blob/main/CONTRIBUTING.md)。

## 开发环境

| 工具 | 版本 | 说明 |
| --- | --- | --- |
| Node.js | `>=22.13.0 <23.0.0` | 详见 `package.json` 的 `engines.node`，`.nvmrc` 已声明 |
| pnpm | `>=9.0.0` | 推荐 9.15，启用 corepack 自动切换：`corepack enable` |

> 包管理统一使用 pnpm，**不要**用 npm/yarn，lockfile 为 pnpm 专用。

```bash
git clone https://github.com/vue-admin/vue-admin.git
cd vue-admin
pnpm i
pnpm dev          # 启动开发服务器（含 vite-plugin-mock）
```

测试账号：

| 用户名 | 密码 | 角色 |
| --- | --- | --- |
| admin | 123456 | super_admin（全权限） |
| user | 123456 | user（仅 `user:read`） |

## 提交前检查

PR 必须全部通过以下检查：

```bash
pnpm lint         # ESLint flat config 检查（0 错误 0 警告）
pnpm type-check   # vue-tsc 类型检查
pnpm test         # Vitest 单次运行
pnpm build        # 构建（含 type-check）
pnpm smoke        # Playwright smoke 测试（需先启动 dev server）
```

提交时 husky 会通过 lint-staged 自动对暂存文件运行 `eslint --fix`（覆盖 `*.{ts,tsx,vue}`），无需手动格式化。

## Commit 规范

本仓库使用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/)，由 `commitlint.config.js` + husky `commit-msg` 钩子强制。type 取值（共 11 种）：

| type | 含义 |
| --- | --- |
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

格式：`<type>(<scope>): <subject>`，`subject` 可中文（`subject-case` 规则已关闭），header 长度上限 100 字符。示例：

```
feat(auth): 新增 OAuth2 登录
fix(router): 修复动态路由 404 兜底
docs(readme): 更新 badge
```

## 分支策略

- `main`：受保护主干，仅通过 PR 合入
- 特性分支命名：`feat/<short-desc>` / `fix/<short-desc>` / `docs/<short-desc>` / `chore/<short-desc>`

## PR 流程

1. Fork 仓库并从 `main` 切出特性分支
2. 实现变更并补充测试
3. 本地跑通「提交前检查」全部命令
4. 提交 PR，目标分支为 `main`，简要描述改动原因和影响范围（自检清单见 PR 模板）
5. 至少 1 位 reviewer 通过
6. 使用 Squash Merge，commit message 用 PR 标题（同样需符合 Conventional Commits）

## 相关链接

- [CONTRIBUTING.md](https://github.com/vue-admin/vue-admin/blob/main/CONTRIBUTING.md)（完整版）
- [行为准则 Code of Conduct](https://github.com/vue-admin/vue-admin/blob/main/CODE_OF_CONDUCT.md)
- [安全问题上报 SECURITY.md](https://github.com/vue-admin/vue-admin/blob/main/SECURITY.md)
- [GitHub Discussions](https://github.com/vue-admin/vue-admin/discussions)（使用问题讨论）
- [GitHub Issues](https://github.com/vue-admin/vue-admin/issues)（Bug 报告 / 功能请求）
