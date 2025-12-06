# Cross-Platform Build Guide

This guide explains how to build Command Manager portable applications for Windows, macOS, and Linux.

## 📦 Available Build Scripts

### Windows
- **`build-portable.bat`** - Build Windows portable executable only
- **`build-installer.bat`** - Build Windows installer (NSIS)
- **`build-all-platforms.bat`** - Build for all platforms (Windows, macOS, Linux)

### macOS / Linux
- **`build-portable-macos.sh`** - Build macOS portable applications
- **`build-portable-linux.sh`** - Build Linux portable applications
- **`build-all-platforms.sh`** - Build for all platforms

### NPM Scripts
```bash
npm run build-win          # Windows portable
npm run build-macos        # macOS portable (zip + dmg)
npm run build-linux        # Linux portable (AppImage + tar.gz)
npm run build-all-portable # All platforms portable
npm run build-all          # All platforms (all formats)
```

## 🚀 Quick Start

### On Windows
```bash
# Build Windows only
.\build-portable.bat

# Build all platforms
.\build-all-platforms.bat
```

### On macOS
```bash
# Make script executable
chmod +x build-portable-macos.sh build-all-platforms.sh

# Build macOS only
./build-portable-macos.sh

# Build all platforms
./build-all-platforms.sh
```

### On Linux
```bash
# Make script executable
chmod +x build-portable-linux.sh build-all-platforms.sh

# Build Linux only
./build-portable-linux.sh

# Build all platforms
./build-all-platforms.sh
```

## 📁 Output Files

All builds are saved to the `dist/` folder:

### Windows
- **`Command-Manager-Portable.exe`** - Portable executable (no installation needed)
- **`Command-Manager-Setup.exe`** - Installer with desktop shortcuts

### macOS
- **`Command-Manager-1.0.0-mac-x64.zip`** - Portable for Intel Macs
- **`Command-Manager-1.0.0-mac-arm64.zip`** - Portable for Apple Silicon (M1/M2/M3)
- **`Command-Manager-1.0.0-mac-x64.dmg`** - Installer for Intel Macs
- **`Command-Manager-1.0.0-mac-arm64.dmg`** - Installer for Apple Silicon

### Linux
- **`Command-Manager-1.0.0-linux-x64.AppImage`** - Portable executable
- **`Command-Manager-1.0.0-linux-x64.tar.gz`** - Archive format

## 🔧 Build Configuration

### Key Settings (package.json)

```json
{
  "build": {
    "asar": false,  // Important: Keeps files unpacked for proper path resolution
    "win": {
      "target": "portable"
    },
    "mac": {
      "target": ["zip", "dmg"],
      "arch": ["x64", "arm64"]
    },
    "linux": {
      "target": ["AppImage", "tar.gz"]
    }
  }
}
```

## 💻 Platform-Specific Usage

### Windows
1. Download `Command-Manager-Portable.exe`
2. Double-click to run (no installation needed)
3. Or use the installer for desktop shortcuts

### macOS
1. Download the appropriate `.zip` or `.dmg` file:
   - **x64** for Intel Macs
   - **arm64** for Apple Silicon (M1/M2/M3)
2. **ZIP**: Extract and run `Command Manager.app`
3. **DMG**: Mount and drag to Applications folder

**Note**: On first run, you may need to right-click → Open due to Gatekeeper.

### Linux
1. Download the `.AppImage` file
2. Make it executable:
   ```bash
   chmod +x Command-Manager-*.AppImage
   ```
3. Run it:
   ```bash
   ./Command-Manager-*.AppImage
   ```

**Alternative (tar.gz)**:
```bash
tar -xzf Command-Manager-*.tar.gz
cd Command\ Manager-1.0.0/
./command-manager
```

## 🌍 Cross-Platform Building

You can build for other platforms from your current OS:

### From Windows
- ✅ Windows builds (native)
- ✅ macOS builds (unsigned)
- ❌ Linux builds (requires WSL or Docker - see below)

