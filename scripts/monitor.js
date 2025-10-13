const genreMap = {
    1: 'Hombre',
    2: 'Mujer',
    3: 'Otro'
};

const countryMap = {
    1: 'España',
    2: 'Portugal',
    3: 'Francia',
    4: 'Inglaterra',
    5: 'Bélgica'
}

let enviado = false;
let platformInfo = null;
let appInfo = null;
let userInfo = null;

function createJSONContext(userInfo, platformInfo, appInfo) {
    const userData = {
        nick: userInfo.nick,
        nombre: userInfo.name,
        edad: userInfo.age,
        sexo: genreMap[userInfo.genre] || 'Desconocido',
        pais: countryMap[userInfo.country] || 'Desconocido'
    };
    const appData = {
        nombre: appInfo.app,
        tipo: "catalogo de productos",
        vChromium: appInfo.engine,
        vNode: appInfo.node,
        vElectron: appInfo.electron,
        adapActual: appInfo.mutations,
        adapDisponibles: appInfo.all_mutations
    };
    const platformData = {
        hora: platformInfo.time,
        so: platformInfo.os,
        arquitectura: platformInfo.arch,
        nCPUs: platformInfo.cpu,
        ram: platformInfo.ram,
        idiomaDefecto: platformInfo.defaultLang
    };
    const context = { usuario: userData, aplicacion: appData, plataforma: platformData };
    console.log("Contexto para el LLM GEMINI: ", context);
    window.monitor.sendContext(context);
}



function sendContext(){
    if (!enviado && userInfo !== null && platformInfo !== null && appInfo !== null) {
        createJSONContext(userInfo, platformInfo, appInfo);
        enviado = true;
    }
}

window.monitor.onUpdate((data) => {
    const payload = data.info.payload;

    if (data.info.type === 'platform-info') {
        document.getElementById('platform-time').textContent = payload.time;
        document.getElementById('platform-os').textContent = payload.os;
        document.getElementById('platform-arch').textContent = payload.arch;
        document.getElementById('platform-core').textContent = payload.cpu;
        document.getElementById('platform-ram').textContent = payload.ram;
        document.getElementById('platform-defaultLang').textContent = payload.defaultLang;

        if (!enviado) platformInfo = payload;
    }

    if (data.info.type === 'app-info') {
        document.getElementById('platform-time').textContent = payload.time;
        document.getElementById('app-name').textContent = payload.app;
        document.getElementById('app-chronium').textContent = payload.engine;
        document.getElementById('app-node').textContent = payload.node;
        document.getElementById('app-electron').textContent = payload.electron;
        document.getElementById('app-screen').textContent = `${payload.windowSize.width} x ${payload.windowSize.height}`;
        const applied = document.getElementById('default-adaptations');
        const available = document.getElementById('available-adaptations');

        applied.innerHTML = '';
        available.innerHTML = '';

        for (const key in payload.mutations) {
            const li = document.createElement('li');
            li.textContent = `${key}: ${payload.mutations[key]}`;
            applied.appendChild(li);
        }

        for (const key in payload.all_mutations) {
            const li = document.createElement('li');
            li.textContent = `${key}: ${payload.all_mutations[key].join(', ')}`;
            available.appendChild(li);
        }

        if (!enviado) appInfo = payload;
    }

    if (data.info.type === 'user-info') {
        const genreNumber = payload.user.genre;
        const countryNumber = payload.user.country;

        document.getElementById('platform-time').textContent = payload.time;
        document.getElementById('user-name').textContent = payload.user.name;
        document.getElementById('user-surname').textContent = payload.user.surname;
        document.getElementById('user-gender').textContent = genreMap[genreNumber] || 'Desconocido';
        document.getElementById('user-age').textContent = payload.user.age;
        document.getElementById('user-email').textContent = payload.user.email;
        document.getElementById('user-address').textContent = payload.user.address;
        document.getElementById('user-city').textContent = payload.user.city;
        document.getElementById('user-country').textContent = countryMap[countryNumber] || 'Desconocido';

        if (!enviado) userInfo = payload.user;
    }

    if (data.info.type === 'window-resize') {
        const w = payload.width;
        const h = payload.height;
        document.getElementById('app-screen').textContent = `${w} x ${h}`;
    }
    
    sendContext();
});