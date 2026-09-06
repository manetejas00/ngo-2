import { readFileSync } from 'fs';
import { resolve } from 'path';

console.log('Testing Sponsor Care & Early Detection Custom Amount Donation Modal...');

const indexHtml = readFileSync(resolve('index.html'), 'utf8');
const modalsJs = readFileSync(resolve('js/modals.js'), 'utf8');
const stylesCss = readFileSync(resolve('css/styles.css'), 'utf8');

const errors = [];

// 1. Check Custom button tile
if (!indexHtml.includes('selectCustom()') || !indexHtml.includes('Custom</button>')) {
  errors.push('Missing Custom amount tile in index.html');
}

// 2. Check Custom input field
if (!indexHtml.includes('id="custom-amount-input"') || !indexHtml.includes('placeholder="Enter amount (₹)"')) {
  errors.push('Missing #custom-amount-input with placeholder "Enter amount (₹)" in index.html');
}

// 3. Check Ratio and format in js/modals.js
if (!modalsJs.includes('Math.floor(amount / 500)') || !modalsJs.includes('provides diagnostic screening guidance and local travel assistance for')) {
  errors.push('Missing dynamic 500:1 ratio and updated impact copy in js/modals.js');
}

// 4. Check CSS 6 columns
if (!stylesCss.includes('grid-template-columns: repeat(6, 1fr)')) {
  errors.push('Missing repeat(6, 1fr) for .amount-grid in css/styles.css');
}

// 5. Check all form fields preserved
if (!indexHtml.includes('id="donor-name"') || !indexHtml.includes('id="donor-email"') || !indexHtml.includes('id="donor-phone"') || !indexHtml.includes('id="donor-pan"')) {
  errors.push('Missing one or more required donor form fields (Name, Email, Phone, PAN) in index.html');
}

if (!indexHtml.includes('id="toggle-one-time"') || !indexHtml.includes('id="toggle-monthly"')) {
  errors.push('Missing one-time / monthly toggle buttons in index.html');
}

if (errors.length > 0) {
  console.error('❌ Validation Errors:');
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
} else {
  console.log('✅ ALL Custom Amount Donation Modal Checks Passed Successfully!');
  process.exit(0);
}