### From macOS
- ✅ Windows builds (unsigned)
- ✅ macOS builds (native)
- ✅ Linux builds (native)

### From Linux
- ✅ Windows builds (unsigned)
- ⚠️ macOS builds (limited, unsigned)
- ✅ Linux builds (native)

**Note**: Cross-platform builds may not be signed. For production, build on the target platform or use CI/CD with proper code signing.

## ⚠️ Building Linux from Windows

Building Linux AppImages on Windows requires additional setup because AppImage tools need a Linux environment:

### Option 1: Use WSL (Windows Subsystem for Linux) - Recommended
1. Install WSL:
   ```powershell
   wsl --install
   ```
2. Open WSL terminal and navigate to your project
3. Install Node.js in WSL:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
4. Run the build:
   ```bash
   npm run build-linux
   ```

### Option 2: Use Docker
1. Install Docker Desktop for Windows
2. Create a build container:
   ```bash
   docker run --rm -v ${PWD}:/project -w /project electronuserland/builder npm run build-linux
   ```

### Option 3: Use GitHub Actions (Easiest)
Create `.github/workflows/build.yml`:
```yaml
name: Build
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run build-linux
      - uses: actions/upload-artifact@v3
        with:
          name: linux-builds
          path: dist/*.AppImage
```

### Option 4: Skip Linux Builds on Windows
If you only need Windows and macOS builds, use:
```bash
npm run build-win
npm run build-macos
```

## 🔐 Code Signing (Optional)

For production releases, you should sign your applications:

### Windows
- Use a code signing certificate
- Configure in `package.json`:
  ```json
  "win": {
    "certificateFile": "path/to/cert.pfx",
    "certificatePassword": "password"
  }
  ```

### macOS
- Use an Apple Developer certificate
- Configure in `package.json`:
  ```json
  "mac": {
    "identity": "Developer ID Application: Your Name (TEAM_ID)"
  }
  ```

### Linux
- AppImages don't require signing
- GPG signatures can be added separately

## 🐛 Troubleshooting

### Build Fails
1. Ensure Node.js and npm are installed
2. Delete `node_modules` and run `npm install`
3. Clear build cache: Delete `dist` folder

### Windows Executable Doesn't Show Window
- Ensure `"asar": false` is in package.json
- Check that all files are properly included in `"files"` array

### macOS "App is damaged" Error
- The app is not signed
- Right-click → Open instead of double-clicking
- Or disable Gatekeeper temporarily (not recommended):
  ```bash
  sudo spctl --master-disable
  ```

### Linux AppImage Won't Run
- Make sure it's executable: `chmod +x *.AppImage`
- Install FUSE: `sudo apt install libfuse2` (Ubuntu/Debian)

## 📊 Build Sizes (Approximate)

- **Windows**: ~150-200 MB (portable exe)
- **macOS**: ~180-220 MB (per architecture)
- **Linux**: ~170-210 MB (AppImage)

**Note**: Sizes include Electron runtime and Node.js modules.

## ⚙️ Advanced Configuration

### Custom Build Output
Edit `package.json`:
```json
"build": {
  "directories": {
    "output": "release"  // Change output folder
  },
  "artifactName": "${productName}-${version}.${ext}"
}
```

### Include Additional Files
```json
"build": {
  "files": [
    "app.js",
    "config/**/*",
    "your-custom-folder/**/*"
  ]
}
```

### Change Compression
```json
"build": {
  "compression": "maximum"  // or "store", "normal"
}
```

## 📚 Resources

- [Electron Builder Documentation](https://www.electron.build/)
- [Electron Documentation](https://www.electronjs.org/docs)
- [Node.js Documentation](https://nodejs.org/docs)

## 🆘 Support

If you encounter issues:
1. Check this guide and troubleshooting section
2. Review build logs for specific error messages
3. Ensure all dependencies are installed
4. Try building with verbose output: `npm run build-win -- --verbose`

---

**Version**: 1.0.0  
**Last Updated**: December 2025
