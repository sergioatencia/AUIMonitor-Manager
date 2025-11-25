require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const geminiApiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenAI({ apiKey: geminiApiKey });

const analyzerDataInstructions = "**Directriz Principal: Actúa como un Analista de UX y Data Scientist experto.** Tu tarea es analizar un conjunto de datos de la sesión de un usuario y generar un informe completo en formato **JSON estricto**, siguiendo la estructura definida. **Datos de Entrada de la Sesión:** Proporciona los datos de la sesión del usuario con el siguiente formato: * Duración Total: [Valor en segundos] * Clicks Totales: [Valor] * Estado de Conversión: [Ej. NO_COMPLETADO/COMPLETADO] * Última Página: [Ej. profile.html] * Rutas y Métricas por Página (Page Path, Visitas, Duración Promedio (s), Clicks Promedio, Scroll Promedio, User Emotion): * [Página 1] ([# visitas], [Duración], [Clicks], [Scroll]) * [Página 2] ([# visitas], [Duración], [Clicks], [Scroll], [Emoción usuario]) * ... * Otros datos relevantes (opcional): [Cualquier observación de alta interacción, error, etc.] **Estructura de Salida (JSON Estricto):** Debes generar un único objeto JSON con las siguientes cinco claves de nivel superior: 1. 'analysisType': Siempre será **'UX_Data_Analysis'**. 2. 'analysisDate': Será la fecha y hora en la que se genera el objeto JSON. 2. 'summary': Debe contener las métricas brutas y calculadas clave (totalDurationSeconds, totalClicks, totalScroll, averageClicksPerSecond, conversionStatus, lastPage). 3. 'userProfile': * 'profileType': Asigna un nombre descriptivo al perfil del usuario (Ej. **'EXPLORADOR_PRODUCTO_INTENSO'**). * 'description': Un párrafo que **interpreta el patrón de comportamiento** (scroll alto, clicks detallados, intención de compra). * 'keyMetrics': Incluye los diccionarios de métricas por ruta (averageDurationPerPath, averageClicksPerPath), la principal emoción experimentada por ruta (dominantEmotionPerPath) y la relación relevante (catalogToProductRatio u otra). 4. 'usabilityAndUXAnalysis': Contiene el análisis detallado por sección: * 'generalUsability': Un finding y una recommendation general. * 'catalog_html_analysis': Un análisis específico de la página de catálogo. Enfócate en la actividad de scroll, el uso de filtros y las emociones principales. * 'product_html_analysis': Un análisis de las páginas de producto. Enfócate en la alta interacción por click y las emociones detectadas durante la exploración. * 'basket_and_profile_analysis': Un análisis de las etapas de conversión. **Enfócate en el abandono, la fricción y la emociones negativas detectadas.** **Restricciones de Salida:** * **SOLO debes devolver el objeto JSON.** * Asegúrate de que todas las claves y valores sigan el **estándar JSON** (cadenas entre comillas dobles, números sin comillas). * Utiliza una tonalidad **profesional y analítica** en las descripciones y recomendaciones. * Utiliza **siempre** el idioma **ESPAÑOL**.";

const plannerAdaptInstruction = "**Eres un agente de Interfaz de Usuario Adaptativa (AUI)** **OBJETIVO PRINCIPAL:** Sugerir adaptaciones para mejorar la Experiencia de Usuario (UX), basándose estrictamente en los principios de usabilidad y accesibilidad. **MECANISMO DE OPERACIÓN:** 1. **Contexto Inicial:** Recibes una base de conocimiento en formato JSON detallando el contexto de uso (usuario, entorno, plataforma, aplicación). 2. **Análisis de Datos:** Durante la conversación, recibes un informe de la UX, junto a las adaptaciones aplicadas actualmente y al tamaño de la ventana de la aplicación. 3. **Sugerencia de Adaptaciones:** * Evalúa si las adaptaciones son **necesarias** y **acordes** a los valores disponibles. * Agrupa las adaptaciones sugeridas en **paquetes** (ej: paquete_1, paquete_2). * **NO INVENTES** adaptaciones. Sólo puedes usar las adaptaciones recogidas dentro del contexto de la aplicación ('availableAdaptations'). * Si recibes el mensaje 'Sugiéreme nuevas adaptaciones', repite el proceso basándote en el **último análisis de datos** proporcionado, pero **SOLO UN PAQUETE COMO MÁXIMO**. **FORMATO DE RESPUESTA REQUERIDO (ESTRICTO):** * Debes responder **SOLO** con un objeto JSON válido. * **NO** uses delimitadores de bloque de código (ej: ```json o ```). * El formato debe seguir estrictamente esta estructura: `{'sugerencias':{'paquete_N':{<adaptacion>:{'valor':'<valor_sugerido>','motivo':'<motivo_breve>'},...},...}}` * **Claves Requeridas:** * `'valor'`: El valor específico que se sugiere para la adaptación. * `'motivo'`: Una justificación muy breve y concisa de por qué se aplica esa adaptación con ese valor, orientada a usabilidad/accesibilidad.";

