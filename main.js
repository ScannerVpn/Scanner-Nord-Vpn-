const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');

// سرور رو start کن
require('./server');

// صبر کن تا سرور واقعاً آماده بشه — در حالت exe ممکنه کمی طول بکشه
function waitForServer(url, retries, delay) {
  return new Promise((resolve, reject) => {
    function attempt(n) {
      http.get(url, (res) => {
        res.resume();
        resolve();
      }).on('error', () => {
        if (n <= 0) return reject(new Error('Server did not start'));
        setTimeout(() => attempt(n - 1), delay);
      });
    }
    attempt(retries);
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1600,
    height: 1000,
    autoHideMenuBar: true,
    backgroundColor: '#111111',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  // لاگ خطاهای renderer برای دیباگ
  win.webContents.on('did-fail-load', (event, code, desc) => {
    console.error('Page load failed:', code, desc);
    // یه بار دیگه تلاش کن
    setTimeout(() => win.loadURL('http://localhost:3000/dashboard.html'), 1000);
  });

  win.loadURL('http://localhost:3000/dashboard.html');
}

app.whenReady().then(async () => {
  try {
    // حداکثر ۵ ثانیه صبر کن (۲۵ بار × ۲۰۰ms)
    await waitForServer('http://localhost:3000/', 25, 200);
  } catch (e) {
    console.error('Server wait timeout:', e.message);
  }
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
