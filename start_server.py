#!/usr/bin/env python3
"""
Quick start script for VClub Auto-Login Server
This script handles common setup issues and provides a user-friendly interface
"""

import os
import sys
import subprocess
import time

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 7):
        print("❌ Python 3.7+ is required. Current version:", sys.version)
        return False
    print("✅ Python version:", sys.version.split()[0])
    return True

def check_dependencies():
    """Check if required packages are installed"""
    try:
        import flask
        import flask_cors
        import requests
        print("✅ All required packages are installed")
        return True
    except ImportError as e:
        print(f"❌ Missing package: {e}")
        print("Installing requirements...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
            print("✅ Requirements installed successfully")
            return True
        except subprocess.CalledProcessError:
            print("❌ Failed to install requirements")
            return False

def create_directories():
    """Create necessary directories"""
    dirs = ["hit", "logs"]
    for dir_name in dirs:
        if not os.path.exists(dir_name):
            os.makedirs(dir_name)
            print(f"📁 Created directory: {dir_name}")
        else:
            print(f"📁 Directory exists: {dir_name}")

def get_accounts_file():
    """Get accounts file from user"""
    while True:
        filename = input("\n📁 Enter your accounts file name (e.g., accounts.txt): ").strip()
        
        if not filename:
            print("❌ Please enter a filename")
            continue
            
        # Add .txt extension if not provided
        if not filename.endswith('.txt'):
            filename += '.txt'
            
        if os.path.exists(filename):
            print(f"✅ Found accounts file: {filename}")
            return filename
        else:
            print(f"❌ File not found: {filename}")
            retry = input("Try again? (y/n): ").lower()
            if retry != 'y':
                print("Exiting...")
                sys.exit(1)

def main():
    """Main function"""
    print("🚀 VClub Auto-Login Server - Quick Start")
    print("=" * 50)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Create directories
    create_directories()
    
    # Get accounts file
    accounts_file = get_accounts_file()
    
    print("\n✅ All checks passed!")
    print(f"📋 Accounts file: {accounts_file}")
    print("🌐 Server will start on: http://localhost:5050")
    print("\n🚀 Starting server...")
    print("Press Ctrl+C to stop the server")
    print("-" * 50)
    
    # Start the main server
    try:
        # Set environment variable for accounts file
        os.environ['ACCOUNTS_FILE'] = accounts_file
        
        # Import and run the server
        from vclub_server import app
        app.run(host="0.0.0.0", port=5050, debug=False)
        
    except KeyboardInterrupt:
        print("\n\n🛑 Server stopped by user")
    except Exception as e:
        print(f"\n❌ Error starting server: {e}")
        print("Please check the error message above and try again")

if __name__ == "__main__":
    main()