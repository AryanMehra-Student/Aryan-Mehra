# 🚀 UltimateShop Checker - Complete Setup Guide

## 🎯 **What You Get:**

### **1. Beautiful UI with Tkinter File Dialog:**
- **Epic ASCII banner** with mixed colors
- **Professional file selection** dialog box
- **Interactive menu** system
- **Real-time colored logging**

### **2. Complete UltimateShop Checker:**
- **Chrome Extension** for ultimateshop.vc
- **Flask Server** with account management
- **CAPTCHA solving** via XEvil
- **Automated login** system

## 📁 **Files Structure:**

```
ultimateshop_checker/
├── ultimateshop_checker.py      # Main Flask server with UI
├── ultimateshop_manifest.json   # Extension manifest
├── ultimateshop_content.js      # Extension content script
├── ultimateshop_background.js   # Extension background script
├── requirements.txt             # Python packages
└── ULTIMATESHOP_SETUP.md       # This guide
```

## 🔧 **Setup Steps:**

### **Step 1: Install Python Dependencies**
```bash
pip install -r requirements.txt
```

### **Step 2: Create Extension Folder**
```
ultimateshop_extension/
├── manifest.json        # Copy from ultimateshop_manifest.json
├── content.js          # Copy from ultimateshop_content.js
└── background.js       # Copy from ultimateshop_background.js
```

### **Step 3: Install Chrome Extension**
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `ultimateshop_extension` folder

### **Step 4: Start UltimateShop Checker**
```bash
python ultimateshop_checker.py
```

## 🎨 **User Experience:**

### **1. Startup:**
```
🎨 Beautiful ASCII banner appears
📋 Menu shows 2 options
🚀 User selects UltimateShop Checker
```

### **2. File Selection:**
```
📁 Tkinter file dialog opens
🔍 User browses and selects .txt file
✅ File loads with account count
```

### **3. Server Running:**
```
⚡ Flask server starts on localhost:5050
🔄 Real-time colored logging
💰 Live hit reporting
```

## 🎯 **How It Works:**

### **1. Extension Detection:**
- **Automatically activates** on ultimateshop.vc
- **Detects login page** and form elements
- **Fills credentials** from Flask server

### **2. Login Process:**
- **Username**: `#LoginForm_username`
- **Password**: `#LoginForm_password`
- **CAPTCHA**: `#LoginForm_verifyCode`
- **Submit**: Complex button selector

### **3. Success Detection:**
- **URL**: `/news` redirect
- **Text**: "Discount :" 
- **Reports hit** to server

### **4. Account Management:**
- **Fetches one account** at a time
- **Removes used accounts** automatically
- **Saves progress** to file

## 🚀 **Features:**

### **✅ What's Included:**
- **Beautiful ASCII banner** with mixed colors
- **Tkinter file dialog** for easy file selection
- **Interactive menu** system
- **Real-time colored logging** with emojis
- **Professional UI** experience
- **Complete automation** system

### **🎨 UI Elements:**
- **Red/Green/Yellow/Blue/Magenta/Cyan** color scheme
- **Professional borders** and separators
- **Emoji indicators** for status
- **Timestamps** for all actions
- **Beautiful formatting** throughout

## ⚠️ **Requirements:**

### **System:**
- **Python 3.7+**
- **Chrome/Chromium browser**
- **XEvil CAPTCHA solver** (localhost:80)

### **Files:**
- **Accounts.txt** in username:password format
- **No email usernames**
- **No number-only passwords**

## 🎉 **Ready to Use!**

**Your UltimateShop Checker is complete with:**

1. **Epic ASCII banner** 🎨
2. **Tkinter file dialog** 📁
3. **Professional UI** ✨
4. **Complete automation** 🚀
5. **Beautiful logging** 📊

**Just run `python ultimateshop_checker.py` and enjoy!** 🎯

## 🆘 **Support:**

- **Check console logs** for errors
- **Verify XEvil** is running
- **Ensure file format** is correct
- **Monitor server status** at localhost:5050

**Happy account checking!** 🚀💰