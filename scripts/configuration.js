let initialConfig = null;

window.addEventListener('DOMContentLoaded', async () => {
    if (!window.electronAPI) return;

    const config = await window.electronAPI.getConfig();
    console.log("Configuración actual:", config);
    initialConfig = config;

    if (config.monitor) {
        document.getElementById('sample-interval').value = config.monitor.sampleInterval ?? 60;
        document.getElementById('sessionPath').value = config.monitor.sessionPath ?? '';
        document.getElementById('model-agent').value = config.monitor.agente.model ?? 'gemini-2.0-flash';
    }

    if (config.gestor) {
        document.getElementById('mode').value = config.gestor.mode ?? 'automatico';
    }
});

function openPage(pageName, elmnt) {
    const tabcontent = document.getElementsByClassName("tabcontent");
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    const tablinks = document.getElementsByClassName("tablink");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].style.backgroundColor = "";
    }
    document.getElementById(pageName).style.display = "block";
    elmnt.style.backgroundColor = "#363636ff";
}

document.getElementById("defaultOpen").click();

async function selectFolder() {
    if (window.electronAPI && window.electronAPI.selectDirectory) {
        const folderPath = await window.electronAPI.selectDirectory();
        if (folderPath) {
            document.getElementById("sessionPath").value = folderPath;
        }
    } else {
        alert("API de Electron no disponible");
    }
}

async function saveSettings(formId) {
    const form = document.getElementById(formId);
    const data = {};

    for (let element of form.elements) {
        if (element.name && element.type !== 'button') {
            const keys = element.name.split('.');
            let target = data;
            while (keys.length > 1) {
                const key = keys.shift();
                if (!target[key]) target[key] = {};
                target = target[key];
            }
            target[keys[0]] = element.value;
        }
    }

    let update = {};
    if (formId === 'monitorForm') update = { monitor: data };
    if (formId === 'gestorForm') update = { gestor: data };

    if (window.electronAPI?.updateConfig) {
        const result = await window.electronAPI.updateConfig(update);
        if (result?.success) {
            showToast("✅ Cambios guardados", "success");
        } else {
            showToast("Se produjo un error: " + (result?.message || "Desconocido"), "error");
        }
    } else {
        showToast("Error: API de Electron no disponible", "error");
    }
}


function restoreFormValues(form, section, prefix = '') {
    for (const [key, value] of Object.entries(section)) {
        const fieldName = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null) {
            restoreFormValues(form, value, fieldName);
        } else {
            const input = form.querySelector(`[name="${fieldName}"]`);
            if (input) input.value = value;
        }
    }
}

function cancelSettings(formId) {
    const form = document.getElementById(formId);
    const section = formId === 'monitorForm' ? initialConfig.monitor : initialConfig.gestor;
    restoreFormValues(form, section);
    showToast("❌ Cambios desechados", "error");
}

function showToast(message, type = 'success', duration = 3000) {
    const container = document.getElementById('toastContainer');

    const toast = document.createElement('div');
    toast.classList.add('toast', type);
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => container.removeChild(toast), 300);
    }, duration);
}