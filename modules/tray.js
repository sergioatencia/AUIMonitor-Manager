const { Tray, Menu, app } = require('electron');
const path = require('path');

let tray;

function createTray(mainWindow, secondWindow, configWindow) {
  tray = new Tray(path.join(__dirname, '../images', 'tray-c.png'));

  const menu = Menu.buildFromTemplate([
    { label: 'Mostrar monitor', click: () => mainWindow.show() },
    { label: 'Mostrar gestor', click: () => secondWindow.show() },
    { label: 'Abrir configuración', click: () => configWindow.show() },
    {
      label: 'Salir', click: () => {
        mainWindow.removeAllListeners('close');
        secondWindow.removeAllListeners('close');
        configWindow.removeAllListeners('close');
        if (tray) {
          tray.destroy();
          tray = null;
        }
        app.quit();
      }
    }
  ]);

  tray.setToolTip('AUI MntMgr');
  tray.setContextMenu(menu);
}

module.exports = { createTray };
