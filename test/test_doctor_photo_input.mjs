import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import assert from 'node:assert';

console.log('Testing Doctor Photo Input & Section Overlap Fix...');

// 1. Check admin.html for doctor photo input UI elements
const adminHtmlPath = resolve('admin.html');
const adminHtml = readFileSync(adminHtmlPath, 'utf8');

assert.ok(adminHtml.includes('id="docAvatarPreview"'), 'admin.html should contain #docAvatarPreview for photo live preview');
assert.ok(adminHtml.includes('id="docAvatarFileInput"'), 'admin.html should contain #docAvatarFileInput for file selection');
assert.ok(adminHtml.includes('id="docAvatarBase64"'), 'admin.html should contain hidden input for base64 photo data');
assert.ok(adminHtml.includes('handleDoctorImageFileSelect'), 'admin.html should contain handleDoctorImageFileSelect function');
assert.ok(adminHtml.includes('INDIAN_DOCTOR_PRESETS'), 'admin.html should contain INDIAN_DOCTOR_PRESETS for quick Indian doctor photo selection');
assert.ok(adminHtml.includes('selectPresetDoctorAvatar'), 'admin.html should contain selectPresetDoctorAvatar helper');
assert.ok(adminHtml.includes('updateDoctorAvatarPreview'), 'admin.html should contain updateDoctorAvatarPreview helper');

console.log('✓ Admin HTML contains all Doctor Photo Input UI components & event handlers.');

// 2. Check CSS for Section Overlap Fix
const cssPath = resolve('css/styles.css');
const cssContent = readFileSync(cssPath, 'utf8');

assert.ok(cssContent.includes('.section-nestjs-stack'), 'CSS should have .section-nestjs-stack');
assert.ok(cssContent.includes('isolation: isolate;'), 'CSS should have isolation: isolate for stacking isolation');
assert.ok(cssContent.includes('overflow: hidden;'), 'CSS should have overflow: hidden on .section-nestjs-stack to prevent card deck bleed');

console.log('✓ CSS section overlap fix verified with stacking isolation and overflow bounds.');

// 3. Check assets/doctors directory for doctor profile images
const expectedImages = [
  'default-doctor.jpg',
  'doc-1-priya-sharma.jpg',
  'doc-2-rajesh-varma.jpg',
  'doc-3-ananya-sengupta.jpg',
  'doc-4-vikramaditya-rathore.jpg',
  'doc-5-meera-nambiar.jpg',
  'doc-6-siddharth-balakrishnan.jpg',
  'doc-7-kavita-joshi.jpg',
  'doc-8-arvind-deshmukh.jpg',
  'doc-9-shalini-raman.jpg',
  'doc-10-farooq-qureshi.jpg'
];

for (const img of expectedImages) {
  const p = resolve('assets/doctors', img);
  assert.ok(existsSync(p), `Expected doctor photo asset exists: ${img}`);
}

console.log('✓ All 11 Indian doctor photo assets exist locally in /assets/doctors/.');

console.log('🎉 ALL Doctor Photo Input & Section Overlap Tests Passed Successfully!');
