#!/bin/bash
# ╔══════════════════════════════════════════════════════════════╗
# ║  Auto Caller Pro - Package Builder                            ║
# ║  Creates distributable ZIP for selling                        ║
# ╚══════════════════════════════════════════════════════════════╝

set -e

VERSION="1.1.0"
PACKAGE_NAME="auto-caller-pro-v${VERSION}"
DIST_DIR="dist"

echo "Building Auto Caller Pro v${VERSION}..."

# Clean
rm -rf ${DIST_DIR}
mkdir -p ${DIST_DIR}/${PACKAGE_NAME}

# Copy files
cp -r src ${DIST_DIR}/${PACKAGE_NAME}/
cp -r public ${DIST_DIR}/${PACKAGE_NAME}/
cp -r chrome-extension ${DIST_DIR}/${PACKAGE_NAME}/
cp package.json ${DIST_DIR}/${PACKAGE_NAME}/
cp next.config.ts ${DIST_DIR}/${PACKAGE_NAME}/
cp tsconfig.json ${DIST_DIR}/${PACKAGE_NAME}/
cp tailwind.config.ts ${DIST_DIR}/${PACKAGE_NAME}/
cp postcss.config.mjs ${DIST_DIR}/${PACKAGE_NAME}/
cp components.json ${DIST_DIR}/${PACKAGE_NAME}/
cp install.sh ${DIST_DIR}/${PACKAGE_NAME}/
cp README.md ${DIST_DIR}/${PACKAGE_NAME}/
cp mcp-server.ts ${DIST_DIR}/${PACKAGE_NAME}/
cp mcp-config.json ${DIST_DIR}/${PACKAGE_NAME}/
cp auto-caller-pro.rb ${DIST_DIR}/${PACKAGE_NAME}/
cp .gitignore ${DIST_DIR}/${PACKAGE_NAME}/

# Make install script executable
chmod +x ${DIST_DIR}/${PACKAGE_NAME}/install.sh

# Create ZIP
cd ${DIST_DIR}
zip -r ${PACKAGE_NAME}.zip ${PACKAGE_NAME}
cd ..

# Get file size
SIZE=$(du -h ${DIST_DIR}/${PACKAGE_NAME}.zip | cut -f1)

echo ""
echo "✅ Package created: ${DIST_DIR}/${PACKAGE_NAME}.zip (${SIZE})"
echo ""
echo "Contents:"
echo "  - Full Next.js app (src/)"
echo "  - Chrome extension (chrome-extension/)"
echo "  - MCP integration (mcp-server.ts)"
echo "  - Install script (install.sh)"
echo "  - Homebrew formula (auto-caller-pro.rb)"
echo "  - Documentation (README.md)"
echo ""
