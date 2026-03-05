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
DEEPSEEK_API_KEY=sk-360700bc766b46eb8227b32f5e33e573
NEXT_PUBLIC_SHOP_URL=https://www.xiaohongshu.com/shop/your-shop-id
WECHAT_MCHID=1643683525
WECHAT_APPID=wx913d3eea2b04ce29
WECHAT_SECRET=2a79760b880fca4b937ec614654cb472
WECHAT_SERIAL_NO=75F5E48600DF4E0180F9CFBD8173C82AE0DB9F55
WECHAT_API_V3_KEY=8nS2GbP7vQcR9tY1kLz5xD4mF0hJ6wE3
WECHAT_PLATFORM_SERIAL=489F90906E8BD46CD19D49F7D5BD6FEF2FAA575C
NEXT_PUBLIC_BASE_URL=https://aicareer.sque.site
PAYMENT_PROVIDER=wechat
ENVEOF

# ── 5. 写入微信支付证书 ──────────────────────────────────
echo "[5/9] 写入微信证书..."
mkdir -p private/wechat

python3 -c "
import base64
data = 'LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUV2QUlCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktZd2dnU2lBZ0VBQW9JQkFRRE9Cc3FJNlRuY2pDcHkKekdXeDI2VFFJajJyYmp3UDl1Q2dlRzh2MXNyeHZOZVdMZzFIRExKamRndHZJc2tTMkFBQmQzaDVhSjdjeTQxcAo5dmpvbjFHTEpWRkNkZ3k0N1V0MGJVTGMxM0RtcncxRFV6aVpETnB6UStaZXRwRS9ZSHN6bFNjN3NhK2NnTFYyClZNSWNUdjhNQjd3U0JTNGxYK244V0VrVGRUSDd5azA2NkhPK2dTaTl1NmVCY21IanZBS29EeGQ2Mk9xQWVBeEoKOWxING1lMlFJWlB2VkNsaVA4aFpYLzUvSWlXSXdvMGRJTGR2NjgrY3RqcUNxRFRBd0VveURiaDdLTW01M3FiUAppWEF3UlpkWEJyRFdPaUhNY2kwQ3hjTG1ENmMwWEJqSHhNQ3FuT0Q1ei9XQ3hvaWZta3dBWDdGZXpCK09DUmQzCjd5Q0drOXVWQWdNQkFBRUNnZ0VBR0VkT21NRzdNdFZGcjArTThGK3MxV1lqbEU4aVB0TmQ5eXNhRnk0ZHJrME4KcnNId2lKM2phN3NlYjlOT2xLemxtMGFqNk5LK1hkQ1M4cGpMRGthd0NsQzBlYnVGbGtsSWFnanlKeW93UU04QwpKaHZwZ0llMk9uMFc2YlJqKzI3NE5jVHU0YWIzeGQ2WkE3L0xQQ0RIQjNqbDNjM0VlVjBMS3RTUWovMXdqWFk4ClRIQzRjS0p5SFRGeU10dFdpYzZPYVNnbFZSeUptUHIrQ2d4RXZrZEl6dVd0b2N4WmlVZUdWT2hXYllBNkxiYlAKZENLZGNwSTB0MW1mdmM4L1M1TGdydGlLYzNDaUI4Z29xZGx5WVJCN0FVZlZEWmtQM3Z5QVprMStXNW1QdVZzSwp3M2pWYnAxSVV2a3l2V1lrRDBUbTljVVhPeUVPaXd5bFkwaGFqb1hsaFFLQmdRRDI5YzVZaXdINEtDOENsSUEvCjNCT2xOUjBiUkxXRHkzK3ZJZ2hySXFHaHk2VHZ1Rk1wSGFwaFNQYlNyQmUyOWJHMG5YeW03cnk3a0JJREdQSHYKZTFBUW9oUjJtbjdaOVR4cUo1NS92OTNpTndZQnBnUWpwRFZNa0lLRjBOdUU2U2VnSUNQMS9VT3FGaTM2OTNWMQpENENqcmRnbldUS3ppc0phck5oNzFQa241d0tCZ1FEVmtXaE9SU0tkMFdWSTdqaUdqK3pHVm9UcHROM004MVdzCms1MjVaOEMwVHpvcHB1RE5zbDN0R1dlaW9aaURocHBGU3BHdWFnN3FYVDdZL21uREd5TFplZXhKWnh1M21pSE8KemRYSWk1L0NENEFnVnlmYk44V1Fzd2x3c05YQWFVY1lyTS8vVFFmV3VCZXBwTmdyNFRiSmFpbC92U0Q1VVc2eQorK1AzUEZpQkl3S0JnQ0JzRFBjYTZOdEhpMFJ2Y3BidnNiU1MwSXR2N2RTcnRzdXJVQ2VnbUUvQmlKbmdQU3E4CnRrMm5ZcUF0Nzc4WmFvY24xZUdrbmlxUnM0dXNqcmErSGJqUlRwWnptZ3ZMWW04ZFhIV3hIdFJBSFEzQ1dmREQKOGl0bkhYdXIrK1hySmtTamM1VXI5dUl4bnorL2xUQVZKUEpZTkhTV0JVNEUvWmNoOGhudnovWXBBb0dBZjhGdwpDQUpMWnVUd0ZlU0xZOU9NN0VpdFViQ2tUZ255WWo0YngrRk00WS9UVno5QWswdno2L1dhalNybHRTZzcrTjlXCnJtTTdjTzgrdlVmVHRLYnkvZTExYjZPQ2JSNkN3dGRXMzVUR2lLd0ZGVk9Od0JGbzJkcC85eTJSY0h5Snp6VHgKWitPSW9PV1hJaUErUUdHRkNJKzlLM0RUM05EZHk2dnEvdWJXZXNrQ2dZQmtabTIvYmhjbnpmZTBpRytSOFFUTgpiblBoOGc2TnZUa0RzbCtRNWFPVnY0UUhLeG03Q0FET01NVjN3b0liV3VuSloxZnd3c0Y4emp5Z1ZuZWJGUGV5CmZiQ1JPMVZ4cVZwUGpKM2V0YWY1aGYxZlpkR0hNeU5KR0lUMDBxaEIvR3ZqQWdPV0xBWE5uVlQwNDlNeHdzS20Kdi9VWWFyb21qREhWRGVjdkE3ZEpRUT09Ci0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS0K'
with open('private/wechat/apiclient_key.pem','wb') as f:
    f.write(base64.b64decode(data))
