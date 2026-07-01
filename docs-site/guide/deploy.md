# 云主机部署指南

本文档给出 Vue Admin 在云主机上的几种主流部署方案，任选其一。所有配置均可直接复制使用。

## 自动化部署（推荐：GitHub Actions + rsync）

推送 `main` 即自动构建 **app + 文档** 并同步到云主机。仓库已内置 `.github/workflows/deploy.yml`，只需三步配置：

### 1. 云主机准备 Nginx

仓库提供现成配置 `deploy/nginx.conf`，app 与文档同域（app 在 `/`，文档在 `/docs/`）：

```bash
# 云主机上创建目录
sudo mkdir -p /var/www/vue-admin /var/www/vue-admin-docs
sudo chown -R $USER:$USER /var/www/vue-admin /var/www/vue-admin-docs

# 上传并启用 Nginx 配置（按需修改 server_name）
sudo cp nginx.conf /etc/nginx/conf.d/vue-admin.conf
sudo nginx -t && sudo systemctl reload nginx
```

### 2. 配置 GitHub Secrets

仓库 **Settings → Secrets and variables → Actions → New repository secret**，添加：

| Secret 名 | 值 | 说明 |
|---|---|---|
| `SERVER_HOST` | `1.2.3.4` 或 `example.com` | 云主机地址 |
| `SERVER_USER` | `deploy` | SSH 登录用户 |
| `SERVER_SSH_KEY` | （私钥完整内容） | `cat ~/.ssh/id_ed25519` 的输出 |
| `APP_PATH` | `/var/www/vue-admin` | app 部署目录 |
| `DOCS_PATH` | `/var/www/vue-admin-docs` | 文档部署目录 |

可选 **Variables**（Settings → Variables，非 Secret）：`APP_BASE`（默认 `/`）、`DOCS_BASE`（默认 `/docs/`）。

> SSH 用户需对两个部署目录有写权限；建议建专用 `deploy` 用户并配置 sudo 免密（仅 nginx reload）。

### 3. 推送即部署

```bash
git push origin main
```

推送后 Actions 自动执行：`lint/test 质量门禁 → 构建 app (VITE_BASE=/) → 构建文档 (DOCS_BASE=/docs/) → rsync 同步到云主机`。访问 `https://your-domain.com/`（app）与 `/docs/`（文档）。

> 后续每次推送 main 自动发版，无需手动操作。Workflow 也支持手动触发（Actions 页 → Run workflow）。

---

## 手动部署方案

以下方案适合首次部署、临时演示或不用 CI 的场景。

## 构建产物

无论哪种方案，第一步都是产出静态构建产物：

```bash
pnpm i
pnpm build          # 产物输出到 dist/，已开启 terser（移除 console/debugger）
```

### 部署路径（base）

默认 `base` 为 `/vue-admin/`（适配 GitHub Pages 子路径）。**部署到云主机域名根路径时需覆盖为 `/`**：

```bash
# 方式一：环境变量（推荐，无需改代码）
VITE_BASE=/ pnpm build

# 方式二：构建后部署到子路径，则用对应子路径
VITE_BASE=/admin/ pnpm build
```

> 生产构建默认**不含 mock**（`vite-plugin-mock` 仅 dev 注入）。部署前需在后端配置真实 API，或保留 mock 用于演示。

### 接入后端 API

修改 `src/lib/http/client.ts` 中的 `baseURL`，或通过环境变量注入：

```bash
# .env.production
VITE_API_BASE_URL=https://api.your-domain.com
```

---

## 方案一：Nginx + 静态资源（推荐）

最经典的云主机部署方式，性能好、配置清晰。

### 1. 安装 Nginx

```bash
# Ubuntu / Debian
sudo apt update && sudo apt install -y nginx

# CentOS / RHEL
sudo yum install -y nginx
```

### 2. 上传构建产物

```bash
# 本地构建后上传 dist/ 到云主机
scp -r dist/* user@your-server:/var/www/vue-admin/
```

### 3. Nginx 配置

创建 `/etc/nginx/conf.d/vue-admin.conf`：

