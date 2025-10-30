const AUIAgent = require('./agent');

class Monitor {
    constructor(idclient = null) {
        this.idclient = idclient;
        this.data = null;
        this.agent = new AUIAgent();
    }
    getIdClient(){
        return this.idclient;
    }
    getData() {
        return this.data;
    }
    setData(data) {
        this.data = data;
    }

    async setAgent() {
        await this.agent.run();
    }
    destroy() {
        this.idclient = null;
        this.data = null;
        this.agent = null;
    }

    generateKnowledgeBase(payload) {
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
    
    generateContext(payload) {
        const context = {
            hora: payload.time,
            tamano_ventana: payload.windowSize,
            adpActual: payload.applied_adaptations,
            navegacion: payload.navigation
        }
        return JSON.stringify(context, null, 2);
    }
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

module.exports = Monitor;