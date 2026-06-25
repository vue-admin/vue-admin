# CLAUDE.md

> 本文件是 Claude Code 的**工程上下文索引**。详细内容见 `docs/standards/`，本文不重复。

## 项目概述

Vue Admin —— Vue 3 + Vite + TypeScript + Element Plus 的后台管理前端基座。

定位与演进路线见 [docs/standards/00-OVERVIEW.md](./docs/standards/00-OVERVIEW.md)。

## 常用命令

```bash
pnpm i              # 安装
pnpm dev            # 启动开发服务器
pnpm build          # 构建（含 type-check）
pnpm build-only     # 仅构建（不 type-check）
pnpm type-check     # 类型检查
pnpm lint           # ESLint 检查（待引入）
pnpm preview        # 预览生产构建
```

## 技术栈

- Vue 3.4 + `<script setup>`
- Vite 4.5 + TypeScript 4.8（待升级到最新主版本）
- Element Plus 2.5 + 完整图标自动注册
- Pinia 2.1（setup 风格 store）
- Vue Router 4.3
- Axios（统一通过 `service` 单例使用）
- VueUse 10.8 + SCSS

## 工程上下文指引

| 想做什么 | 看哪里 |
|---------|--------|
| 写新代码 | [01-ARCHITECTURE.md](./docs/standards/01-ARCHITECTURE.md) |
| 写新 API | [02-API.md](./docs/standards/02-API.md) |
| 写新 store | [03-STATE.md](./docs/standards/03-STATE.md) |
| 起名 / 起文件名 | [04-NAMING.md](./docs/standards/04-NAMING.md) |
| 了解战略方向 | [00-OVERVIEW.md](./docs/standards/00-OVERVIEW.md) |
| 修改规范本身 | [standards/README.md](./docs/standards/README.md) |

## 关键架构约定（高频引用）

1. **单一 HTTP 客户端**：业务代码必须用 `src/apis/client/service.ts` 导出的 `service` 单例。`request.ts` 仅类型定义。禁止业务代码 `import axios`。

2. **Store 必须用 setup 风格**：`defineStore('<domain>', () => { ... })`，禁止 Options 风格。

3. **响应式解构必须 `storeToRefs`**：`const { user } = storeToRefs(userStore)`。

4. **错误处理三层**：service 拦截器（提示 + 跳登录）→ api 函数（不提示）→ 页面（检查 `error` 后做 UI 反馈）。

5. **业务代码禁止直接调 axios**：必须通过 `src/apis/<domain>/index.ts` 封装。

6. **目录扁平**：业务页面按域分子目录，单 `.vue` 文件不超过 500 行。

## 自动导入

Vite 已配置：
- `unplugin-auto-import`：Vue API（ref / reactive / computed 等）无需手动 import
- `unplugin-vue-components`：Element Plus 组件按需自动注册
- Element Plus 图标：在 `main.ts` 全局注册

## 路径别名

`@/` → `src/`（已在 `vite.config.ts` 与 `tsconfig.json` 配置）。

## 构建配置

- 生产 `base`：`/vue-admin/`（建议改为可配置，见 00-OVERVIEW 待办）
- 代码分割：Element Plus / Vue / 第三方库分别打包
- 压缩：terser，移除 `console` 和 `debugger`

## Mock

- `vite-plugin-mock` 在开发环境提供 Mock API
- Mock 文件位于 `src/mock/apis/`
- Mock 响应必须与真实后端结构一致（`ApiResult` 包装）
