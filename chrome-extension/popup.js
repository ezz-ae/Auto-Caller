// Auto Caller Pro - Chrome Extension Popup

const API_URL = 'http://localhost:3000';

// Check server status
async function checkStatus() {
  const serverStatus = document.getElementById('serverStatus');
  const apiStatus = document.getElementById('apiStatus');
  const creditsValue = document.getElementById('creditsValue');
  
  try {
    const res = await fetch(`${API_URL}/api/settings`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (res.ok) {
      const data = await res.json();
      
      serverStatus.textContent = 'Running';
      serverStatus.className = 'status-value connected';
      
      if (data.isConfigured) {
        apiStatus.textContent = 'Configured';
        apiStatus.className = 'status-value connected';
      } else {
        apiStatus.textContent = 'Setup Required';
        apiStatus.className = 'status-value disconnected';
      }
      
      creditsValue.textContent = data.credits || 0;
    } else {
      throw new Error('Server error');
    }
  } catch (error) {
    serverStatus.textContent = 'Offline';
    serverStatus.className = 'status-value disconnected';
    apiStatus.textContent = 'Start Server';
    creditsValue.textContent = '---';
  }
}

// Open dashboard
document.getElementById('openApp').addEventListener('click', () => {
  chrome.tabs.create({ url: `${API_URL}` });
});

// Open settings
document.getElementById('openSettings').addEventListener('click', () => {
  chrome.tabs.create({ url: `${API_URL}/#settings` });
});

// Initial check
checkStatus();

// Refresh every 5 seconds
setInterval(checkStatus, 5000);
