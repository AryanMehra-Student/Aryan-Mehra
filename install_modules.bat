@echo off
title UltimateShop Checker - Module Installer
color 0A

echo.
echo ================================================
echo    UltimateShop Checker - Module Installer
echo ================================================
echo.
echo Installing required Python modules...
echo.

echo 📦 Installing Flask...
python -m pip install Flask==2.3.3
if %errorlevel% neq 0 (
    echo ❌ Failed to install Flask
    pause
    exit /b 1
)
echo ✅ Flask installed successfully!

echo.
echo 📦 Installing Flask-CORS...
python -m pip install Flask-CORS==4.0.0
if %errorlevel% neq 0 (
    echo ❌ Failed to install Flask-CORS
    pause
    exit /b 1
)
echo ✅ Flask-CORS installed successfully!

echo.
echo 📦 Installing requests...
python -m pip install requests==2.31.0
if %errorlevel% neq 0 (
    echo ❌ Failed to install requests
    pause
    exit /b 1
)
echo ✅ requests installed successfully!

echo.
echo 📦 Installing colorama...
python -m pip install colorama==0.4.6
if %errorlevel% neq 0 (
    echo ❌ Failed to install colorama
    pause
    exit /b 1
)
echo ✅ colorama installed successfully!

echo.
echo ================================================
echo 🎉 All modules installed successfully!
echo ================================================
echo.
echo 🚀 You can now run: python final_ultimateshop_checker.py
echo.
echo 💡 Alternative: pip install -r requirements.txt
echo.
pause