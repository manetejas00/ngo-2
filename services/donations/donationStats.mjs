/** Donation classification and aggregation shared by public and admin APIs. */
const SUCCESSFUL_PAYMENT_STATUSES = new Set(['SUCCESS', 'CONFIRMED', 'PAID']);

export function getSubmissionCategory(record) {
  return String(record?.category || record?.interest || '').trim();
}

function isSuccessfulDonation(record) {
  return record.form_type === 'donation'
    && Number.isFinite(Number(record.amount))
    && Number(record.amount) > 0
    && SUCCESSFUL_PAYMENT_STATUSES.has(String(record.payment_status || '').toUpperCase());
}

function getPaymentStatus(record) {
  return String(record.payment_status || record.paymentStatus || 'PENDING').trim().toUpperCase();
}

export function isDonationPledge(record) {
  return record.form_type === 'donation'
    && Number.isFinite(Number(record.amount))
    && Number(record.amount) > 0;
}

export function calculateDonationStats(records) {
  const stats = {
    total: 0,
    total_donations: 0,
    unique_donors: 0,
    donors: 0,
    categories: {},
    campaign_donors: {},
    pledged_total: 0,
    pledged_donations: 0,
    pledged_categories: {},
    pledged_campaign_donors: {},
    pending_total: 0,
    pending_donations: 0,
    failed_total: 0,
    failed_donations: 0
  };
  const donorKeys = new Set();
  const campaignDonorKeys = new Map();
  const pledgedCampaignDonorKeys = new Map();
  const seenTransactions = new Set();

  for (const record of records || []) {
    if (!isDonationPledge(record)) continue;
    const transactionId = String(record.transaction_id || record.transactionId || '').trim();
    if (transactionId) {
      if (seenTransactions.has(transactionId)) continue;
      seenTransactions.add(transactionId);
    }

    const amount = Number(record.amount);
    const status = getPaymentStatus(record);
    const category = getSubmissionCategory(record) || 'General Fund';

    // Submitted forms are visible as pledges immediately. They remain
    // separate from verified aid until payment is confirmed.
    if (status === 'PENDING' || isSuccessfulDonation(record)) {
      stats.pledged_total += amount;
      stats.pledged_donations += 1;
      stats.pledged_categories[category] = (stats.pledged_categories[category] || 0) + amount;
      if (!pledgedCampaignDonorKeys.has(category)) pledgedCampaignDonorKeys.set(category, new Set());
      if (record.email) pledgedCampaignDonorKeys.get(category).add(String(record.email).trim().toLowerCase());
    }
    if (isSuccessfulDonation(record)) {
      stats.total += amount;
      stats.total_donations += 1;
      stats.categories[category] = (stats.categories[category] || 0) + amount;
      if (record.email) donorKeys.add(String(record.email).trim().toLowerCase());
      if (!campaignDonorKeys.has(category)) campaignDonorKeys.set(category, new Set());
      if (record.email) campaignDonorKeys.get(category).add(String(record.email).trim().toLowerCase());
    } else if (status === 'PENDING') {
      stats.pending_total += amount;
      stats.pending_donations += 1;
    } else {
      stats.failed_total += amount;
      stats.failed_donations += 1;
    }
  }

  stats.unique_donors = donorKeys.size;
  stats.donors = stats.unique_donors;
  for (const [category, donors] of campaignDonorKeys) stats.campaign_donors[category] = donors.size;
  for (const [category, donors] of pledgedCampaignDonorKeys) stats.pledged_campaign_donors[category] = donors.size;
  return stats;
}

export function formatINR(amount) {
  return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(Number(amount) || 0)}`;
}
