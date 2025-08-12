#!/bin/bash

# UltimateShop Checker - Module Installer
# This script automatically installs all required Python modules.

echo "🚀 UltimateShop Checker - Module Installer"
echo "================================================"
echo
echo "Installing required Python modules..."
echo

# Function to install a module
install_module() {
    local module_name=$1
    echo "📦 Installing $module_name..."
    if python3 -m pip install "$module_name"; then
        echo "✅ $module_name installed successfully!"
        return 0
    else
        echo "❌ Failed to install $module_name"
        return 1
    fi
}

# List of required modules
modules=(
    "Flask==2.3.3"
    "Flask-CORS==4.0.0"
    "requests==2.31.0"
    "colorama==0.4.6"
)

# Install each module
success_count=0
total_modules=${#modules[@]}

for module in "${modules[@]}"; do
    if install_module "$module"; then
        ((success_count++))
    fi
    echo
done

# Installation summary
echo "================================================"
echo "📊 Installation Summary:"
echo "   ✅ Successfully installed: $success_count/$total_modules"
echo

if [ $success_count -eq $total_modules ]; then
    echo "🎉 All modules installed successfully!"
    echo "🚀 You can now run: python3 final_ultimateshop_checker.py"
else
    echo "⚠️  Some modules failed to install."
    echo "🔧 Please check the error messages above and try again."
    echo "💡 You can also install manually using: pip3 install -r requirements.txt"
fi

echo
echo "📚 For manual installation, run:"
echo "   pip3 install -r requirements.txt"
echo