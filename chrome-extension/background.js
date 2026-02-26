// Auto Caller Pro - Background Service Worker

const API_URL = 'http://localhost:3000';

// Keep the connection alive
chrome.alarms.create('keepAlive', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keepAlive') {
    fetch(`${API_URL}/api/settings`).catch(() => {});
  }
});

// Handle installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Auto Caller Pro installed');
  
  // Check if server is running
  fetch(`${API_URL}/api/settings`)
    .then(res => res.json())
    .then(data => {
      if (!data.isConfigured) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon-128.png',
          title: 'Auto Caller Pro',
          message: 'Please configure your API keys in Settings'
        });
      }
    })
    .catch(() => {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-128.png',
        title: 'Auto Caller Pro',
        message: 'Start the local server to use the app'
      });
    });
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkServer') {
    fetch(`${API_URL}/api/settings`)
      .then(res => res.json())
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open
  }
});
