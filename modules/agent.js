const { GoogleGenAI } = require('@google/genai');

const geminiApiKey = process.env.GEMINI_API_KEY;
//const agentAUIinstructions = require('../agentAUInstructions').initialInstructions;
const agentAUIinstructions = "Eres un **Agente de Interfaz de Usuario Adaptativa (AUI)**. Sugiere adaptaciones para mejorar la UX. Recibes contexto inicial (usuario, aplicación, plataforma) en JSON, seguido de actualizaciones: `{'hora', 'tamano_ventana', 'adpActual': {<adaptacion>:<valor>,...}, 'navegacion': []}`. Debes sugerir, solo si es necesario, adaptaciones agrupadas en paquetes. Responde **SOLO** con un objeto JSON válido, **sin delimitadores de bloque de código** (```json o ```), que siga estrictamente este formato:`{'sugerencias':{'paquete_N':{<adaptacion>:{'valor':'<valor_sugerido>','motivo':'<motivo_breve>'},...},...}}`**IMPORTANTE:** Usa la clave **'valor'** para el valor de la adaptación y **'motivo'** para una explicación breve.";

const genAI = new GoogleGenAI({ apiKey: geminiApiKey });

let chat;

async function runAgent() {
  chat = genAI.chats.create({
    model: 'gemini-2.0-flash',
    config: { systemInstruction: agentAUIinstructions },
  });
  console.log('[AGENT] Agente Gemini inicializado.');
}

// Función para enviar contexto al agente
async function sendKnwBase(knwb) {
  const resp = await chat.sendMessage({ message: knwb });
  console.log("Respuesta base conocimiento: ", resp.text);
}

async function sendContext(context, uuid) {
  try {
    const resp = await chat.sendMessage({ message: context });
    console.log(`[AGENT] Respuesta para ${uuid}: ${resp.text}`);
    const respText = resp.text;

    const cleanedResp = respText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    const satinizedResp = JSON.parse(cleanedResp);
    const adaptPacks = extractAdaptPack(satinizedResp);
    return adaptPacks;
  } catch (err) {
    console.error('[sCtxt] Error al tratar las respuestas: ', err);
  }
}

// =======================================================
// Extrae paquetes de adaptaciones de la respuesta del agente
// =======================================================
function extractAdaptPack(sanitizedResp) {
  const sugerencias = sanitizedResp.sugerencias;
  const packNames = Object.keys(sugerencias);
  const packages = [];

  if (packNames.length > 0) {
    for (const packName of packNames) {
      const packContent = sugerencias[packName];
      const adaptations = [];

      for (const adaptKey in packContent) {
        const suggestion = packContent[adaptKey];
        const valor = suggestion.valor;
        const motivo = suggestion.motivo;

        console.log(`- Adaptación: ${adaptKey}`);
        console.log(`  Valor sugerido: ${valor}`);
        console.log(`  Motivo: ${motivo}`);

        adaptations.push({ key: adaptKey, valor, motivo });
      }

      packages.push({ packageName: packName, adaptations });
    }

    return packages;
  } else {
    console.log('Sin sugerencias');
    return [];
  }
}




module.exports = { runAgent, sendContext, sendKnwBase };
