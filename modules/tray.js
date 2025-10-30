const { config } = require('dotenv');
const { Tray, Menu, app } = require('electron');
const path = require('path');

let tray;

function createTray(mainWindow, secondWindow, configWindow) {
  tray = new Tray(path.join(__dirname, '../images', 'icon.png'));

  const menu = Menu.buildFromTemplate([
    { label: 'Mostrar monitor', click: () => mainWindow.show() },
    { label: 'Mostrar gestor', click: () => secondWindow.show() },
    { label: 'Abrir configuración', click: () => configWindow.show() },
    {
      label: 'Salir',
      click: () => {
        mainWindow.removeAllListeners('close');
        secondWindow.removeAllListeners('close');
        configWindow.removeAllListeners('close');
        if (tray) {
          tray.destroy(); // 👈 Destruye el icono de bandeja antes de salir
          tray = null;
        }
        app.quit();
      }
    }
  ]);

  tray.setToolTip('AUI Monitor&Manage');
  tray.setContextMenu(menu);

  console.log('[TRAY] Bandeja creada correctamente.');
}

module.exports = { createTray };
