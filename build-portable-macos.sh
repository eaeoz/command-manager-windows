#!/bin/bash

################################################################################
# Command Manager - macOS Portable Build Script
################################################################################
# This script builds portable versions of Command Manager for macOS
# Supports both Intel (x64) and Apple Silicon (arm64) architectures
################################################################################

echo "======================================"
echo "Command Manager - macOS Portable Build"
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

echo -e "${BLUE}Building macOS portable application...${NC}"
echo ""

# Build for macOS (both Intel and Apple Silicon)
npm run build-macos

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
        ls -lh dist/*.zip dist/*.dmg 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
    fi
    
    echo ""
    echo -e "${BLUE}macOS Portable Builds:${NC}"
    echo "  • ZIP files - Extract and run Command Manager.app"
    echo "  • DMG files - Mount and drag to Applications folder"
    echo ""
    echo -e "${BLUE}Architectures:${NC}"
    echo "  • x64 - For Intel Macs"
    echo "  • arm64 - For Apple Silicon (M1/M2/M3) Macs"
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
