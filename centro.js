class Monitor{
    constructor(idclient = null){
        this.idclient = idclient;
        this.data = [];
        this.lastSession = null;
    }
    getIdClient(){
        return this.idclient;
    }
    getData(){
        return this.data;
    }
    getLastSession(){
        return this.lastSession;
    }
    setIdClient(idC){
        this.idclient = idC;
    }
    setData(data){
        this.data = data;
    }
    setLastSession(path){
        this.lastSession = path;
    }
    destroy(){
        this.idclient = null;
        this.data = [];
        this.lastSession = null;
    }    
}

module.exports = Monitor;