let currentUuid = null; 
let lastPayload = {};

// document.addEventListener('DOMContentLoaded', () => {
//     promptGenerator();
// });

window.monitor.onUpdate((data) => {
    currentUuid = data.uuid;
    console.log(`[${new Date().toLocaleTimeString()}] Received data in manager: ${data.info}.`);

    // If receving partial data, merge with last payload.
    const payload = data.info.payload || {};
    lastPayload = {
        ...lastPayload,
        ...payload,
        app: {
            ...lastPayload.app,
            ...payload.app,
            availableAdaptations: {
                ...(lastPayload.app?.availableAdaptations || {}),
                ...(payload.app?.availableAdaptations || {})
            }
        }
    };

    const available = lastPayload.app?.availableAdaptations;
    if (!available) {
        console.warn(`[${new Date().toLocaleTimeString()}] No available adaptations yet.`);
        return;
    }

    const container = document.getElementById('buttons-container');
    container.innerHTML = '';
    const adapFields = {};
    const valueFields = {};

    Object.entries(available).forEach(([mutation, values]) => {
        const formatField = mutation.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        adapFields[mutation] = formatField;

        values.forEach(val => {
            if (!valueFields[val]) {
                const formatValue = val.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                valueFields[val] = formatValue;
            }
        });
    });

    console.log('Campos de adaptación:', adapFields);
    console.log('Valores de adaptación:', valueFields);

    Object.entries(available).forEach(([mutation, values]) => {
        const group = document.createElement('div');
        group.className = 'adaptation-group';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'adaptation-title';
        titleDiv.textContent = adapFields[mutation] || mutation;
        group.appendChild(titleDiv);

        values.forEach(val => {
            const btn = document.createElement('button');
            btn.textContent = valueFields[val] || val;
            btn.onclick = () => {
                window.monitor.sendMutation(currentUuid, mutation, val);
            };
            group.appendChild(btn);
        });

        container.appendChild(group);
    });
});

// Limpieza de la UI cuando el cliente se desconecta
window.monitor.onClearContent(() => {
    console.log(`[${new Date().toLocaleTimeString()}] Clearing gestor UI (client disconnected).`);

    // 🔹 Reinicia variables internas
    currentUuid = null;
    lastPayload = {};

    // 🔹 Limpia el contenedor principal de botones
    const container = document.getElementById('buttons-container');
    if (container) {
        container.innerHTML = '';
    }

});



// function promptGenerator() {
//     const sendBtn = document.getElementById('send-prompt');
//     const inputTxt = document.getElementById('prompt-input');
//     const outputTxt = document.getElementById('prompt-output');

//     sendBtn.onclick = async () => {
//         const clearTxt = inputTxt.value.trim();

//         if (!clearTxt) {
//             alert("El campo de entrada no puede estar vacío.");
//             return;
//         }
//         if (!currentUuid) {
//             alert("UUID no disponible aún. Espera unos segundos.");
//             return;
//         }

//         outputTxt.value = "Generando respuesta...";

//         try {
//             const result = await window.monitor.generatePrompt(JSON.parse(inputTxt), currentUuid);
//             outputTxt.value = result || "No se obtuvo respuesta.";
//         } catch (error) {
//             console.error(error);
//             outputTxt.value = "Error al generar contenido.";
//         }
//     };
// } 