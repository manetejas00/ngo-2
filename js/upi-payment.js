(() => {
  if (window.AvinyaUpiPayment) return;
  const upi = 'avinyacarefoundation1225@aubank';
  window.AvinyaUpiPayment = { upi };
  const style = document.createElement('link');
  style.rel = 'stylesheet'; style.href = '/css/upi-payment.css?v=1'; document.head.append(style);
  function panel(withReference) {
    const section = document.createElement('section');
    section.className = 'upi-payment';
    section.innerHTML = `<p class="upi-payment-kicker">DIRECT UPI PAYMENT</p><h3>Bring care closer.</h3><img src="/assets/payments/avinya-upi-qr.png" width="497" height="493" alt="Scan to pay Avinya Care Foundation using any UPI app"><p>Check the payee name in your app:<br><strong>AVINYA CARE FOUNDATION</strong></p><label>UPI ID<input class="upi-payment-id" readonly value="${upi}" aria-label="Foundation UPI ID"></label><button type="button" class="btn-secondary-dark" data-copy-upi>Copy UPI ID</button><a class="upi-payment-download" href="/assets/payments/avinya-upi-payment-card.png" download>Download payment QR</a><p class="upi-payment-status" role="status" aria-live="polite"></p><p>Pay using your UPI app. Confirm the amount and recipient before approving. Never share your UPI PIN or OTP. A payment reference is subject to bank verification.</p>${withReference ? '<label>Payment details<select name="payment_claim" id="donor-payment-claim"><option value="interest">Donation interest only — not paid yet</option><option value="paid">I have paid by UPI</option></select></label><div data-upi-reference hidden><label for="donor-transaction-id">12-digit UPI reference / UTR *</label><input id="donor-transaction-id" name="transaction_id" inputmode="numeric" pattern="[0-9]{12}" maxlength="12" autocomplete="off" placeholder="12-digit UPI reference"><small>Copy the 12-digit reference from your successful bank transaction. We verify receipt before issuing a paid receipt.</small></div>' : ''}`;
    return section;
  }
  function mount() {
    const form = document.querySelector('#donate-modal form');
    if (form && !form.querySelector('.upi-payment')) form.prepend(panel(true));
    const guide = document.querySelector('.donation-guide-content');
    if (guide && !guide.querySelector('.upi-payment')) guide.prepend(panel(false));
  }
  document.addEventListener('change', event => {
    if (event.target.id !== 'donor-payment-claim') return;
    const panel = event.target.closest('.upi-payment');
    const paid = event.target.value === 'paid';
    panel.querySelector('[data-upi-reference]').hidden = !paid;
    const input = panel.querySelector('[name="transaction_id"]');
    input.required = paid;
    if (!paid) input.value = '';
  });
  document.addEventListener('click', async event => {
    const button = event.target.closest('[data-copy-upi]');
    if (!button) return;
    const section = button.closest('.upi-payment');
    try { await navigator.clipboard.writeText(upi); section.querySelector('[role="status"]').textContent = 'UPI ID copied.'; }
    catch { section.querySelector('input').select(); section.querySelector('[role="status"]').textContent = 'Select and copy the UPI ID above.'; }
  });
  new MutationObserver(mount).observe(document.body, { childList: true, subtree: true });
  mount();
})();
