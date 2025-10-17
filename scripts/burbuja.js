const bubble = document.getElementById('bubble');

let pointerDown = false;
let startScreenX = 0;
let startScreenY = 0;
let offsetX = 0;
let offsetY = 0;
let moved = false;
const MOVE_THRESHOLD = 6;

// Inicia drag
bubble.addEventListener('pointerdown', e => {
    pointerDown = true;
    moved = false;
    startScreenX = e.screenX;
    startScreenY = e.screenY;
    offsetX = e.clientX;
    offsetY = e.clientY;
    bubble.setPointerCapture(e.pointerId);
});

// Drag move
window.addEventListener('pointermove', e => {
    if (!pointerDown) return;
    const dist = Math.hypot(e.screenX - startScreenX, e.screenY - startScreenY);
    if (dist > MOVE_THRESHOLD) moved = true;
    if (moved) {
        const newX = Math.round(e.screenX - offsetX);
        const newY = Math.round(e.screenY - offsetY);
        window.bubble.dragBubble(newX, newY);
    }
});

// Drag end / click
bubble.addEventListener('pointerup', e => {
    if (!pointerDown) return;
    bubble.releasePointerCapture(e.pointerId);
    pointerDown = false;

    // Solo toggle popup si es click izquierdo
    if (e.button !== 0) return;

    if (!moved && window.bubble?.togglePopup) {
        window.bubble.togglePopup();
    }

});

// Prevenir drag nativo
bubble.addEventListener('dragstart', e => e.preventDefault());