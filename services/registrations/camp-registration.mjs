import { spawn } from 'node:child_process';
import { mkdir, chmod } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

export const REGISTRATION_CLOSES_AT = Date.parse('2026-11-29T16:00:00+05:30');
export const CAMP_ID = 'mega-health-2026-11-29';
const choices = {
  gender: ['Female', 'Male', 'Other', 'Prefer not to say'],
  previousScreening: ['', 'Yes', 'No', 'Not sure'],
  diagnosedCondition: ['', 'Yes', 'No', 'Prefer not to say'],
  familyHistory: ['', 'Yes', 'No', 'Not sure', 'Prefer not to say']
};
export function validateRegistration(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { errors: { form: 'Invalid registration.' } };
  const errors = {};
  const text = (key, limit, required = false) => {
    const value = typeof input[key] === 'string' ? input[key].trim() : '';
    if (required && !value) errors[key] = 'This field is required.';
    if (value.length > limit || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value)) errors[key] = `Enter up to ${limit} characters without control characters.`;
    return value;
  };
  const data = { name: text('name', 120, true), phone: text('phone', 20, true), location: text('location', 160, true), testsInterested: text('testsInterested', 500), healthConcerns: text('healthConcerns', 2000) };
  data.email = text('email', 254).toLowerCase();
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,63}$/.test(data.email)) errors.email = 'Enter a valid email address or leave it blank.';
  const age = String(input.age ?? '').trim();
  if (!/^\d{1,3}$/.test(age) || Number(age) < 1 || Number(age) > 120) errors.age = 'Enter an age from 1 to 120 years.';
  data.age = Number(age);
  data.phone = data.phone.replace(/[\s()-]/g, '').replace(/^\+91/, '');
  if (!/^[6-9]\d{9}$/.test(data.phone)) errors.phone = 'Enter a valid 10-digit Indian mobile number.';
  for (const [key, options] of Object.entries(choices)) {
    data[key] = text(key, 40, key === 'gender');
    if (!options.includes(data[key])) errors[key] = 'Choose one of the listed options.';
  }
  if (input.consent !== true) errors.consent = 'Please read the privacy notice and consent to register.';
  data.consent = true;
  data.consentVersion = 'camp-registration-2026-10-25';
  return { data, errors };
}
const literal = value => `'${String(value).replaceAll("'", "''")}'`;

