require('dotenv').config();

const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const WebSocket = require('ws');
const { GoogleGenAI } = require("@google/genai");
const { type } = require('os');

const url = process.env.URL;
const port = process.env.PORT;
const agentAUIinstructions = require('./agentAUInstructions').initialInstructions;
const knowledgeDB = require('./initialKnowledge').conocimientoInicial;
const otromen = require('./otromensaje').otrom;

const geminiApiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenAI({ apiKey: geminiApiKey });
const chat = genAI.chats.create({
  model: 'gemini-2.0-flash',
  config: {
    systemInstruction: agentAUIinstructions,
  }
});


let mainWindow;
let secondWindow;
let tray;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    show: false,
    autoHideMenuBar: true,
    resizable: false,
    icon: path.join(__dirname, 'images', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js') }
  });

  mainWindow.loadFile(path.join(__dirname, 'pages', 'monitor.html'));

  secondWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    show: false,
    autoHideMenuBar: true,
    resizable: false,
    icon: path.join(__dirname, 'images', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js') }
  });

  secondWindow.loadFile(path.join(__dirname, 'pages', 'gestor.html'));

  // 🔒 Evitar destrucción de ventanas al cerrar
  mainWindow.on('close', (event) => {
    event.preventDefault();
    mainWindow.hide(); // Oculta la ventana en lugar de destruirla
  });

  secondWindow.on('close', (event) => {
    event.preventDefault();
    secondWindow.hide();
  });
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'images', 'icon.png'));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Mostrar monitor',
      click: () => {
        mainWindow.show();
      },
    },
    {
      label: 'Mostra gestor',
      click: () => {
        secondWindow.show();
      },
    },
    {
      label: 'Salir',
      click: () => {
        mainWindow.removeAllListeners('close');
        secondWindow.removeAllListeners('close');
        app.quit();
      },
    },
  ]);

  tray.setToolTip('Mi App en la bandeja');
  tray.setContextMenu(contextMenu);

  // Opcional: abrir ventana al hacer doble click en el tray
  tray.on('double-click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  const wss = new WebSocket.Server({ port });
  const idMap = new Map();

  console.log(`[Monitor] Corriendo en ws://${url}:${port}`);

  wss.on('connection', (ws) => {
    ws.uuid = uuidv4();
    idMap.set(ws.uuid, ws);
    console.log(`[Monitor] Cliente ${ws.uuid} conectado.`);

    ws.send(JSON.stringify({
      type: 'id-assign',
      uuid: ws.uuid
    }));

    ws.on('message', (msg) => {
      try {
        const data = { info: JSON.parse(msg), uuid: ws.uuid };

        console.log(`[Monitor] Mensaje recibido del cliente ${ws.uuid}: `, data.info);

        // Reenviar al renderer
        if (mainWindow) {
          mainWindow.webContents.send('monitor-update', data);
        }
        if (secondWindow) {
          secondWindow.webContents.send('monitor-update', data);
        }
      } catch (err) {
        console.error('[Monitor] Error procesando mensaje:', err.message);
      }
    });

    ws.on('close', () => {
      console.log(`[Monitor] Cliente ${ws.uuid} desconectado`);
      idMap.delete(ws.uuid);
    });
  });

  ipcMain.on('send-mutation', (event, { uuid, mutation, value }) => {
    const client = idMap.get(uuid);
    if (client && client.readyState === WebSocket.OPEN) {
      console.log(`[Monitor] Enviando al cliente ${client.uuid}`, mutation, value);
      client.send(JSON.stringify({
        type: 'mutate',
        mutation,
        value
      }));
    } else {
      console.log(`[Monitor] Cliente con UUID ${uuid} no encontrado o desconectado.`);
    }
  });

  ipcMain.on('send-context', async (event, context) => {
    //const initialContext = JSON.stringify(context, null, 2);
    const initialContext = knowledgeDB;
    console.log('Contexto recibido desde monitor:', initialContext);
    await sleep(5000);
    try {
      const respuestaInicial = await chat.sendMessage({
        message: initialContext
      });
      console.log(respuestaInicial.text);

      await sleep(10000);
      const mdf = JSON.stringify(otromen, null, 2);
      const nuevoMensaje = await chat.sendMessage({
        message: mdf
      });
      console.log("Nuevo mensaje: ",nuevoMensaje.text);
    } catch (error) {
      console.error("Error al inicializar el Agente AUI:", error);
    }
  });
});

/* ipcMain.handle('generate-prompt', async (event, inputTxt) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: inputTxt,
    });
    return response.text;
  } catch (err) {
    console.error(err);
    return "Error al generar contenido.";
  }
}); */


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});