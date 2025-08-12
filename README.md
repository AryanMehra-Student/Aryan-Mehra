# 🚀 UltimateShop Checker - Complete Account Checking System

## 🎯 **Overview:**
A comprehensive Chrome extension and Flask server system for automated account checking on `ultimateshop.vc`. Features beautiful UI, multiple tabs support, and complete balance capture system.

## 🏗️ **System Architecture:**

### **1. Chrome Extension:**
- **`final_ultimateshop_manifest.json`** - Extension configuration
- **`final_ultimateshop_content.js`** - Main automation logic
- **`final_ultimateshop_background.js`** - Background service worker

### **2. Flask Server (`final_ultimateshop_checker.py`):**
- **Manages account lists** with Tkinter file dialog
- **Handles CAPTCHA solving** via XEvil integration
- **Reports different account types** (HIT, CUSTOM, FAIL, 2FA, unactivated)
- **Saves results** to organized files with professional display
- **Beautiful UI** with ASCII banner and colored logging

## 🚀 **Key Features:**

### **✅ Complete Automation:**
- **Automatic login** on ultimateshop.vc
- **CAPTCHA solving** via XEvil
- **Balance extraction** from profile page
- **Multiple tabs support** for parallel processing

### **🎨 Professional UI:**
- **Mixed-color ASCII banner**
- **Tkinter file selection dialog**
- **Interactive menu system**
- **Real-time colored logging** with emojis
- **@AliveRishu branding**

### **💰 Smart Classification:**
- **HIT** (Green) - Balance > 0.00
- **CUSTOM** (Yellow) - Balance = 0.00 (Free hits)
- **FAIL** (Red) - Login failed
- **2FA** - Two-factor authentication
- **Unactivated** - Inactive accounts

### **📊 Data Capture:**
- **Current Balance** from profile page
- **Total Spent** tracking
- **Cards Purchased** count
- **Automatic profile navigation**

## 🔧 **Setup Instructions:**

### **Step 1: Install Dependencies**
```bash
pip install -r requirements.txt
```

### **Step 2: Create Extension Folder**
```
ultimateshop_extension/
├── manifest.json        # Copy from final_ultimateshop_manifest.json
├── content.js          # Copy from final_ultimateshop_content.js
└── background.js       # Copy from final_ultimateshop_background.js
```

### **Step 3: Install Chrome Extension**
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `ultimateshop_extension` folder

### **Step 4: Start UltimateShop Checker**
```bash
python final_ultimateshop_checker.py
```

### **Step 5: Open Multiple Tabs**
1. **Open multiple tabs** with `https://ultimateshop.vc/`
2. **Each tab** will work independently
3. **Extension activates** on all tabs
4. **Parallel checking** across all tabs

## 📁 **File Organization:**

### **Result Files:**
- **`hit.txt`** - Regular hits with balance
- **`custom.txt`** - Free hits (balance 0.00)
- **`fail.txt`** - Failed accounts
- **`2fa-hit.txt`** - 2FA accounts
- **`free.txt`** - Unactivated accounts

## 🎯 **How It Works:**

### **1. Extension Detection:**
- **Automatically activates** on all ultimateshop.vc tabs
- **Each tab** gets different account credentials
- **Parallel processing** across multiple tabs

### **2. Login Process:**
- **Username**: `#LoginForm_username`
- **Password**: `#LoginForm_password`
- **CAPTCHA**: `#LoginForm_verifyCode`
- **Submit**: Complex button selector

### **3. Success Detection:**
- **URL**: `/news` redirect + "Shop Rules" element (`<h4 class="modal-title" id="myLargeModalLabel">Shop Rules</h4>`) + "Discount :" text (fallback)
- **Auto-navigate** to `/profile` page
- **Extract balance data** automatically

### **4. Balance Capture:**
- **Current Balance**: `<td>Current balance:</td>` → `<td>0.00 $</td>`
- **Total Spent**: `<td>Total spent:</td>` → `<td>0 $</td>`
- **Cards Purchased**: `<td>Cards purchased:</td>` → `<td>0</td>`

### **5. Account Classification:**
- **Balance > 0.00** → HIT (Green)
- **Balance = 0.00** → CUSTOM (Yellow)
- **Login failed** → FAIL (Red)

## 🚀 **Display System:**

### **✅ HIT (Green Color):**
```
[ HIT ] | username:password | Balance : $150.50 | Total Spent : $500 | Cards : 25
Made By 🔥 @AliveRishu 🔥
```

### **🟡 CUSTOM/FREE (Yellow Color):**
```
[ CUSTOM ] | username:password | Balance : 0.00 | Total Spent : $0 | Cards : 0
Made By 🔥 @AliveRishu 🔥
```

### **🔴 FAIL (Red Color):**
```
[ FAIL ] | username:password
Made By 🔥 @AliveRishu 🔥
```

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
6. **Balance capture** 💰
7. **Stylish branding** 🔥
8. **Multiple tabs support** 📱

**Just run `python final_ultimateshop_checker.py` and open multiple tabs!** 🎯

## 🆘 **Support:**

- **Check console logs** for errors
- **Verify XEvil** is running
- **Ensure file format** is correct
- **Monitor server status** at localhost:5050
- **Open multiple tabs** for parallel checking

**Happy account checking with multiple tabs!** 🚀💰📱

## 🔥 **Made By @AliveRishu 🔥**
