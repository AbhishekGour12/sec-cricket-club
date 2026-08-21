#!/bin/bash

# SEC Cricket Club Full Deployment Script (Backend + Admin Panel)
set -e

echo "================================================="
echo "🚀 Auto-Deploying SEC Cricket Club (Backend + Admin)"
echo "================================================="

ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$ROOT_DIR"

# Step 1: Pull latest changes from GitHub
echo "📥 [1/5] Pulling latest code from GitHub..."
git pull origin master

# Step 2: Install dependencies & build Backend
echo "📦 [2/5] Installing Backend dependencies..."
cd "$ROOT_DIR/backend"
npm install

echo "🔨 [3/5] Building Backend TypeScript..."
npm run build

echo "🔄 Restarting Backend PM2 process..."
pm2 restart sec-backend || pm2 start dist/server.js --name "sec-backend"
pm2 save

# Step 3: Install dependencies & build Admin Frontend
echo "🎨 [4/5] Building Admin Frontend (Vite React)..."
cd "$ROOT_DIR/admin"
npm install
VITE_API_URL=https://sec-api.duckdns.org/api npm run build

# Step 4: Ensure Nginx routes /uploads to Node.js and allows large multipart bodies
echo "🌐 [5/6] Checking Nginx configuration for /uploads + client_max_body_size..."
NGINX_CONF="/etc/nginx/sites-available/sec-api.duckdns.org"
if [ ! -f "$NGINX_CONF" ]; then
    NGINX_CONF="/etc/nginx/sites-available/default"
fi
if [ -f "$NGINX_CONF" ]; then
    if ! grep -q "client_max_body_size" "$NGINX_CONF"; then
        echo "🔧 Adding client_max_body_size 15m..."
        sudo sed -i '/server_name/a \    client_max_body_size 15m;' "$NGINX_CONF" || true
    fi
    if ! grep -q "location /uploads" "$NGINX_CONF"; then
        echo "🔧 Adding /uploads proxy rule to Nginx..."
        sudo sed -i '/location \/ {/i \    location /uploads/ {\n        proxy_pass http://127.0.0.1:5001/uploads/;\n        proxy_http_version 1.1;\n        proxy_set_header Host $host;\n        proxy_read_timeout 60s;\n    }\n' "$NGINX_CONF" || true
    fi
fi
echo "📌 Reference config: deploy/nginx-sec-api.duckdns.org.conf.example"
echo "📌 Verify an image (not HTML): curl -sI https://sec-api.duckdns.org/api/uploads/announcements/<file>"

echo "🌐 [6/6] Testing & Reloading Nginx Web Server..."
sudo nginx -t || true
sudo systemctl reload nginx || sudo systemctl restart nginx

echo "================================================="
echo "✅ Full Deployment Completed Successfully!"
echo "================================================="
echo "📌 Admin Panel: https://sec-api.duckdns.org"
echo "📌 Backend API:  https://sec-api.duckdns.org/api"
echo "================================================="
pm2 status sec-backend
