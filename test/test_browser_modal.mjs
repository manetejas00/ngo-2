import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function runBrowserTest() {
  console.log('1. Launching Chromium browser...');
  const browser = await chromium.launch({
    headless: false,
    slowMo: 200
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 850 }
  });
  const page = await context.newPage();

  console.log('2. Navigating to https://test.avinyacarefoundation.org/...');
  await page.goto('https://test.avinyacarefoundation.org/', { waitUntil: 'load' });

  // Wait for Hostinger anti-bot / challenge page to finish redirecting
  console.log('3. Waiting for homepage to load...');
  await page.waitForSelector('nav.navbar', { timeout: 30000 });
  console.log('   Homepage loaded successfully!');

  // Click Donate button in navbar
  console.log('4. Clicking Donate button in navbar...');
  const donateBtn = page.locator('nav button:has-text("Donate")').first();
  await donateBtn.click();

  // Wait for modal to become active
  await page.waitForSelector('#donate-modal.active', { timeout: 10000 });
  console.log('5. Donate modal is open.');

  // Select amount ₹2,500
  console.log('6. Selecting ₹2,500 donation amount pill...');
  await page.locator('button.amount-btn:has-text("₹2,500")').click();

  // Fill in the form fields
  console.log('7. Filling in donor details: Tejas Mane | manetejas00@gmail.com...');
  await page.fill('#donor-name', 'Tejas Mane');
  await page.fill('#donor-email', 'manetejas00@gmail.com');
  await page.fill('#donor-phone', '+91 98200 12345');
  await page.fill('#donor-pan', 'ABCDE1234F');

  // Submit donation
  console.log('8. Submitting donation form...');
  const submitBtn = page.locator('#donate-modal button[type="submit"]');
  await submitBtn.click();

  // Wait for final confirmation and email status box to appear
  console.log('9. Waiting for live email delivery status card and preview...');
  await page.waitForSelector('#donate-modal div:has-text("Email Preview"), #donate-modal div:has-text("Email Delivery Status")', { timeout: 25000 });

  await page.waitForTimeout(2000);

  const modalText = await page.locator('#donate-modal .modal-container').innerText();
  console.log('\n========================================');
  console.log('LIVE MODAL CONFIRMATION CARD:');
  console.log('========================================\n' + modalText + '\n========================================\n');

  // Take screenshot of final confirmation state
  const afterScreenshotPath = join(__dirname, 'submission_confirmed.png');
  await page.screenshot({ path: afterScreenshotPath });
  console.log('10. Captured confirmation screenshot:', afterScreenshotPath);

  // Keep open for 4 seconds for visual inspection
  await page.waitForTimeout(4000);

  await browser.close();
  console.log('🎉 Browser test completed with 100% success!');
}

runBrowserTest().catch(err => {
  console.error('Browser Test Error:', err);
  process.exit(1);
});
