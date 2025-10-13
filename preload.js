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
    generatePrompt: (text) => ipcRenderer.invoke('generate-prompt', text),
    sendContext: (context) => {
        console.log('[Monitor] Enviando contexto al main:', context);
        ipcRenderer.send('send-context', context);
    }
});