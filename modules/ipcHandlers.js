const { ipcMain } = require('electron');
const { sendToClient } = require('./websocketServer');
const { initAgent, sendContext } = require('./agent');

function setupIpcHandlers({ createOrTogglePopup, bubbleWindowRef, popupWindowRef, screen, positionPopup, chatHistory }) {
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

  ipcMain.on('apply-suggestions', (_, { uuid, adaptations }) => {
    adaptations.forEach(a => {
      sendToClient(uuid, { type: 'mutate', adaptationKey: a.key, valor: a.valor });
    });
  });

  ipcMain.handle('toggle-popup', () => {
    popupWindowRef.current = createOrTogglePopup(path.join(__dirname, '../pages', 'popup.html'));
  });



  ipcMain.on('drag-bubble', (event, { x, y }) => {
    const bubbleWindow = bubbleWindowRef.current;
    const popupWindow = popupWindowRef.current;

    if (!bubbleWindow) return;

    const display = screen.getDisplayNearestPoint({ x, y });
    const wa = display.workArea;

    const bw = bubbleWindow.getBounds().width;
    const bh = bubbleWindow.getBounds().height;

    const minX = wa.x;
    const maxX = wa.x + wa.width - bw;
    const minY = wa.y;
    const maxY = wa.y + wa.height - bh;

    const newX = Math.max(minX, Math.min(x, maxX));
    const newY = Math.max(minY, Math.min(y, maxY));

    bubbleWindow.setBounds({ x: newX, y: newY, width: bw, height: bh });

    if (popupWindow && !popupWindow.isDestroyed()) {
      positionPopup();
    }
  });

  ipcMain.on('new-message', (event, message) => {
    chatHistory.push(message);
  });
  ipcMain.handle('get-chat-history', () => {
    return chatHistory;
  });


  console.log('[IPC] Canales IPC configurados.');
}

module.exports = { setupIpcHandlers };
