require('dotenv').config();
const { app, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Módulos principales
const { createWindow } = require('./modules/windows');
const { createBubbleWindow } = require('./modules/bubbleWindow');
const { createTray } = require('./modules/tray');
const { runServer, sendToClient, getMonitorGestor, processCurrentStatus, applyNewConfig, askNewAdaptations } = require('./modules/websocketServer');
const CONFIG_FILE = path.join(__dirname, 'config.json');

// Variables globales
let mainWindow = null;
let secondWindow = null;
let bubbleWindow = null;
let configWindow = null;
let appConfig = require(CONFIG_FILE);


app.whenReady().then(() => {
  bubbleWindow = createBubbleWindow(path.join(__dirname, 'pages', 'bubble.html'));
  mainWindow = createWindow(path.join(__dirname, 'pages', 'monitor.html'));
  secondWindow = createWindow(path.join(__dirname, 'pages', 'gestor.html'));
  configWindow = createWindow(path.join(__dirname, 'pages', 'configuration.html'), 550, 450);


  createTray(mainWindow, secondWindow, configWindow);
  runServer(mainWindow, secondWindow, appConfig);
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
ipcMain.on('ask-adaptation', (_, { text, uuid }) => {
  try {
    const { monitor, gestor } = getMonitorGestor(uuid);
    askNewAdaptations(monitor, gestor, text);
  } catch (error) {
    console.error(`[${new Date().toLocaleTimeString()}] ipcMain ask-adaptation error: ${error}.`);
  }
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
ipcMain.handle('update-config', (event, newConfigSection) => {
  try {
    const key = Object.keys(newConfigSection)[0];
    appConfig[key] = { ...appConfig[key], ...newConfigSection[key] };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(appConfig, null, 2));
    applyNewConfig(appConfig);
    console.log('Configuración guardada y actualizada:', appConfig);
    return { success: true, message: 'Configuración aplicada y guardada' };
  } catch (error) {
    console.error(`[${new Date().toLocaleTimeString()}] Saving-applying configuration error: ${error}.`);
    return { success: false, message: `Error al guardar: ${error.message}` };
  }
});

ipcMain.handle('get-config', () => appConfig);