print('  apiclient_key.pem OK')
"

python3 -c "
import base64
data = 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUVLRENDQXhDZ0F3SUJBZ0lVZGZYa2hnRGZUZ0dBK2MrOWdYUElLdURibjFVd0RRWUpLb1pJaHZjTkFRRUwKQlFBd1hqRUxNQWtHQTFVRUJoTUNRMDR4RXpBUkJnTlZCQW9UQ2xSbGJuQmhlUzVqYjIweEhUQWJCZ05WQkFzVApGRlJsYm5CaGVTNWpiMjBnUTBFZ1EyVnVkR1Z5TVJzd0dRWURWUVFERXhKVVpXNXdZWGt1WTI5dElGSnZiM1FnClEwRXdIaGNOTWpZd01qSTFNRGcwTnpNeVdoY05NekV3TWpJME1EZzBOek15V2pDQmdURVRNQkVHQTFVRUF3d0sKTVRZME16WTRNelV5TlRFYk1Ca0dBMVVFQ2d3UzViNnU1TCtoNVpXRzVvaTM1N083NTd1Zk1TMHdLd1lEVlFRTApEQ1RrdUlybXRiZmxvN0RwbTREa3Y2SG1nYS9ucDVIbWlvRG1uSW5wbVpEbGhhemxqN2d4Q3pBSkJnTlZCQVlUCkFrTk9NUkV3RHdZRFZRUUhEQWhUYUdWdVdtaGxiakNDQVNJd0RRWUpLb1pJaHZjTkFRRUJCUUFEZ2dFUEFEQ0MKQVFvQ2dnRUJBTTRHeW9qcE9keU1LbkxNWmJIYnBOQWlQYXR1UEEvMjRLQjRieS9XeXZHODE1WXVEVWNNc21OMgpDMjhpeVJMWUFBRjNlSGxvbnR6TGpXbjIrT2lmVVlzbFVVSjJETGp0UzNSdFF0elhjT2F2RFVOVE9Ka00ybk5ECjVsNjJrVDlnZXpPVkp6dXhyNXlBdFhaVXdoeE8vd3dIdkJJRkxpVmY2ZnhZU1JOMU1mdktUVHJvYzc2QktMMjcKcDRGeVllTzhBcWdQRjNyWTZvQjRERW4yVWZpWjdaQWhrKzlVS1dJL3lGbGYvbjhpSllqQ2pSMGd0Mi9yejV5MgpPb0tvTk1EQVNqSU51SHNveWJuZXBzK0pjREJGbDFjR3NOWTZJY3h5TFFMRnd1WVBwelJjR01mRXdLcWM0UG5QCjlZTEdpSithVEFCZnNWN01INDRKRjNmdklJYVQyNVVDQXdFQUFhT0J1VENCdGpBSkJnTlZIUk1FQWpBQU1Bc0cKQTFVZER3UUVBd0lEK0RDQm13WURWUjBmQklHVE1JR1FNSUdOb0lHS29JR0hob0dFYUhSMGNEb3ZMMlYyWTJFdQphWFJ5ZFhNdVkyOXRMbU51TDNCMVlteHBZeTlwZEhKMWMyTnliRDlEUVQweFFrUTBNakl3UlRVd1JFSkRNRFJDCk1EWkJSRE01TnpVME9UZzBOa013TVVNelJUaEZRa1F5Sm5OblBVaEJRME0wTnpGQ05qVTBNakpGTVRKQ01qZEIKT1VRek0wRTROMEZFTVVORVJqVTVNalpGTVRRd016Y3hNQTBHQ1NxR1NJYjNEUUVCQ3dVQUE0SUJBUUNtd0piaAo0dW55Z1phRG9OeFJwU1h5bm82TTcwRXZrTHEyaStrbUhKeEM3KzlGMHpPQXhzLzRsL2ovSWlzWmFzVEk0b2JsCk9YaHp0UHoxOXJYclM3eXJTdUcrQWo4K3pNb05tZGJ2aVdBQnM2RG1ud3BoRFlpZWplWEJkTitxYlNwcWxSeTYKTUd6M3JCTWNNR2NKNEpnUm9yYWJIdkxZZkg0Rzg1ZGlQazFJUXJQVGxoOVhvVEFTZEh4eE9mdDExTXAzdzIxeAo5UzRXQ3JUOVNkN2w3aEgzbnh2RzFzSmQrd01qUjkvK3BmSnJ4UHFoZ3U0WWpncU4wUmxTamZqMWFFS2RuZ0hnCnAzMXNGeWE2TFdja1hZcXF0dExGZ0xFbGVpK2Q4KzZEcC9QSUxuZWpFeEEvbkJPVGthdzhYT1R5ODFTVDhFaEMKY0QwYlNReGJBR2F1TkFYNAotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCg=='
with open('private/wechat/apiclient_cert.pem','wb') as f:
    f.write(base64.b64decode(data))
