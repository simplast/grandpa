#!/bin/bash

# Grandpa CLI Template Setup Script
# This script sets up the development environment

set -e

echo "🚀 Setting up Grandpa CLI Template..."

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Please install Bun first:"
    echo "   curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

echo "✅ Bun is installed"

# Install dependencies
echo "📦 Installing dependencies..."
bun install

echo "✅ Dependencies installed"

# Build the project
echo "🔨 Building project..."
bun run build

echo "✅ Project built successfully"

# Link CLI globally (optional)
echo "🔗 Linking CLI globally..."
cd apps/cli
bun link
cd ../..

echo "✅ Setup complete!"
echo ""
echo "🎉 You can now use the CLI:"
echo "   bun run cli --help"
echo "   grandpa --help  (if globally linked)"
echo ""
echo "📖 For more information, see README.md"