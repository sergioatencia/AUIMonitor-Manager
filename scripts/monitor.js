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

window.monitor.onUpdate((data) => {
    const payload = data.info.payload;
    const availAdapt = data.info.payload.applied_adaptations || data.info.payload.app.applied_adaptations;
    const recentNavigation = data.info.payload.navigation || data.info.payload.app.navigation;

    const genreNumber = payload.user.userInfo.clientData.genre;
    const countryNumber = payload.user.userInfo.shipmentData.country;
    document.getElementById('platform-time').textContent = payload.time;
    document.getElementById('user-name').textContent = payload.user.userInfo.clientData.name;
    document.getElementById('user-surname').textContent = payload.user.userInfo.clientData.surname;
    document.getElementById('user-gender').textContent = genreMap[genreNumber] || 'Desconocido';
    document.getElementById('user-age').textContent = getAge(payload.user.userInfo.clientData.birthDate);
    document.getElementById('user-email').textContent = payload.user.userInfo.clientData.email;
    document.getElementById('user-address').textContent = [payload.user.userInfo.shipmentData.roadMainInfo, payload.user.userInfo.shipmentData.roadExtraInfo].filter(Boolean).join(" ");
    document.getElementById('user-city').textContent = payload.user.userInfo.shipmentData.city;
    document.getElementById('user-country').textContent = countryMap[countryNumber] || 'Desconocido';


    document.getElementById('platform-os').textContent = payload.platform.os;
    document.getElementById('platform-arch').textContent = payload.platform.arch;
    document.getElementById('platform-core').textContent = payload.platform.cpu;
    document.getElementById('platform-ram').textContent = payload.platform.ram;
    document.getElementById('platform-defaultLang').textContent = payload.platform.defaultLang;


    document.getElementById('app-name').textContent = payload.app.name;
    document.getElementById('app-chronium').textContent = payload.app.engine;
    document.getElementById('app-node').textContent = payload.app.node;
    document.getElementById('app-electron').textContent = payload.app.electron;
    document.getElementById('app-screen').textContent = `${payload.app.windowSize.width} x ${payload.app.windowSize.height}`;
    const applied = document.getElementById('default-adaptations');
    const available = document.getElementById('available-adaptations');

    applied.innerHTML = '';
    available.innerHTML = '';

    for (const key in availAdapt) {
        const li = document.createElement('li');
        li.textContent = `${key}: ${availAdapt[key]}`;
        applied.appendChild(li);
    }

    for (const key in payload.app.available_adaptations) {
        const li = document.createElement('li');
        li.textContent = `${key}: ${payload.app.available_adaptations[key].join(', ')}`;
        available.appendChild(li);
    }

    document.getElementById('navigation-sequence').textContent = JSON.stringify(recentNavigation, null, 2);

});