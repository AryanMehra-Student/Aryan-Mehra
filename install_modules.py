#!/usr/bin/env python3
"""
UltimateShop Checker - Auto Module Installer
This script automatically installs all required Python modules.
"""

import subprocess
import sys
import os

def install_module(module_name):
    """Install a Python module using pip"""
    try:
        print(f"📦 Installing {module_name}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", module_name])
        print(f"✅ {module_name} installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install {module_name}: {e}")
        return False
    except Exception as e:
        print(f"❌ Error installing {module_name}: {e}")
        return False

def main():
    """Main installation function"""
    print("🚀 UltimateShop Checker - Module Installer")
    print("=" * 50)
    
    # List of required modules
    required_modules = [
        "Flask==2.3.3",
        "Flask-CORS==4.0.0", 
        "requests==2.31.0",
        "colorama==0.4.6"
    ]
    
    print("📋 Required modules:")
    for module in required_modules:
        print(f"   • {module}")
    
    print("\n🔧 Starting installation...")
    print("-" * 50)
    
    # Install each module
    success_count = 0
    total_modules = len(required_modules)
    
    for module in required_modules:
        if install_module(module):
            success_count += 1
        print()
    
    # Installation summary
    print("=" * 50)
    print("📊 Installation Summary:")
    print(f"   ✅ Successfully installed: {success_count}/{total_modules}")
    
    if success_count == total_modules:
        print("🎉 All modules installed successfully!")
        print("🚀 You can now run: python final_ultimateshop_checker.py")
    else:
        print("⚠️  Some modules failed to install.")
        print("🔧 Please check the error messages above and try again.")
        print("💡 You can also install manually using: pip install -r requirements.txt")
    
    print("\n📚 For manual installation, run:")
    print("   pip install -r requirements.txt")

if __name__ == "__main__":
    main()