const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const Monitor = require('./Monitor');
const Gestor = require('./Gestor');
const fs = require('fs');
const path = require('path');
const { getPopupWindow } = require('./bubbleWindow');

const url = process.env.URL;
const port = process.env.PORT;
const clients = new Map();
const monitores = new Map();
const gestores = new Map();
const intervals = new Map();

function runServer(mainWindow, secondWindow) {
  const wss = new WebSocket.Server({ port });
  console.log(`[WS] Servidor WebSocket activo en ws://${url}:${port}`);

  wss.on('connection', (ws) => {
    if (clients.size > 0) {
      ws.send(JSON.stringify({ type: 'error', message: 'Solo se permite una conexión.' }));
      ws.close();
      return;
    }
    //Identifica cliente
    ws.uuid = uuidv4();
    clients.set(ws.uuid, ws);
    console.log(`[WS] Cliente conectado: ${ws.uuid}`);
    ws.send(JSON.stringify({ type: 'id-assign', uuid: ws.uuid }));
    //Crea monitor para cliente
    const monitor = new Monitor(ws.uuid);
    monitor.setAgent();
    monitores.set(ws.uuid, monitor);
    //Crea gestor para cliente
    const gestor = new Gestor(ws.uuid);
    gestores.set(ws.uuid, gestor);
    let interval = null;

    ws.on('message', async (msg) => {
      try {
        const data = JSON.parse(msg);
        const monitor = monitores.get(ws.uuid);
        const gestor = gestores.get(ws.uuid);

        if (data.type === 'last-session') {
          const filePath = path.join(__dirname, '../userssessions', data.filename);
          fs.mkdirSync(path.dirname(filePath), { recursive: true });
          const content = monitor.generateKnowledgeBase(data.payload);
          await fs.promises.writeFile(filePath, content, 'utf-8');
          await monitor.agent.sendKnwBase(content);
          interval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              console.log(`[Server] Solicitando datos actuales periódicos a cliente ${ws.uuid}.`);
              ws.send(JSON.stringify({ type: 'current-state' }));
            }
          }, 30000);
          intervals.set(ws.uuid, interval);
        }

        if (data.type === 'current-state') {
          const context = monitor.generateContext(data.payload);
          const resp = await monitor.agent.sendContext(context);
          const adaptationPackages = gestor.extractAdaptPack(resp);

          if (adaptationPackages && adaptationPackages.length > 0) {

            const popupWindow = getPopupWindow();
            if (popupWindow && !popupWindow.isDestroyed()) {
              try {
                popupWindow.webContents.send('adaptation-packages', adaptationPackages, gestor.getIdCliente(), gestor.mode);
                console.log('[WS] Paquetes enviados al popup.');
              } catch (err) {
                console.error('[WS] Error enviando paquetes al popup:', err.message);
              }
            } else {
              console.log('[WS] No hay popup ni bubble disponible para enviar paquetes.');
            }

          } else {
            console.log('[WS] Sin sugerencias :(((');
          }
        }
        monitor.setData(data);
        [mainWindow, secondWindow].forEach(win => {
          if (win) win.webContents.send('monitor-update', { info: monitor.getData(), uuid: monitor.getIdClient() });
        });

      } catch (err) {
        console.error('[WS] Error procesando mensaje:', err.message);
      }
    });

    ws.on('close', () => {
      try {
        clearInterval(intervals.get(ws.uuid));
        intervals.delete(ws.uuid);
        monitores.get(ws.uuid).destroy();
        gestores.get(ws.uuid).destroy();
        monitores.delete(ws.uuid);
        gestores.delete(ws.uuid);
        clients.delete(ws.uuid);
        console.log(`[WS] Cliente desconectado: ${ws.uuid}`);
      } catch (error) {
        console.error('Error al quitar cliente del servidor: ', error);
      }

    });
  });
}

function sendToClient(uuid, payload) {
  const client = clients.get(uuid);
  if (client && client.readyState === WebSocket.OPEN) {
    try {
      client.send(JSON.stringify(payload));
    } catch (err) {
      console.error(`[WS] Error enviando a ${uuid}:`, err.message);
    }
  }
}

module.exports = { runServer, sendToClient };
