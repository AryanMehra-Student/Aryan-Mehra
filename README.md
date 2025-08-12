# VClub Auto-Login System

This is a complete account checking system for vclub.one that includes a Chrome extension and a Flask server for automated login and account validation.

## System Components

### 1. Chrome Extension (`extension/` folder)
- **manifest.json**: Extension configuration
- **background.js**: Background service worker for handling messages and tab management
- **content.js**: Content script that runs on vclub.one pages

### 2. Flask Server (`vclub_server.py`)
- Manages account lists
- Handles CAPTCHA solving via XEvil
- Reports different account types (2FA, unactivated, hits)
- Saves results to organized files

## Setup Instructions

### Prerequisites
1. **Python 3.7+** installed
2. **Chrome/Chromium browser**
3. **XEvil CAPTCHA solver** running on `http://127.0.0.1:80`
4. **Account list file** in format: `username:password` (one per line)

### Step 1: Install Python Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Prepare Account List
Create a text file (e.g., `accounts.txt`) with your accounts in this format:
```
username1:password1
username2:password2
username3:password3
```

**Important**: 
- Don't use email addresses as usernames
- Don't use number-only passwords
- Use colon (`:`) as separator

### Step 3: Start the Flask Server
```bash
python vclub_server.py
```
When prompted, enter your account list filename (e.g., `accounts.txt`)

The server will start on `http://localhost:5050`

### Step 4: Install Chrome Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the folder containing your extension files
5. The extension should now appear in your extensions list

## How It Works

### Account Checking Process
1. **Extension detects** when you're on vclub.one
2. **Automatically navigates** to login page
3. **Fetches credentials** from the Flask server
4. **Fills login form** with username/password
5. **Solves CAPTCHA** using XEvil
6. **Submits login** and waits for response
7. **Analyzes result** and reports accordingly

### Account Types Detected
- **Valid Accounts**: Extracts balance, CCS stats, amounts, refunds
- **2FA Accounts**: Requires two-factor authentication
- **Unactivated Accounts**: Not yet activated
- **Invalid Accounts**: Wrong credentials

### Result Files
Results are saved in the `hit/` folder:
- `hit.txt`: Valid accounts with balance and stats
- `2fa-hit.txt`: Accounts requiring 2FA
- `free.txt`: Unactivated accounts

## Features

### Human-like Behavior
- Random delays between actions (1-3 seconds)
- Natural clicking patterns
- Session management

### Automatic Recovery
- Retries with new CAPTCHA on failure
- Handles different error types
- Continues checking after failures

### Smart Navigation
- Detects current page type
- Automatically navigates to login
- Handles dynamic content changes

## Configuration

### XEvil Settings
- **URL**: `http://127.0.0.1:80`
- **Key**: `error` (change this to your actual XEvil key)
- **Timeout**: 10 seconds for submission, 5 seconds for results

### Server Settings
- **Port**: 5050
- **Host**: 0.0.0.0 (accessible from any IP)
- **Debug**: Disabled for production

## Troubleshooting

### Common Issues

1. **Extension not working**
   - Check if server is running on port 5050
   - Verify extension permissions in Chrome
   - Check console for error messages

2. **CAPTCHA solving fails**
   - Ensure XEvil is running on port 80
   - Check XEvil key configuration
   - Verify CAPTCHA image format

3. **Accounts not loading**
   - Check account file format
   - Ensure file path is correct
   - Verify file encoding (UTF-8)

4. **Server connection errors**
   - Check firewall settings
   - Verify port 5050 is not blocked
   - Ensure CORS is properly configured

### Debug Mode
Enable detailed logging by modifying the logging level in `vclub_server.py`:
```python
logging.basicConfig(level=logging.DEBUG, ...)
```

## Security Notes

- **Never share** your account lists
- **Use VPN** if needed for privacy
- **Monitor** server logs for suspicious activity
- **Keep** XEvil key private

## Performance Tips

- **Batch processing**: Process accounts in smaller batches
- **Rate limiting**: Add delays between requests if needed
- **Memory management**: Monitor server memory usage with large account lists
- **Error handling**: Implement retry mechanisms for failed requests

## Support

For issues or questions:
1. Check the console logs in Chrome DevTools
2. Review server logs in the terminal
3. Verify all components are properly configured
4. Ensure dependencies are up to date

## Legal Disclaimer

This tool is for educational and legitimate testing purposes only. Users are responsible for ensuring compliance with applicable laws and terms of service.
