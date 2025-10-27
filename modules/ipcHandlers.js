const { ipcMain } = require('electron');
const { sendToClient } = require('./websocketServer');
const { initAgent, sendContext } = require('./agent');

function setupIpcHandlers() {
  ipcMain.on('send-mutation', (_, { uuid, mutation, value }) => {
    console.log(`[IPC] Mutación enviada a ${uuid}:`, mutation, value);
    sendToClient(uuid, { type: 'mutate', mutation, value });
  });

  ipcMain.on('send-knowledge', async (_, knowledge) => {
    console.log('[IPC] Conocimiento recibido para inicializar agente.');
    await initAgent(knowledge);
  });

  ipcMain.on('send-context', async (_, { context, uuid }) => {
    await sendContext(context, uuid);
  });

  ipcMain.on('apply-adaptation', (_, { uuid, pack }) => {
    sendToClient(uuid, { type: 'apply-adaptation', pack });
  });
}

module.exports = { setupIpcHandlers };
