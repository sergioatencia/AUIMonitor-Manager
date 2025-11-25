let currentUUID = null;
let adaptationPackages = [];

function getTimeMessage() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

window.addEventListener('DOMContentLoaded', () => {
  const messagesDiv = document.getElementById('chat-messages');
  const form = document.getElementById('chat-form');
  const prmtButton = document.getElementById('prompt-button');

  function addMessage(text, sender = 'bot') {
    const msg = document.createElement('div');
    msg.className = sender === 'user' ? 'msg-user' : 'msg-bot';
    const content = document.createElement('div');
    content.className = 'msg-content';
    content.textContent = text;
    //msg.textContent = text;
    const time = document.createElement('span');
    time.className = 'msg-time';
    time.textContent = getTimeMessage();
    msg.appendChild(content);
    msg.appendChild(time);
    messagesDiv.appendChild(msg);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  function showPackages(packages, modo) {
    if (!packages || packages.length === 0) {
      addMessage('Sin nuevas sugerencias, de momento.', 'bot');
      return;
    }
    if (modo === "sugerencia") {
      packages.forEach(pkg => {
        const pkgDiv = document.createElement('div');
        pkgDiv.className = 'msg-bot';
        const content = document.createElement('div');
        content.className = 'msg-content';
        const title = document.createElement('h4');
        title.textContent = `Nueva sugerencia: 📦 ${pkg.packageName}`;
        content.appendChild(title);

        pkg.adaptations.forEach(a => {
          const line = document.createElement('p');
          line.innerHTML = `<b>${a.key}</b>: ${a.valor}`;
          content.appendChild(line);
          const anotherLine = document.createElement('p');
          anotherLine.innerHTML = `<small>${a.motivo}</small>`;
          content.appendChild(anotherLine);
        });
        pkgDiv.appendChild(content);
        const applyBtn = document.createElement('button');
        applyBtn.textContent = 'Aplicar';
        applyBtn.className = 'pkg-btn';
        applyBtn.onclick = () => {
          if (currentUUID) {
            window.bubble.applyAdaptation(currentUUID, pkg);
            setTimeout(() => {
              addMessage(`✅ Paquete "${pkg.packageName}" aplicado.`, 'bot');
            }, 1500);
            applyBtn.disabled = true;
            rejectBtn.disabled = true;
          } else {
            addMessage('⚠️ No hay cliente seleccionado.', 'bot');
          }
        };

        const rejectBtn = document.createElement('button');
        rejectBtn.textContent = 'Rechazar';
        rejectBtn.className = 'pkg-btn pkg-btn-reject';
        rejectBtn.style.marginLeft = "8px";
        rejectBtn.onclick = () => {
          applyBtn.disabled = true;
          rejectBtn.disabled = true;
          addMessage(`❌ Paquete "${pkg.packageName}" rechazado.`, 'bot');
        };
        const btnRow = document.createElement('div');
        btnRow.className = 'pkg-btn-row';

        btnRow.appendChild(applyBtn);
        btnRow.appendChild(rejectBtn);

        pkgDiv.appendChild(btnRow);

        const time = document.createElement('span');
        time.className = 'msg-time';
        time.textContent = getTimeMessage();
        pkgDiv.appendChild(time);

        messagesDiv.appendChild(pkgDiv);
      });
    }
    else {
      if (packages.length === 1) {
        packages.forEach(pkg => {
          if (currentUUID) {
            const pkgDiv = document.createElement('div');
            pkgDiv.className = 'msg-bot';
            const content = document.createElement('div');
            content.className = 'msg-content';
            const title = document.createElement('h4');
            title.textContent = `📦✅ Adaptaciones aplicadas automaticamente: `;
            content.appendChild(title);

            pkg.adaptations.forEach(a => {
              const line = document.createElement('p');
              line.innerHTML = `<b>${a.key}</b>: ${a.valor}`;
              content.appendChild(line);
              const anotherLine = document.createElement('p');
              anotherLine.innerHTML = `<small>${a.motivo}</small>`;
              content.appendChild(anotherLine);
            });
            pkgDiv.appendChild(content);
            window.bubble.applyAdaptation(currentUUID, pkg);
            messagesDiv.appendChild(pkgDiv);
          }
        });
      };
    }
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  if (window.bubble?.onAdaptationPackages) {
    window.bubble.onAdaptationPackages((data, uuid, modo) => {
      currentUUID = uuid;
      adaptationPackages = data;
      console.log("Paquetes recibidos al popup: ", adaptationPackages);
      if (modo === "sugerencia") {
        //addMessage('💡 Se recibieron nuevas sugerencias:');
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
  });

  addMessage('Bienvenido! 😊 Soy mAUrI, tu asistente de IU adaptativas.', 'bot');
});

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
    const content = document.createElement('div');
    content.className = 'msg-content';
    content.textContent = 'Bienvenido! 😊 Soy mAUrI, tu asistente de IU adaptativas.';
    const time = document.createElement('span');
    time.className = 'msg-time';
    time.textContent = getTimeMessage();
    msg.appendChild(content);
    msg.appendChild(time);
    messagesDiv.appendChild(msg);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }, 3000);
});
