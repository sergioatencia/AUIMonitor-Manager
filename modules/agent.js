const { GoogleGenAI } = require('@google/genai');
const { sendToClient } = require('./websocketServer');
const fs = require('fs');
const path = require('path');

const geminiApiKey = process.env.GEMINI_API_KEY;
const agentAUIinstructions = require('../agentAUInstructions').initialInstructions;

const genAI = new GoogleGenAI({ apiKey: geminiApiKey });

let chat;
let agentReadyResolve;
const agentReady = new Promise(resolve => { agentReadyResolve = resolve; });

// Buffer temporal para conocimientos recibidos antes de que el agente esté listo
const pendingContexts = [];

async function runAgent() {
  chat = genAI.chats.create({
    model: 'gemini-2.0-flash',
    config: { systemInstruction: agentAUIinstructions },
  });

  // Agente listo: procesar contextos pendientes
  agentReadyResolve();
  for (const { context, uuid } of pendingContexts) {
    await sendContext(context, uuid);
  }
  pendingContexts.length = 0; // limpiar buffer
}

// Función para enviar contexto al agente
async function sendContext(context, uuid) {
  if (!chat) {
    // Si el agente no está listo, guardar en buffer
    pendingContexts.push({ context, uuid });
    await agentReady; // asegura que se procesará cuando el agente esté listo
    return;
  }

  try {
    const parsedContext = typeof context === 'string' ? context : JSON.stringify(context, null, 2);
    const resp = (await chat.sendMessage({ message: parsedContext })).text;

    const cleanedResp = resp.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    const objResp = JSON.parse(cleanedResp);

    if (objResp.sugerencias) processSuggestions(objResp.sugerencias, uuid);
    return resp;
  } catch (error) {
    console.error('[AGENT] Error enviando/procesando contexto:', error);
  }
}

// Procesa sugerencias y envía al cliente
function processSuggestions(sugerencias, uuid) {
  if (!sugerencias || typeof sugerencias !== 'object') return;

  const buttons = [];

  for (const packageName of Object.keys(sugerencias)) {
    const packageContent = sugerencias[packageName];
    const adaptations = [];

    for (const adaptationKey in packageContent) {
      const suggestion = packageContent[adaptationKey];
      if (!suggestion) continue;
      adaptations.push({
        key: adaptationKey,
        valor: suggestion.valor,
        motivo: suggestion.motivo
      });
    }

    if (adaptations.length > 0) {
      buttons.push({ packageName, adaptations });
    }
  }
  // Enviar al renderer de la burbuja
  mainWindow.webContents.send('show-suggestion-buttons', { uuid, buttons });
}



module.exports = { runAgent, sendContext, agentReady };
