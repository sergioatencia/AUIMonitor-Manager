require('dotenv').config();
const { app, ipcMain, dialog } = require('electron');
const path = require('path');

// Módulos principales
const { createWindow } = require('./modules/windows');
const { createBubbleWindow } = require('./modules/bubbleWindow');
const { createTray } = require('./modules/tray');
const { runServer, sendToClient } = require('./modules/websocketServer');

// Variables globales
let mainWindow = null;
let secondWindow = null;
let bubbleWindow = null;
let configWindow = null;

app.whenReady().then(() => {
  bubbleWindow = createBubbleWindow(path.join(__dirname, 'pages', 'bubble.html'));
  mainWindow = createWindow(path.join(__dirname, 'pages', 'monitor.html'));
  secondWindow = createWindow(path.join(__dirname, 'pages', 'gestor.html'));
  configWindow = createWindow(path.join(__dirname, 'pages', 'configuration.html'));


  createTray(mainWindow, secondWindow, configWindow);
  runServer(mainWindow, secondWindow, bubbleWindow);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('send-mutation', (_, { uuid, mutation, value }) => {
  sendToClient(uuid, { type: 'mutate', mutation, value });
});
ipcMain.on('apply-adaptation', (_, { uuid, pack }) => {
  sendToClient(uuid, { type: 'apply-adaptation', pack });
});
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});