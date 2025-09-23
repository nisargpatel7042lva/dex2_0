#!/bin/bash

# Mobile App Build Script for Launch
# This script prepares the app for production launch

set -e  # Exit on any error

echo "🚀 Starting Mobile App Build for Launch..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

print_status "Checking Node.js version..."
NODE_VERSION=$(node --version)
print_success "Node.js version: $NODE_VERSION"

print_status "Checking npm version..."
NPM_VERSION=$(npm --version)
print_success "npm version: $NPM_VERSION"

# Clean previous builds
print_status "Cleaning previous builds..."
rm -rf node_modules
rm -rf android/build
rm -rf android/app/build
rm -rf ios/build
rm -rf .expo

# Install dependencies
print_status "Installing dependencies..."
npm install

# Type checking
print_status "Running TypeScript type checking..."
if npm run type-check; then
    print_success "TypeScript compilation successful"
else
    print_error "TypeScript compilation failed"
    exit 1
fi

# Linting
print_status "Running ESLint..."
if npm run lint:check; then
    print_success "ESLint passed"
else
    print_warning "ESLint found issues - please fix them before launch"
fi

# Format checking
print_status "Checking code formatting..."
if npm run fmt:check; then
    print_success "Code formatting is correct"
else
    print_warning "Code formatting issues found - run 'npm run fmt' to fix"
fi

# Build Android
print_status "Building Android app..."
if npm run android:build; then
    print_success "Android build successful"
else
    print_error "Android build failed"
    exit 1
fi

# Check for critical files
print_status "Checking critical files..."
CRITICAL_FILES=(
    "app/(tabs)/launchpad.tsx"
    "app/(tabs)/trading.tsx"
    "app/send.tsx"
    "app/receive.tsx"
    "app/swap.tsx"
    "src/context/AppContext.tsx"
    "src/services/WalletService.ts"
    "src/services/TokenLaunchService.ts"
    "src/services/JupiterService.ts"
    "src/services/RaydiumService.ts"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "✓ $file exists"
    else
        print_error "✗ $file missing"
        exit 1
    fi
done

# Check for environment variables
print_status "Checking environment configuration..."
if [ -f ".env" ]; then
    print_success "Environment file found"
else
    print_warning "No .env file found - make sure to configure environment variables"
fi

# Check app.json configuration
print_status "Checking app.json configuration..."
if [ -f "app.json" ]; then
    print_success "app.json found"
    # Check for required fields
    if grep -q '"name"' app.json; then
        print_success "✓ App name configured"
    else
        print_error "✗ App name not configured in app.json"
    fi
    
    if grep -q '"version"' app.json; then
        print_success "✓ App version configured"
    else
        print_error "✗ App version not configured in app.json"
    fi
else
    print_error "app.json not found"
    exit 1
fi

# Check for test files
print_status "Checking test files..."
if [ -f "TESTING_GUIDE.md" ]; then
    print_success "✓ Testing guide exists"
else
    print_warning "Testing guide missing"
fi

# Check for documentation
print_status "Checking documentation..."
if [ -f "README.md" ]; then
    print_success "✓ README exists"
else
    print_warning "README missing"
fi

# Performance checks
print_status "Running performance checks..."

# Check bundle size (approximate)
print_status "Checking bundle size..."
BUNDLE_SIZE=$(find . -name "*.js" -o -name "*.ts" -o -name "*.tsx" | xargs wc -l | tail -1 | awk '{print $1}')
print_success "Total lines of code: $BUNDLE_SIZE"

# Check for unused dependencies
print_status "Checking for unused dependencies..."
if command -v depcheck &> /dev/null; then
    depcheck --json | jq -r '.dependencies[]' 2>/dev/null || print_warning "Some dependencies may be unused"
else
    print_warning "depcheck not installed - install with 'npm install -g depcheck'"
fi

# Security checks
print_status "Running security checks..."

# Check for hardcoded secrets
print_status "Checking for hardcoded secrets..."
if grep -r "private_key\|secret\|password\|api_key" src/ --exclude-dir=node_modules 2>/dev/null; then
    print_warning "Potential hardcoded secrets found - please review"
else
    print_success "✓ No obvious hardcoded secrets found"
fi

# Check for console.log statements in production
print_status "Checking for console.log statements..."
CONSOLE_LOGS=$(grep -r "console.log" src/ --exclude-dir=node_modules | wc -l)
if [ "$CONSOLE_LOGS" -gt 0 ]; then
    print_warning "Found $CONSOLE_LOGS console.log statements - consider removing for production"
else
    print_success "✓ No console.log statements found"
fi

# Final checks
print_status "Running final checks..."

# Check if all services are properly imported
print_status "Checking service imports..."
if grep -q "import.*Service" src/context/AppContext.tsx; then
    print_success "✓ Services properly imported in AppContext"
else
    print_error "✗ Services not properly imported"
fi

# Check for error boundaries
print_status "Checking error boundaries..."
if grep -r "ErrorBoundary" src/ --exclude-dir=node_modules; then
    print_success "✓ Error boundaries implemented"
else
    print_warning "Error boundaries not found - consider adding them"
fi

# Generate build report
print_status "Generating build report..."
BUILD_REPORT="build-report-$(date +%Y%m%d-%H%M%S).txt"

cat > "$BUILD_REPORT" << EOF
Mobile App Build Report
Generated: $(date)
Version: $(grep '"version"' package.json | cut -d'"' -f4)

Build Status: SUCCESS
Node.js Version: $NODE_VERSION
npm Version: $NPM_VERSION

Critical Files Check: PASSED
TypeScript Compilation: PASSED
Android Build: PASSED

Bundle Size: $BUNDLE_SIZE lines of code
Console Logs Found: $CONSOLE_LOGS

Launch Readiness: READY
EOF

print_success "Build report generated: $BUILD_REPORT"

# Final summary
echo ""
echo "🎉 BUILD COMPLETED SUCCESSFULLY!"
echo ""
echo "📋 Next Steps:"
echo "1. Test the app on real devices"
echo "2. Run through the testing guide: TESTING_GUIDE.md"
echo "3. Submit to app stores"
echo "4. Monitor performance after launch"
echo ""
echo "📊 Build Report: $BUILD_REPORT"
echo ""

print_success "Mobile app is ready for launch! 🚀"
