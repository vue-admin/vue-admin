# 命名规范

> 命名是软件工程中最难的两件事之一。本规范列出全项目命名约定。

## 一、文件 / 目录

| 类型 | 规则 | 示例 |
|------|------|------|
| 目录 | kebab-case | `system/dict/` |
| Vue 组件文件 | PascalCase | `DictTree.vue`、`UserForm.vue` |
| 页面入口 | `List.vue` / `Detail.vue` / `Index.vue`（无明确主体时） | - |
| TS 模块 | camelCase | `useDictTree.ts` |
| 类型定义 | `types.ts` | - |
| 文档 | UPPER-KEBAB-CASE + 序号 | `04-NAMING.md` |

## 二、变量 / 函数

| 类型 | 规则 | 示例 |
|------|------|------|
| 普通变量 | camelCase | `userName`、`isLoading` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY`、`HTTP_STATUS` |
| Boolean | `is/has/can/should` 前缀 | `isLogin`、`hasPermission` |
| 函数 | camelCase + 动词开头 | `fetchUser`、`handleSubmit` |
| 事件处理 | `handle<Event>` | `handleClick`、`handleSubmit` |

## 三、类型 / 接口

| 类型 | 规则 | 示例 |
|------|------|------|
| Interface | PascalCase，**不加 `I` 前缀** | `User`、`DictItem` |
| Type alias | PascalCase | `UserRole` |
| 联合类型 | 字符串字面量（不用 enum） | `'active' \| 'inactive'` |

## 四、组件

| 类型 | 规则 | 示例 |
|------|------|------|
| 组件名 | PascalCase + 业务前缀 | `DictTree`、`SearchTable` |
| Props | camelCase | `:user-name="..."` |
| Emits | kebab-case | `@update:value`、`@submit` |
| 插槽 | kebab-case | `#header`、`#action-footer` |

## 五、Store / Composable

| 类型 | 规则 | 示例 |
|------|------|------|
| Store | `use<Domain>Store` | `useUserStore` |
| Composable | `use<Feature>` | `useRequest` |
| Store id | 与 domain 同名 | `'user'`、`'tagsView'` |

## 六、API

| 操作 | 命名 | URL |
|------|------|-----|
| 查询单个 | `fetch<Domain>` | `/api/user/:id` |
| 查询列表 | `fetch<Domain>List` | `/api/user/list` |
| 创建 | `create<Domain>` | `/api/user/create` |
| 更新 | `update<Domain>` | `/api/user/update/:id` |
| 删除单个 | `delete<Domain>` | `/api/user/delete/:id` |
| 批量删除 | `batchDelete<Domain>s` | `/api/user/batch-delete` |
| 选项（下拉） | `fetch<Domain>Options` | `/api/user/options` |

禁止 `getUser` / `delUser` / `removeUser` 等模糊命名。

## 七、路由

| 类型 | 规则 | 示例 |
|------|------|------|
| path | kebab-case，全小写 | `/system/dict/list` |
| name | camelCase | `dictList` |
| meta.title | 中文短语 | `'字典列表'` |

## 八、CSS 类

| 类型 | 规则 | 示例 |
|------|------|------|
| 全局类 | kebab-case | `.tags-view-container` |
| scoped 类 | kebab-case | `.search-card` |
| BEM 修饰 | `--modifier` | `.btn--primary` |
| BEM 元素 | `__element` | `.card__header` |

颜色、间距、字号 **必须** 用 Element Plus CSS 变量（`var(--el-color-primary)`），禁止硬编码。

## 九、禁止

- 拼音命名（`yonghu`、`zidian`）
- 缩写到不识别（`usr`、`dt`、`tmp1`）
- 1-2 字母变量（循环索引 `i`、`j` 除外）
- 类型后缀（`userArray`、`userObject`）—— 用 TypeScript 表达类型
- "魔术数字"直接出现（用 const 命名）

## 十、基础设施命名

| 类型 | 命名 | 备注 |
|------|------|------|
| HTTP 客户端导出 | `http`、`api` | `lib/http/client.ts` 导出；禁止 `service` / `request` |
| HTTP 错误类 | `HttpError` | `lib/error/types.ts` |
| 错误响应类型 | `ProblemDetail` | RFC 7807 |
| 错误捕获组件 | `ErrorBoundary` | `lib/error/ErrorBoundary.vue` |
| 监控接口 | `Monitor` | `lib/error/types.ts`；控制台默认实现 `defaultMonitor`（`lib/error/monitor.ts`） |
| 认证服务单例 | `authService` | `lib/auth/authService.ts`（工厂创建） |
| 认证提供方接口 | `AuthProvider` | `lib/auth/AuthProvider.ts` |
| JWT 实现类 | `JwtAuthProvider` | `lib/auth/JwtAuthProvider.ts` |
| Token 存储接口 | `TokenStorage` | `lib/auth/TokenStorage.ts` |
| 内存默认实现 | `MemorySessionTokenStorage` | `lib/auth/TokenStorage.ts` |
| Token 读取接口 | `TokenReader` | `lib/http/token.ts` |
| 动态路由装载 | `registerDynamicRoutes` | `lib/router/dynamic.ts` |
| 路由守卫安装 | `installGuards` | `lib/router/guards.ts` |
| 权限指令 | `vPermission` | `app/directives/permission.ts`；模板中用 `v-permission` |
| 全局用户 store | `useUserStore` | `app/stores/user.ts` |
| 全局权限 store | `usePermissionStore` | `app/stores/permission.ts` |

