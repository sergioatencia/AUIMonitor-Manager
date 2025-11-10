const AUIAgent = require('./agent');

class Monitor {
    constructor(idclient = null, monitorConfig = {}) {
        this.idclient = idclient;
        this.data = null;
        this.navigation = null;
        this.analyzerAgent = new AUIAgent(monitorConfig.agente.model, "analyzer-data");
        this.plannerAgent = new AUIAgent(monitorConfig.agente.model, "planner-adaptation");
        this.knwb = null;
    }
    getIdClient() {
        return this.idclient;
    }
    getData() {
        return this.data;
    }
    setData(data) {
        this.data = data;
    }
    setKnwBase(knwb) {
        this.knwb = knwb;
    }

    async launchAgent() {
        await this.analyzerAgent.run();
        await this.plannerAgent.run(this.knwb);
    }
    destroy() {
        this.idclient = null;
        this.data = null;
        this.analyzerAgent.destroy();
        this.plannerAgent.destroy();
        this.analyzerAgent = null;
        this.plannerAgent = null;
        this.knwb = null;
    }

    generateKnowledgeBase(payload) {
        const knowledgeBase = JSON.stringify(payload, null, 2);
        this.setKnwBase(knowledgeBase);
        return knowledgeBase;
    }

    getNavigationData(payload) {
        const context = payload.app.navigation;
        this.navigation = context;
        return JSON.stringify(context, null, 2);
    }

    mergeAnalysisContext(analysis, payload) {
        try {
            const analisis = JSON.parse(analysis);
            const windowSize = payload.app.windowSize;
            const currentAdaptations = payload.app.currentAdaptations;
            const resp = {
                analisis,
                currentAdaptations,
                windowSize
            }
            return JSON.stringify(resp, null, 2);

        } catch (error) {

        }
    }
}

module.exports = Monitor;