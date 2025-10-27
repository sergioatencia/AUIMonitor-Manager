const { BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');

let popupWin = null;

function createBubbleWindow(filePath) {
    const display = screen.getPrimaryDisplay();
    const { width, height } = display.workAreaSize;

    const buwin = new BrowserWindow({
        width: 60,
        height: 60,
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

        // Mover también el popup si está visible
        if (popupWin && !popupWin.isDestroyed() && popupWin.isVisible()) {
            positionPopup(buwin, popupWin);
        }
    });

    // --- IPC para mostrar / ocultar popup ---
    ipcMain.on('toggle-popup', () => {
        if (!popupWin || popupWin.isDestroyed()) {
            popupWin = new BrowserWindow({
                width: 320,
                height: 420,
                frame: false,
                transparent: true,
                alwaysOnTop: true,
                resizable: false,
                skipTaskbar: true,
                autoHideMenuBar: true,
                show: false,
                parent: buwin,
                webPreferences: {
                    preload: path.join(__dirname, '../preload.js'),
                },
            });
            popupWin.loadFile(path.join(__dirname, '../pages/popup.html'));
        }

        if (popupWin.isVisible()) {
            popupWin.hide();
        } else {
            positionPopup(buwin, popupWin);
            popupWin.show();
        }
    });

    return buwin;
}

// --- Posicionar popup junto a la burbuja ---
function positionPopup(bubble, popup) {
    const display = screen.getPrimaryDisplay();
    const { width: screenW, height: screenH } = display.workAreaSize;

    const [bx, by] = bubble.getPosition();
    const [bw, bh] = bubble.getSize();
    const [pw, ph] = popup.getSize();

    let newX = bx + bw + 10; // popup a la derecha
    let newY = by;

    // Si se sale por la derecha, muévelo a la izquierda
    if (newX + pw > screenW) newX = bx - pw - 10;
    // Si se sale por abajo, súbelo
    if (newY + ph > screenH) newY = screenH - ph - 10;
    // No dejar que suba demasiado
    if (newY < 0) newY = 0;

    popup.setPosition(Math.round(newX), Math.round(newY));
}

function getPopupWindow() {
    return popupWin;
}

module.exports = { createBubbleWindow, getPopupWindow };
