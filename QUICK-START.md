# Command Manager - Quick Start Guide

## 🚀 Build Your Desktop App in 3 Steps

### Step 1: Install Dependencies
Open a terminal in the project directory and run:
```bash
npm install
```
This will install electron-builder and all required dependencies.

### Step 2: Choose Your Build Type

#### Option A: Portable Executable (Easiest)
Double-click `build-portable.bat`

**OR** run in terminal:
```bash
npm run build-win
```

**Result:** `dist/Command-Manager-Portable.exe`
- ✅ Single executable file
- ✅ No installation needed
- ✅ Run from anywhere
- ✅ Perfect for sharing

#### Option B: Installer Package
Double-click `build-installer.bat`

**OR** run in terminal:
```bash
npm run build-installer
```

**Result:** `dist/Command-Manager-Setup.exe`
- ✅ Professional installer
- ✅ Desktop shortcuts
- ✅ Start menu entry
- ✅ Uninstaller included

### Step 3: Run Your App
Navigate to the `dist` folder and run your executable!

---

## 📋 What You Get

After building, your `dist` folder will contain:

```
dist/
├── Command-Manager-Portable.exe    (150-250MB)
└── win-unpacked/                   (development folder)
```

## ⚡ Quick Commands

| Command | What It Does |
|---------|--------------|
| `npm run start` | Run app in development mode |
| `npm run build-win` | Build portable .exe |
| `npm run build-installer` | Build installer |
| `npm run build-all` | Build for Windows, Mac & Linux |

## 🔧 Common Issues

### "electron-builder not found"
Run: `npm install`

### Windows SmartScreen Warning
Click "More info" → "Run anyway" (normal for unsigned apps)

### Build is slow
First build downloads dependencies (~2-3 minutes). Subsequent builds are faster.

### Antivirus blocking
Add an exception or temporarily disable antivirus during build.

## 📦 File Sizes

- **Portable .exe**: ~150-250 MB (includes Chromium + Node.js)
- **Installer**: ~150-250 MB
- This is normal for Electron apps!

## 🎯 Next Steps

1. ✅ Build your app
2. ✅ Test the executable
3. ✅ Share with others
4. 📖 Read `BUILD-GUIDE.md` for advanced options

---

## 💡 Tips

- **First Build**: Takes 2-3 minutes (downloads Electron binaries)
- **Later Builds**: Take 30-60 seconds (uses cache)
- **Icon**: Replace `favicon.ico` to customize app icon
- **App Name**: Change in `package.json` → `"productName"`

## 🆘 Need Help?

- Check `BUILD-GUIDE.md` for detailed documentation
- Verify `favicon.ico` exists in root directory
- Ensure Node.js version 16+ is installed
- Try: `rmdir /s /q node_modules && npm install`

---

**Ready to build? Just double-click `build-portable.bat`! 🎉**
