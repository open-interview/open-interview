#!/bin/bash

# Script to replace npm with pnpm in documentation files
# This ensures consistency across the entire project

echo "🔄 Replacing npm with pnpm in documentation..."

# Find all markdown files and replace npm run with pnpm run
find docs -name "*.md" -type f -exec sed -i.bak 's/npm run /pnpm run /g' {} \;
find . -maxdepth 1 -name "*.md" -type f -exec sed -i.bak 's/npm run /pnpm run /g' {} \;

# Replace npm install with pnpm install
find docs -name "*.md" -type f -exec sed -i.bak 's/npm install/pnpm install/g' {} \;
find . -maxdepth 1 -name "*.md" -type f -exec sed -i.bak 's/npm install/pnpm install/g' {} \;

# Replace npm ci with pnpm install --frozen-lockfile
find docs -name "*.md" -type f -exec sed -i.bak 's/npm ci/pnpm install --frozen-lockfile/g' {} \;
find . -maxdepth 1 -name "*.md" -type f -exec sed -i.bak 's/npm ci/pnpm install --frozen-lockfile/g' {} \;

# Clean up backup files
find docs -name "*.bak" -type f -delete
find . -maxdepth 1 -name "*.bak" -type f -delete

echo "✅ Done! All npm references replaced with pnpm"
echo ""
echo "📊 Summary:"
echo "  - Replaced 'npm run' with 'pnpm run'"
echo "  - Replaced 'npm install' with 'pnpm install'"
echo "  - Replaced 'npm ci' with 'pnpm install --frozen-lockfile'"
