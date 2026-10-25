const form = document.querySelector('#camp-registration-form');
const status = document.querySelector('#form-status');
const button = form.querySelector('button[type="submit"]');
const confirmation = document.querySelector('#registration-confirmation');
let sending = false;
const registrationCutoff = Date.parse('2026-11-29T16:00:00+05:30');
let registrationClosed = false;
form.noValidate = true;
function clearErrors() {
  form.querySelectorAll('.field-error').forEach(node => node.remove());
  form.querySelectorAll('[aria-invalid]').forEach(node => {
    node.removeAttribute('aria-invalid');
    const descriptions = (node.getAttribute('aria-describedby') || '').split(' ').filter(id => !id.endsWith('-error')).join(' ');
    if (descriptions) node.setAttribute('aria-describedby', descriptions);
    else node.removeAttribute('aria-describedby');
  });
}
function fieldError(field, message) {
  const error = document.createElement('span');
  error.className = 'field-error'; error.id = `${field.name}-error`; error.textContent = message;
  field.setAttribute('aria-invalid', 'true');
  field.setAttribute('aria-describedby', `${field.getAttribute('aria-describedby') || ''} ${error.id}`.trim());
  (field.type === 'checkbox' ? field.closest('label') : field).after(error);
}
function notice(kind, title, message, action = '') {
  status.replaceChildren();
  status.className = `registration-notice notice-${kind}`;
  const icon = document.createElement('span'); icon.className = 'notice-icon'; icon.setAttribute('aria-hidden', 'true');
  icon.textContent = kind === 'loading' ? '◌' : kind === 'warning' ? '!' : '×';
  const copy = document.createElement('div');
  const heading = document.createElement('strong'); heading.textContent = title;
  const text = document.createElement('p'); text.textContent = message;
  copy.append(heading, text);
  if (action) {
    const link = document.createElement('a'); link.className = 'notice-action';
    if (action === 'edit') { link.href = '#name'; link.textContent = 'Review name & mobile number ↑'; link.addEventListener('click', event => { event.preventDefault(); form.elements.name.focus(); }); }
    else { link.href = 'tel:+917447441116'; link.textContent = 'Call 744 744 1116 ↗'; }
    copy.append(link);
  }
  status.append(icon, copy);
}
function focusNotice() { status.focus(); }
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (sending || registrationClosed) return;
  clearErrors();
  let invalid = false;
  for (const field of form.querySelectorAll('input, select, textarea')) {
    if (!field.checkValidity()) {
      invalid = true;
      let message = field.validity.valueMissing ? 'Please complete this field.' : field.validationMessage;
      if (field.name === 'phone') message = 'Enter a valid 10-digit Indian mobile number.';
      if (field.name === 'email') message = 'Enter a valid email address or leave it blank.';
      if (field.name === 'consent') message = 'Please read the privacy notice and give your consent to register.';
      fieldError(field, message);
    }
  }
  if (invalid) {
    notice('error', 'A few details need your attention', 'Check the highlighted fields. Your other entries are still here.');
    form.querySelector('[aria-invalid="true"]').focus();
    return;
  }
  sending = true; button.disabled = true; form.setAttribute('aria-busy', 'true');
  button.textContent = 'Saving your registration…';
  notice('loading', 'Saving your registration', 'Please keep this page open while we save your details.');
  const payload = Object.fromEntries(new FormData(form)); payload.consent = form.elements.consent.checked;
  try {
    const response = await fetch('/api/camp-registration', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok || result.status !== 'ok') {
      if (response.status === 410) {
        closeRegistration();
      } else if (response.status === 409) {
        notice('warning', 'You’re already on the list', 'A registration already exists for this name and mobile number. No new registration was created. For changes or help finding your reference, contact our team.', 'call');
      } else if (response.status === 422) {
        for (const [name, message] of Object.entries(result.errors || {})) {
          const field = form.elements.namedItem(name); if (field) fieldError(field, message);
        }
        notice('error', 'Please check your details', 'We couldn’t complete registration. Review the highlighted fields and try again. Your entries have been kept.');
      } else if (response.status === 429) {
        const seconds = Number(response.headers.get('Retry-After'));
        notice('warning', 'Please wait a moment', `There have been several attempts. ${seconds > 0 ? `Try again in ${seconds} seconds.` : 'Please try again shortly.'} Your entries have been kept.`);
      } else {
        notice('error', 'We couldn’t complete your request', 'Your entries have been kept. Please try again shortly, or call our team for help.', 'call');
      }
      (form.querySelector('[aria-invalid="true"]') || status).focus(); return;
    }
    document.querySelector('#registration-reference').textContent = result.registrationId;
    const emailStatus = document.querySelector('#registration-email-status');
    emailStatus.className = result.emailStatus === 'FAILED' ? 'email-result email-warning' : 'email-result email-success';
    emailStatus.textContent = result.emailStatus === 'SENT' ? '✓ Confirmation email sent. Check your inbox or spam folder.' : result.emailStatus === 'FAILED' ? 'Your registration is confirmed in our records. The email couldn’t be delivered; please save the reference above.' : 'No email requested. Please save your registration reference.';
    form.reset(); form.hidden = true; confirmation.hidden = false;
    document.querySelector('#registration').classList.add('registration-complete'); confirmation.focus();
  } catch {
    notice('error', 'Connection interrupted', 'We couldn’t confirm the result. Your entries are still here. Try again; if the registration was saved, we’ll let you know it already exists.', 'call'); focusNotice();
  } finally {
    sending = false; button.disabled = registrationClosed; form.removeAttribute('aria-busy'); button.textContent = registrationClosed ? 'Registration closed' : 'Register for the camp ↗';
  }
});
document.querySelector('#register-another').addEventListener('click', () => {
  confirmation.hidden = true; document.querySelector('#registration').classList.remove('registration-complete');
  form.hidden = false; status.replaceChildren(); status.className = ''; clearErrors(); form.elements.name.focus();
});
form.addEventListener('input', event => {
  const field = event.target;
  if (field.getAttribute('aria-invalid') === 'true' && field.checkValidity()) {
    document.getElementById(`${field.name}-error`)?.remove(); field.removeAttribute('aria-invalid');
    const ids = (field.getAttribute('aria-describedby') || '').split(' ').filter(id => !id.endsWith('-error')).join(' ');
    if (ids) field.setAttribute('aria-describedby', ids); else field.removeAttribute('aria-describedby');
  }
});

function closeRegistration() {
  registrationClosed = true;
  button.disabled = true;
  button.textContent = 'Registration closed';
  form.querySelectorAll('input,select,textarea').forEach(field => { field.disabled = true; });
  notice('warning', 'Registration is now closed', 'Online registration closed on 29 November 2026 at 4:00 PM IST. Please contact our team for any further assistance.', 'call');
  document.querySelector('#register-another').hidden = true;
}
function updateCountdown() {
  const remaining = Math.max(0, registrationCutoff - Date.now());
  const total = Math.floor(remaining / 1000);
  const values = { days: Math.floor(total / 86400), hours: Math.floor(total / 3600) % 24, minutes: Math.floor(total / 60) % 60, seconds: total % 60 };
  for (const [unit, value] of Object.entries(values)) document.querySelector(`[data-count="${unit}"]`).textContent = String(value).padStart(2, '0');
  if (!remaining) {
    document.querySelector('.camp-countdown .eyebrow').textContent = 'REGISTRATION CLOSED';
    if (!registrationClosed) closeRegistration();
  }
}
updateCountdown();
const countdownTimer = setInterval(() => { updateCountdown(); if (registrationClosed) clearInterval(countdownTimer); }, 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) updateCountdown(); });
