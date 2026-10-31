(() => {
  let dialog, opener;
  function openGuide(trigger) {
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = 'donation-guide-dialog';
      dialog.className = 'donation-guide-dialog';
      dialog.setAttribute('aria-labelledby', 'donation-guide-title');
      dialog.innerHTML = "<button type=\"button\" class=\"donation-guide-close\" data-guide-close aria-label=\"Close donation guide\">\u00d7</button><header><span class=\"donation-guide-kicker\">BEFORE YOU CONTRIBUTE</span><h2 id=\"donation-guide-title\">Donation &amp; receipt guide</h2><p>Know the status of your contribution.</p></header><div class=\"donation-guide-content\"><section><h2>Interest is not payment</h2><p>The donation form records your interest and requested purpose. It does not process a payment. A reference or acknowledgement does not prove money was received. Choosing monthly interest does not create an automatic debit or recurring mandate.</p></section><section><h2>Confirm before paying</h2><p>Ask the foundation for the approved payment route, recipient, purpose, any charges and settlement process. Patient assistance and infrastructure proposals use funds differently. International contributions are not enabled on this website; obtain confirmed authorization and banking instructions before considering one.</p></section><section><h2>Receipts and tax</h2><p>A paid receipt can follow only after payment is verified. An acknowledgement is not a statutory tax certificate. Ask for current approval details and applicable certificate arrangements; consult your tax advisor about eligibility. This website does not calculate tax savings.</p></section><section><h2>Anonymous giving</h2><p>Request anonymity for public display if preferred. It does not mean the foundation can omit records it is required to retain. Avoid sending PAN or identity documents until the team confirms why they are needed and how to provide them securely.</p></section><section><h2>Payment issues and refund enquiries</h2><p>For a missing receipt, correction, payment query, cancellation or refund request, contact <a href=\"mailto:info@avinyacarefoundation.org\">info@avinyacarefoundation.org</a> with your request reference, payment date and amount. Do not email card details, passwords or banking codes. Ask for the applicable refund conditions and processing time before payment.</p></section></div><footer><a href=\"mailto:info@avinyacarefoundation.org\">Ask our team \u2197</a><button type=\"button\" data-guide-close>Close guide</button></footer>";
      document.body.append(dialog);
      dialog.querySelectorAll('[data-guide-close]').forEach(button => button.addEventListener('click', () => dialog.close()));
      dialog.addEventListener('click', event => { if (event.target === dialog) { const r=dialog.getBoundingClientRect(); if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom) dialog.close(); } });
      dialog.addEventListener('close', () => {
        document.body.classList.remove('donation-guide-open');
        if(location.hash === '#donation-guide') history.replaceState(null, '', location.pathname + location.search);
        if(opener?.isConnected) opener.focus();
      });
    }
    if(dialog.open) return;
    opener = trigger || document.activeElement;
    dialog.showModal();
    document.body.classList.add('donation-guide-open');
    dialog.scrollTop = 0;
    dialog.querySelector('[data-guide-close]').focus();
  }
  window.openDonationGuide = openGuide;
  document.addEventListener('click', event => {
    const trigger=event.target.closest('[data-donation-guide]');
    if(!trigger || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); openGuide(trigger);
  });
  const openFromHash=()=>{if(location.hash==='#donation-guide') openGuide();};
  window.addEventListener('hashchange',openFromHash);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',openFromHash);else openFromHash();
})();

// Shared foundation payment details, also used by dynamically loaded donation forms.
if (!document.getElementById('avinya-upi-script')) {
  const script = document.createElement('script'); script.id = 'avinya-upi-script';
  script.src = '/js/upi-payment.js?v=1'; document.head.append(script);
}
