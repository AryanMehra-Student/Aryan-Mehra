# UltimateShop Checker - Complete System

A powerful Chrome extension and Flask server system for checking UltimateShop accounts with balance capture, CAPTCHA solving, and multiple tabs support.

## 🚀 Features

- **Multiple Tabs Support**: Check multiple accounts simultaneously in different tabs
- **Automatic CAPTCHA Solving**: Integrated with XEvil for seamless CAPTCHA handling
- **Balance Capture**: Automatically extracts balance, total spent, and cards purchased
- **Smart Retry Logic**: Retries failed CAPTCHAs up to 5 times per account
- **Account Classification**: Automatically categorizes accounts as HIT, CUSTOM, FAIL, or BANNED
- **Beautiful UI**: Colorful console output with ASCII art banner
- **File Selection**: Tkinter-based file selection dialog for accounts file
- **Auto-refresh**: Automatically refreshes tabs for continuous checking

## 📁 File Structure

```
UltimateShop-Checker/
├── manifest.json              # Chrome extension manifest
├── content.js                 # Main content script for website interaction
├── background.js              # Background service worker
├── final_ultimateshop_checker.py  # Flask server with UI
├── README.md                  # This documentation
└── hit/                       # Results folder (auto-created)
    ├── hit.txt               # Successful accounts with balance
    ├── custom.txt            # Free accounts (0.00 balance)
    ├── fail.txt              # Failed login attempts
    ├── banned.txt            # Banned accounts
    ├── 2fa-hit.txt          # 2FA protected accounts
    └── free.txt              # Unactivated accounts
```

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
pip install flask flask-cors requests colorama
```

### 2. Configure XEvil API Key

Edit `final_ultimateshop_checker.py` and replace:
```python
XEVIL_API_KEY = "YOUR_XEVIL_API_KEY_HERE"
```

### 3. Load Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the folder containing the extension files
4. The extension will appear as "UltimateShop Checker"

### 4. Start the Server

```bash
python final_ultimateshop_checker.py
```

### 5. Use the System

1. Select your accounts file using the Tkinter dialog
2. Open multiple tabs with `https://ultimateshop.vc`
3. The extension will automatically start checking accounts in each tab
4. Results are displayed in real-time and saved to appropriate files

## 🔧 How It Works

### Content Script (`content.js`)
- Detects login page and automatically fills credentials
- Captures and solves CAPTCHAs using XEvil
- Handles login success/failure detection
- Navigates to profile page to extract balance data
- Sends results to background script

### Background Script (`background.js`)
- Manages communication between content script and Flask server
- Handles cookie clearing and tab refresh
- Reports results to server endpoints
- Manages service worker lifecycle

### Flask Server (`final_ultimateshop_checker.py`)
- Provides credentials to extension
- Solves CAPTCHAs via XEvil API
- Receives and processes results
- Saves accounts to categorized files
- Beautiful console UI with colorama

## 📊 Account Types & Display

### HIT (Green)
```
[ HIT ] | username:password | Balance : $X | Total Spent : $Y | Cards : Z
Made By 🔥 @AliveRishu 🔥
```

### CUSTOM/FREE (Yellow)
```
[ CUSTOM ] | username:password | Balance : 0.00 | Total Spent : $0 | Cards : 0
Made By 🔥 @AliveRishu 🔥
```

### FAIL (Red)
```
[ FAIL ] | username:password
Made By 🔥 @AliveRishu 🔥
```

### BANNED (Red)
```
[ BANNED ] | username:password
Made By 🔥 @AliveRishu 🔥
```

## 🔄 CAPTCHA Handling

- **Automatic Solving**: Uses XEvil API for CAPTCHA resolution
- **Retry Logic**: Retries failed CAPTCHAs up to 5 times per account
- **Fresh CAPTCHA**: Refreshes page to get new CAPTCHA on failures
- **Failure Handling**: Closes tab and clears cookies after max attempts

## 🌐 Multiple Tabs Support

- **Manual Tab Control**: User opens tabs manually (no automatic tab creation)
- **Parallel Processing**: Each tab processes different accounts simultaneously
- **Auto-refresh**: Tabs automatically refresh after each account completion
- **Cookie Isolation**: Each tab maintains separate session state

## 📝 Success Detection

The system detects successful login by checking for:
- URL contains `/news`
- Page text contains "Discount :"

This combination reliably identifies successful login on UltimateShop.

## 🚨 Error Handling

- **CAPTCHA Errors**: Automatic retry with fresh CAPTCHA
- **Login Failures**: Immediate reporting and next account
- **Banned Accounts**: Detection and separate logging
- **Site Issues**: Automatic page refresh and retry
- **Network Errors**: Graceful fallback and retry mechanisms

## 🔑 Security Features

- **Cookie Management**: Automatic clearing after each account
- **Session Isolation**: Separate sessions for each tab
- **Secure Communication**: Localhost-only server communication
- **Input Validation**: Robust credential format validation

## 📈 Performance Features

- **Efficient Processing**: Minimal delays between operations
- **Memory Management**: Proper cleanup of session data
- **Error Recovery**: Automatic recovery from various failure modes
- **Logging**: Comprehensive logging for debugging

## 🎯 Usage Tips

1. **Multiple Tabs**: Open 3-5 tabs for optimal performance
2. **Account Format**: Ensure accounts are in `username:password` format
3. **XEvil Setup**: Make sure XEvil is running on localhost:80
4. **File Encoding**: Use UTF-8 encoding for accounts file
5. **Regular Monitoring**: Check console output for real-time status

## 🐛 Troubleshooting

### Extension Not Working
- Check if extension is loaded in Chrome
- Verify manifest.json file paths
- Check browser console for errors

### CAPTCHA Solving Issues
- Verify XEvil API key is correct
- Ensure XEvil server is running
- Check network connectivity

### Server Connection Issues
- Verify Flask server is running on port 5050
- Check firewall settings
- Ensure localhost access is allowed

## 🔄 Updates & Maintenance

- **Regular Updates**: Keep XEvil updated for best CAPTCHA solving
- **Account Validation**: Regularly validate account file format
- **Performance Monitoring**: Monitor server performance and adjust as needed
- **Error Logging**: Review logs for pattern identification

## 📞 Support

For issues or questions:
- Check the console output for detailed error messages
- Review the logging information in the Flask server
- Ensure all dependencies are properly installed
- Verify file paths and permissions

## 🎉 Credits

**Developer**: @AliveRishu  
**System**: UltimateShop Checker  
**Version**: 1.0 Final  
**Status**: Production Ready ✅

---

**Made with 🔥 by @AliveRishu 🔥**
