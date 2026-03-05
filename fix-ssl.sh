#!/bin/bash
set -e
echo "======================================"
echo " 修复 SSL 证书问题"
echo " 添加 aicareer.sque.site 到证书"
echo "======================================"

# 检查是否以root运行
if [ "$EUID" -ne 0 ]; then
  echo "请使用 sudo 运行此脚本: sudo bash fix-ssl.sh"
  exit 1
fi

# 1. 备份当前 Nginx 配置
echo "[1/5] 备份当前配置..."
cp /etc/nginx/conf.d/sque.site.conf /etc/nginx/conf.d/sque.site.conf.backup.$(date +%Y%m%d_%H%M%S)

# 2. 停止 Nginx（certbot standalone 模式需要）
echo "[2/5] 停止 Nginx 服务..."
systemctl stop nginx

# 3. 使用 standalone 模式更新证书（避免端口冲突）
echo "[3/5] 更新 SSL 证书..."
certbot certonly --standalone \
  -d aicareer.sque.site -d sque.site \
  --non-interactive --agree-tos \
  -m admin@sque.site \
  --force-renewal

# 4. 重新启动 Nginx
echo "[4/5] 启动 Nginx 服务..."
systemctl start nginx

# 5. 验证结果
echo "[5/5] 验证证书更新..."
echo "新的证书包含以下域名:"
certbot certificates | grep -A2 "Domains:"

echo ""
echo "======================================"
echo " 修复完成！"
echo " 请测试访问:"
echo "  - https://aicareer.sque.site"
echo "  - https://sque.site"
echo "======================================"

# 检查证书详细信息
echo "证书 SAN 列表:"
echo | openssl s_client -servername aicareer.sque.site -connect localhost:443 2>/dev/null | \
  openssl x509 -noout -text | grep -A1 "Subject Alternative Name" || true