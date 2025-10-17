require('dotenv').config();
const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

// Módulos principales
const { createWindow } = require('./modules/windows');
const { createBubble, createOrTogglePopup, positionPopup } = require('./modules/bubble'); // Asegúrate de exportarlo
const { createTray } = require('./modules/tray');
const { runServer } = require('./modules/websocketServer');
const { setupIpcHandlers } = require('./modules/ipcHandlers');
const { runAgent } = require('./modules/agent');

// Variables globales
let mainWindow = null;
let secondWindow = null;
let bubble = null;
let popup = null;
let chatHistory = [];


const bubbleRef = { current: null };
const popupRef = { current: null };


app.whenReady().then(() => {
  mainWindow = createWindow(path.join(__dirname, 'pages', 'monitor.html'));
  secondWindow = createWindow(path.join(__dirname, 'pages', 'gestor.html'));
  bubbleRef.current = createBubble(path.join(__dirname, 'pages', 'bubble.html'));
  //popupRef.current = createOrTogglePopup(path.join(__dirname, 'pages', 'popup.html'));

  createTray(mainWindow, secondWindow);
  runServer(mainWindow, secondWindow);
  setupIpcHandlers({
    createOrTogglePopup: (filePath) => {
      popupRef.current = createOrTogglePopup(filePath);
      return popupRef.current;
    },
    bubbleWindowRef: bubbleRef,
    popupWindowRef: popupRef,
    screen,
    positionPopup,
    chatHistory
  });

  runAgent();
});


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) bubble = createBubble(path.join(__dirname, 'pages', 'bubble.html'));
});