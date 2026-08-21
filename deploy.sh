#!/bin/bash

# SEC Cricket Club Main Deployment Script
set -e

echo "=========================================="
echo "🚀 Auto-Deploying SEC Cricket Club Backend..."
echo "=========================================="

# Navigate to backend folder
ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$ROOT_DIR/backend"

# Pull latest code
echo "📥 Pulling latest code from GitHub master..."
git pull origin master

# Install dependencies & build
echo "📦 Installing backend dependencies..."
npm install

echo "🔨 Building TypeScript code..."
npm run build

# Restart PM2
echo "🔄 Restarting PM2 process..."
pm2 restart sec-backend || pm2 start dist/server.js --name "sec-backend"
pm2 save

echo "=========================================="
echo "✅ Backend Deployed & Running Successfully!"
echo "=========================================="
pm2 status sec-backend
