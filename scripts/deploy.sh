#!/bin/bash

# Production deployment script for GymAdmin

echo "🚀 Starting production deployment..."

# Check if environment variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: Missing required environment variables"
    echo "Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Run type checking
echo "🔍 Running type checks..."
npm run build

# Run tests if they exist
if [ -f "package.json" ] && grep -q "\"test\"" package.json; then
    echo "🧪 Running tests..."
    npm test
fi

# Build the application
echo "🏗️ Building application..."
npm run build

echo "✅ Deployment completed successfully!"
echo "🌐 Application is ready to serve"

# Optional: Start the application
if [ "$1" = "--start" ]; then
    echo "🚀 Starting application..."
    npm start
fi