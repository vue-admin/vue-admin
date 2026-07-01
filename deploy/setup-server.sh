#!/usr/bin/env bash
#
# Vue Admin 云主机部署用户配置（权限组方案，不动 nginx、不改 www 属主）
# 用 root 执行： bash deploy/setup-server.sh
# 路径/用户/组不同时用环境变量覆盖：
#   DEPLOY_USER=xxx APP_PATH=/srv/vue-admin DOCS_PATH=/srv/vue-admin-docs WWW_GROUP=www bash deploy/setup-server.sh
set -euo pipefail

DEPLOY_USER="${DEPLOY_USER:-vue-admin-deploy}"
WWW_GROUP="${WWW_GROUP:-www}"
APP_PATH="${APP_PATH:-/var/www/vue-admin}"
DOCS_PATH="${DOCS_PATH:-/var/www/vue-admin-docs}"
KEY_NAME="gh_actions_vue_admin"

[ "$(id -u)" -eq 0 ] || { echo "请用 root 执行： sudo bash $0" >&2; exit 1; }

# 1. 建用户并加入 www 组
id "$DEPLOY_USER" >/dev/null 2>&1 || useradd -m -s /bin/bash "$DEPLOY_USER"
id -nG "$DEPLOY_USER" | tr ' ' '\n' | grep -qxF "$WWW_GROUP" || usermod -aG "$WWW_GROUP" "$DEPLOY_USER"

# 2. 目录开组写 + setgid（新文件继承 www 组，不破坏属主）
for d in "$APP_PATH" "$DOCS_PATH"; do
  [ -d "$d" ] || { echo "目录 $d 不存在" >&2; exit 1; }
  chmod -R g+w "$d"
  find "$d" -type d -exec chmod g+s {} +
done

# 3. 生成专用 SSH 密钥并授权
HOME_DIR="$(getent passwd "$DEPLOY_USER" | cut -d: -f6)"
install -d -m 700 -o "$DEPLOY_USER" -g "$WWW_GROUP" "$HOME_DIR/.ssh"
[ -f "$HOME_DIR/.ssh/$KEY_NAME" ] || sudo -u "$DEPLOY_USER" ssh-keygen -t ed25519 -C gh-actions-vue-admin -f "$HOME_DIR/.ssh/$KEY_NAME" -N "" >/dev/null
sudo -u "$DEPLOY_USER" bash -c "cat ~/.ssh/$KEY_NAME.pub >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"

# 4. 自测
if sudo -u "$DEPLOY_USER" ssh -i "$HOME_DIR/.ssh/$KEY_NAME" -o BatchMode=yes -o StrictHostKeyChecking=no "$DEPLOY_USER@127.0.0.1" 'echo deploy-ok' >/dev/null 2>&1; then
  echo "✓ SSH 自测通过"
else
  echo "⚠ SSH 自测失败，检查 sshd PubkeyAuthentication 与 ~/.ssh 权限（700/600）" >&2
fi

# 5. 打印 GitHub Secrets
PUB_IP="$(curl -s --max-time 3 https://api.ipify.org 2>/dev/null || echo '<服务器公网IP>')"
echo ""
echo "═══ 填入 GitHub Settings → Secrets and variables → Actions ═══"
echo "Secrets:"
echo "  SERVER_HOST    = $PUB_IP"
echo "  SERVER_USER    = $DEPLOY_USER"
echo "  APP_PATH       = $APP_PATH"
echo "  DOCS_PATH      = $DOCS_PATH"
echo "  SERVER_SSH_KEY = （下面整段私钥，含 BEGIN/END 行）"
echo "──────────────────── 复制私钥 ────────────────────"
cat "$HOME_DIR/.ssh/$KEY_NAME"
echo "──────────────────────────────────────────────────"
echo "Variables: APP_BASE=/  DOCS_BASE=/docs/"
echo ""
echo "✅ 配置后 git push origin main 即自动部署"
