import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSubmissionStore } from '../services/submissions/submission-store.mjs';

test('concurrent submissions and payment updates preserve records', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'submissions-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const store = createSubmissionStore(join(dir, 'records.json'), { timestamp: () => 'test time' });
  await Promise.all(Array.from({ length: 30 }, (_, i) => store.save({ submissionId: String(i), formType: 'donation', amount: 100, category: 'Care' })));
  await Promise.all([store.updateDonationPaymentStatus('0', 'paid', 'admin'), store.save({ submissionId: 'new', formType: 'contact' })]);
  const records = await store.list();
  assert.equal(records.length, 31);
  assert.equal(records.find(record => record.id === '0').payment_status, 'PAID');
  assert.equal(records.find(record => record.id === '0').interest, 'Care');
});

test('a malformed data file is reported and never overwritten', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'submissions-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const file = join(dir, 'records.json');
  await writeFile(file, '{broken');
  const store = createSubmissionStore(file, { timestamp: () => 'test time' });
  await assert.rejects(store.save({ submissionId: '1' }));
  await assert.rejects(store.list());
  assert.equal(await readFile(file, 'utf8'), '{broken');
});
