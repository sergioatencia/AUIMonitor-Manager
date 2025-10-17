const { Tray, Menu, app } = require('electron');
const path = require('path');

let tray;

function createTray(mainWindow, secondWindow) {
  tray = new Tray(path.join(__dirname, '../images', 'icon.png'));

  const menu = Menu.buildFromTemplate([
    { label: 'Mostrar monitor', click: () => mainWindow.show() },
    { label: 'Mostrar gestor', click: () => secondWindow.show() },
    {
      label: 'Salir',
      click: () => {
        mainWindow.removeAllListeners('close');
        secondWindow.removeAllListeners('close');
        app.quit();
      }
    }
  ]);

  tray.setToolTip('AUI Monitor&Manage');
  tray.setContextMenu(menu);

  console.log('[TRAY] Bandeja creada correctamente.');
}

module.exports = { createTray };
