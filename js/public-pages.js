// Standalone information pages use the same navigation without loading form modals.
window.AvinyaModals ||= {
  openSupportModal: () => location.assign('/assistance'),
  openDonateModal: () => location.assign('/donation-guide'),
  openVolunteerModal: () => location.assign('/get-involved#volunteer'),
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
