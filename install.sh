#!/bin/bash

echo "=== VClub Auto-Login System Setup ==="
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.7+ first."
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip3 first."
    exit 1
fi

echo "✅ pip3 found: $(pip3 --version)"

# Create virtual environment
echo ""
echo "📦 Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install requirements
echo "📥 Installing Python dependencies..."
pip install -r requirements.txt

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p hit
mkdir -p logs

# Make the server script executable
chmod +x vclub_server.py

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Create your accounts.txt file with username:password format"
echo "2. Start the server: source venv/bin/activate && python vclub_server.py"
echo "3. Install the Chrome extension from the extension folder"
echo "4. Make sure XEvil is running on http://127.0.0.1:80"
echo ""
echo "📖 For detailed instructions, see README.md"
echo ""
echo "🚀 Happy account checking!"