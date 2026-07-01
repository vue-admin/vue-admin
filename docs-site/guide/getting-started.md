# 快速上手

5 分钟把 Vue Admin 在本地跑起来。

## 环境要求

| 工具 | 版本 | 说明 |
|---|---|---|
| Node.js | `>=22.12.0 <23` | 推荐 22.12 LTS（`.nvmrc` 已声明） |
| pnpm | `>=9.0.0` | 推荐 9.15（启用 corepack 自动切换） |
| 包管理 | pnpm | **不要用 npm/yarn**，lockfile 是 pnpm 专用 |

用 [nvm](https://github.com/nvm-sh/nvm) / [fnm](https://github.com/Schniz/fnm) 切换 Node 版本：

```bash
nvm use          # 自动读取 .nvmrc
corepack enable  # 启用 pnpm
```

## 安装与启动

```bash
git clone <repo-url> vue-admin
cd vue-admin
pnpm i            # 安装依赖
pnpm dev          # 启动开发服务器（含 mock）
```

浏览器打开 `http://localhost:5173/`。

## 测试账号

开发环境内置 mock，开箱即用：

| 用户名 | 密码 | 角色 | 权限 |
|---|---|---|---|
| `admin` | `123456` | super_admin | 全部（`*` 通配） |
| `user` | `123456` | user | 仅 `user:read` |

用 `admin` 登录可看到全部菜单；用 `user` 登录可验证权限收敛效果。

## 常用命令

| 命令 | 作用 |
|---|---|
| `pnpm dev` | 开发服务器（含 mock） |
| `pnpm build` | 生产构建（含 type-check） |
| `pnpm build-only` | 仅构建（跳过类型检查） |
| `pnpm type-check` | vue-tsc 类型检查 |
| `pnpm lint` / `lint:fix` | ESLint 检查 / 自动修复 |
| `pnpm test` | 单元测试（Vitest） |
| `pnpm smoke` | E2E 冒烟（需先起 dev server） |
| `pnpm format` | Prettier 格式化 |
| `pnpm gen:module <name>` | 脚手架生成新模块 |
| `pnpm docs:dev` | 文档站本地预览 |

## 目录结构

```
src/
├── lib/           基础设施（HTTP/认证/路由/错误/i18n/文件/缓存/格式）
├── app/           应用骨架（组件/composables/stores/directives/constants）
├── modules/       业务领域（按域拆分）
│   ├── auth/      登录
│   ├── dashboard/ 工作台
│   ├── system/    系统管理（user/role/dept/permission/menu/dict/notice/log）
│   ├── profile/   个人中心
│   └── crud/      CRUD 示例
├── layout/        布局（Header/Sidebar/TagsView/Footer/Breadcrumb）
├── router/        路由表
└── mock/          Mock API（仅 dev）
```

**四层依赖**：`lib/ → app/ → modules/ → shared/`，反向依赖由 ESLint 强制禁止。

## 下一步

- [云主机部署](./deploy.md) —— 上线到生产
- [架构](./architecture.md) —— 理解四层目录与设计
- [模块开发](./module.md) —— 用 `pnpm gen:module` 新建业务模块
- [通用组件](../components/search-table.md) —— SearchTable / FormDrawer / Selectors
