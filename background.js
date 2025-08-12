// Background service worker for Account Checker Extension
let targetSite = '';
let isChecking = false;
let checkInterval = null;

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'setTargetSite') {
    targetSite = request.site;
    chrome.storage.local.set({ targetSite: targetSite });
    sendResponse({ success: true });
  }
  else if (request.action === 'startChecking') {
    startAccountChecking();
    sendResponse({ success: true });
  }
  else if (request.action === 'stopChecking') {
    stopAccountChecking();
    sendResponse({ success: true });
  }
  else if (request.action === 'getStatus') {
    sendResponse({ 
      isChecking: isChecking, 
      targetSite: targetSite 
    });
  }
  else if (request.action === 'checkAccount') {
    // Forward account check request to content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'performAccountCheck',
          credentials: request.credentials
        });
      }
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