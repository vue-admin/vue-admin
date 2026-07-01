# 部署指南

Vue Admin 构建后产出纯静态文件，可部署到任何支持静态资源托管的服务器或 PaaS 平台。

## 构建产物

```bash
pnpm i
pnpm build          # 输出到 dist/
```

生产构建默认不含 mock，部署前需确保后端 API 已就绪。

## 部署路径（base）

`vite.config.ts` 中 `base` 默认生产环境为 `/vue-admin/`（适配 GitHub Pages 子路径）。若部署到域名根路径，需覆盖：

```bash
VITE_BASE=/ pnpm build
```

## SPA 路由 fallback

Vue Admin 使用 `createWebHistory`，刷新子路由时需要服务器返回 `index.html`。Nginx 示例：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/vue-admin;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 反向代理后端 API

将 `/api/` 转发到后端服务可消除跨域：

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
}
```

前端 `baseURL` 设为 `/api`（相对路径）即可。

## 常见部署问题

| 问题 | 原因 | 解决 |
|---|---|---|
| 刷新子路由 404 | 未配置 SPA fallback | 加 `try_files $uri $uri/ /index.html;` |
| 资源 404 | `VITE_BASE` 与实际路径不符 | 用 `VITE_BASE=/` 覆盖 |
| 接口跨域 | 前后端不同域 | Nginx 反向代理 `/api/` |
| 发版后缓存 | index.html 被浏览器缓存 | 配置 `no-cache` |

> 内部 CI/CD、云主机详细配置属于项目维护信息，不在这里展开。
