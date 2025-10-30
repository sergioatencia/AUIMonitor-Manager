require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const geminiApiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenAI({ apiKey: geminiApiKey });

//const agentAUIinstructions = require('../agentAUInstructions').initialInstructions;
const agentAUIinstructions = "Eres un **Agente de Interfaz de Usuario Adaptativa (AUI)**. Sugiere adaptaciones para mejorar la UX. Recibes contexto inicial (usuario, aplicación, plataforma) en JSON, seguido de actualizaciones: `{'hora', 'tamano_ventana', 'adpActual': {<adaptacion>:<valor>,...}, 'navegacion': []}`. Debes sugerir, solo si es necesario, adaptaciones agrupadas en paquetes. Responde **SOLO** con un objeto JSON válido, **sin delimitadores de bloque de código** (```json o ```), que siga estrictamente este formato:`{'sugerencias':{'paquete_N':{<adaptacion>:{'valor':'<valor_sugerido>','motivo':'<motivo_breve>'},...},...}}`**IMPORTANTE:** Usa la clave **'valor'** para el valor de la adaptación y **'motivo'** para una explicación breve.";

class AUIAgent {
  constructor() {
    this.sysInstructions = agentAUIinstructions;
    this.chat = null;
  }

  async run() {
    this.chat = genAI.chats.create({
      model: 'gemini-2.0-flash',
      config: { systemInstruction: this.sysInstructions },
    });
  }
  // Envía conocimiento base
  async sendKnwBase(knwb) {
    if (!this.chat) throw new Error("Agente no inicializado. Ejecuta init() primero.");
    const resp = await this.chat.sendMessage({ message: knwb });
    console.log("[AGENT] Respuesta base conocimiento:", resp.text);
  }

  // Envía contexto y recibe adaptaciones
  async sendContext(context) {
    if (!this.chat) throw new Error("Agente no inicializado. Ejecuta init() primero.");
    try {
      const resp = await this.chat.sendMessage({ message: context });
      const respText = resp.text;
      const cleanedResp = respText.replace(/^```json\s*/, '').replace(/\s*```$/, '');

      return JSON.parse(cleanedResp);
    } catch (err) {
      console.error('[AGENT] Error al procesar la respuesta:', err);
      return [];
    }
  }
}

module.exports = AUIAgent;
