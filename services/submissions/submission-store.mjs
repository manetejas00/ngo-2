/** File-backed submission records used by the Node API. */
import { readFile, writeFile, mkdir, rename, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { getSubmissionCategory } from '../donations/donationStats.mjs';

function normalizeSubmissions(list) {
    return list.map(item => ({
      id: item.submissionId || item.id || item.submission_id || ('SUB-' + Date.now()),
      submission_id: item.submissionId || item.id || item.submission_id || ('SUB-' + Date.now()),
      form_type: (item.formType || item.form_type || 'contact').toLowerCase(),
      name: item.name || 'Anonymous',
      email: item.email || '',
      phone: item.phone || '',
      organization: item.organization || '',
      message: item.message || '',
      amount: item.amount || null,
      payment_status: item.paymentStatus || item.payment_status || 'PENDING',
      transaction_id: item.transactionId || item.transaction_id || '',
      category: getSubmissionCategory(item),
      interest: getSubmissionCategory(item),
      is_anonymous: Boolean(item.isAnonymous || item.is_anonymous),
      delivery_status: item.deliveryStatus || item.delivery_status || 'SENT',
      created_at: item.timestampIST || item.created_at || new Date().toISOString()
    }));
}


/** Serialize mutations so concurrent requests cannot overwrite one another. */
export function createSubmissionStore(file, { timestamp } = {}) {
  let pending = Promise.resolve();
  async function readRecords() {
    let raw;
    try { raw = await readFile(file, 'utf8'); }
    catch (error) { if (error.code === 'ENOENT') return []; throw error; }
    const records = JSON.parse(raw);
    if (!Array.isArray(records)) throw new Error('Submission records are unavailable.');
    return records;
  }
  async function writeRecords(records) {
    await mkdir(dirname(file), { recursive: true });
    const temporary = `${file}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporary, JSON.stringify(records, null, 2), 'utf8');
      await rename(temporary, file);
    } finally {
      await unlink(temporary).catch(error => { if (error.code !== 'ENOENT') console.warn('[Submission cleanup warning]', error.message); });
    }
  }
  function mutate(operation) {
    const result = pending.then(operation);
    pending = result.catch(() => {});
    return result;
  }
  return {
    save(record) {
      return mutate(async () => {
        const records = await readRecords();
        const category = getSubmissionCategory(record);
        records.unshift({ ...record, category, interest: category || record.interest || '' });
        await writeRecords(records);
      });
    },
    async list() {
      await pending;
      return normalizeSubmissions(await readRecords());
    },
    updateDonationPaymentStatus(submissionId, paymentStatus, verifiedBy) {
      return mutate(async () => {
        const allowed = new Set(['PENDING', 'CONFIRMED', 'PAID', 'FAILED']);
        const id = String(submissionId || '').trim();
        const status = String(paymentStatus || '').trim().toUpperCase();
        if (!id || !allowed.has(status)) throw new Error('Invalid donation payment status update.');
        const records = await readRecords();
        const record = records.find(item => String(item.submissionId || item.id || item.submission_id || '').trim() === id
          && String(item.formType || item.form_type || '').toLowerCase() === 'donation');
        if (!record) throw new Error('Donation record was not found.');
        record.paymentStatus = status;
        record.payment_status = status;
        record.paymentVerifiedBy = String(verifiedBy || 'admin').slice(0, 120);
        record.paymentVerifiedAt = timestamp();
        await writeRecords(records);
        return record;
      });
    }
  };
}
