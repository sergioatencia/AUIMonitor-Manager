const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('monitor', {
  onUpdate: (callback) => {
    ipcRenderer.on('monitor-update', (event, data) => callback(data));
    // window.addEventListener('monitor-update', (event) => callback(event.detail));
  },
  sendMutation: (uuid, mutation, value) => {
    console.log(`[Monitor] Enviando mutación ${mutation}=${value} al cliente ${uuid}.`);
    ipcRenderer.send('send-mutation', { uuid, mutation, value });
  },
  generatePrompt: (text) => ipcRenderer.send('send-context', { text, uuid }),
  onClearContent: (callback) => ipcRenderer.on('clear-content', callback),
});

contextBridge.exposeInMainWorld('bubble', {
  moveBubble: (dx, dy) => ipcRenderer.send('move-bubble', { dx, dy }),
  togglePopup: () => ipcRenderer.send('toggle-popup'),
  onAdaptationPackages: (callback) => { ipcRenderer.on('adaptation-packages', (_, data, uuid, currentMode) => callback(data, uuid, currentMode)); },
  applyAdaptation: (uuid, pack) => ipcRenderer.send('apply-adaptation', { uuid, pack }),
  askAdaptation: (text, uuid) => ipcRenderer.send('ask-adaptation', { text, uuid }),
  onClearContent: (callback) => ipcRenderer.on('clear-bubble-content', callback),
});

contextBridge.exposeInMainWorld('electronAPI', {
  // 1. Obtener la configuración actual (usado en DOMContentLoaded)
  getConfig: () => ipcRenderer.invoke('get-config'),

  // 2. Actualizar/Guardar configuración (usado por saveSettings)
  updateConfig: (newConfigSection) => ipcRenderer.invoke('update-config', newConfigSection),

  // 3. Abrir diálogo de carpeta (usado por selectFolder)
  selectDirectory: () => ipcRenderer.invoke('select-directory')
})