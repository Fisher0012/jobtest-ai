#!/bin/bash
set -e
echo "======================================"
echo " 修复 SSL 证书问题 (Webroot 方式)"
echo " 无需停止 Nginx"
echo "======================================"

# 检查是否以root运行
if [ "$EUID" -ne 0 ]; then
  echo "请使用 sudo 运行此脚本: sudo bash fix-ssl-webroot.sh"
  exit 1
fi

# 1. 创建 webroot 目录
echo "[1/6] 创建 webroot 目录..."
mkdir -p /var/www/certbot

# 2. 临时修改 Nginx 配置以支持 webroot 验证
echo "[2/6] 配置 Nginx 支持 webroot 验证..."
if ! grep -q "location /.well-known/acme-challenge/" /etc/nginx/conf.d/sque.site.conf; then
  # 备份配置
  cp /etc/nginx/conf.d/sque.site.conf /etc/nginx/conf.d/sque.site.conf.bak

  # 在 server 块内添加 location
  sed -i '/location \/ {/i\
    location /.well-known/acme-challenge/ {\
        root /var/www/certbot;\
    }' /etc/nginx/conf.d/sque.site.conf

  echo "已添加 webroot 配置"
else
  echo "webroot 配置已存在"
fi

# 3. 重新加载 Nginx
echo "[3/6] 重新加载 Nginx..."
nginx -t && systemctl reload nginx

# 4. 使用 webroot 模式更新证书
echo "[4/6] 更新 SSL 证书..."
certbot certonly --webroot \
  -w /var/www/certbot \
  -d aicareer.sque.site -d sque.site \
  --non-interactive --agree-tos \
  -m admin@sque.site \
  --force-renewal

# 5. 恢复 Nginx 配置（移除临时 location）
echo "[5/6] 恢复 Nginx 配置..."
if [ -f /etc/nginx/conf.d/sque.site.conf.bak ]; then
  mv /etc/nginx/conf.d/sque.site.conf.bak /etc/nginx/conf.d/sque.site.conf
  nginx -t && systemctl reload nginx
  echo "配置已恢复"
else
  echo "使用当前配置"
fi

# 6. 验证结果
echo "[6/6] 验证证书更新..."
echo "证书状态:"
certbot certificates

echo ""
echo "======================================"
echo " 修复完成！"
echo " 请测试访问:"
echo "  - https://aicareer.sque.site"
echo "  - https://sque.site"
echo ""
echo " 如果仍有问题，请检查:"
echo "  1. DNS 解析是否正确"
echo "  2. 防火墙是否开放 80/443 端口"
echo "  3. 证书是否包含正确域名"
echo "======================================"