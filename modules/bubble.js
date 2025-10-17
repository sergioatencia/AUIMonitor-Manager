const { BrowserWindow, screen } = require('electron');
const path = require('path');

let bbW = null; // Ventana burbuja
let ppW = null; // Ventana popup

function createBubble(filePath) {
    const display = screen.getPrimaryDisplay();
    const wa = display.workArea;
    const startX = wa.x + wa.width - 120;
    const startY = wa.y + wa.height - 120;

    bbW = new BrowserWindow({
        x: startX,
        y: startY,
        width: 80,
        height: 80,
        frame: false,
        transparent: true,
        resizable: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        webPreferences: {
            preload: path.join(__dirname, '../preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    bbW.loadFile(filePath);

    // Reposiciona el popup si la burbuja se mueve
    bbW.on('move', () => {
        if (ppW && !ppW.isDestroyed() && ppW.isVisible()) {
            positionPopup();
        }
    });

    bbW.on('closed', () => {
        bbW = null;
    });

    return bbW;
}

/**
 * Crea o muestra/oculta el popup asociado
 * @param {string} filePath Ruta del archivo HTML del popup
 */
function createOrTogglePopup(filePath) {
    if (ppW && !ppW.isDestroyed()) {
        if (ppW.isVisible()) {
            ppW.hide();
        } else {
            positionPopup();
            ppW.show();
        }
        return ppW;
    }

    ppW = new BrowserWindow({
        width: 360,
        height: 520,
        frame: false,
        resizable: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, '../preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    ppW.loadFile(filePath);

    ppW.once('ready-to-show', () => {
        positionPopup();
        ppW.show();
    });

    // Oculta en lugar de destruir
    ppW.on('close', (e) => {
        e.preventDefault();
        ppW.hide();
    });

    ppW.on('closed', () => {
        ppW = null;
    });

    return ppW;
}

/**
 * Calcula y ajusta la posición del popup en torno a la burbuja
 */
function positionPopup() {
    if (!bbW || !ppW) return;

    const bubbleBounds = bbW.getBounds();
    const display = screen.getDisplayNearestPoint({
        x: bubbleBounds.x,
        y: bubbleBounds.y
    });
    const wa = display.workArea;

    const popupW = 360;
    const popupH = 520;
    const padding = 12;

    let px, py;

    // Lógica de ubicación: derecha > izquierda > arriba > abajo
    if (bubbleBounds.x + bubbleBounds.width + popupW + padding <= wa.x + wa.width) {
        px = bubbleBounds.x + bubbleBounds.width + padding;
        py = clamp(bubbleBounds.y, wa.y + padding, wa.y + wa.height - popupH - padding);
    } else if (bubbleBounds.x - popupW - padding >= wa.x) {
        px = bubbleBounds.x - popupW - padding;
        py = clamp(bubbleBounds.y, wa.y + padding, wa.y + wa.height - popupH - padding);
    } else if (bubbleBounds.y - popupH - padding >= wa.y) {
        px = clamp(bubbleBounds.x, wa.x + padding, wa.x + wa.width - popupW - padding);
        py = bubbleBounds.y - popupH - padding;
    } else {
        px = clamp(bubbleBounds.x, wa.x + padding, wa.x + wa.width - popupW - padding);
        py = bubbleBounds.y + bubbleBounds.height + padding;
    }

    ppW.setBounds({ x: px, y: py, width: popupW, height: popupH });
}

/**
 * Limita un valor entre min y max
 */
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

module.exports = { createBubble, createOrTogglePopup, positionPopup };
