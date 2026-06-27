[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/rushui/vue-admin/blob/main/LICENSE)
[![CI](https://github.com/rushui/vue-admin/actions/workflows/ci.yml/badge.svg)](https://github.com/rushui/vue-admin/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/rushui/vue-admin/graph/badge.svg)](https://codecov.io/gh/rushui/vue-admin)

# Vue Admin

> Vue 3 + Element Plus 企业级后台管理前端基座

## 特性

- 🏗️ 四层架构（lib / app / modules / shared）+ ESLint 边界强制
- 🔒 RBAC 权限系统：`v-permission` 指令 + 4 步路由守卫 + 超级管理员短路
- 🌐 RFC 7807 错误契约（ProblemDetail）+ 全局 ElMessage 提示
- 🔑 JWT 认证：`authService` 单例 + 并发刷新保护 + 可插拔 `TokenStorage`
- 🎨 Element Plus 2.5 + 暗黑模式 + 完整图标自动注册
- 🧪 Vitest + jsdom + @vue/test-utils

## 快速开始

```bash
pnpm i
pnpm dev          # 启动开发服务器（含 vite-plugin-mock）
```

浏览器打开 http://localhost:5173/

## Mock 账号

| 用户名 | 密码 | 角色 | 权限 |
|---|---|---|---|
| admin | 123456 | super_admin | 全部（`*`） |
| user | 123456 | user | `user:read` |

## 界面

### 正常模式

![正常模式](docs/images/vue-admin.png)

### 暗模式

![暗模式](docs/images/vue-admin-dark.png)

## 常用命令

```bash
pnpm i              # 安装
pnpm dev            # 启动开发服务器
pnpm build          # 构建（含 type-check）
pnpm build-only     # 仅构建（不 type-check）
pnpm type-check     # vue-tsc 类型检查
pnpm lint           # ESLint flat config 检查
pnpm lint:fix       # ESLint 自动修复
pnpm test           # Vitest 单次运行
pnpm test:watch     # Vitest watch 模式
pnpm preview        # 预览生产构建
```

## 架构

四层目录，单向依赖：

```
modules ──→ app ──→ lib
              ▲
shared  ──────┘
```

- `src/lib/`：基础设施（http / auth / router / error / monitor），与业务无关
- `src/app/`：应用骨架（main.ts、stores、directives）
- `src/modules/`：业务领域（按 domain 聚合，如 auth/system）
- `src/shared/`：跨模块共享类型与常量

详见 [docs/standards/01-ARCHITECTURE.md](./docs/standards/01-ARCHITECTURE.md)。

## 文档

- [项目定位](./docs/standards/00-OVERVIEW.md)
- [架构规范](./docs/standards/01-ARCHITECTURE.md)
- [HTTP 客户端规范](./docs/standards/02-API.md)
- [状态管理规范](./docs/standards/03-STATE.md)
- [命名规范](./docs/standards/04-NAMING.md)
- [基础模块设计 spec](./docs/superpowers/specs/2026-06-25-foundation-design.md)
- [实施计划](./docs/superpowers/plans/2026-06-25-foundation-implementation.md)

## 技术栈

Vue 3.4 + Vite 4.5 + TypeScript 4.8 + Element Plus 2.5 + Pinia 2.1 + Vue Router 4.3 + Axios + Vitest 1.6 + ESLint 9

## DEMO

[http://demo.cncf.vip/vue-admin/](http://demo.cncf.vip/vue-admin/)

## License

[MIT](./LICENSE) © 2026 如水 <rushui@qq.com>
