# 🚀 UltimateShop Auto-Login System Setup

## 📁 **Files You Need:**

### **1. Extension Files (Chrome Extension):**
- `ultimateshop_manifest.json` → Rename to `manifest.json`
- `ultimateshop_content.js` → Rename to `content.js`
- `ultimateshop_background.js` → Rename to `background.js`

### **2. Server Files (Same as VClub):**
- `vclub_server.py` (use same Flask server)
- `requirements.txt` (same Python packages)

## 🔧 **Setup Steps:**

### **Step 1: Create Extension Folder**
```
ultimateshop_extension/
├── manifest.json
├── content.js
├── background.js
└── (any icons you want)
```

### **Step 2: Rename Files**
```bash
# Rename the files
mv ultimateshop_manifest.json manifest.json
mv ultimateshop_content.js content.js
mv ultimateshop_background.js background.js
```

### **Step 3: Install Chrome Extension**
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `ultimateshop_extension` folder

### **Step 4: Start Flask Server**
```bash
# Use same server as VClub
python vclub_server.py
```

## ✅ **What's Different from VClub:**

### **Form Selectors:**
- **Username**: `#LoginForm_username`
- **Password**: `#LoginForm_password`
- **CAPTCHA Input**: `#LoginForm_verifyCode`
- **CAPTCHA Image**: `#yw0`
- **Submit Button**: Complex selector for button

### **Success Detection:**
- **URL**: `/news` redirect
- **Text**: "Discount :" 
- **No complex navigation** needed

### **Site Permissions:**
- **Domain**: `ultimateshop.vc`
- **Same logic**, different site

## 🎯 **How It Works:**

1. **Extension detects** ultimateshop.vc pages
2. **Automatically fills** username + password + CAPTCHA
3. **Submits form** and waits for response
4. **Detects success** via `/news` + "Discount :" text
5. **Reports to server** and clears cookies
6. **Opens new tab** for next account

## 🚀 **Ready to Use:**

**Same Flask server** - no changes needed!
**Same account format** - username:password
**Same CAPTCHA solving** - XEvil integration
**Same result files** - hit.txt, 2fa-hit.txt, free.txt

## ⚠️ **Important Notes:**

- **Cloudflare**: Handle manually in Chrome
- **XEvil**: Must be running on localhost:80
- **Accounts**: Same format as VClub
- **Server**: Same Flask server works

## 🎉 **You're All Set!**

Your UltimateShop Auto-Login system is ready! Just follow the setup steps above and you'll have a fully automated account checker for ultimateshop.vc!

**Happy account checking!** 🚀