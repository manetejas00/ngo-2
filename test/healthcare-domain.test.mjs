import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../js/healthcare/healthcare-domain.js', import.meta.url), 'utf8');
const context = { window: {} };
vm.runInNewContext(source, context);
const domain = context.window.AvinyaHealthcareDomain;

test('booking dates use sorted, unique future dates and honor the limit', () => {
  const dates = domain.getDoctorBookingDates({ schedule: { availableDates: ['9999-12-02', '9999-12-01', '9999-12-01', 'invalid'] } }, 1);
  assert.deepEqual(Array.from(dates), ['9999-12-01']);
});

test('fee formatting retains the displayed concession and free labels', () => {
  assert.equal(domain.parseFeeDisplay({ feeDisplay: '₹500 (50% AvinyaCareFoundation Concession)' }).tag, '50% Concession');
  assert.equal(domain.parseFeeDisplay({ consultationFee: 0 }).isFree, true);
});

test('doctors page loads the domain before the controller', async () => {
  const html = await readFile(new URL('../doctors.html', import.meta.url), 'utf8');
  const domainIndex = html.indexOf('js/healthcare/healthcare-domain.js');
  assert.ok(domainIndex >= 0 && domainIndex < html.indexOf('js/healthcare/healthcare-app.js'));
});
