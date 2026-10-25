const form = document.querySelector('#connect-form');
const reason = form.elements.reason;
const status = document.querySelector('#form-status');
const help = {
  support: 'Ask about care navigation and available assistance. Email is optional for medical support.',
  volunteer: 'Tell us your interests, skills and when you’re available.',
  donation: 'Ask about contribution options. This form does not take a payment or issue a donation receipt.',
  contact: 'Share your question and the team can follow up with you.'
};
function updateReason() {
  form.elements.email.required = reason.value !== 'support';
  document.querySelector('#email-required').textContent = form.elements.email.required ? '*' : '(optional)';
  document.querySelector('#reason-help').textContent = help[reason.value];
}
const preset = new URLSearchParams(location.search).get('reason');
if (Object.hasOwn(help, preset)) reason.value = preset;
reason.addEventListener('change', updateReason);
updateReason();
let sending = false;
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (sending || !form.reportValidity()) return;
  sending = true;
  const button = form.querySelector('button');
  button.disabled = true;
  status.textContent = 'Sending your enquiry…';
  const data = new FormData(form);
  const category = reason.value;
  try {
    const response = await fetch('/api/submit-form', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        form_type: category === 'donation' ? 'contact' : category,
        name: data.get('name').trim(), email: data.get('email').trim(),
        phone: data.get('phone').trim(), interest: category,
        message: `Enquiry: ${category}\nCity / area: ${data.get('location').trim()}\n${data.get('message').trim()}`,
        consent: true
      })
    });
    const result = await response.json();
    if (!response.ok || result.status !== 'ok') throw new Error(result.message || 'We couldn’t send your enquiry. Please try again.');
    status.textContent = `Your enquiry has been received.${result.submissionId ? ' Reference: ' + result.submissionId + '.' : ''} Please save this reference for follow-up. Our team will review your request. This is not a confirmation of assistance, a placement or payment.`;
    form.reset();
    updateReason();
  } catch (error) {
    status.textContent = `${error.message || 'Connection problem. Please try again.'} Your details are still here. You can also call 744 744 1116.`;
  } finally {
    sending = false;
    button.disabled = false;
    status.focus();
  }
});
