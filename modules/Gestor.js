const path = require('path');

class Gestor {
    constructor(idCliente = null) {
        this.idCliente = idCliente;
        this.mode = "automatico";
        this.adaptaciones = null;
    }
    getIdCliente(){
        return this.idCliente;
    }
    destroy() {
        this.idCliente = null;
        this.mode = null;        
        this.bubble = null;
        this.adaptaciones = null;
    }

    extractAdaptPack(sanitizedResp) {
        const sugerencias = sanitizedResp.sugerencias || {};
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
                    console.log(`[Cliente ${this.idCliente}]\n\tAdaptación: ${adaptKey}\n\tValor sugerido: ${valor}\n\tMotivo: ${motivo}`);
                    adaptations.push({ key: adaptKey, valor, motivo });
                }

                packages.push({ packageName: packName, adaptations });
            }
        } else {
            console.log(`[AGENT ${this.idCliente}] Sin sugerencias`);
        }

        return packages;
    }
}

module.exports = Gestor;
