const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const Monitor = require('../centro');
const fs = require('fs');
const path = require('path');

const url = process.env.URL;
const port = process.env.PORT;
const clients = new Map();
let knowDoc;

function runServer(mainWindow, secondWindow) {
  const wss = new WebSocket.Server({ port });
  console.log(`[WS] Servidor WebSocket activo en ws://${url}:${port}`);

  wss.on('connection', (ws) => {
    ws.uuid = uuidv4();
    clients.set(ws.uuid, ws);
    console.log(`[WS] Cliente conectado: ${ws.uuid}`);

    ws.send(JSON.stringify({ type: 'id-assign', uuid: ws.uuid }));

    const monitor = new Monitor(ws.uuid);

    setTimeout(() => {
      // Solicitar datos de la última sesión
      ws.send(JSON.stringify({ type: 'request-last-session' }));
    }, 10000);

    ws.on('message', async (msg) => {
      try {
        const data = JSON.parse(msg);
        if (data.type === 'last-session-data') {
          const knowledge = handleLastSessionData(data.payload);
          mainWindow.webContents.send('monitor-update', data);
          await sendContext(knowledge, ws.uuid);

        }
        monitor.setData(msg.toString());
        console.log("Datos almacenados en el monitor: ", monitor.getData());

        [mainWindow, secondWindow].forEach(win => {
          if (win) win.webContents.send('monitor-update', { info: data, uuid: monitor.getIdClient() });
        });
      } catch (err) {
        console.error('[WS] Error procesando mensaje:', err.message);
      }
    });

    ws.on('close', () => {
      console.log(`[WS] Cliente desconectado: ${ws.uuid}`);
      clients.delete(ws.uuid);
      monitor.destroy();
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

function handleLastSessionData(payload) {
  try {
    const appName = payload.app.name || 'desconocido';
    const user = payload.user || {};
    const nombre = user?.userInfo.clientData.name || 'anonimo';
    const apellido = user?.userInfo.clientData.lastName || 'ns/nc';

    const fileName = `${appName}-${nombre}_${apellido}.txt`;
    const dir = path.join(__dirname, '../userssessions');
    const filePath = path.join(dir, fileName);

    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    if (fs.existsSync(filePath)) {
      console.log(`[WS] El archivo ${fileName} ya existe. Datos descartados.`);
      const existingContent = fs.readFileSync(filePath, 'utf-8');
      return existingContent;
    }

    const fileContent = generateKnowledgeBase(payload);
    fs.writeFileSync(filePath, fileContent, 'utf-8');
    console.log(`[WS] Archivo creado: ${fileName}`);
    knowDoc = path.join(filePath);
    return fileContent;
  } catch (err) {
    console.error('[WS] Error guardando datos de sesión:', err.message);
  }
}

function generateKnowledgeBase(payload) {
  const genreMap = {
    1: 'Hombre',
    2: 'Mujer',
    3: 'Otro'
  };

  const countryMap = {
    1: 'España',
    2: 'Portugal',
    3: 'Francia',
    4: 'Inglaterra',
    5: 'Bélgica'
  }

  const userData = {
    nombre: payload.user.userInfo.clientData.name,
    edad: getAge(payload.user.userInfo.clientData.birthDate),
    sexo: genreMap[payload.user.userInfo.clientData.genre] || 'Desconocido',
    pais: countryMap[payload.user.userInfo.shipmentData.country] || 'Desconocido'
  };
  const appData = {
    nombre: payload.app.name,
    tipo: "catalogo de productos",
    vChromium: payload.app.engine,
    vNode: payload.app.node,
    vElectron: payload.app.electron,
    adapActual: payload.app.mutations,
    adapDisponibles: payload.appInfo.all_mutations,
    ultimaSesion: payload.navigation
  };
  const platformData = {
    hora: payload.platform.time,
    so: payload.platform.os,
    arquitectura: payload.platform.arch,
    nCPUs: payload.platform.cpu,
    ram: payload.platform.ram,
    idiomaDefecto: payload.platform.defaultLang
  };
  const knownledgeBase = { usuario: userData, plataforma: platformData, aplicacion: appData };
  return JSON.stringify(knownledgeBase, null, 2);
}

function getAge(birthDate) {
  birthDate = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

module.exports = { runServer, sendToClient };
