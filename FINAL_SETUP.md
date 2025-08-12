# 🚀 UltimateShop Checker - FINAL COMPLETE SYSTEM (Multiple Tabs Support)

## 🎯 **What You Get:**

### **1. Complete UltimateShop Checker:**
- **Beautiful ASCII banner** with mixed colors
- **Tkinter file dialog** for easy file selection
- **Interactive menu** system
- **Real-time colored logging** with emojis
- **Complete balance capture** system
- **Professional UI** experience
- **Multiple tabs support** for parallel checking

### **2. All Features Included:**
- **Automatic login** on ultimateshop.vc
- **CAPTCHA solving** via XEvil
- **Balance extraction** from profile page
- **Multiple account types** detection
- **Stylish display** with @AliveRishu branding
- **Separate file saving** for different results
- **User-controlled tab management**

## 📁 **Final Files Structure:**

```
ultimateshop_checker/
├── final_ultimateshop_checker.py    # Main Flask server with UI
├── final_ultimateshop_manifest.json # Extension manifest
├── final_ultimateshop_content.js    # Extension content script
├── final_ultimateshop_background.js # Extension background script
├── requirements.txt                  # Python packages
└── FINAL_SETUP.md                   # This guide
```

## 🔧 **Setup Steps:**

### **Step 1: Install Python Dependencies**
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

## 🎨 **User Experience:**

### **1. Startup:**
```
🎨 Beautiful ASCII banner appears
📋 Menu shows 2 options
🚀 User selects UltimateShop Checker (Multiple Tabs)
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
💰 Live hit reporting with styling
📱 Multiple tabs support enabled
```

## 🎯 **How It Works (Multiple Tabs):**

### **1. Extension Detection:**
- **Automatically activates** on all ultimateshop.vc tabs
- **Each tab** gets different account credentials
- **Parallel processing** across multiple tabs

### **2. Tab Management:**
- **User controls** how many tabs to open
- **Extension works** on each tab independently
- **No automatic tab creation** - user decides

### **3. Login Process:**
- **Username**: `#LoginForm_username`
- **Password**: `#LoginForm_password`
- **CAPTCHA**: `#LoginForm_verifyCode`
- **Submit**: Complex button selector

### **4. Success Detection:**
- **URL**: `/news` redirect + "Discount :" text
- **Auto-navigate** to `/profile` page
- **Extract balance data** automatically

### **5. Balance Capture:**
- **Current Balance**: `<td>Current balance:</td>` → `<td>0.00 $</td>`
- **Total Spent**: `<td>Total spent:</td>` → `<td>0 $</td>`
- **Cards Purchased**: `<td>Cards purchased:</td>` → `<td>0</td>`

### **6. Account Classification:**
- **Balance > 0.00** → HIT (Green)
- **Balance = 0.00** → CUSTOM (Yellow)
- **Login failed** → FAIL (Red)

## 🚀 **Display System:**

### **✅ HIT (Green Color):**
```
[ HIT ] [ COMBO ] [ CAPTURES ] username | Balance: $150.50 | Total Spent: $500 | Cards: 25
Made By 🔥 @AliveRishu 🔥
```

### **🟡 CUSTOM/FREE (Yellow Color):**
```
[ CUSTOM ] [ COMBO ] [ CAPTURES ] username | Balance: 0.00 | Total Spent: $0 | Cards: 0
Made By 🔥 @AliveRishu 🔥
```

### **🔴 FAIL (Red Color):**
```
[ FAIL ] [ COMBO ] username:password
Made By 🔥 @AliveRishu 🔥
```

## 📊 **File Organization:**

### **Result Files:**
- **`hit.txt`** - Regular hits with balance
- **`custom.txt`** - Free hits (balance 0.00)
- **`fail.txt`** - Failed accounts
- **`2fa-hit.txt`** - 2FA accounts
- **`free.txt`** - Unactivated accounts

## ⚠️ **Requirements:**

### **System:**
- **Python 3.7+**
- **Chrome/Chromium browser**
- **XEvil CAPTCHA solver** (localhost:80)

### **Files:**
- **Accounts.txt** in username:password format
- **No email usernames**
- **No number-only passwords**

## 🎯 **Multiple Tabs Strategy:**

### **How to Use:**
1. **Start Flask server** once
2. **Load extension** in Chrome
3. **Open multiple tabs** with ultimateshop.vc
4. **Each tab** gets different account
5. **Parallel processing** across all tabs
6. **User controls** tab count

### **Benefits:**
- **Faster processing** with multiple tabs
- **User flexibility** in tab management
- **Efficient resource usage**
- **Professional workflow**

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