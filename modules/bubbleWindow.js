const { BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');

function createBubbleWindow(filePath) {
    const display = screen.getPrimaryDisplay();
    const { width, height } = display.workAreaSize;

    const buwin = new BrowserWindow({
        width: 80,
        height: 80,
        x: width - 100,
        y: height - 120,
        show: true,
        alwaysOnTop: true,
        autoHideMenuBar: true,
        frame: false,
        resizable: false,
        transparent: true,
        hasShadow: false,
        skipTaskbar: true,
        webPreferences: {
            preload: path.join(__dirname, '../preload.js'),
        },
    });

    buwin.loadFile(filePath);

    //   buwin.on('close', (event) => {
    //     event.preventDefault();
    //     buwin.hide();
    //   });

    ipcMain.on('move-bubble', (_, { dx, dy }) => {
        const display = screen.getPrimaryDisplay();
        const { width: screenW, height: screenH } = display.workAreaSize;
        const [x, y] = buwin.getPosition();
        const [winW, winH] = buwin.getSize();

        // Nueva posición tentativa
        let newX = x + dx;
        let newY = y + dy;

        // Limitar dentro de la pantalla
        if (newX < 0) newX = 0;
        if (newY < 0) newY = 0;
        if (newX + winW > screenW) newX = screenW - winW;
        if (newY + winH > screenH) newY = screenH - winH;

        buwin.setPosition(newX, newY);
    });


    return buwin;
}

module.exports = { createBubbleWindow };
