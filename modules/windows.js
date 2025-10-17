const { BrowserWindow } = require('electron');
const path = require('path');

function createWindow(filePath) {
  const window = new BrowserWindow({
    width: 1000,
    height: 600,
    show: false,
    autoHideMenuBar: true,
    resizable: false,
    icon: path.join(__dirname, '../images', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, '../preload.js') }
  });

  window.loadFile(filePath);

  window.on('close', (event) => {
    event.preventDefault();
    window.hide();
  });

  return window;
}

module.exports = { createWindow };
