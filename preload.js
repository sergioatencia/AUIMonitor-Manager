const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('monitor', {
  onUpdate: (callback) => {
    ipcRenderer.on('monitor-update', (event, data) => callback(data));
    // window.addEventListener('monitor-update', (event) => callback(event.detail));
  },
  sendMutation: (uuid, mutation, value) => {
    console.log(`[Monitor] Enviando mutación ${mutation}=${value} al cliente ${uuid}.`);
    ipcRenderer.send('send-mutation', { uuid, mutation, value });
  },
  generatePrompt: (text) => ipcRenderer.send('send-context', { text, uuid }),
  sendKnowledge: (knowledge) => {
    console.log('[Monitor] Enviando conocimiento inicial al main:', knowledge);
    ipcRenderer.send('send-knowledge', knowledge);
  }
});

contextBridge.exposeInMainWorld('bubble', {
  moveBubble: (dx, dy) => ipcRenderer.send('move-bubble', { dx, dy }),
})




/*

ipcRenderer.on('show-suggestion-buttons', (_, { uuid, buttons }) => {
  const container = document.getElementById('suggestion-container');
  container.innerHTML = '';

  buttons.forEach(btn => {
    const buttonEl = document.createElement('button');
    buttonEl.textContent = btn.packageName;
    buttonEl.classList.add('suggestion-btn');

    buttonEl.addEventListener('click', () => {
      // Mostrar motivos en el chat
      btn.adaptations.forEach(a => {
        const msg = document.createElement('div');
        msg.textContent = `(${a.key}) ${a.motivo}`;
        msg.classList.add('chat-msg');
        container.appendChild(msg);
      });

      // Enviar al servidor las adaptaciones para aplicar mutaciones
      ipcRenderer.send('apply-suggestions', { uuid, adaptations: btn.adaptations });
    });

    container.appendChild(buttonEl);
  });
*/