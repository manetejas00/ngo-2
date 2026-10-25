(() => {
  const dialog = document.getElementById('camp-announcement');
  const key = 'avinya-camp-2026-11-29-announcement-seen';
  // One automatic announcement per campaign per browser. The hero link stays available.
  const expires = Date.parse('2026-11-29T16:00:00+05:30');
  if (!dialog || !dialog.showModal || Date.now() >= expires) return;
  try { if (localStorage.getItem(key)) return; } catch { return; }
  let attempts = 0;
  let previousFocus;
  function showWhenIdle() {
    if (++attempts > 12 || Date.now() >= expires) return;
    const active = document.activeElement;
    const busy = document.hidden || document.querySelector('dialog[open], .modal-backdrop.active, .modal-backdrop.open, body.mobile-nav-open') || active?.matches('input,select,textarea,button,a,[contenteditable="true"]');
    if (busy) { setTimeout(showWhenIdle, 5000); return; }
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, new Date().toISOString());
    } catch { return; }
    previousFocus = active;
    dialog.showModal();
    dialog.querySelector('.camp-announcement-close').focus();
  }
  dialog.querySelector('.camp-announcement-close').addEventListener('click', () => dialog.close());
  dialog.querySelector('.camp-announcement-dismiss').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => { if (previousFocus?.isConnected) previousFocus.focus(); });
  setTimeout(showWhenIdle, 12000);
})();
