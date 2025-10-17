const messages = document.getElementById('messages');
const closeBtn = document.getElementById('close');

closeBtn.addEventListener('click', () => {
    window.bubble.togglePopup();
});

// Función para añadir mensajes al popup
function addBotMessage(text, buttons = []) {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex flex-col space-y-2';

    const msg = document.createElement('div');
    msg.className = 'bg-gray-200 text-gray-900 rounded-lg py-2 px-3';
    msg.textContent = text;
    wrapper.appendChild(msg);
    window.bubble.getChatHistory().then(history => {
        history.forEach(msg => addBotMessage(msg));
    });


    if (buttons.length > 0) {
        const btnContainer = document.createElement('div');
        btnContainer.className = 'flex flex-wrap gap-2';
        buttons.forEach(btn => {
            const b = document.createElement('button');
            b.textContent = btn.label;
            b.className = 'bg-gray-800 text-white text-sm rounded-lg px-3 py-1 hover:bg-gray-700';
            b.onclick = () => {
                if (btn.action) btn.action();
            };
            btnContainer.appendChild(b);
        });
        wrapper.appendChild(btnContainer);
    }

    messages.appendChild(wrapper);
    messages.scrollTop = messages.scrollHeight;
}

document.addEventListener('DOMContentLoaded', () => {
    addBotMessage('¡Hola! Soy el agente AUI. ¿En qué puedo ayudarte hoy?');
});