// SQL is supplied over stdin, never in shell commands or process arguments.
function sqlite(file, sql) {
  return new Promise((resolve, reject) => {
    const child = spawn('sqlite3', ['-batch', '-bail', file], { stdio: ['pipe', 'pipe', 'pipe'] });
    let output = '', error = '';
    const timer = setTimeout(() => { child.kill(); reject(new Error('Database timeout.')); }, 10000);
    child.stdout.on('data', chunk => { output += chunk; });
    child.stderr.on('data', chunk => { error += chunk; });
    child.on('error', err => { clearTimeout(timer); reject(err); });
    child.stdin.on('error', () => {});
    child.on('close', code => { clearTimeout(timer); code === 0 ? resolve(output.trim()) : reject(new Error(error || 'Database write failed.')); });
    child.stdin.end(`.timeout 5000\n${sql}\n`);
  });
}
export function createCampRegistrationStore(file) {
  let ready;
  function initialize() {
    return ready ||= (async () => {
      await mkdir(dirname(file), { recursive: true, mode: 0o700 });
      await sqlite(file, `CREATE TABLE IF NOT EXISTS camp_registrations (
        id TEXT PRIMARY KEY, camp_id TEXT NOT NULL, name TEXT NOT NULL,
        phone TEXT NOT NULL, age INTEGER NOT NULL, gender TEXT NOT NULL,
        locality TEXT NOT NULL, answers_json TEXT NOT NULL,
        consent_version TEXT NOT NULL, created_at TEXT NOT NULL,
        UNIQUE(camp_id, phone, name COLLATE NOCASE)
      ); CREATE TABLE IF NOT EXISTS camp_email_status (registration_id TEXT PRIMARY KEY, status TEXT NOT NULL);`);
      await chmod(file, 0o600);
    })().catch(error => { ready = undefined; throw error; });
  }
  return {
    async list() {
      await initialize();
      const output = await sqlite(file, `SELECT json_object('id', r.id, 'createdAt', r.created_at, 'answers', json(r.answers_json), 'emailStatus', coalesce(e.status, CASE WHEN coalesce(json_extract(r.answers_json, '$.email'), '') = '' THEN 'SKIPPED' ELSE 'PENDING' END)) FROM camp_registrations r LEFT JOIN camp_email_status e ON e.registration_id = r.id ORDER BY r.created_at DESC;`);
      return output ? output.split('\n').map(line => { const row = JSON.parse(line); return { ...row.answers, id: row.id, createdAt: row.createdAt, emailStatus: row.emailStatus }; }) : [];
    },
    async update(id, data) {
      await initialize();
      return await sqlite(file, `UPDATE camp_registrations SET name=${literal(data.name)},phone=${literal(data.phone)},age=${literal(data.age)},gender=${literal(data.gender)},locality=${literal(data.location)},answers_json=${literal(JSON.stringify(data))} WHERE id=${literal(id)}; SELECT changes();`) === '1';
    },
    async remove(id) {
      await initialize();
      return await sqlite(file, `BEGIN IMMEDIATE; DELETE FROM camp_email_status WHERE registration_id=${literal(id)}; DELETE FROM camp_registrations WHERE id=${literal(id)}; SELECT changes(); COMMIT;`) === '1';
    },
    async setEmailStatus(id, status) {
      await initialize();
      await sqlite(file, `INSERT INTO camp_email_status VALUES (${literal(id)}, ${literal(status)}) ON CONFLICT(registration_id) DO UPDATE SET status=excluded.status;`);
    },
    async register(data) {
      await initialize();
      const id = `ACF-${randomUUID()}`;
      const createdAt = new Date().toISOString();
      const values = [id, CAMP_ID, data.name, data.phone, data.age, data.gender, data.location, JSON.stringify(data), data.consentVersion, createdAt].map(literal).join(',');
      const changed = await sqlite(file, `INSERT INTO camp_registrations VALUES (${values}) ON CONFLICT(camp_id, phone, name) DO NOTHING; SELECT changes();`);
      return changed === '1' ? { id, createdAt } : null;
    }
  };
}
export function campRegistrationHandler(store, { sendConfirmation } = {}) {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const reply = (code, body) => { res.writeHead(code); res.end(JSON.stringify(body)); };
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return reply(405, { status: 'error', message: 'Use POST to register.' }); }
    if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) return reply(415, { status: 'error', message: 'Send registration as JSON.' });
    if (Date.now() >= REGISTRATION_CLOSES_AT) return reply(410, { status: 'error', message: 'Registration closed on 29 November 2026 at 4:00 PM IST. Call 7447441116 for assistance.' });
    try {
      let body = '', size = 0;
      for await (const chunk of req) {
        size += Buffer.byteLength(chunk);
        if (size > 16384) return reply(413, { status: 'error', message: 'Registration is too large.' });
        body += chunk;
      }
      let input;
      try { input = JSON.parse(body); } catch { return reply(400, { status: 'error', message: 'Invalid registration data.' }); }
      const { data, errors } = validateRegistration(input);
      if (Object.keys(errors).length) return reply(422, { status: 'error', message: 'Please check the highlighted fields.', errors });
      if (Date.now() >= REGISTRATION_CLOSES_AT) return reply(410, { status: 'error', message: 'Registration is now closed. Call 7447441116 for assistance.' });
      const record = await store.register(data);
      if (!record) return reply(409, { status: 'error', message: 'A registration already exists for this name and mobile number. Call 7447441116 for changes or help.' });
      let emailStatus = data.email ? 'FAILED' : 'SKIPPED';
      if (data.email && sendConfirmation) {
        try { emailStatus = await sendConfirmation(data, record); } catch { emailStatus = 'FAILED'; }
      }
      if (store.setEmailStatus) {
        try { await store.setEmailStatus(record.id, emailStatus); } catch { /* Registration remains saved even if delivery audit fails. */ }
      }
      return reply(201, { status: 'ok', emailStatus, registrationId: record.id, message: 'Your camp registration is saved. Please keep your reference. Tests and appointments remain subject to medical eligibility and availability.' });
    } catch {
      return reply(503, { status: 'error', message: 'Registration is temporarily unavailable. Please try again or call 7447441116.' });
    }
  };
}
