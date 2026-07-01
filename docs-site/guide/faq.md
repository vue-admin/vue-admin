# 常见问题

汇总使用 Vue Admin 过程中高频出现的问题与排查思路。多数问题来源于 Mock 注入时机、路由动态注册机制或本地环境配置，按下方步骤逐项核对通常即可定位。

## 本地 Mock 不生效

Mock 由 `vite-plugin-mock` 提供，在 `vite.config.ts` 中配置为 `mockPath: './src/mock/apis'`、`enable: true`。该插件 `prodEnabled` 默认为 `false`，因此 **Mock 仅在 `pnpm dev` 开发模式下注入**，`pnpm build` / `pnpm preview` 不会生效。

1. 确认启动命令是 `pnpm dev`（`vite-plugin-mock` 只在 dev 模式注入）
2. 检查请求 URL 是否与 `src/mock/apis/` 下导出的 `url` 字段一致，例如 `/api/system/menus`、`/api/auth/login`
3. 打开浏览器 DevTools → Network，查看对应请求是否仍走真实后端或返回 404
4. 若修改了 mock 文件未生效，确认 `watchFiles: true` 已开启，必要时重启 dev server

## 构建报错 `Cannot find module '@/'`

`@` 别名由两处共同支撑：`vite.config.ts` 的 `resolve.alias` 与 `tsconfig.json` 的 `paths`。运行时构建走 Vite 别名，类型检查（`vue-tsc`）走 tsconfig paths，两者缺一都会报错。

1. 确认 `tsconfig.json` 中已配置 `"paths": { "@": ["src"], "@/*": ["src/*"] }`
2. 确认 `vite.config.ts` 中 `resolve.alias` 的 `'@'` 指向 `path.resolve(__dirname, 'src')`
3. 若配置正确仍报错，重启 VS Code / TypeScript 服务（命令面板执行 `TypeScript: Restart TS Server`）

## 登录后看不到菜单

菜单由 `/api/system/menus` 返回，`src/mock/apis/menu.ts` 根据请求头 `Authorization` 中的 token 判断身份：token 包含 `_admin_` 字段才返回 `ALL_MENUS` 全部菜单，否则只返回首页一项。这是权限设计的预期行为，不是 bug。

1. 确认登录账号：`admin` / `123456`（super_admin，全菜单）；`user` / `123456`（user 角色，仅首页）
2. 浏览器控制台查看 `/api/system/menus` 响应，确认 `data` 数组长度
3. 若是自定义后端，确认返回结构与 `MenuDTO` 一致，且 token 中携带身份标识
4. 菜单数据由路由守卫 `bootstrapMenus` 拉取并经 `registerDynamicRoutes` 注册，若菜单接口请求失败，守卫会降级继续（不阻塞导航），此时表现为侧边栏为空——查看控制台是否有 `[router]` 相关 monitor 上报

## 新增页面 404

动态路由通过 `import.meta.glob('@/modules/**/*.vue')` 收集所有业务页面，再按菜单 `component` 字段拼接路径查找 loader。`src/lib/router/dynamic.ts` 中查找逻辑为 `const key = /src/modules/${m.component}.vue`，因此 `component` 字段必须对应 `src/modules/` 下真实存在的 `.vue` 文件相对路径（不带 `.vue` 后缀、不带前导 `/`）。

1. 确认菜单 `component` 字段值，例如 `system/user/views/List` 对应文件 `src/modules/system/user/views/List.vue`
2. 确认 `registerDynamicRoutes` 在控制台未输出 `[router] 路由组件缺失: ...`（该告警表示 glob 未匹配到文件）
3. 确认路由守卫已成功 bootstrap 菜单：`bootstrapMenus` 仅在 `menusRegistered === false` 时拉取，首次成功后会置位；登出再登录会重置该标志
4. 确认 404 通配符路由是在动态路由注册完成后才添加的（守卫中 `bootstrapMenus` 成功后 `addRoute` catchAll），若手动改动了注册顺序可能导致动态路由被通配符提前拦截

## smoke 测试失败

Smoke 测试基于 Playwright，配置见 `playwright.config.ts`：`testDir: './test/smoke'`，`baseURL` 默认 `http://localhost:5173/`。测试用例不会自动启动 dev server，需手动起服务。

1. 先单独启动 `pnpm dev`，确认开发服务器在 `http://localhost:5173/` 可访问
2. 再运行 `pnpm smoke`（CI 环境用 `pnpm smoke:ui` 调试）
3. 失败时查看 `test-results/` 目录下的截图与 trace（配置为 `trace: 'on-first-retry'`、`screenshot: 'only-on-failure'`）
4. 若测试间存在状态污染，注意 `workers: 1`、`fullyParallel: false` 已强制串行，优先排查用例自身的登录态残留
