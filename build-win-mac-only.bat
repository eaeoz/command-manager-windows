@echo off
REM ################################################################################
REM Command Manager - Build Windows and macOS Only
REM ################################################################################
REM This script builds portable versions for Windows and macOS
REM Skips Linux (which requires WSL/Docker on Windows)
REM ################################################################################

echo ======================================
echo Command Manager - Windows + macOS Build
echo ======================================
echo.
echo Note: Linux builds are skipped (require WSL or Docker on Windows)
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

echo Building portable applications for Windows and macOS...
echo.
echo This will create:
echo   - Windows: Command-Manager-Portable.exe
echo   - macOS: .zip and .dmg files (Intel + Apple Silicon)
echo.

REM Build for Windows and macOS only
call npm run build-win-mac

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ======================================
    echo Build completed successfully!
    echo ======================================
    echo.
    echo Output files are in the 'dist' folder:
    echo.
    
    if exist "dist\" (
        echo Windows builds:
        dir /B dist\*.exe 2>nul
        echo.
        echo macOS builds:
        dir /B dist\*.zip dist\*.dmg 2>nul
    )
    
    echo.
    echo Platform-specific builds:
    echo.
    echo [Windows]
    echo   - Command-Manager-Portable.exe
    echo     ^> Double-click to run
    echo.
    echo [macOS]
    echo   - .zip files (extract and run Command Manager.app)
    echo   - .dmg files (mount and drag to Applications)
    echo   - Both Intel (x64) and Apple Silicon (arm64)
    echo.
    echo ======================================
    echo.
    echo For Linux builds, you need WSL or Docker.
    echo See CROSS-PLATFORM-BUILD-GUIDE.md for details.
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
