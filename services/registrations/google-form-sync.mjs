import { createHash, timingSafeEqual } from 'node:crypto';
import { validateRegistration } from './camp-registration.mjs';

export function validSyncToken(received, expected) {
  if (!expected || expected.length < 32 || typeof received !== 'string') return false;
  const hash = value => createHash('sha256').update(value).digest();
  return timingSafeEqual(hash(received), hash(expected));
}
export function googleRegistration(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { errors: { form: 'Invalid response.' } };
  if (!/^[a-zA-Z0-9_-]{1,200}$/.test(input.responseId || '') || !/^[a-zA-Z0-9_-]{1,200}$/.test(input.formId || '')) return { errors: { responseId: 'Google form and response IDs required.' } };
  const checkups = input.checkups ?? [];
  if (!Array.isArray(checkups) || checkups.some(v => !['General health','Eye','Dental','ENT','Cancer screening','Not sure'].includes(v))) return { errors: { checkups: 'Invalid checkups.' } };
  const { data, errors } = validateRegistration({ ...input, location: input.area_location, healthConcerns: input.health_concerns, testsInterested: checkups.join(', '), previousScreening: input.prior_screening, diagnosedCondition: input.prior_cancer_diagnosis, familyHistory: input.family_cancer_history });
  if (Object.keys(errors).length) return { errors };
  const id = 'GFORM-' + createHash('sha256').update(`${input.formId}:${input.responseId}`).digest('hex');
  return { errors, record: { submissionId: id, formType: 'preregistration', name: data.name, full_name: data.name, phone: data.phone, age: data.age, gender: data.gender, email: data.email, area_location: data.location, checkups, health_concerns: data.healthConcerns, prior_screening: data.previousScreening, prior_cancer_diagnosis: data.diagnosedCondition, family_cancer_history: data.familyHistory, consent: true, consentVersion: data.consentVersion, source: 'google_forms', google_form_id: input.formId, google_response_id: input.responseId, status: 'PENDING_REVIEW', review_status: 'PRIVATE_UNREVIEWED', deliveryStatus: data.email ? 'PENDING' : 'SKIPPED', created_at: new Date().toISOString() } };
}
export function googleFormHandler(store, { token, formId, sendConfirmation } = {}) {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json');
    const reply = (code, body) => { res.writeHead(code); res.end(JSON.stringify(body)); };
    if (req.method !== 'POST') return reply(405, { status: 'error', message: 'Use POST.' });
    if (!validSyncToken((req.headers.authorization || '').replace(/^Bearer /, ''), token)) return reply(401, { status: 'error', message: 'Invalid sync credentials.' });
    try {
      let body = '';
      for await (const chunk of req) { body += chunk; if (Buffer.byteLength(body) > 16384) return reply(413, { status: 'error' }); }
      let input;
      try { input = JSON.parse(body); } catch { return reply(400, { status: 'error', message: 'Invalid JSON.' }); }
      if (!formId || input.formId !== formId) return reply(403, { status: 'error', message: 'Form is not configured.' });
      const { record, errors } = googleRegistration(input);
      if (Object.keys(errors).length) return reply(422, { status: 'error', errors });
      const saved = await store.saveGoogleResponse(record);
      if (!saved.duplicate) {
        let status = record.email ? 'FAILED' : 'SKIPPED';
        if (record.email) try { status = await sendConfirmation(record, { id: record.submissionId, createdAt: record.created_at }); } catch {}
        await store.setEmailStatus(record.submissionId, status);
      }
      return reply(200, { status: 'ok', submissionId: record.submissionId, duplicate: saved.duplicate });
    } catch { return reply(503, { status: 'error', message: 'Sync unavailable. Retry later.' }); }
  };
}