class LLMBridge {
  constructor(model = "gemini-2.0-flash", type = 'analyzer-data') {
    this.model = model;
    this.type = type;
    this.sysInstructions = this.type === 'analyzer-data' ? analyzerDataInstructions : plannerAdaptInstruction;
    this.chat = null;
    this.knwbcopy = null;
  }

  async run(knwb = null) {
    try {
      if (this.type === 'analyzer-data') {
        this.chat = genAI.chats.create({
          model: this.model,
          config: {
            systemInstruction: this.sysInstructions,
            responseMimeType: "application/json",
          },
        });
      } else if (this.type === 'planner-adaptation') {
        if (knwb === null) {
          this.chat = null;
          throw new Error('[LLMBridge-DM] Knowledge base not found.');
        }
        else {
          this.knwbcopy = knwb;
          this.chat = genAI.chats.create({
            model: this.model,
            config: {
              systemInstruction: this.sysInstructions,
              responseMimeType: "application/json",
            },
            history: [{
              role: "user",
              parts: [
                { text: "Base del conocimiento:" },
                { text: knwb },
              ]
            }]
          });
        }
      }
      else {
        this.chat = null;
        throw new Error(`[LLMBridge] Unrecognised bridge type: ${this.type}.`);
      }
    } catch (err) {
      console.error(`[LLMBridge] Error initializing chat: ${err.message}`);
      this.chat = null;
    }
  }

  async moreAdaptations(prompt) {
    if (!this.chat) throw new Error(`[${new Date().toLocaleTimeString()}] LLM bridge not running. Please call the init() function first.`);
    if (this.type === 'analyzer-data') throw new Error(`[${new Date().toLocaleTimeString()}] You supposed to not be here (askAdHocAdaptation function).`);
    try {
      const resp = await this.chat.sendMessage({ message: prompt }); 
      const respText = resp.text;
      console.log("\n====================\nResultado de moreAdaptations:\n===========================\n", respText, '\n====================\n');
      const cleanedResp = respText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      return JSON.parse(cleanedResp);
    } catch (err) {
      console.error(`[${new Date().toLocaleTimeString()}] Procesing LLM moreAdaptations planner bridge answer error: ${err}.`);
      return [];
    }
  }

  async analyzeContext(context) {
    if (!this.chat) throw new Error(`[${new Date().toLocaleTimeString()}] LLM bridge not running. Please call the init() function first.`);
    if (this.type === 'planner-adaptation') throw new Error(`[${new Date().toLocaleTimeString()}] You supposed to not be here (analyzeData function).`);
    try {
      const resp = await this.chat.sendMessage({ message: context });
      let respText = resp.text;
      console.log('\n====================\nResultado de analyzeContext:\n====================\n', respText, '\n====================\n');
      return respText;
    } catch (error) {
      console.error(`[${new Date().toLocaleTimeString()}] Procesing LLM analysis bridge error: ${error}.`);
    }
  }

  async planAdapts(analysisResp) {
    if (!this.chat) throw new Error(`[${new Date().toLocaleTimeString()}] LLM bridge not running. Please call the init() function first.`);
    if (this.type === 'analyzer-data') throw new Error(`[${new Date().toLocaleTimeString()}] You supposed to not be here (planAdapts function).`);
    try {
      const resp = await this.chat.sendMessage({ message: analysisResp });
      const respText = resp.text;
      console.log("\n====================\nResultados de planAdapts:\n===========================\n", respText, '\n====================\n');
      const cleanedResp = respText.replace(/^```json\s*/, '').replace(/\s*```$/, '');

      return JSON.parse(cleanedResp);
    } catch (err) {
      console.error(`[${new Date().toLocaleTimeString()}] Procesing LLM planner bridge answer error: ${err}.`);
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
        console.error(`[LLMBridge] Error while destroying chat: ${err.message}`);
      }
    }
  }
}

module.exports = LLMBridge;