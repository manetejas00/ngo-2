// Information pages reuse the existing donation form and its submission manager.
let donationFormLoading;
async function openSharedDonationForm(amount = 1000, category = null) {
  try {
    if (typeof window.AvinyaModals?.submitDonation === 'function') {
      window.AvinyaModals.openDonateModal(amount, category);
      return;
    }
    if (!donationFormLoading) donationFormLoading = (async () => {
      const response = await fetch('/components/donation-form?v=1');
      if (!response.ok) throw new Error('Donation form unavailable');
      const template = document.createElement('template');
      template.innerHTML = await response.text();
      document.body.append(template.content);
      const fallback = window.AvinyaModals;
      await new Promise((resolve,reject) => {
        const script = document.createElement('script');
        script.src='/js/modals.js?v=4.4.4-volunteer'; script.onload=resolve; script.onerror=reject;
        document.body.append(script);
      });
      // Keep information-page support/volunteer routes while reusing donation controls.
      for (const [key,value] of Object.entries(fallback)) {
        if (!['openDonateModal','closeAll'].includes(key)) window.AvinyaModals[key]=value;
      }
    })().catch(error => { donationFormLoading=undefined;document.getElementById('donate-modal')?.remove();throw error; });
    await donationFormLoading;
    window.AvinyaModals.openDonateModal(amount, category);
  } catch {
    window.alert('The donation form could not load. Please refresh and try again, or call 744 744 1116.');
  }
}
window.AvinyaModals ||= {
  openSupportModal: () => location.assign('/assistance'),
  openDonateModal: (amount, category) => openSharedDonationForm(amount, category),
  openVolunteerModal: () => location.assign('https://docs.google.com/forms/d/e/1FAIpQLSeiRxf0Cv3OktSKILJScVgsNHpTVAEj0M-9rOD-7vMeECXZUA/viewform'),
  openCSRModal: () => location.assign('/get-involved#partnerships'),
  openCsrModal: () => location.assign('/get-involved#partnerships'),
  closeAll: () => {}
};
document.addEventListener('DOMContentLoaded', () => {
  const markCurrent = () => document.querySelectorAll('nav a[href]').forEach(link => {
    if (link.getAttribute('href') === location.pathname) link.setAttribute('aria-current', 'page');
  });
  markCurrent();
  new MutationObserver(markCurrent).observe(document.body, { childList: true, subtree: true });
});
