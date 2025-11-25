let unreadCount = 0;


window.addEventListener('DOMContentLoaded', () => {
  const bubble = document.getElementById('bubble');
  const counter = document.getElementById('unread-counter');

  if (!bubble) return;

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let moved = false;
  const MOVE_THRESHOLD = 6;

  function updateCounter() {
    counter.textContent = unreadCount;
    counter.style.display = unreadCount > 0 ? 'flex' : 'none';
    counter.classList.add('pop');
    setTimeout(() => {
      counter.classList.remove('pop');
    }, 500);

  }


  bubble.addEventListener('pointerdown', (e) => {
    bubble.setPointerCapture(e.pointerId);
    isDragging = true;
    moved = false;
    startX = e.screenX;
    startY = e.screenY;
  });

  bubble.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const dx = e.screenX - startX;
    const dy = e.screenY - startY;

    if (!moved && (Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD)) {
      moved = true;
    }

    if (moved) {
      startX = e.screenX;
      startY = e.screenY;
      window.bubble.moveBubble(dx, dy);
    }
  });

  bubble.addEventListener('pointerup', (e) => {
    try { bubble.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    if (!moved) {
      window.bubble.togglePopup();
      unreadCount = 0;
      updateCounter();
    }
    isDragging = false;
    moved = false;
  });

  bubble.addEventListener('pointercancel', () => {
    isDragging = false;
    moved = false;
  });

  bubble.addEventListener('dragstart', (e) => e.preventDefault());

  if (window.bubble?.incrementCounter) {
    window.bubble.incrementCounter((numPack) => {
      unreadCount += numPack;
      updateCounter();
    });
  }
  if (window.bubble?.onClearContent) {
    window.bubble.onClearContent(() => {
      unreadCount = 0;
      updateCounter();
    });
  }
});