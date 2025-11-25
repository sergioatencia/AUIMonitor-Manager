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
let analysisFile;

function startCommunication(mainWindow, secondWindow, bubbleWindow, config) {
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
    //------------> await monitor.setBridge();
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
          const filename = data.filename.replace(/\s+/g, '');
          const sessionsDirFromApp = config?.monitor?.sessionPath;
          const sessionsDir = sessionsDirFromApp || '../user_sessions';
          let resolvedSessionsDir;
          if (path.isAbsolute(sessionsDir)) {
            resolvedSessionsDir = sessionsDir;
          } else {
            resolvedSessionsDir = path.resolve(__dirname, sessionsDir);
          }

          //const filePath = path.join(__dirname, '../user_sessions', data.filename);
          const filePath = path.join(resolvedSessionsDir, filename);
          fs.mkdirSync(path.dirname(filePath), { recursive: true });
          analysisFile = path.join(__dirname, `${filename.replace(".txt", "")}-analysisUX.log`);
          const content = monitor.generateKnowledgeBase(data.payload);
          await fs.promises.writeFile(filePath, content, 'utf-8');
          //await monitor.bridgesendKnwBase(content);
          await monitor.launchBridge();
          interval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'current-state' }));
            }
          }, config.monitor.sampleInterval * 1000);
          intervals.set(ws.uuid, interval);
        }

        if (data.type === 'current-state') {
          const navigation = monitor.getNavigationData(data.payload);
          await processCurrentStatus(navigation, data.payload, monitor, gestor, bubbleWindow);
        }
        monitor.setData(data);
        [mainWindow, secondWindow].forEach(win => {
          if (win) win.webContents.send('monitor-update', { info: monitor.getData(), uuid: monitor.getIdClient() });
        });

      } catch (err) {
        console.error(`[${new Date().toLocaleTimeString()}] Error processing the message on the server: ${err}.`);
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
        bubbleWindow.webContents.send('clear-bubble-content');

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

async function processCurrentStatus(navigation, data, monitor, gestor, bubbleWindow) {
  const analysisUX = await monitor.analyzerBridge.analyzeContext(navigation);
  await saveAnalysis(analysisUX);
  const context = monitor.mergeAnalysisContext(analysisUX, data);
  const resp = await monitor.plannerBridge.planAdapts(context);
  gestor.extractAdaptPack(resp);
  const adaptationPackages = gestor.getAdaptaciones();

  if (adaptationPackages && adaptationPackages.length > 0) {
    const popupWindow = getPopupWindow();
    if (popupWindow && !popupWindow.isDestroyed()) {
      try {
        popupWindow.webContents.send('adaptation-packages', adaptationPackages, gestor.getIdCliente(), gestor.mode);
        if (!popupWindow.isVisible()) {
          bubbleWindow.webContents.send('counter-up', adaptationPackages.length);
        }
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

async function askNewAdaptations(monitor, gestor, prompt, bubbleWindow) {
  const resp = await monitor.plannerBridge.moreAdaptations(prompt);
  gestor.extractAdaptPack(resp);
  const adaptationPackages = gestor.getAdaptaciones();
  if (adaptationPackages && adaptationPackages.length > 0) {
    const popupWindow = getPopupWindow();
    if (popupWindow && !popupWindow.isDestroyed()) {
      try {
        popupWindow.webContents.send('adaptation-packages', adaptationPackages, gestor.getIdCliente(), gestor.mode);
        if (!popupWindow.isVisible()) {
          bubbleWindow.webContents.send('counter-up', adaptationPackages.length);
        }
      } catch (err) {
        console.error(`[${new Date().toLocaleTimeString()}] Error sending MORE adaptations packages to popup: ${err.message}.`);
      }
    } else {
      console.log(`[${new Date().toLocaleTimeString()}] No bubble/popup running for moreadaptations request.`);
    }
  } else {
    console.log(`[${new Date().toLocaleTimeString()}] LLM moreadaptations response: `, resp);
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
    const currentModel = monitor.analyzerBridge.modelo;
    const newModel = newConfig.monitor?.bridge?.modelo;
    if (newModel && currentModel !== newModel) {
      console.log(`[${new Date().toLocaleTimeString()}] Changing LLM model for monitor ${uuid} → ${newModel}`);
      await monitor.analyzerBridge.changeModel(newModel);
      await monitor.plannerBridge.changeModel(newModel);
    }
  }
}

async function saveAnalysis(analysisUX) {
  try {
    const now = new Date();
    const fecha = now.toLocaleDateString('es-ES');
    const hora = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    const data = JSON.stringify(analysisUX, null, 2);
    const entry = `=== [${fecha} ${hora}] ===\n${data}\n\n`;
    await fs.promises.appendFile(analysisFilePath, entry, 'utf8');
  } catch (err) {
    console.error(`Error guardando analysisUX: ${err.message}`);
  }
}

module.exports = { startCommunication, sendToClient, processCurrentStatus, getMonitorGestor, applyNewConfig, askNewAdaptations };