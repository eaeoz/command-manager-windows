#!/bin/bash

################################################################################
# Command Manager - Linux Portable Build Script
################################################################################
# This script builds portable versions of Command Manager for Linux
# Creates AppImage (portable) and tar.gz (archive) formats
################################################################################

echo "======================================"
echo "Command Manager - Linux Portable Build"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
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

echo -e "${BLUE}Building Linux portable application...${NC}"
echo ""

# Build for Linux
npm run build-linux

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
        ls -lh dist/*.AppImage dist/*.tar.gz 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
    fi
    
    echo ""
    echo -e "${BLUE}Linux Portable Builds:${NC}"
    echo "  • AppImage - Portable executable (no installation needed)"
    echo "    Make executable: chmod +x *.AppImage"
    echo "    Run: ./Command-Manager-*.AppImage"
    echo ""
    echo "  • tar.gz - Archive format"
    echo "    Extract: tar -xzf *.tar.gz"
    echo "    Run: ./command-manager"
    echo ""
    echo -e "${BLUE}Architecture:${NC}"
    echo "  • x64 - For 64-bit Linux systems"
    echo ""
    echo -e "${BLUE}Usage Instructions:${NC}"
    echo "  1. Download the AppImage file"
    echo "  2. Make it executable: chmod +x Command-Manager-*.AppImage"
    echo "  3. Run it: ./Command-Manager-*.AppImage"
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
