const { app, BrowserWindow } = require('electron');
const path = require('path');
const express = require('express');
const { createServer } = require('http');

// Express uygulamasını başlat
const server = express();
require('../server/routes').registerRoutes(server);

// Electron penceresi oluştur
function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Express sunucusunu başlat
  const httpServer = createServer(server);
  const PORT = 5000;
  httpServer.listen(PORT, '127.0.0.1', () => {
    console.log(`Server running on port ${PORT}`);
    // Sunucu başladıktan sonra uygulamayı yükle
    mainWindow.loadURL(`http://localhost:${PORT}`);
  });

  // Geliştirici araçlarını aç (isteğe bağlı)
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
