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
