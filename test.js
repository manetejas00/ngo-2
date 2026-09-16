import fs from 'fs';
const content = fs.readFileSync('index.html', 'utf-8');
const navbar = fs.readFileSync('components/navbar.html', 'utf-8');
const footer = fs.readFileSync('components/footer.html', 'utf-8');
let replaced = content.replace('<!-- REUSABLE_NAVBAR -->', navbar);
replaced = replaced.replace('<!-- REUSABLE_FOOTER -->', footer);
console.log(replaced.includes('navbar-wrapper'));
console.log(replaced.includes('footer-brand'));
