import fs from 'fs';
import path from 'path';

function runTests() {
  console.log('Testing Legal & Compliance Modals...');

  const indexPath = path.resolve('index.html');
  const indexHtml = fs.readFileSync(indexPath, 'utf-8');

  const doctorsPath = path.resolve('doctors.html');
  const doctorsHtml = fs.readFileSync(doctorsPath, 'utf-8');

  const modalsJsPath = path.resolve('js/modals.js');
  const modalsJs = fs.readFileSync(modalsJsPath, 'utf-8');

  // Check modals.js contains methods and modalIds
  const requiredMethods = ['openPrivacyModal', 'openTermsModal', 'openComplianceModal'];
  for (const method of requiredMethods) {
    if (!modalsJs.includes(method)) {
      throw new Error(`modals.js is missing method: ${method}`);
    }
  }

  const requiredIds = ['privacy-modal', 'terms-modal', 'compliance-modal'];
  for (const id of requiredIds) {
    if (!modalsJs.includes(`'${id}'`)) {
      throw new Error(`modals.js modalIds is missing: ${id}`);
    }
  }

  // Check index.html has modal DOM elements
  for (const id of requiredIds) {
    if (!indexHtml.includes(`id="${id}"`)) {
      throw new Error(`index.html is missing modal element: ${id}`);
    }
  }

  // Check doctors.html has modal DOM elements
  for (const id of requiredIds) {
    if (!doctorsHtml.includes(`id="${id}"`)) {
      throw new Error(`doctors.html is missing modal element: ${id}`);
    }
  }

  // Check index.html footer onclicks
  if (!indexHtml.includes('window.AvinyaModals.openPrivacyModal()')) {
    throw new Error('index.html footer does not trigger openPrivacyModal()');
  }
  if (!indexHtml.includes('window.AvinyaModals.openTermsModal()')) {
    throw new Error('index.html footer does not trigger openTermsModal()');
  }
  if (!indexHtml.includes('window.AvinyaModals.openComplianceModal()')) {
    throw new Error('index.html footer does not trigger openComplianceModal()');
  }

  // Check doctors.html footer onclicks
  if (!doctorsHtml.includes('window.AvinyaModals.openPrivacyModal()')) {
    throw new Error('doctors.html footer does not trigger openPrivacyModal()');
  }
  if (!doctorsHtml.includes('window.AvinyaModals.openTermsModal()')) {
    throw new Error('doctors.html footer does not trigger openTermsModal()');
  }
  if (!doctorsHtml.includes('window.AvinyaModals.openComplianceModal()')) {
    throw new Error('doctors.html footer does not trigger openComplianceModal()');
  }

  // Check key legal content in modals
  const requiredKeywords = [
    'Digital Personal Data Protection (DPDP) Act 2023',
    'Zero Commercial Monetization',
    'Section 80G',
    'Section 12A',
    'MCA CSR-1',
    'NITI Aayog NGO Darpan',
    'Maharashtra Public Trusts Act',
    'Non-Emergency'
  ];

  for (const kw of requiredKeywords) {
    if (!indexHtml.includes(kw)) {
      throw new Error(`index.html is missing compliance text: ${kw}`);
    }
    if (!doctorsHtml.includes(kw)) {
      throw new Error(`doctors.html is missing compliance text: ${kw}`);
    }
  }

  console.log('✅ ALL Legal & Compliance Modal Tests Passed Successfully!');
}

runTests();
