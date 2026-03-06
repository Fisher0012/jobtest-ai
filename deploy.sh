#!/bin/bash
set -e
echo "======================================"
echo " AI职业危机测评 — 一键部署脚本"
echo " aicareer.sque.site → 49.234.191.61"
echo "======================================"

# ── 1. 安装 Node.js 20（via NVM，兼容 OpenCloudOS）────────
echo "[1/9] 安装 Node.js 20 via NVM..."
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20
nvm alias default 20
# 让后续所有命令都能找到 node/npm
export PATH="$NVM_DIR/versions/node/$(nvm version)/bin:$PATH"
echo "Node: $(node -v)  NPM: $(npm -v)"

# ── 2. 安装 Nginx + Git + PM2 ───────────────────────────
echo "[2/9] 安装 Nginx / Git / PM2..."
dnf install -y nginx git
npm install -g pm2
echo "Nginx: $(nginx -v 2>&1)  PM2: $(pm2 -v)"

# ── 3. 拉取代码 ──────────────────────────────────────────
echo "[3/9] 拉取代码..."
mkdir -p /var/www
cd /var/www
rm -rf jobtest-ai
git clone https://github.com/Fisher0012/jobtest-ai.git
cd jobtest-ai

# ── 4. 写入 .env.local ───────────────────────────────────
echo "[4/9] 配置环境变量..."
cat > .env.local << 'ENVEOF'
DEEPSEEK_API_KEY=YOUR_DEEPSEEK_API_KEY
NEXT_PUBLIC_SHOP_URL=https://www.xiaohongshu.com/shop/YOUR_SHOP_ID
WECHAT_MCHID=YOUR_WECHAT_MCHID
WECHAT_APPID=YOUR_WECHAT_APPID
WECHAT_SECRET=YOUR_WECHAT_SECRET
WECHAT_SERIAL_NO=YOUR_WECHAT_SERIAL_NO
WECHAT_API_V3_KEY=YOUR_WECHAT_API_V3_KEY
WECHAT_PLATFORM_SERIAL=YOUR_WECHAT_PLATFORM_SERIAL
NEXT_PUBLIC_BASE_URL=https://aicareer.sque.site
PAYMENT_PROVIDER=wechat
ENVEOF

# ── 5. 写入微信支付证书 ──────────────────────────────────
echo "[5/9] 写入微信证书..."
mkdir -p private/wechat

python3 -c "
import base64
data = 'YOUR_APICLIENT_KEY_PEM_BASE64'
with open('private/wechat/apiclient_key.pem','wb') as f:
    f.write(base64.b64decode(data))
print('  apiclient_key.pem OK')
"

python3 -c "
import base64
data = 'YOUR_APICLIENT_CERT_PEM_BASE64'
with open('private/wechat/apiclient_cert.pem','wb') as f:
    f.write(base64.b64decode(data))
print('  apiclient_cert.pem OK')
"

python3 -c "
import base64
data = 'YOUR_PLATFORM_CERT_PEM_BASE64'
with open('private/wechat/platform_cert.pem','wb') as f:
    f.write(base64.b64decode(data))
print('  platform_cert.pem OK')
"

chmod 600 private/wechat/*.pem

# ── 6. 安装依赖 + 构建 ───────────────────────────────────
echo "[6/9] npm install + build（可能需要 3-5 分钟）..."
npm install
npm run build

# ── 7. PM2 启动 ──────────────────────────────────────────
echo "[7/9] 配置 PM2..."
cat > ecosystem.config.js << 'PMEOF'
module.exports = {
  apps: [{
    name: 'ai-career-test',
    script: 'node_modules/.bin/next',
    args: 'start',
    cwd: '/var/www/jobtest-ai',
    env: { NODE_ENV: 'production', PORT: 3000 }
  }]
}
PMEOF

pm2 start ecosystem.config.js
pm2 save
pm2 startup | tail -1 | bash || true

# ── 8. Nginx 反代配置 ────────────────────────────────────
echo "[8/9] 配置 Nginx..."
# 删除可能存在的旧配置文件
rm -f /etc/nginx/conf.d/aicareer.sque.site.conf
cat > /etc/nginx/conf.d/sque.site.conf << 'NGINXEOF'
server {
    listen 80;
    server_name aicareer.sque.site sque.site;

    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINXEOF

nginx -t
systemctl enable nginx
systemctl restart nginx

# ── 9. HTTPS（Let's Encrypt）────────────────────────────
echo "[9/9] 申请 SSL 证书..."
dnf install -y epel-release
dnf install -y certbot python3-certbot-nginx
certbot --nginx \
  -d aicareer.sque.site -d sque.site \
  --non-interactive --agree-tos \
  -m admin@sque.site \
  --redirect \
  --force-renewal

echo ""
echo "======================================"
echo " 部署完成！"
echo " 访问: https://aicareer.sque.site"
echo "======================================"
