# Command Manager - Build Guide

## Overview
This guide will help you build a single executable file for the Command Manager desktop application using Electron Builder.

## Prerequisites

1. **Node.js and npm** - Make sure you have Node.js installed (version 16 or higher recommended)
2. **Windows OS** - These build scripts are designed for Windows

## Quick Start

### Option 1: Portable Executable (Recommended)
This creates a single `.exe` file that can run without installation.

1. Double-click `build-portable.bat`
2. Wait for the build process to complete
3. Find your executable at: `dist/Command-Manager-Portable.exe`

**Advantages:**
- No installation required
- Can be run from any location
- Easy to share and distribute
- Perfect for USB drives or portable use

### Option 2: Installer Package
This creates an installer that users can use to install the application.

1. Double-click `build-installer.bat`
2. Wait for the build process to complete
3. Find your installer at: `dist/Command-Manager-Setup.exe`

**Advantages:**
- Professional installation experience
- Creates desktop and start menu shortcuts
- User can choose installation directory
- Proper uninstaller included

## Build Process Details

### What Happens During Build:

1. **Dependencies Installation** - All required npm packages are installed
2. **Clean Previous Builds** - Old build artifacts are removed
3. **Application Packaging** - Electron Builder packages your app with Node.js runtime
4. **Executable Creation** - Single executable file is created

### Build Scripts Available:

```bash
npm run start              # Run the app in development mode
npm run build              # Build for current platform (default)
npm run build-win          # Build portable Windows executable
npm run build-installer    # Build Windows installer (NSIS)
npm run build-all          # Build for Windows, Mac, and Linux
```

## Manual Build Commands

If you prefer to use the command line:

### For Portable Executable:
```bash
npm install
npm run build-win
```

### For Installer:
```bash
npm install
npm run build-installer
```

### For All Platforms:
```bash
npm install
npm run build-all
```

## Build Configuration

The build configuration is defined in `package.json` under the `"build"` section:

- **appId**: `com.commandmanager.app`
- **productName**: `Command Manager`
- **Output Directory**: `dist/`
- **Icon**: `favicon.ico`

### Included Files:
- Application code (app.js)
- Configuration files (config/)
- Static assets (data/, public/)
- Server files (server/)
- Views (views/)
- All Node.js dependencies

## Troubleshooting

### Build Fails with "electron-builder not found"
**Solution:** Run `npm install` to install all dependencies

### Icon Not Showing on Executable
**Solution:** Ensure `favicon.ico` exists in the root directory. ICO format is required for Windows.

### Executable Too Large
**Solution:** This is normal. Electron apps bundle the Chromium engine and Node.js runtime. Typical size: 150-250MB.

### "EPERM: operation not permitted" Error
**Solution:** 
- Close any running instances of the app
- Close antivirus software temporarily
- Run the build script as administrator

### Antivirus Flags the Executable
**Solution:** This is common with unsigned executables. You can:
- Add an exception in your antivirus
- Code sign the executable (requires a certificate)
- Use SmartScreen override when running

## Distribution

### Portable Executable:
- Share the single `.exe` file
- No installation required by users
- Users can run directly by double-clicking

### Installer:
- Share the `-Setup.exe` file
- Users run it to install the application
- Creates shortcuts and uninstaller automatically

## Code Signing (Optional)

For production distribution, consider code signing your executable:

1. Obtain a code signing certificate
2. Update `package.json` build config:
   ```json
   "win": {
     "certificateFile": "path/to/certificate.pfx",
     "certificatePassword": "password"
   }
   ```

## Advanced Configuration

### Changing App Name:
Edit `package.json`:
```json
"build": {
  "productName": "Your App Name"
}
```

### Changing Output Names:
Edit `package.json`:
```json
"portable": {
  "artifactName": "YourApp-Portable.exe"
},
"nsis": {
  "artifactName": "YourApp-Setup.exe"
}
```

### Custom Icon:
1. Replace `favicon.ico` with your icon (must be ICO format)
2. For best results, use a 256x256 or 512x512 icon

## File Structure After Build

```
dist/
├── Command-Manager-Portable.exe    # Portable executable
├── Command-Manager-Setup.exe       # Installer (if built)
└── win-unpacked/                   # Unpacked files (for debugging)
    ├── Command Manager.exe
    ├── resources/
    └── ...
```

## Performance Tips

1. **First Build Takes Longer** - Electron Builder downloads necessary files
2. **Subsequent Builds Are Faster** - Cached files are reused
3. **Clean Builds** - Delete `dist/` folder for a fresh build
4. **Parallel Builds** - Don't run multiple builds simultaneously

## Support

If you encounter issues:
1. Check the error messages in the console
2. Ensure all dependencies are installed: `npm install`
3. Try cleaning node_modules: `rmdir /s /q node_modules && npm install`
4. Check Electron Builder documentation: https://www.electron.build/

## Next Steps

After building:
1. Test the executable on a clean Windows machine
2. Create a release on GitHub with your builds
3. Consider setting up automatic builds with GitHub Actions
4. Add auto-update functionality (optional)

---

**Note:** The first time you run the built executable, Windows SmartScreen might show a warning. This is normal for unsigned applications. Click "More info" and "Run anyway" to proceed.
