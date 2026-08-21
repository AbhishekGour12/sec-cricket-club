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

# Step 4: Reload Nginx
echo "🌐 [5/5] Reloading Nginx Web Server..."
sudo systemctl reload nginx || sudo systemctl restart nginx

echo "================================================="
echo "✅ Full Deployment Completed Successfully!"
echo "================================================="
echo "📌 Admin Panel: https://sec-api.duckdns.org"
echo "📌 Backend API:  https://sec-api.duckdns.org/api"
echo "================================================="
pm2 status sec-backend
