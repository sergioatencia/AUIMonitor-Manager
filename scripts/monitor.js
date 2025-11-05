let lastPayload = {};

window.monitor.onUpdate((data) => {
    console.log(`[${new Date().toLocaleTimeString()}] Received data in monitor: ${data}.`);
    const payload = data.info.payload;

    lastPayload = {
        ...lastPayload,
        ...payload,
        user: { ...lastPayload.user, ...payload.user },
        environment: { ...lastPayload.environment, ...payload.environment },
        platform: { ...lastPayload.platform, ...payload.platform },
        app: { ...lastPayload.app, ...payload.app }
    };

    const full = lastPayload;

    if (full.user) {
        document.getElementById('user-name').textContent = full.user.name ?? '';
        document.getElementById('user-surname').textContent = full.user.lastName ?? '';
        document.getElementById('user-genre').textContent = full.user.genre ?? '';
        document.getElementById('user-age').textContent = full.user.age ?? '';
        document.getElementById('user-city').textContent = full.user.city ?? '';
        document.getElementById('user-country').textContent = full.user.country ?? '';
    }

    // --- Sección: Entorno ---
    if (full.environment) {
        document.getElementById('environment-timeZone').textContent = full.environment.timeZone ?? '';
        document.getElementById('environment-countryCode').textContent = full.environment.countryCode ?? '';
        document.getElementById('environment-date').textContent = full.environment.date ?? '';
        document.getElementById('environment-day').textContent = full.environment.day ?? '';
        document.getElementById('environment-time').textContent = full.environment.time ?? '';
    }

    if (full.platform) {
        document.getElementById('platform-os').textContent = full.platform.os ?? '';
        document.getElementById('platform-arch').textContent = full.platform.arch ?? '';
        document.getElementById('platform-numCPU').textContent = full.platform.numCPUs ?? '';
        document.getElementById('platform-totalRAM').textContent = full.platform.ramSizeGB ? `${full.platform.ramSizeGB} GB` : '';
        document.getElementById('platform-defaultLang').textContent = full.platform.defaultLang ?? '';
    }

    if (full.app) {
        document.getElementById('app-name').textContent = full.app.name ?? '';
        document.getElementById('app-type').textContent = full.app.type ?? '';
        if (full.app.windowSize) {
            document.getElementById('app-screen').textContent = `${full.app.windowSize.width} x ${full.app.windowSize.height}`;
        }
        document.getElementById('app-cpuUsage').textContent = full.app.cpuUsagePercent ? `${full.app.cpuUsagePercent} %` : '';
        document.getElementById('app-ramUsage').textContent = full.app.ramUsageMB ? `${full.app.ramUsageMB} MB` : '';
        if (full.app.navigation) {
            document.getElementById('navigation-sequence').textContent = JSON.stringify(full.app.navigation, null, 2);
        }

        const current = document.getElementById('current-adaptations');
        const available = document.getElementById('available-adaptations');

        if (full.app.currentAdaptations) {
            current.innerHTML = '';
            for (const key in full.app.currentAdaptations) {
                const li = document.createElement('li');
                li.textContent = `${key}: ${full.app.currentAdaptations[key]}`;
                current.appendChild(li);
            }
        }

        if (full.app.availableAdaptations) {
            available.innerHTML = '';
            for (const key in full.app.availableAdaptations) {
                const li = document.createElement('li');
                li.textContent = `${key}: ${full.app.availableAdaptations[key].join(', ')}`;
                available.appendChild(li);
            }
        }
    }
});

window.monitor.onClearContent(() => {
    console.log(`[${new Date().toLocaleTimeString()}] Clearing monitor UI (client disconnected).`);
    lastPayload = {};
    const textFields = [
        'user-name', 'user-surname', 'user-genre', 'user-age', 'user-city', 'user-country',
        'environment-timeZone', 'environment-countryCode', 'environment-date',
        'environment-day', 'environment-time',
        'platform-os', 'platform-arch', 'platform-numCPU', 'platform-totalRAM', 'platform-defaultLang',
        'app-name', 'app-type', 'app-screen', 'app-cpuUsage', 'app-ramUsage', 'navigation-sequence'
    ];

    textFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '';
    });

    ['current-adaptations', 'available-adaptations'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
    });
});