print('  apiclient_cert.pem OK')
"

python3 -c "
import base64
data = 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUVGRENDQXZ5Z0F3SUJBZ0lVU0orUWtHNkwxR3pSblVuMzFiMXY3eStxVjF3d0RRWUpLb1pJaHZjTkFRRUwKQlFBd1hqRUxNQWtHQTFVRUJoTUNRMDR4RXpBUkJnTlZCQW9UQ2xSbGJuQmhlUzVqYjIweEhUQWJCZ05WQkFzVApGRlJsYm5CaGVTNWpiMjBnUTBFZ1EyVnVkR1Z5TVJzd0dRWURWUVFERXhKVVpXNXdZWGt1WTI5dElGSnZiM1FnClEwRXdIaGNOTWpNd05UQTRNRGt5TkRFeFdoY05Namd3TlRBMk1Ea3lOREV4V2pCdU1SZ3dGZ1lEVlFRRERBOVUKWlc1d1lYa3VZMjl0SUhOcFoyNHhFekFSQmdOVkJBb01DbFJsYm5CaGVTNWpiMjB4SFRBYkJnTlZCQXNNRkZSbApibkJoZVM1amIyMGdRMEVnUTJWdWRHVnlNUXN3Q1FZRFZRUUdEQUpEVGpFUk1BOEdBMVVFQnd3SVUyaGxibHBvClpXNHdnZ0VpTUEwR0NTcUdTSWIzRFFFQkFRVUFBNElCRHdBd2dnRUtBb0lCQVFDbUdhOVRSS3YvNW5sM3NodWIKTVl0TkwrV0xySlVqenJiOEI5SWFrSlZDb1U0WGZZdUdVZ3pZWHRwN3JZYzZia1R3NGxwUitETlVqZE5zV0JTUQpuOFE2TkwyMDhDNDdIZmFoK1VBK1FFdUhyUk53U3lWbmo4T1JqZ3JkYmIxUkRNeTREbTlOemtzSU4xUGh5bjhaCmJTbzJXaWUrUCtvS05qdXhZVk1mdU5UeHBvdVFhOEZjbnVwbjUvdm4xdEM3SkVnaENuU0ZreVlRWHl6ZmE1TmUKWkpFRFRFTDlYRFRwM1UwdW1oY0JkWnJCS0M3QWJOdjBWUnlMWWFqZ09yenBqWUhYNlByTUUybFhsQzY0QXVuSQo4OGx6STBrS0hEWjN1YVRaaWV0eHVCek9KQnA5WUZVcWtTTFF0a3hNWnYrMk1RY2tCRTMxaUdKTDhVZmtsM0hIClRGWVJBZ01CQUFHamdicXdnYmt3Q1FZRFZSMFRCQUl3QURBTEJnTlZIUThFQkFNQ0EvZ3dnWnNHQTFVZEh3U0IKa3pDQmtEQ0JqYUNCaXFDQmg0YUJoR2gwZEhBNkx5OWxkbU5oTG1sMGNuVnpMbU52YlM1amJpOXdkV0pzYVdNdgphWFJ5ZFhOamNtdy9RMEU5TVVKRU5ESXlNRVUxTUVSQ1F6QTBRakEyUVVRek9UYzFORGs0TkRaRE1ERkRNMFU0ClJVSkVNaVp6WnoxSVFVTkRORGN4UWpZMU5ESXlSVEV5UWpJM1FUbEVNek5CT0RkQlJERkNSRVkxT1RJMlJURTAKTURNM01UQU5CZ2txaGtpRzl3MEJBUXNGQUFPQ0FRRUFCTDNNaVJLTHJiUlBWaUhTVjgwUG03NXRKeVUveDNHUQpyT0FFMHptcE1ndkU5TlVTbkNnQVVvN0dZVXQxaHNsaTJGbjZJanBBNVRkUjNKRytxaDZ2Vmw5b2RkTkRsVEo1Cm5oVXhLalJDSXMyL3JoYzF2a1NNZTQwL0x6NUt2dTYzazlrRnQxRkhQZElTMEpJOTJtcjYyeitpUngrWTJjeEoKVW12UHVsQkUyaVp3VkVPYXBJeHQwUUs2STk5WVVDSGdpTm5IUVdvMlE3WXpJZnJvZlpzZkd4S0piczVrem90QwpYanpKOFdUaTF2cG1DUWN5SlZiK1playsrbm4vKytsb3pkQnI5bE5qeDlEMDc2aW9OZ2hOZ0pQbTlzcUdNQkF6Cklha2lqc3BjbWY4SjM3WnJ6cURiZmd3Rk9NZzYrb3FxTnYwVnpZcXE2OFRRTXhHbXoya1gwdz09Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K'
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
