#!/bin/bash

################################################################################
# Command Manager - Build All Platforms (Windows, macOS, Linux)
################################################################################
# This script builds portable versions for all supported platforms
# Run this on macOS or Linux to create cross-platform builds
################################################################################

echo "======================================"
echo "Command Manager - Build All Platforms"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed${NC}"
    echo "Please install Node.js and npm first"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}Installing dependencies...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to install dependencies${NC}"
        exit 1
    fi
fi

echo -e "${BLUE}Building portable applications for all platforms...${NC}"
echo ""
echo "This will create:"
echo "  • Windows: Command-Manager-Portable.exe"
echo "  • macOS: .zip and .dmg files (Intel + Apple Silicon)"
echo "  • Linux: .AppImage and .tar.gz files"
echo ""

# Detect current platform
OS_TYPE=$(uname -s)
if [[ "$OS_TYPE" == "Darwin" ]]; then
    echo -e "${YELLOW}Note: Building on macOS - Windows builds will not be signed${NC}"
elif [[ "$OS_TYPE" == "Linux" ]]; then
    echo -e "${YELLOW}Note: Building on Linux - macOS and Windows builds may have limitations${NC}"
fi
echo ""

# Build for all platforms
npm run build-all-portable

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}======================================"
    echo "Build completed successfully!"
    echo "======================================${NC}"
    echo ""
    echo "Output files are in the 'dist' folder:"
    echo ""
    
    # List the created files
    if [ -d "dist" ]; then
        echo -e "${BLUE}Windows:${NC}"
        ls -lh dist/*.exe 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
        
        echo ""
        echo -e "${BLUE}macOS:${NC}"
        ls -lh dist/*.zip dist/*.dmg 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
        
        echo ""
        echo -e "${BLUE}Linux:${NC}"
        ls -lh dist/*.AppImage dist/*.tar.gz 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
    fi
    
    echo ""
    echo -e "${BLUE}Platform-specific usage:${NC}"
    echo ""
    echo -e "${GREEN}[Windows]${NC}"
    echo "  • Command-Manager-Portable.exe - Double-click to run"
    echo ""
    echo -e "${GREEN}[macOS]${NC}"
    echo "  • .zip files - Extract and run Command Manager.app"
    echo "  • .dmg files - Mount and drag to Applications folder"
    echo "  • Architectures: Intel (x64) and Apple Silicon (arm64)"
    echo ""
    echo -e "${GREEN}[Linux]${NC}"
    echo "  • .AppImage - Make executable and run:"
    echo "    chmod +x Command-Manager-*.AppImage"
    echo "    ./Command-Manager-*.AppImage"
    echo "  • .tar.gz - Extract and run:"
    echo "    tar -xzf Command-Manager-*.tar.gz"
    echo "    ./command-manager"
    echo ""
else
    echo ""
    echo -e "${RED}======================================"
    echo "Build failed!"
    echo "======================================${NC}"
    echo ""
    echo "Please check the error messages above"
    exit 1
fi
