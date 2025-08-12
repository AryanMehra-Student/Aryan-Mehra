// Content script that runs on web pages
let isChecking = false;
let accountQueue = [];
let currentCheckIndex = 0;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startChecking') {
    startChecking();
  }
  else if (request.action === 'stopChecking') {
    stopChecking();
  }
  else if (request.action === 'performAccountCheck') {
    performAccountCheck(request.credentials);
  }
});

// Start account checking process
function startChecking() {
  if (isChecking) return;
  
  isChecking = true;
  console.log('Account checking started on:', window.location.href);
  
  // Load accounts from storage or start with default list
  loadAccountsAndStart();
}

// Stop account checking
function stopChecking() {
  isChecking = false;
  console.log('Account checking stopped on:', window.location.href);
}

// Load accounts and start checking
function loadAccountsAndStart() {
  chrome.storage.local.get(['accounts'], (result) => {
    if (result.accounts && result.accounts.length > 0) {
      accountQueue = [...result.accounts];
      currentCheckIndex = 0;
      processNextAccount();
    } else {
      console.log('No accounts found in storage');
      // You can add default accounts here or prompt user to add them
    }
  });
}

// Process next account in queue
function processNextAccount() {
  if (!isChecking || currentCheckIndex >= accountQueue.length) {
    if (isChecking) {
      console.log('Finished checking all accounts');
      // Restart from beginning if still checking
      currentCheckIndex = 0;
      setTimeout(processNextAccount, 1000);
    }
    return;
  }
  
  const account = accountQueue[currentCheckIndex];
  console.log(`Checking account ${currentCheckIndex + 1}/${accountQueue.length}:`, account.username);
  
  performAccountCheck(account);
}

// Perform account check for specific credentials
function performAccountCheck(credentials) {
  if (!credentials || !credentials.username || !credentials.password) {
    console.log('Invalid credentials provided');
    currentCheckIndex++;
    setTimeout(processNextAccount, 1000);
    return;
  }
  
  // This is where you implement the actual account checking logic
  // The implementation will depend on the specific site structure
  
  try {
    // Example: Fill login form and submit
    fillLoginForm(credentials);
    
    // Wait for response and check result
    setTimeout(() => {
      checkLoginResult(credentials);
    }, 2000);
    
  } catch (error) {
    console.error('Error checking account:', error);
    currentCheckIndex++;
    setTimeout(processNextAccount, 1000);
  }
}

// Fill login form with credentials
function fillLoginForm(credentials) {
  // Find username and password fields
  const usernameField = document.querySelector('input[name="username"], input[name="email"], input[type="text"]');
  const passwordField = document.querySelector('input[name="password"], input[type="password"]');
  
  if (usernameField && passwordField) {
    // Clear fields and fill with credentials
    usernameField.value = credentials.username;
    passwordField.value = credentials.password;
    
    // Trigger input events
    usernameField.dispatchEvent(new Event('input', { bubbles: true }));
    passwordField.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Find and click submit button
    const submitButton = document.querySelector('button[type="submit"], input[type="submit"]');
    if (submitButton) {
      submitButton.click();
    }
  }
}

// Check login result
function checkLoginResult(credentials) {
  // This function should analyze the page to determine if login was successful
  // You'll need to customize this based on the specific site
  
  let result = {
    username: credentials.username,
    password: credentials.password,
    status: 'unknown',
    timestamp: new Date().toISOString(),
    url: window.location.href
  };
  
  // Check for common success/error indicators
  if (document.body.textContent.includes('Welcome') || 
      document.body.textContent.includes('Dashboard') ||
      document.querySelector('.user-profile, .dashboard')) {
    result.status = 'valid';
  } else if (document.body.textContent.includes('Invalid') ||
             document.body.textContent.includes('Wrong') ||
             document.body.textContent.includes('Failed')) {
    result.status = 'invalid';
  } else if (document.body.textContent.includes('Captcha') ||
             document.body.textContent.includes('Verify')) {
    result.status = 'captcha';
  }
  
  // Save result to storage
  saveCheckResult(result);
  
  // Move to next account
  currentCheckIndex++;
  setTimeout(processNextAccount, 1000);
}

// Save check result to storage
function saveCheckResult(result) {
  chrome.storage.local.get(['checkResults'], (storageResult) => {
    let results = storageResult.checkResults || [];
    results.push(result);
    
    // Keep only last 1000 results
    if (results.length > 1000) {
      results = results.slice(-1000);
    }
    
    chrome.storage.local.set({ checkResults: results });
    console.log('Result saved:', result);
  });
}

// Listen for page changes (for SPA sites)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    // Page changed, check if we need to restart checking
    if (isChecking) {
      setTimeout(() => {
        if (isChecking) {
          processNextAccount();
        }
      }, 1000);
    }
  }
}).observe(document, { subtree: true, childList: true });