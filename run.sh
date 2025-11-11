#!/bin/bash

# Lottie Open Studio - Run Script
# This script starts the development server

set -e  # Exit on error

echo "================================"
echo "Lottie Open Studio"
echo "================================"
echo ""

# Check if node_modules exists
if [ ! -d "web-editor/node_modules" ]; then
    echo "❌ Dependencies not installed"
    echo ""
    echo "Please run setup first:"
    echo "  ./setup.sh"
    echo ""
    exit 1
fi

# Navigate to web-editor directory
cd "$(dirname "$0")/web-editor"

echo "🚀 Starting development server..."
echo ""
echo "The editor will open at: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
echo "================================"
echo ""

npm run dev
