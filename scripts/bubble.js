window.addEventListener('DOMContentLoaded', () => {
  const bubble = document.getElementById('bubble');
  if (!bubble) return;

  let isDragging = false;
  let startX, startY;

  bubble.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.screenX;
    startY = e.screenY;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.screenX - startX;
    const dy = e.screenY - startY;
    startX = e.screenX;
    startY = e.screenY;
    window.bubble.moveBubble(dx, dy);
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });
});
