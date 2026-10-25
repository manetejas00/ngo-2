(() => {
  const profiles = [
    {name:'Sagar Warekar',role:'Treasurer',image:'sagar-warekar',summary:'As Treasurer, Sagar Warekar holds the foundation’s treasury role, with a focus on financial stewardship and accountability.',focus:['Treasury and financial oversight','Financial records and reporting','Responsible use of foundation resources']},
    {name:'Ajay Pandey',role:'Finance Advisor',image:'ajay-pandey',summary:'As Finance Advisor, Ajay Pandey provides a financial advisory perspective to the foundation’s planning and resource decisions.',focus:['Financial planning guidance','Budget and resource considerations','Advice on financial sustainability']},
    {name:'Ravindra Singh',role:'CSR Head',image:'ravindra-singh',summary:'As CSR Head, Ravindra Singh is the team’s point of focus for corporate social responsibility and partnership conversations.',focus:['CSR partnership conversations','Alignment between partners and community initiatives','Coordination of proposed corporate contributions']},
    {name:'Ranjeet Mane',role:'NGO Advisor',image:'ranjeet-mane',summary:'As NGO Advisor, Ranjeet Mane brings an advisory perspective to the foundation’s organizational direction and community work.',focus:['Organizational guidance','Community initiative planning','Advice on responsible NGO practices']},
    {name:'Chandresh Pandey',role:'Chairman',image:'chandresh-pandey',summary:'As Chairman, Chandresh Pandey holds the foundation’s leadership role, helping guide its shared purpose and organizational direction.',focus:['Foundation leadership','Organizational direction and governance','Keeping the foundation’s purpose central to decisions']},
    {name:'Tejas Mane',role:'Secretary',image:'tejas-mane',summary:'As Secretary, Tejas Mane holds a coordination and administration role within the foundation’s team.',focus:['Organizational coordination','Records and communication','Supporting the team’s administrative work']}
  ];
  const dialog = document.getElementById('team-dialog');
  if (!dialog) return;
  let current = 0;
  let opener;
  const name = document.getElementById('team-profile-name');
  function render(index) {
    current = (index + profiles.length) % profiles.length;
    const profile = profiles[current];
    name.textContent = profile.name;
    document.getElementById('team-profile-role').textContent = profile.role;
    document.getElementById('team-profile-summary').textContent = profile.summary;
    const photo = document.getElementById('team-profile-photo');
    photo.src = `/assets/team/${profile.image}.jpg`; photo.alt = profile.name;
    document.getElementById('team-profile-focus').replaceChildren(...profile.focus.map(text => { const li = document.createElement('li'); li.textContent = text; return li; }));
    document.getElementById('team-profile-position').textContent = `${current + 1} / ${profiles.length}`;
  }
  document.querySelectorAll('[data-team-index]').forEach(button => button.addEventListener('click', () => {
    opener = button; render(Number(button.dataset.teamIndex)); dialog.showModal(); document.body.classList.add('team-profile-open');
  }));
  dialog.querySelector('.team-dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { document.body.classList.remove('team-profile-open'); opener?.focus(); });
  dialog.addEventListener('click', event => { const rect = dialog.getBoundingClientRect(); if(event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close(); });
  document.getElementById('team-profile-previous').addEventListener('click', () => render(current - 1));
  document.getElementById('team-profile-next').addEventListener('click', () => render(current + 1));
  dialog.addEventListener('keydown', event => { if(event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); render(current + (event.key === 'ArrowRight' ? 1 : -1)); } });
})();
