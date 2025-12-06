@echo off
echo =====================================
echo Building Command Manager
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

echo [3/4] Building portable executable...
call npm run build-win
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
if exist "dist\Command-Manager-Portable.exe" (
    echo.
    echo =====================================
    echo SUCCESS! Build completed!
    echo =====================================
    echo.
    echo Your portable app is ready at:
    echo %CD%\dist\Command-Manager-Portable.exe
    echo.
    echo File size:
    dir "dist\Command-Manager-Portable.exe" | find "Command-Manager-Portable.exe"
    echo.
    echo You can now:
    echo - Run the .exe file directly
    echo - Copy it anywhere you want
    echo - Share it with others
    echo - No installation required!
    echo.
    pause
) else (
    echo.
    echo =====================================
    echo BUILD FAILED!
    echo =====================================
    echo.
    echo The executable was not created.
    echo Please check the error messages above.
    echo.
    pause
    exit /b 1
)
