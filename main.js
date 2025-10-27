require('dotenv').config();
const { app } = require('electron');
const path = require('path');

// Módulos principales
const { createWindow } = require('./modules/windows');
const { createBubbleWindow } = require('./modules/bubbleWindow');
const { createTray } = require('./modules/tray');
const { runServer } = require('./modules/websocketServer');
const { setupIpcHandlers } = require('./modules/ipcHandlers');
const { runAgent } = require('./modules/agent');

// Variables globales
let mainWindow = null;
let secondWindow = null;
let bubbleWindow = null;

app.whenReady().then(() => {
  bubbleWindow = createBubbleWindow(path.join(__dirname,'pages','bubble.html'));
  mainWindow = createWindow(path.join(__dirname, 'pages', 'monitor.html'));
  secondWindow = createWindow(path.join(__dirname, 'pages', 'gestor.html'));

  createTray(mainWindow, secondWindow);
  runServer(mainWindow, secondWindow, bubbleWindow);
  setupIpcHandlers();
  runAgent();
});


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});