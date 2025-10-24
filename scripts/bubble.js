window.addEventListener('DOMContentLoaded', () => {
  const bubble = document.getElementById('bubble');
  if (!bubble) return;

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let moved = false;
  const MOVE_THRESHOLD = 6; // píxels: si se mueve más que esto, es arrastre

  // Pointer down -> iniciar posible drag
  bubble.addEventListener('pointerdown', (e) => {
    // Captura el pointer para recibir futuros pointermove/up aunque el cursor salga del elemento
    bubble.setPointerCapture(e.pointerId);
    isDragging = true;
    moved = false;
    startX = e.screenX;
    startY = e.screenY;
  });

  // Pointer move -> si estamos arrastrando, calcular dx/dy y enviar al main
  bubble.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const dx = e.screenX - startX;
    const dy = e.screenY - startY;

    // Si supera el umbral, marcamos como movimiento
    if (!moved && (Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD)) {
      moved = true;
    }

    if (moved) {
      // actualizamos referencia de inicio para movimientos continuos
      startX = e.screenX;
      startY = e.screenY;
      window.bubble.moveBubble(dx, dy);
    }
  });

  // Pointer up -> terminar, si no se movió lo suficiente se trata como click
  bubble.addEventListener('pointerup', (e) => {
    try { bubble.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    if (!moved) {
      // Es un click (o toque), abrir/ocultar popup
      window.bubble.togglePopup();
    }
    isDragging = false;
    moved = false;
  });

  // Por si el pointer sale del elemento sin soltar
  bubble.addEventListener('pointercancel', () => {
    isDragging = false;
    moved = false;
  });

  // Evitar comportamiento por defecto (selección de texto, etc.)
  bubble.addEventListener('dragstart', (e) => e.preventDefault());
});
