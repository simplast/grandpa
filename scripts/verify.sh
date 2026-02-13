#!/bin/bash

# Grandpa CLI Template Verification Script
# This script verifies the project setup

set -e

echo "🔍 Verifying Grandpa CLI Template..."

# Check if all required files exist
echo "📁 Checking file structure..."

required_files=(
  "package.json"
  "tsconfig.json"
  "turbo.json"
  "bunfig.toml"
  "eslint.config.js"
  "README.md"
  "QUICK_START.md"
  "PROJECT_SUMMARY.md"
  "apps/cli/package.json"
  "apps/cli/src/index.ts"
  "apps/cli/src/commands/init.ts"
  "apps/cli/src/commands/version.ts"
  "apps/cli/src/commands/config.ts"
  "packages/core/package.json"
  "packages/core/src/index.ts"
  "packages/core/src/runner.ts"
  "packages/core/src/logger.ts"
  "packages/core/src/spinner.ts"
  "packages/core/src/types.ts"
  "packages/config/package.json"
  "packages/config/src/index.ts"
  "packages/config/src/manager.ts"
  "packages/config/src/schema.ts"
  "scripts/setup.sh"
)

missing_files=()
for file in "${required_files[@]}"; do
  if [ ! -f "$file" ]; then
    missing_files+=("$file")
  fi
done

if [ ${#missing_files[@]} -ne 0 ]; then
  echo "❌ Missing files:"
  for file in "${missing_files[@]}"; do
    echo "  - $file"
  done
  exit 1
fi

echo "✅ All required files present"

# Check for opencode references in code (should be replaced with grandpa)
echo "🔍 Checking for opencode references..."

opencode_refs=$(grep -r "opencode" apps/ packages/ --include="*.ts" --include="*.json" 2>/dev/null | grep -v "github.com/anomalyco/opencode" || true)

if [ -n "$opencode_refs" ]; then
  echo "❌ Found opencode references in code:"
  echo "$opencode_refs"
  exit 1
fi

echo "✅ No opencode references in code"

# Check package names
echo "🔍 Checking package names..."

if ! grep -q '"@grandpa/cli"' apps/cli/package.json; then
  echo "❌ CLI package name should be @grandpa/cli"
  exit 1
fi

if ! grep -q '"@grandpa/core"' packages/core/package.json; then
  echo "❌ Core package name should be @grandpa/core"
  exit 1
fi

if ! grep -q '"@grandpa/config"' packages/config/package.json; then
  echo "❌ Config package name should be @grandpa/config"
  exit 1
fi

echo "✅ Package names are correct"

# Check CLI binary name
echo "🔍 Checking CLI binary name..."

if ! grep -q '"grandpa":' apps/cli/package.json; then
  echo "❌ CLI binary should be named 'grandpa'"
  exit 1
fi

echo "✅ CLI binary name is correct"

# Check imports in TypeScript files
echo "🔍 Checking TypeScript imports..."

if ! grep -q '@grandpa/core' apps/cli/src/index.ts; then
  echo "❌ Missing @grandpa/core import in index.ts"
  exit 1
fi

if ! grep -q '@grandpa/config' apps/cli/src/index.ts; then
  echo "❌ Missing @grandpa/config import in index.ts"
  exit 1
fi

echo "✅ TypeScript imports are correct"

# Check configuration storage path
echo "🔍 Checking configuration storage path..."

if ! grep -q 'grandpa-cli' packages/config/src/manager.ts; then
  echo "❌ Configuration storage path should use 'grandpa-cli'"
  exit 1
fi

echo "✅ Configuration storage path is correct"

echo ""
echo "🎉 All verifications passed!"
echo ""
echo "📋 Project Summary:"
echo "   - Project name: grandpa-cli-template"
echo "   - CLI binary: grandpa"
echo "   - Packages: @grandpa/cli, @grandpa/core, @grandpa/config"
echo ""
echo "🚀 Next steps:"
echo "   1. Run: ./scripts/setup.sh"
echo "   2. Test: bun run cli --help"
echo "   3. Read: QUICK_START.md"
echo ""
echo "✅ Grandpa CLI Template is ready to use!"