```nginx
server {
    listen 80;
    server_name your-domain.com;          # 改成你的域名或 IP
    root /var/www/vue-admin;              # 构建产物目录
    index index.html;

    # gzip 压缩（显著减小传输体积）
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;
    gzip_min_length 1024;

    # 静态资源长缓存（带 hash 文件名，可强缓存）
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # index.html 不缓存（保证发版即时生效）
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # SPA history 路由 fallback（关键：刷新子路径不 404）
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 4. 启用并重载

```bash
sudo nginx -t                  # 校验配置语法
sudo systemctl reload nginx    # 重载（不中断服务）
```

访问 `http://your-domain.com` 即可。

### 配置 HTTPS（强烈推荐）

```bash
# 安装 certbot
sudo apt install -y certbot python3-certbot-nginx
# 自动申请并配置 Let's Encrypt 证书
sudo certbot --nginx -d your-domain.com
```

证书自动续期已由 certbot 配置好。

---

## 方案二：Docker（容器化）

适合容器编排、CI/CD 流水线、环境隔离。

### 1. 编写 Dockerfile（多阶段构建）

项目根目录新建 `Dockerfile`：

```dockerfile
# ---- 构建阶段 ----
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
# 部署到根路径；子路径改为 VITE_BASE=/admin/
RUN VITE_BASE=/ pnpm build

# ---- 运行阶段（Nginx 托管静态资源） ----
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# 覆盖默认配置以支持 SPA fallback
RUN printf 'server {\n\
    listen 80;\n\
    location / {\n\
        root /usr/share/nginx/html;\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### 2. 构建并运行

```bash
docker build -t vue-admin .
docker run -d -p 80:80 --name vue-admin vue-admin
```

访问 `http://your-server-ip`。

---

## 方案三：Node 托管（轻量，无需 Nginx）

无 root 权限或临时演示可用 `serve` 直接托管。

```bash
pnpm build
npx serve -s dist -l 8080        # -s 启用 SPA fallback
```

配合 `pm2` 常驻：

```bash
npm i -g pm2
pm2 start "serve -s dist -l 8080" --name vue-admin
pm2 save
pm2 startup                       # 开机自启
```

---

## 反向代理后端 API（同域避免跨域）

若后端 API 与前端部署在同一域名下，Nginx 加一段反向代理即可消除跨域：

```nginx
# 加到 server 块内
location /api/ {
    proxy_pass http://127.0.0.1:8080;     # 后端服务地址
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

前端 `baseURL` 设为 `/api`（相对路径），请求自动经 Nginx 转发。

---

## 发版更新流程

```bash
# 1. 本地构建最新版本
VITE_BASE=/ pnpm build

# 2. 上传覆盖（方案一）
rsync -avz --delete dist/ user@your-server:/var/www/vue-admin/

# 3. Nginx 无需重启（index.html 设了 no-cache，即时生效）
```

CI/CD 可在 GitHub Actions 中自动执行上述步骤（推送 tag → 构建 → scp/rsync 到主机）。

---

## 常见问题

| 问题 | 原因 | 解决 |
|---|---|---|
| 刷新子路由 404 | Nginx 未配置 SPA fallback | 加 `try_files $uri $uri/ /index.html;` |
| 资源 404 / 路径错误 | `base` 与实际部署路径不符 | 用 `VITE_BASE` 覆盖（根路径用 `/`） |
| 接口跨域 | 前后端不同域 | 用 Nginx 反向代理 `/api/` |
| 发版后页面不更新 | index.html 被缓存 | index.html 设 `no-cache`（见上方配置） |
| 包体积警告 | Element Plus 整体打包 | 正常现象，EP 已按需引入，首屏 gzip ~315KB |

---

## 一键部署（PaaS）

无需自管主机，可直接用现成模板：

- **Vercel**：`vercel.json` 已配置，导入仓库即可
- **Netlify**：`netlify.toml` 已配置，导入仓库即可

> PaaS 部署后需自行接入真实后端 API（生产构建不含 mock）。
