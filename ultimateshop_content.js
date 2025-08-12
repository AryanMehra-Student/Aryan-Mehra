// UltimateShop Auto-Login System
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

// Check if we're on the profile/dashboard page
function isProfilePage() {
    return isSuccessPage(); // Only use the 2 indicators you specified
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
        console.log('UltimateShop Auto-Login: Form elements not found for retry.');
        return;
    }

    const username = sessionStorage.getItem('current_username');
    const password = sessionStorage.getItem('current_password');
    if (!username || !password) {
        console.log('UltimateShop Auto-Login: No credentials found for retry.');
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
        console.log('UltimateShop Auto-Login: Filled new CAPTCHA.');

        const delay = getRandomDelay();
        setTimeout(() => {
            submitButton.click();
            console.log('UltimateShop Auto-Login: Clicked login button for retry.');
        }, delay);
    } catch (error) {
        console.error('UltimateShop Auto-Login: Error during retry with new CAPTCHA:', error);
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
        console.log('UltimateShop Auto-Login: Form elements not found on login page.');
        return;
    }

    try {
        const credsResponse = await fetch('http://localhost:5050/get-creds');
        if (!credsResponse.ok) {
            if (credsResponse.status === 404) {
                console.log('UltimateShop Auto-Login: No credentials left.');
                return;
            }
            throw new Error('Failed to fetch credentials');
        }
        const { username, password } = await credsResponse.json();

        sessionStorage.setItem('current_username', username);
        sessionStorage.setItem('current_password', password);

        usernameInput.value = username;
        passwordInput.value = password;
        console.log('UltimateShop Auto-Login: Filled username and password.');

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
        console.log('UltimateShop Auto-Login: Filled CAPTCHA.');

        const delay = getRandomDelay();
        setTimeout(() => {
            submitButton.click();
            console.log('UltimateShop Auto-Login: Clicked login button.');
        }, delay);
    } catch (error) {
        console.error('UltimateShop Auto-Login: Error during login automation:', error);
    }
}

// Handle navigation and login based on the current page
function handlePage() {
    console.log('UltimateShop Auto-Login: Current URL:', window.location.href);
    
    if (isLoginPage()) {
        console.log('UltimateShop Auto-Login: Handling login page...');
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
    } else if (isSuccessPage()) {
        console.log('UltimateShop Auto-Login: Login successful! Found "Discount:" text on /news page.');
        const username = sessionStorage.getItem('current_username');
        const password = sessionStorage.getItem('current_password');
        if (username && password) {
            chrome.runtime.sendMessage({
                type: 'hit_detected',
                username,
                password,
                // You can add more data extraction here if needed
            });
            sessionStorage.removeItem('current_username');
            sessionStorage.removeItem('current_password');
        }
    }
}

// Run when the page loads
window.addEventListener('load', () => {
    console.log('UltimateShop Auto-Login: Page loaded, handling page...');
    handlePage();
});

// Observe DOM changes for dynamic content
const observer = new MutationObserver(() => {
    handlePage();
});
observer.observe(document.body, { childList: true, subtree: true });