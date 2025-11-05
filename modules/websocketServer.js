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

function runServer(mainWindow, secondWindow, config) {
  const wss = new WebSocket.Server({ port });
  console.log(`[${new Date().toLocaleTimeString()}] WebSocket server running at ws://${url}:${port}.`);

  wss.on('connection', async (ws) => {
    if (clients.size > 0) {
      ws.send(JSON.stringify({ type: 'error', message: 'Solo se permite una conexión.' }));
      ws.close();
      return;
    }
    //Identifica cliente
    ws.uuid = uuidv4();
    clients.set(ws.uuid, ws);
    console.log(`[${new Date().toLocaleTimeString()}] New client connnected: ${ws.uuid}.`);
    ws.send(JSON.stringify({ type: 'id-assign', uuid: ws.uuid }));
    //Crea monitor para cliente
    const monitor = new Monitor(ws.uuid, config.monitor);
    //------------> await monitor.setAgent();
    monitores.set(ws.uuid, monitor);
    //Crea gestor para cliente
    const gestor = new Gestor(ws.uuid, config.gestor);
    gestores.set(ws.uuid, gestor);
    let interval = null;

    ws.on('message', async (msg) => {
      try {
        const data = JSON.parse(msg);
        const monitor = monitores.get(ws.uuid);
        const gestor = gestores.get(ws.uuid);

        if (data.type === 'last-session') {
          const filePath = path.join(__dirname, '../user_sessions', data.filename);
          fs.mkdirSync(path.dirname(filePath), { recursive: true });

          const content = monitor.generateKnowledgeBase(data.payload);
          await fs.promises.writeFile(filePath, content, 'utf-8');
          //await monitor.agent.sendKnwBase(content);
          await monitor.launchAgent();
          interval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              //console.log(`[Server] Solicitando datos actuales periódicos a cliente ${ws.uuid}.`);
              ws.send(JSON.stringify({ type: 'current-state' }));
            }
          }, config.monitor.sampleInterval * 1000);
          intervals.set(ws.uuid, interval);
        }

        if (data.type === 'current-state') {
          const context = monitor.generateContext(data.payload);
          //console.log('Contexto actualizado recibido: ', context);
          await processCurrentStatus(context, monitor, gestor);
        }
        monitor.setData(data);
        [mainWindow, secondWindow].forEach(win => {
          if (win) win.webContents.send('monitor-update', { info: monitor.getData(), uuid: monitor.getIdClient() });
        });

      } catch (err) {
        console.error(`[${new Date().toLocaleTimeString()}] Error processing the message on the server: ${err.message}.`);
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
        console.log(`[${new Date().toLocaleTimeString()}] Client disconnected: ${ws.uuid}.`);

        [mainWindow, secondWindow].forEach(win => {
          if (win) win.webContents.send('clear-content');
        });

        const popupWindow = getPopupWindow();
        popupWindow.webContents.send('clear-bubble-content');

      } catch (error) {
        console.error(`[${new Date().toLocaleTimeString()}] Error removing client from server: ${error}.`);
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
      console.error(`[${new Date().toLocaleTimeString()}] Error sending adaptations to client ${uuid}: ${err.message}.`);
    }
  }
}

async function processCurrentStatus(data, monitor, gestor) {
  const resp = await monitor.agent.sendContext(data);
  const adaptationPackages = gestor.extractAdaptPack(resp);

  if (adaptationPackages && adaptationPackages.length > 0) {
    const popupWindow = getPopupWindow();
    if (popupWindow && !popupWindow.isDestroyed()) {
      try {
        popupWindow.webContents.send('adaptation-packages', adaptationPackages, gestor.getIdCliente(), gestor.mode);
        //console.log('[WS] Paquetes enviados al popup.');
      } catch (err) {
        console.error(`[${new Date().toLocaleTimeString()}] Error sending adaptations packages to popup: ${err.message}.`);
      }
    } else {
      console.log(`[${new Date().toLocaleTimeString()}] No bubble/popup running.`);
    }
  } else {
    console.log(`[${new Date().toLocaleTimeString()}] LLM response: `, resp);
  }
}

function getMonitorGestor(uuid) {
  try {
    const monitor = monitores.get(uuid);
    const gestor = gestores.get(uuid);
    return { monitor, gestor };
  } catch (error) {
    console.error(`[${new Date().toLocaleTimeString()}] Fail obtaining monitor-manager to ${uuid} client: ${error}.`);
    return;
  }
}

async function applyNewConfig(newConfig) {
  for (const [uuid, gestor] of gestores.entries()) {
    if (newConfig.gestor?.mode && gestor.mode !== newConfig.gestor.mode) {
      console.log(`[${new Date().toLocaleTimeString()}] Manager ${uuid} mode changed to: ${newConfig.gestor.mode}`);
      gestor.mode = newConfig.gestor.mode;
    }
  }

  for (const [uuid, interval] of intervals.entries()) {
    const ws = clients.get(uuid);
    if (!ws || ws.readyState !== WebSocket.OPEN) continue;

    const currentInterval = interval._idleTimeout / 1000;
    const newInterval = newConfig.monitor.sampleInterval;
    if (currentInterval !== newInterval) {
      console.log(`[${new Date().toLocaleTimeString()}] Monitor ${uuid} interval value changed to: ${newInterval} seconds.`);
      clearInterval(interval);
      const newInt = setInterval(() => {
        ws.send(JSON.stringify({ type: 'current-state' }));
      }, newInterval * 1000);
      intervals.set(uuid, newInt);
    }
  }

  for (const [uuid, monitor] of monitores.entries()) {
    const currentModel = monitor.agent.modelo;
    const newModel = newConfig.monitor?.agente?.modelo;
    if (newModel && currentModel !== newModel) {
      console.log(`[${new Date().toLocaleTimeString()}] Changing LLM model for monitor ${uuid} → ${newModel}`);
      await monitor.agent.changeModel(newModel);
    }
  }
}

module.exports = { runServer, sendToClient, processCurrentStatus, getMonitorGestor, applyNewConfig };