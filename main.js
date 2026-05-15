const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let backendProcess = null;


function getBackendPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'finite_pop_backend');
  }

  return path.join(__dirname, 'backend-bin', 'finite_pop_backend');
}

function startBackend() {
  const backendPath = getBackendPath();

  console.log('Backend path:', backendPath);

  backendProcess = spawn(backendPath, [], {
    stdio: 'inherit'
  });

  backendProcess.on('spawn', () => {
    console.log('Backend successfully started');
  });

  backendProcess.on('error', (err) => {
    console.error('Backend failed to start:', err);
  });

  backendProcess.on('exit', (code, signal) => {
    console.error(`Backend exited: code=${code}, signal=${signal}`);
  });

  setTimeout(() => {
    console.log('Backend PID:', backendProcess.pid);
  }, 1000);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1300,
    height: 900,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  win.once('ready-to-show', () => {
    win.show();
  });

  win.webContents.on('did-fail-load', (_, code, desc) => {
    console.error('Window failed to load:', code, desc);
  });
}

app.whenReady().then(() => {
  startBackend();

  setTimeout(() => {
    createWindow();
  }, 1000);
});
app.on('window-all-closed', () => {
  if (backendProcess) backendProcess.kill();
  app.quit();
});