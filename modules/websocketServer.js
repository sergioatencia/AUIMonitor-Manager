const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const Monitor = require('../centro');
const { sendContext, sendKnwBase } = require('./agent');
const { getPopupWindow } = require('./bubbleWindow');
const fs = require('fs');
const path = require('path');

const url = process.env.URL;
const port = process.env.PORT;
const clients = new Map();

function runServer(mainWindow, secondWindow, bubbleWindow) {
  const wss = new WebSocket.Server({ port });
  console.log(`[WS] Servidor WebSocket activo en ws://${url}:${port}`);

  wss.on('connection', (ws) => {
    ws.uuid = uuidv4();
    clients.set(ws.uuid, ws);
    console.log(`[WS] Cliente conectado: ${ws.uuid}`);

    ws.send(JSON.stringify({ type: 'id-assign', uuid: ws.uuid }));

    const monitor = new Monitor(ws.uuid);

    ws.on('message', async (msg) => {
      try {
        const data = JSON.parse(msg);
        if (data.type === 'last-session') {
          const filePath = path.join(__dirname, '../userssessions', data.filename);
          if (fs.existsSync(filePath)) {
            const lastContent = fs.readFileSync(filePath, 'utf8');
            console.log('LEIDO DE FICHERO: ', lastContent);
            await sendKnwBase(lastContent, ws.uuid);
          } else {
            const content = generateKnowledgeBase(data.payload);
            fs.writeFileSync(filePath, content, 'utf-8');
            await sendKnwBase(content, ws.uuid);
          }

        }
        if (data.type === 'current-state') {
          const context = generateContext(data.payload);
          const adaptationPackages = await sendContext(context, ws.uuid);
          // Si hay paquetes, reenviar al cliente
          if (adaptationPackages && adaptationPackages.length > 0) {
            // adaptationPackages.forEach(pkg => {
            //   console.log(`Paquete: ${pkg.packageName}`);
            //   pkg.adaptations.forEach(adap => {
            //     console.log(`  - Adaptación: ${adap.key}`);
            //     console.log(`    Valor: ${adap.valor}`);
            //     console.log(`    Motivo: ${adap.motivo}`);
            //   });
            // });
            // Enviar los paquetes al popup (burbuja)
            const popupWindow = getPopupWindow();
            if (popupWindow && !popupWindow.isDestroyed()) {
              try {
                popupWindow.webContents.send('adaptation-packages', adaptationPackages, ws.uuid);
                console.log('[WS] Paquetes enviados al popup.');
              } catch (err) {
                console.error('[WS] Error enviando paquetes al popup:', err.message);
              }
            } else {
              // fallback: enviar al bubble o a las otras ventanas si quieres
              if (bubbleWindow && !bubbleWindow.isDestroyed()) {
                try {
                  bubbleWindow.webContents.send('adaptation-packages', adaptationPackages, ws.uuid);
                  console.log('[WS] Paquetes enviados al bubble (fallback).');
                } catch (err) {
                  console.error('[WS] Error enviando paquetes al bubble:', err.message);
                }
              } else {
                console.log('[WS] No hay popup ni bubble disponible para enviar paquetes.');
              }
            }
          } else {
            console.log('[WS] Sin sugerencias :(((');
          }
        }
        monitor.setData(msg.toString());
        console.log("Datos almacenados en el monitor: ", monitor.getData());

        [mainWindow, secondWindow].forEach(win => {
          if (win) win.webContents.send('monitor-update', { info: data.payload, uuid: monitor.getIdClient() });
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


function generateKnowledgeBase(payload) {
  const genreMap = { 1: 'Hombre', 2: 'Mujer', 3: 'Otro' };
  const countryMap = { 1: 'España', 2: 'Portugal', 3: 'Francia', 4: 'Inglaterra', 5: 'Bélgica' };

  const userInfo = payload.user || {};


  const userData = {
    nombre: userInfo.name || 'anonimo',
    edad: getAge(userInfo.birthDate) || 'desconocida',
    sexo: genreMap[userInfo.genre] || 'Desconocido',
    pais: countryMap[userInfo.country] || 'Desconocido'
  };

  const appInfo = payload.app || {};

  const appData = {
    nombre: appInfo.name || 'desconocido',
    tipo: "catalogo de productos",
    vChromium: appInfo.engine || 'desconocido',
    vNode: appInfo.node || 'desconocido',
    vElectron: appInfo.electron || 'desconocido',
    adapActual: appInfo.applied_adaptations || [],
    adapDisponibles: appInfo.available_adaptations || [],
    ultimaSesion: appInfo.navigation || {}
  };

  const platformInfo = payload.platform || {};

  const platformData = {
    hora: platformInfo.time || '',
    so: platformInfo.so || '',
    arquitectura: platformInfo.arch || '',
    nCPUs: platformInfo.cpu || 0,
    ram: platformInfo.ram || 0,
    idiomaDefecto: platformInfo.defaultLang || ''
  };

  const knowledgeBase = { usuario: userData, plataforma: platformData, aplicacion: appData };
  return JSON.stringify(knowledgeBase, null, 2);
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

function generateContext(payload) {
  const context = {
    hora: payload.time,
    tamano_ventana: payload.windowSize,
    adpActual: payload.applied_adaptations,
    navegacion: payload.navigation
  }
  return JSON.stringify(context, null, 2);
}

module.exports = { runServer, sendToClient };
