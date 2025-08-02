#!/bin/bash

# Frontend Build and Deployment Script for Academitna
# ===================================================

set -e

echo "🚀 Building and deploying Academitna Frontend..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Configuration
BUILD_DIR="out"
DEPLOY_DIR="/var/www/academitna"
BACKUP_DIR="/var/backups/academitna-frontend"
NODE_VERSION="18"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the frontend project root directory"
    exit 1
fi

# Check Node.js version
print_step "Checking Node.js version..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
fi

CURRENT_NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$CURRENT_NODE_VERSION" -lt "$NODE_VERSION" ]; then
    print_warning "Node.js version $CURRENT_NODE_VERSION detected. Recommended: $NODE_VERSION+"
fi

# Install dependencies
print_step "Installing dependencies..."
if command -v yarn &> /dev/null; then
    print_status "Using Yarn..."
    yarn install --frozen-lockfile
elif command -v pnpm &> /dev/null; then
    print_status "Using pnpm..."
    pnpm install --frozen-lockfile
else
    print_status "Using npm..."
    npm ci
fi

# Run linting (optional)
print_step "Running linting..."
if command -v yarn &> /dev/null; then
    yarn lint || print_warning "Linting failed, continuing..."
elif command -v pnpm &> /dev/null; then
    pnpm lint || print_warning "Linting failed, continuing..."
else
    npm run lint || print_warning "Linting failed, continuing..."
fi

# Build the application
print_step "Building the application..."
export NODE_ENV=production

if command -v yarn &> /dev/null; then
    yarn build
elif command -v pnpm &> /dev/null; then
    pnpm build
else
    npm run build
fi

# Check if build was successful
if [ ! -d "$BUILD_DIR" ] && [ ! -d ".next" ]; then
    print_error "Build failed - no build output found"
    exit 1
fi

print_status "✅ Build completed successfully!"

# Create deployment package
print_step "Creating deployment package..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PACKAGE_NAME="academitna-frontend-${TIMESTAMP}"

mkdir -p "${PACKAGE_NAME}"

# Copy build files
if [ -d "$BUILD_DIR" ]; then
    # Static export
    cp -r "$BUILD_DIR"/* "${PACKAGE_NAME}/"
    print_status "Copied static export files"
elif [ -d ".next" ]; then
    # Next.js build
    cp -r .next "${PACKAGE_NAME}/"
    cp -r public "${PACKAGE_NAME}/"
    cp package.json "${PACKAGE_NAME}/"
    cp next.config.js "${PACKAGE_NAME}/" 2>/dev/null || true
    print_status "Copied Next.js build files"
fi

# Copy deployment scripts
cp -r deployment "${PACKAGE_NAME}/" 2>/dev/null || true

# Create deployment info
cat > "${PACKAGE_NAME}/DEPLOYMENT_INFO.txt" << EOF
Academitna Frontend Deployment Package
======================================

Build Date: $(date)
Node Version: $(node -v)
Build Type: $([ -d "$BUILD_DIR" ] && echo "Static Export" || echo "Next.js Build")
Package Size: $(du -sh "${PACKAGE_NAME}" | cut -f1)

Deployment Instructions:
1. Upload package to VPS
2. Extract to /var/www/academitna
3. Configure Nginx
4. Test deployment

For detailed instructions, see deployment/README.md
EOF

# Create archive
print_step "Creating deployment archive..."
tar -czf "${PACKAGE_NAME}.tar.gz" "${PACKAGE_NAME}"

# Calculate sizes
PACKAGE_SIZE=$(du -sh "${PACKAGE_NAME}" | cut -f1)
ARCHIVE_SIZE=$(ls -lh "${PACKAGE_NAME}.tar.gz" | awk '{print $5}')

print_status "✅ Deployment package created!"
echo ""
echo "📦 Package Details:"
echo "   Directory: ${PACKAGE_NAME}"
echo "   Archive: ${PACKAGE_NAME}.tar.gz"
echo "   Package Size: $PACKAGE_SIZE"
echo "   Archive Size: $ARCHIVE_SIZE"
echo ""

# Deployment options
echo "🚀 Deployment Options:"
echo ""
echo "1. Manual Upload:"
echo "   scp ${PACKAGE_NAME}.tar.gz root@148.230.115.242:/root/"
echo ""
echo "2. Direct Deployment (if running on VPS):"
read -p "Deploy directly to /var/www/academitna? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_step "Deploying to production..."
    
    # Create backup of current deployment
    if [ -d "$DEPLOY_DIR" ]; then
        print_status "Creating backup..."
        mkdir -p "$BACKUP_DIR"
        sudo cp -r "$DEPLOY_DIR" "${BACKUP_DIR}/backup_${TIMESTAMP}"
    fi
    
    # Deploy new version
    print_status "Deploying new version..."
    sudo mkdir -p "$DEPLOY_DIR"
    sudo cp -r "${PACKAGE_NAME}"/* "$DEPLOY_DIR/"
    sudo chown -R nginx:nginx "$DEPLOY_DIR"
    sudo chmod -R 755 "$DEPLOY_DIR"
    
    # Test Nginx configuration
    print_status "Testing Nginx configuration..."
    sudo nginx -t
    
    # Reload Nginx
    print_status "Reloading Nginx..."
    sudo systemctl reload nginx
    
    print_status "✅ Deployment completed!"
    print_status "🌐 Your site should be available at: https://academitna.online"
    
    # Cleanup
    rm -rf "${PACKAGE_NAME}"
    
else
    print_status "Manual deployment package ready: ${PACKAGE_NAME}.tar.gz"
fi

echo ""
print_status "🎉 Frontend build and packaging completed!"
print_warning "📋 Next steps:"
echo "1. Upload the package to your VPS"
echo "2. Extract and configure Nginx"
echo "3. Test the deployment"
echo "4. Monitor for any issues"
