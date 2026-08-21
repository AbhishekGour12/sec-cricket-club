#!/bin/bash

# SEC Cricket Club Backend Deployment Script
# Run this script on your Hostinger VPS to pull latest code, build, and restart the backend.

set -e

echo "=========================================="
echo "🚀 Starting SEC Cricket Club Backend Deploy"
echo "=========================================="

# Navigate to script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Step 1: Fetch and pull latest changes from GitHub
echo "📥 [1/4] Pulling latest code from GitHub..."
git pull origin master

# Step 2: Install node dependencies
echo "📦 [2/4] Installing dependencies..."
npm install

# Step 3: Compile TypeScript to dist/
echo "🔨 [3/4] Building TypeScript code..."
npm run build

# Step 4: Restart PM2 process
echo "🔄 [4/4] Restarting PM2 process (sec-backend)..."
pm2 restart sec-backend || pm2 start dist/server.js --name "sec-backend"
pm2 save

echo "=========================================="
echo "✅ Deployment Successful!"
echo "=========================================="
echo "📊 Current PM2 Status:"
pm2 status sec-backend
