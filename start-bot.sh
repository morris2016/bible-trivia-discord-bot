#!/bin/bash

# Exit on any error
set -e

echo "🐧 Starting Discord Bot..."

# Verify Node.js version
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "⚠️  node_modules not found, installing dependencies..."
    npm ci --only=production
fi

# Verify key dependencies
if [ ! -d "node_modules/discord.js" ]; then
    echo "❌ discord.js not found in node_modules"
    ls -la node_modules/ | head -10
    exit 1
fi

echo "✅ Dependencies verified"

# Display environment variables (without sensitive values)
echo "🔍 Checking environment variables..."
echo "NODE_ENV: $NODE_ENV"
echo "DISCORD_TOKEN: ${DISCORD_TOKEN:0:20}..."
echo "DISCORD_CLIENT_ID: ${DISCORD_CLIENT_ID:0:10}..."
echo "API_BASE_URL: $API_BASE_URL"

# Check if required env vars are set
if [ -z "$DISCORD_TOKEN" ]; then
    echo "❌ DISCORD_TOKEN is not set"
    exit 1
fi

if [ -z "$DISCORD_CLIENT_ID" ]; then
    echo "❌ DISCORD_CLIENT_ID is not set"
    exit 1
fi

echo "🚀 Starting the Discord bot..."
exec npm start
