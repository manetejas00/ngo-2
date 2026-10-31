/** Camp information page. Registration is handled by the official Google Form. */
document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.camp-tab-btn');
  const cards = document.querySelectorAll('.camp-card');
  tabs.forEach(tab => tab.addEventListener('click', () => {
    tabs.forEach(item => item.classList.toggle('active', item === tab));
    const filter = tab.dataset.filter || 'all';
    cards.forEach(card => {
      card.style.display = filter === 'all' || (card.dataset.category || '').includes(filter) || (card.dataset.status || '').includes(filter) ? 'flex' : 'none';
    });
  }));
});
