#!/bin/bash

# Lottie Open Studio - Setup Script
# This script installs all dependencies for the web editor

set -e  # Exit on error

echo "================================"
echo "Lottie Open Studio - Setup"
echo "================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "Please install Node.js (>= 14.0.0) from https://nodejs.org"
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 14 ]; then
    echo "❌ Error: Node.js version must be >= 14.0.0"
    echo "Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo "✅ npm version: $(npm -v)"
echo ""

# Navigate to web-editor directory
cd "$(dirname "$0")/web-editor"

echo "📦 Installing dependencies..."
echo ""

npm install

echo ""
echo "================================"
echo "✅ Setup Complete!"
echo "================================"
echo ""
echo "To start the development server, run:"
echo "  ./run.sh"
echo ""
echo "Or manually:"
echo "  cd web-editor"
echo "  npm run dev"
echo ""
