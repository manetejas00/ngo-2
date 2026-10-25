import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { createCampRegistrationStore, validateRegistration, campRegistrationHandler } from '../services/registrations/camp-registration.mjs';

const valid = { name: "Test O'Brien", age: '37', gender: 'Prefer not to say', phone: '+91 9000000001', location: 'Virar West', consent: true };
test('original required fields and optional medical questions', () => {
  const { data, errors } = validateRegistration(valid);
  assert.deepEqual(errors, {});
  assert.equal(data.phone, '9000000001');
  assert.equal(data.healthConcerns, '');
  for (const [field, value] of Object.entries({ name: '', age: 'NaN', gender: 'invalid', phone: '123', location: '', consent: false, familyHistory: 'invalid' })) {
    assert.ok(validateRegistration({ ...valid, [field]: value }).errors[field], field);
  }
  assert.ok(validateRegistration({ ...valid, age: '3.5' }).errors.age);
  assert.ok(validateRegistration({ ...valid, healthConcerns: 'x'.repeat(2001) }).errors.healthConcerns);
});
test('SQLite persistence, SQL escaping, concurrent duplicates and family registrations', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'avinya-camp-'));
  try {
    const path = join(directory, 'private', 'camp.sqlite');
    const store = createCampRegistrationStore(path);
    const { data } = validateRegistration({ ...valid, healthConcerns: "Test only: '); DROP TABLE camp_registrations; --" });
    const results = await Promise.all(Array.from({ length: 5 }, () => store.register(data)));
    assert.equal(results.filter(Boolean).length, 1);
    assert.match(results.find(Boolean).id, /^ACF-/);
    const restartedStore = createCampRegistrationStore(path);
    assert.equal(await restartedStore.register(data), null);
    assert.equal(await restartedStore.register({ ...data, name: data.name.toUpperCase() }), null);
    assert.ok(await restartedStore.register({ ...data, name: 'Another Family Member' }));
    const rows = await restartedStore.list();
    assert.equal(rows.length, 2);
    assert.equal(rows[0].healthConcerns, data.healthConcerns);
    await restartedStore.setEmailStatus(rows[0].id, 'SENT');
    assert.equal((await restartedStore.list()).find(row => row.id === rows[0].id).emailStatus, 'SENT');
  } finally { await rm(directory, { recursive: true, force: true }); }
});
test('API returns success only after save, validates consent, and hides storage errors', async () => {
  let saves = 0;
  const handler = campRegistrationHandler({ register: async () => { saves++; if (saves === 1) return { id: 'ACF-test' }; if (saves === 2) return null; throw new Error('private database detail'); } });
  const server = createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const send = body => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  try {
    assert.equal((await fetch(url)).status, 405);
    assert.equal((await send({ ...valid, consent: false })).status, 422);
    assert.equal(saves, 0);
    const success = await send(valid);
    assert.equal(success.status, 201);
    assert.equal((await success.json()).registrationId, 'ACF-test');
    assert.equal((await send(valid)).status, 409);
    const failed = await send(valid);
    assert.equal(failed.status, 503);
    assert.doesNotMatch(await failed.text(), /private database detail/);
    assert.equal((await fetch(url, { method: 'POST', body: '{}' })).status, 415);
    assert.equal((await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })).status, 400);
    assert.equal((await send({ ...valid, extra: 'x'.repeat(17000) })).status, 413);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
test('optional email is validated and confirmations only send when supplied', async () => {
  assert.deepEqual(validateRegistration({ ...valid, email: '' }).errors, {});
  assert.ok(validateRegistration({ ...valid, email: 'invalid' }).errors.email);
  assert.equal(validateRegistration({ ...valid, email: ' TEST@EXAMPLE.COM ' }).data.email, 'test@example.com');
  const sent = [], audit = [];
  const handler = campRegistrationHandler({ register: async () => ({ id: 'ACF-email-test' }), setEmailStatus: async (...args) => audit.push(args) }, { sendConfirmation: async data => { sent.push(data.email); if (data.email === 'fail@example.com') throw new Error('SMTP down'); return 'SENT'; } });
  const server = createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const send = email => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...valid, email }) });
  try {
    assert.equal((await (await send('')).json()).emailStatus, 'SKIPPED');
    assert.equal(sent.length, 0);
    assert.equal((await (await send('test@example.com')).json()).emailStatus, 'SENT');
    const failed = await send('fail@example.com');
    assert.equal(failed.status, 201);
    assert.equal((await failed.json()).emailStatus, 'FAILED');
    assert.deepEqual(audit.map(item => item[1]), ['SKIPPED', 'SENT', 'FAILED']);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
test('registration closes at exactly 4 PM IST on camp day', async () => {
  const { Readable } = await import('node:stream');
  const { REGISTRATION_CLOSES_AT } = await import('../services/registrations/camp-registration.mjs');
  const originalNow = Date.now;
  let saves = 0;
  const handler = campRegistrationHandler({ register: async () => { saves++; return { id: 'test' }; } });
  async function requestAt(time) {
    Date.now = () => time;
    const req = Readable.from([JSON.stringify(valid)]); req.method = 'POST'; req.headers = { 'content-type': 'application/json' };
    let code;
    await handler(req, { setHeader() {}, writeHead(value) { code = value; }, end() {} });
    return code;
  }
  try {
    assert.equal(new Date(REGISTRATION_CLOSES_AT).toISOString(), '2026-11-29T10:30:00.000Z');
    assert.equal(await requestAt(REGISTRATION_CLOSES_AT - 1), 201);
    assert.equal(await requestAt(REGISTRATION_CLOSES_AT), 410);
    assert.equal(await requestAt(REGISTRATION_CLOSES_AT + 1), 410);
    assert.equal(saves, 1);
  } finally { Date.now = originalNow; }
});

test('admin edits persist, enforce uniqueness, and deletion removes only the selected record', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'avinya-camp-admin-'));
  try {
    const store = createCampRegistrationStore(join(directory, 'camp.sqlite'));
    const data = validateRegistration(valid).data;
    const first = await store.register(data);
    const second = await store.register({...data, name:'Second Person'});
    assert.equal(await store.update(first.id,{...data,name:'Updated Person',email:'updated@example.com'}),true);
    assert.equal((await store.list()).find(row=>row.id===first.id).email,'updated@example.com');
    await assert.rejects(store.update(first.id,{...data,name:'Second Person'}));
    assert.equal((await store.list()).find(row=>row.id===first.id).name,'Updated Person');
    await store.setEmailStatus(first.id,'SENT');
    assert.equal(await store.remove(first.id),true);
    assert.equal(await store.remove(first.id),false);
    assert.deepEqual((await store.list()).map(row=>row.id),[second.id]);
  } finally { await rm(directory,{recursive:true,force:true}); }
});
