let currentUUID = null;
let adaptationPackages = [];

window.addEventListener('DOMContentLoaded', () => {
  const messagesDiv = document.getElementById('chat-messages');
  const form = document.getElementById('chat-form');
  // const input = document.getElementById('chat-input');
  const prmtButton = document.getElementById('prompt-button');

  // --- Función para añadir mensajes al chat ---
  function addMessage(text, sender = 'bot') {
    const msg = document.createElement('div');
    msg.className = sender === 'user' ? 'msg-user' : 'msg-bot';
    msg.textContent = text;
    messagesDiv.appendChild(msg);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  // --- Función para mostrar paquetes de adaptación ---
  function showPackages(packages, modo) {
    if (modo === "sugerencia") {
      packages.forEach(pkg => {
        const pkgDiv = document.createElement('div');
        pkgDiv.className = 'msg-bot';

        const title = document.createElement('h4');
        title.textContent = `📦 ${pkg.packageName}`;
        pkgDiv.appendChild(title);

        pkg.adaptations.forEach(a => {
          const line = document.createElement('p');
          line.innerHTML = `<b>${a.key}</b>: ${a.valor} <small>(${a.motivo})</small>`;
          pkgDiv.appendChild(line);
        });

        const btn = document.createElement('button');
        btn.textContent = 'Aplicar';
        btn.className = 'pkg-btn';
        btn.onclick = () => {
          if (currentUUID) {
            window.bubble.applyAdaptation(currentUUID, pkg);
            setTimeout(() => {
              addMessage(`✅ Paquete "${pkg.packageName}" aplicado.`, 'bot');
            }, 1500);
            btn.disabled = true;
          } else {
            addMessage('⚠️ No hay cliente seleccionado.', 'bot');
          }
        };
        pkgDiv.appendChild(btn);

        messagesDiv.appendChild(pkgDiv);
      });
    }
    else {
      if (packages.length === 1) {
        packages.forEach(pkg => {
          if (currentUUID) {
            let texto = `✅ Se aplicó el paquete ${pkg.packageName}:\n`;
            pkg.adaptations.forEach(a => {
              texto += `${a.key}: ${a.valor} (${a.motivo})\n`;
            });
            setTimeout(() => {
              addMessage(texto, 'bot');
            }, 1500);
            window.bubble.applyAdaptation(currentUUID, pkg);
          }
        });
      };
    }
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  // --- Escuchar paquetes enviados desde el main ---
  if (window.bubble?.onAdaptationPackages) {
    window.bubble.onAdaptationPackages((data, uuid, modo) => {
      currentUUID = uuid;
      adaptationPackages = data;
      console.log("Paquetes recibidos al popup: ", adaptationPackages);
      if (modo === "sugerencia") {
        addMessage('💡 Se recibieron nuevas sugerencias:');
        prmtButton.style.visibility = "visible";
        prmtButton.disabled = false;
      }
      else prmtButton.style.visibility = "hidden";
      showPackages(data, modo);
    });
  }

  prmtButton.addEventListener('click', () => {
    const text = "Sugiéreme un nuevo paquete de adaptaciones con el contexto actual";
    window.bubble.askAdaptation(text, currentUUID);

    // const text = input.value.trim();
    // if (!text) return;

    // addMessage(text, 'user');
    // input.value = '';

    // Simula respuesta del bot
    // setTimeout(() => {
    //   addMessage(`Entendido: "${text}"`, 'bot');
    // }, 600);
  });

  // --- Mensaje inicial ---
  addMessage('Bienvenido! 😊 Soy mAUrI, tu agente de UI adaptativas.', 'bot');
});

// Limpieza del popup cuando el cliente se desconecta
window.bubble.onClearContent(() => {
  console.log(`[${new Date().toLocaleTimeString()}] Clearing popup UI (client disconnected).`);

  currentUUID = null;
  adaptationPackages = [];

  const messagesDiv = document.getElementById('chat-messages');
  if (messagesDiv) messagesDiv.innerHTML = '';

  const prmtButton = document.getElementById('prompt-button');
  if (prmtButton) {
    prmtButton.disabled = true;
    prmtButton.style.visibility = 'hidden';
  }

  setTimeout(() => {
    const msg = document.createElement('div');
    msg.className = 'msg-bot';
    msg.textContent = 'Bienvenido! 😊 Soy mAUrI, tu agente de UI adaptativas.';
    messagesDiv.appendChild(msg);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }, 3000);
});
