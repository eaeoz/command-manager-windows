@echo off
echo =====================================
echo Building Command Manager Installer
echo =====================================
echo.

cd /d "%~dp0"

echo [1/4] Installing dependencies...
call npm install
if errorlevel 1 (
    echo.
    echo =====================================
    echo ERROR: Failed to install dependencies
    echo =====================================
    echo.
    pause
    exit /b 1
)
echo.

echo [2/4] Cleaning old build...
if exist "dist" (
    rmdir /s /q "dist"
    echo Old build cleaned!
) else (
    echo No previous build found.
)
echo.

echo [3/4] Building installer...
call npm run build-installer
if errorlevel 1 (
    echo.
    echo =====================================
    echo BUILD FAILED!
    echo =====================================
    echo.
    echo Please check the error messages above.
    echo.
    pause
    exit /b 1
)
echo.

echo [4/4] Checking output...
if exist "dist\Command-Manager-Setup.exe" (
    echo.
    echo =====================================
    echo SUCCESS! Build completed!
    echo =====================================
    echo.
    echo Your installer is ready at:
    echo %CD%\dist\Command-Manager-Setup.exe
    echo.
    echo File size:
    dir "dist\Command-Manager-Setup.exe" | find "Command-Manager-Setup.exe"
    echo.
    echo You can now:
    echo - Run the installer to install the app
    echo - Share the installer with others
    echo - Users can choose installation directory
    echo - Creates desktop and start menu shortcuts
    echo.
    pause
) else (
    echo.
    echo =====================================
    echo BUILD FAILED!
    echo =====================================
    echo.
    echo The installer was not created.
    echo Please check the error messages above.
    echo.
    pause
    exit /b 1
)
