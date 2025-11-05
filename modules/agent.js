require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const geminiApiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenAI({ apiKey: geminiApiKey });

const agentAUIinstructions = "Eres un **Agente de Interfaz de Usuario Adaptativa (AUI)**. Sugiere adaptaciones para mejorar la UX. Recibes contexto inicial (usuario, aplicación, plataforma) en JSON, seguido de actualizaciones: `{'hora', 'tamano_ventana', 'adpActual': {<adaptacion>:<valor>,...}, 'navegacion': []}`. Debes sugerir, solo si es necesario, adaptaciones agrupadas en paquetes. Responde **SOLO** con un objeto JSON válido, **sin delimitadores de bloque de código** (```json o ```), que siga estrictamente este formato:`{'sugerencias':{'paquete_N':{<adaptacion>:{'valor':'<valor_sugerido>','motivo':'<motivo_breve>'},...},...}}`**IMPORTANTE:** Usa la clave **'valor'** para el valor de la adaptación y **'motivo'** para una explicación breve. En algunos casos puedes recibir el mensaje 'Sugiéreme un nuevo paquete de adaptaciones con el contexto actual', por lo que tendrás que repetir el proceso anterior con nuevas adaptaciones en base a la última actualización recibida.";

class AUIAgent {
  constructor(model = "gemini-2.0-flash") {
    this.model = model;
    this.sysInstructions = agentAUIinstructions;
    this.chat = null;
    this.knwbcopy = null;
  }

  async run(knwb) {
    try {
      this.knwbcopy = knwb;
      this.chat = genAI.chats.create({
        model: this.model,
        config: { systemInstruction: this.sysInstructions },
        history: [{
          role: "user",
          parts: [
            { text: "Base del conocimiento:" },
            { text: knwb },
          ]
        }]
      });
    } catch (err) {
      console.error(`[AUIAgent] Error initializing chat: ${err.message}`);
      this.chat = null;
    }
  }

  // async sendKnwBase(knwb) {
  //   if (!this.chat) throw new Error(`[${new Date().toLocaleTimeString()}] LLM agent not running. Please call the init() function first.`);
  //   const resp = await this.chat.sendMessage({ message: knwb });
  //   //console.log("[AGENT] Respuesta base conocimiento:", resp.text);
  // }

  async sendContext(context) {
    if (!this.chat) throw new Error(`[${new Date().toLocaleTimeString()}] LLM agent not running. Please call the init() function first.`);
    try {
      const resp = await this.chat.sendMessage({ message: context });
      const respText = resp.text;
      const cleanedResp = respText.replace(/^```json\s*/, '').replace(/\s*```$/, '');

      return JSON.parse(cleanedResp);
    } catch (err) {
      console.error(`[${new Date().toLocaleTimeString()}] Procesing LLM agent answer error: ${err}.`);
      return [];
    }
  }

  async changeModel(newModel) {
    if (newModel !== this.model) {
      console.log(`Cambiando modelo de ${this.model} → ${newModel}`);
      this.model = newModel;
      const knwb = this.knwbcopy;
      this.destroy();
      await this.run(knwb);
    }
  }

  destroy() {
    if (this.chat) {
      try {
        this.chat = null;
        this.knwbcopy = null;
      } catch (err) {
        console.error(`[AUIAgent] Error while destroying chat: ${err.message}`);
      }
    }
  }
}

module.exports = AUIAgent;