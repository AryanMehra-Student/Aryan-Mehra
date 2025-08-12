@echo off
echo === VClub Auto-Login System Setup ===
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.7+ first.
    echo Download from: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo ✅ Python found: 
python --version

REM Check if pip is installed
pip --version >nul 2>&1
if errorlevel 1 (
    echo ❌ pip is not installed. Please install pip first.
    pause
    exit /b 1
)

echo ✅ pip found:
pip --version

REM Create virtual environment
echo.
echo 📦 Creating virtual environment...
python -m venv venv

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install requirements
echo 📥 Installing Python dependencies...
pip install -r requirements.txt

REM Create necessary directories
echo 📁 Creating necessary directories...
if not exist "hit" mkdir hit
if not exist "logs" mkdir logs

echo.
echo ✅ Setup completed successfully!
echo.
echo 📋 Next steps:
echo 1. Create your accounts.txt file with username:password format
echo 2. Start the server: venv\Scripts\activate.bat ^&^& python vclub_server.py
echo 3. Install the Chrome extension from the extension folder
echo 4. Make sure XEvil is running on http://127.0.0.1:80
echo.
echo 📖 For detailed instructions, see README.md
echo.
echo 🚀 Happy account checking!
pause