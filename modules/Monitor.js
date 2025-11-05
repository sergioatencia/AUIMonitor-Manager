const AUIAgent = require('./agent');

class Monitor {
    constructor(idclient = null, monitorConfig = {}) {
        this.idclient = idclient;
        this.data = null;
        this.agent = new AUIAgent(monitorConfig.agente.model);
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
    setKnwBase(knwb){
        this.knwb = knwb;
    }

    async launchAgent() {
        await this.agent.run(this.knwb);
    }
    destroy() {
        this.idclient = null;
        this.data = null;
        this.agent.destroy();
        this.agent = null;
        this.knwb = null;
    }

    generateKnowledgeBase(payload) {
        const knowledgeBase = JSON.stringify(payload, null, 2);
        this.setKnwBase(knowledgeBase);
        return knowledgeBase;
    }

    generateContext(payload) {
        return JSON.stringify(payload, null, 2);
    }
}

module.exports = Monitor;