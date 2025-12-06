@echo off
REM ################################################################################
REM Command Manager - Build All Platforms (Windows, macOS, Linux)
REM ################################################################################
REM This script builds portable versions for all supported platforms
REM Run this on Windows to create cross-platform builds
REM ################################################################################

echo ======================================
echo Command Manager - Build All Platforms
echo ======================================
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: npm is not installed
    echo Please install Node.js and npm first
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to install dependencies
        pause
        exit /b 1
    )
)

echo Building portable applications for all platforms...
echo.
echo This will create:
echo   - Windows: Command-Manager-Portable.exe
echo   - macOS: .zip and .dmg files (Intel + Apple Silicon)
echo   - Linux: .AppImage and .tar.gz files
echo.

REM Build for all platforms
call npm run build-all-portable

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ======================================
    echo Build completed successfully!
    echo ======================================
    echo.
    echo Output files are in the 'dist' folder:
    echo.
    
    if exist "dist\" (
        dir /B dist\*.exe dist\*.zip dist\*.dmg dist\*.AppImage dist\*.tar.gz 2>nul
    )
    
    echo.
    echo Platform-specific builds:
    echo.
    echo [Windows]
    echo   - Command-Manager-Portable.exe
    echo.
    echo [macOS]
    echo   - .zip files (extract and run)
    echo   - .dmg files (mount and drag to Applications)
    echo   - Both Intel (x64) and Apple Silicon (arm64)
    echo.
    echo [Linux]
    echo   - .AppImage (portable, make executable and run)
    echo   - .tar.gz (extract and run)
    echo.
) else (
    echo.
    echo ======================================
    echo Build failed!
    echo ======================================
    echo.
    echo Please check the error messages above
)

echo.
pause
