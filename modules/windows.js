const { BrowserWindow } = require('electron');
const path = require('path');

function createWindow(filePath, width=1000, height=600) {
  const window = new BrowserWindow({
    width: width,
    height: height,
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
