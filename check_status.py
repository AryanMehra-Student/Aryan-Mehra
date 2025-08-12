#!/usr/bin/env python3
"""
Simple status checker for the Flask server
"""

import requests
import json
import time
from colorama import init, Fore, Style

# Initialize colorama
init(autoreset=True)

def check_server_status():
    try:
        response = requests.get('http://localhost:5050/status', timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"{Fore.GREEN}✅ Server Status: {data['status']}")
            print(f"{Fore.CYAN}📊 Accounts Remaining: {data['accounts_remaining']}")
            print(f"{Fore.YELLOW}🕐 Server Time: {data['server_time']}")
        else:
            print(f"{Fore.RED}❌ Server Error: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print(f"{Fore.RED}❌ Server not running on localhost:5050")
    except Exception as e:
        print(f"{Fore.RED}❌ Error: {e}")

def main():
    print(f"{Fore.CYAN}🔍 Checking Flask Server Status...")
    print(f"{Fore.CYAN}{'═' * 50}")
    
    while True:
        check_server_status()
        print(f"{Fore.CYAN}{'═' * 50}")
        
        try:
            time.sleep(10)  # Check every 10 seconds
        except KeyboardInterrupt:
            print(f"\n{Fore.YELLOW}👋 Status checker stopped")
            break

if __name__ == "__main__":
    main()