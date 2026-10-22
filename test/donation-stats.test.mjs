import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDonationStats, getSubmissionCategory, isDonationPledge } from '../services/donations/donationStats.mjs';

test('donation statistics distinguish verified, pending, and failed payments', () => {
  const records = [
    { form_type: 'donation', amount: 100, payment_status: 'PAID', email: 'A@example.com', category: 'Care', transaction_id: 'one' },
    { form_type: 'donation', amount: 100, payment_status: 'PAID', email: 'A@example.com', category: 'Care', transaction_id: 'one' },
    { form_type: 'donation', amount: 50, payment_status: 'PENDING', email: 'a@example.com', interest: 'Care' },
    { form_type: 'donation', amount: 20, payment_status: 'FAILED' },
    { form_type: 'donation', amount: -10, payment_status: 'PAID' },
    { form_type: 'volunteer', amount: 500, payment_status: 'PAID' }
  ];
  const stats = calculateDonationStats(records);
  assert.equal(stats.total, 100);
  assert.equal(stats.total_donations, 1);
  assert.equal(stats.unique_donors, 1);
  assert.equal(stats.pledged_total, 150);
  assert.equal(stats.pending_total, 50);
  assert.equal(stats.failed_total, 20);
  assert.equal(stats.pledged_campaign_donors.Care, 1);
  assert.equal(stats.categories.Care, 100);
});

test('donation helpers retain existing fallback behavior', () => {
  assert.equal(getSubmissionCategory({ interest: '  Health ' }), 'Health');
  assert.equal(isDonationPledge({ form_type: 'donation', amount: '20' }), true);
  assert.equal(isDonationPledge({ form_type: 'donation', amount: 'invalid' }), false);
  assert.equal(calculateDonationStats([]).total, 0);
});
