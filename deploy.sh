#!/bin/bash

echo "🚀 CA Governor Voter Guide Deployment Script"
echo "=========================================="

# Step 1: Build the project
echo "📦 Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    exit 1
fi

# Step 2: Instructions for GitHub
echo ""
echo "📋 Next Steps:"
echo "1. Go to github.com and create a new repository called 'ca-governor-voter-guide'"
echo "2. Run these commands to push to GitHub:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/ca-governor-voter-guide.git"
echo "   git push -u origin main"
echo ""
echo "3. Go to dash.cloudflare.com/pages"
echo "4. Connect your GitHub repository"
echo "5. Use these settings:"
echo "   - Build command: npm run build"
echo "   - Build output directory: dist"
echo "   - Node version: 20"
echo ""
echo "🎉 Your app will be live at: https://ca-governor-voter-guide.pages.dev"
