/**
 * Automated Verification Script for Letterhead PDF Generation Assets & Inclusions
 */
import fs from 'fs';
import path from 'path';

console.log('======================================================');
console.log('  AVINYA CARE LETTERHEAD PDF INTEGRATION AUDIT');
console.log('======================================================\n');

let allPassed = true;

function check(title, fn) {
  try {
    const res = fn();
    if (res !== false) {
      console.log(`✓ [PASS] ${title}`);
    } else {
      console.log(`✗ [FAIL] ${title}`);
      allPassed = false;
    }
  } catch (err) {
    console.log(`✗ [FAIL] ${title} -> ${err.message}`);
    allPassed = false;
  }
}

// 1. Check letterhead asset exists
check('Letterhead asset exists in assets/letterhead.png', () => {
  const stat = fs.statSync('assets/letterhead.png');
  return stat.size > 500000;
});

// 2. Check pdf-service.js
check('PDF service exists and includes all 5 generator methods', () => {
  const code = fs.readFileSync('js/services/pdf-service.js', 'utf8');
  const hasGuide = code.includes('generateAwarenessGuidePDF');
  const has80G = code.includes('generateDonationReceiptPDF');
  const hasDoctor = code.includes('generateDoctorAppointmentPDF');
  const hasDiag = code.includes('generateDiagnosticBookingPDF');
  const hasReport = code.includes('generateReportPDF');
  const hasNumberToWords = code.includes('numberToWordsIN');
  const hasLetterheadRef = code.includes('assets/letterhead.png');
  return hasGuide && has80G && hasDoctor && hasDiag && hasReport && hasNumberToWords && hasLetterheadRef;
});

// 3. Check index.html imports and button bindings
check('index.html imports html2pdf and pdf-service', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const hasHtml2Pdf = html.includes('html2pdf.bundle.min.js');
  const hasPdfService = html.includes('js/services/pdf-service.js');
  return hasHtml2Pdf && hasPdfService;
});

// 4. Check modals.js integrations
check('modals.js integrates AvinyaPdf for donations and guide download', () => {
  const js = fs.readFileSync('js/modals.js', 'utf8');
  const has80G = js.includes('window.AvinyaPdf.generateDonationReceiptPDF');
  const hasGuide = js.includes('window.AvinyaPdf.generateAwarenessGuidePDF');
  return has80G && hasGuide;
});

// 5. Check doctors.html and healthcare-app.js
check('doctors.html and healthcare-app.js integrate AvinyaPdf', () => {
  const docHtml = fs.readFileSync('doctors.html', 'utf8');
  const hcJs = fs.readFileSync('js/healthcare/healthcare-app.js', 'utf8');
  const hasDocScripts = docHtml.includes('html2pdf.bundle.min.js') && docHtml.includes('js/services/pdf-service.js');
  const hasAptPdf = hcJs.includes('window.AvinyaPdf.generateDoctorAppointmentPDF');
  const hasDiagPdf = hcJs.includes('window.AvinyaPdf.generateDiagnosticBookingPDF');
  return hasDocScripts && hasAptPdf && hasDiagPdf;
});

// 6. Check admin.html
check('admin.html integrates Export PDF Report, detail modal PDF, and 80G buttons', () => {
  const adminHtml = fs.readFileSync('admin.html', 'utf8');
  const hasScripts = adminHtml.includes('html2pdf.bundle.min.js') && adminHtml.includes('js/services/pdf-service.js');
  const hasExportBtn = adminHtml.includes('exportPDF()');
  const hasDetailBtn = adminHtml.includes('downloadCurrentRecordPDF()');
  const has80GBtn = adminHtml.includes('generateDonationReceiptPDF');
  return hasScripts && hasExportBtn && hasDetailBtn && has80GBtn;
});

console.log('\n======================================================');
if (allPassed) {
  console.log('🎉 ALL LETTERHEAD PDF INTEGRATION CHECKS PASSED!');
} else {
  console.log('❌ SOME CHECKS FAILED.');
  process.exit(1);
}
console.log('======================================================\n');
