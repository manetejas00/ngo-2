/* Shared progressive enhancements for static forms and dynamically rendered bookings. */
(() => {
  let serial = 0;
  let healthcareDialog = null;
  let returnFocus = null;
  const focusable = dialog => [...dialog.querySelectorAll('a[href],button,input,select,textarea,[tabindex="0"]')]
    .filter(element => !element.disabled && element.getClientRects().length);

  function enhance() {
    document.querySelectorAll('input:not([type="hidden"]),select,textarea').forEach(input => {
      if (input.labels?.length) return;
      const nearby = input.previousElementSibling;
      if (nearby?.tagName === 'LABEL' && !nearby.querySelector('input,select,textarea')) {
        input.id ||= `avinya-field-${++serial}`;
        nearby.htmlFor = input.id;
      } else if (input.placeholder) {
        input.id ||= `avinya-field-${++serial}`;
        const label = document.createElement('label');
        label.htmlFor = input.id;
        label.className = 'avinya-field-label';
        label.textContent = input.placeholder;
        input.before(label);
      }
    });
    document.querySelectorAll('.hc-modal-backdrop').forEach(dialog => {
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      const heading = dialog.querySelector('h2,h3');
      if (heading) {
        heading.id ||= `avinya-dialog-${++serial}`;
        dialog.setAttribute('aria-labelledby', heading.id);
      }
      dialog.querySelectorAll('.hc-modal-close').forEach(button => button.setAttribute('aria-label', 'Close dialog'));
    });
    const active = [...document.querySelectorAll('.hc-modal-backdrop.active')].pop() || null;
    if (active !== healthcareDialog) {
      if (active) {
        if (!healthcareDialog) returnFocus = document.activeElement;
        healthcareDialog = active;
        focusable(active)[0]?.focus();
      } else {
        healthcareDialog = null;
        if (returnFocus?.isConnected) returnFocus.focus();
        returnFocus = null;
      }
    }
  }
  document.addEventListener('keydown', event => {
    if (event.key !== 'Tab' || !healthcareDialog) return;
    const items = focusable(healthcareDialog);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (!healthcareDialog.contains(document.activeElement)) { event.preventDefault(); first.focus(); }
    else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  const start = () => {
    enhance();
    new MutationObserver(enhance).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
