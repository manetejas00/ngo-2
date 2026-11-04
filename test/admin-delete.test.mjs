import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { execFileSync, spawnSync } from 'node:child_process';

const server = await readFile(new URL('../server.mjs', import.meta.url), 'utf8');
const deletion = server.slice(server.indexOf("      if (action === 'delete_record')"), server.indexOf("      if (action === 'send_camp_mail')"));

async function request(role, payload, method = 'POST', removed = true) {
  const calls = [];
  const context = { action: 'delete_record', req: { method }, sessionUser: { role }, payload,
    sendJson: (code, body) => ({ code, body }),
    submissionStore: { remove: async id => { calls.push(['form', id]); return removed; } },
    deleteAdminRecord: async (type, id) => { calls.push([type, id]); return removed; }
  };
  const response = await vm.runInNewContext(`(async () => { ${deletion} })()`, context);
  return { ...response, calls };
}

test('delete API blocks unauthorized roles and invalid input before touching storage', async () => {
  for (const role of ['doctor', 'diagnostic_provider', 'user']) {
    const result = await request(role, { type: 'form', id: 'SUB-1' });
    assert.equal(result.code, 403);
    assert.equal(result.calls.length, 0);
  }
  for (const payload of [{ type: 'users', id: '1' }, { type: 'form', id: '' }, { type: 'form', id: "x' OR 1=1" }]) {
    const result = await request('admin', payload);
    assert.equal(result.code, 422);
    assert.equal(result.calls.length, 0);
  }
  assert.equal((await request('admin', { type: 'form', id: '1' }, 'GET')).code, 405);
});

test('delete API targets the requested record and reports missing records', async () => {
  for (const role of ['admin', 'manager']) for (const type of ['form', 'doctor', 'diagnostic', 'email', 'activity']) {
    const result = await request(role, { type, id: 'record-1' });
    assert.equal(result.code, 200);
    assert.deepEqual(result.calls, [[type, 'record-1']]);
  }
  assert.equal((await request('admin', { type: 'form', id: 'missing' }, 'POST', false)).code, 404);
});

const html = await readFile(new URL('../admin.html', import.meta.url), 'utf8');
const ui = html.slice(html.indexOf('    function deleteRecordButton('), html.indexOf('    function renderForms('));
function deleteUI({ confirm = true, ok = true } = {}) {
  const calls = [];
  const button = { disabled: false, dataset: { deleteType: 'form', deleteId: 'SUB-1' } };
  const context = { currentUser: { role: 'admin' }, adminToken: 'test', escapeHtml: value => String(value).replaceAll('"', '&quot;'),
    document: { addEventListener: (type, handler) => { context.click = handler; } },
    confirm: () => confirm, getApiBaseUrl: () => '',
    fetch: async (url, options) => { calls.push(JSON.parse(options.body)); return { ok, json: async () => ({ status: ok ? 'ok' : 'error', message: ok ? 'Deleted' : 'Failed' }) }; },
    showToast: (...args) => calls.push(args), fetchAdminData: async () => { calls.push('refresh'); return true; }
  };
  vm.runInNewContext(ui, context);
  return { context, button, calls, click: () => context.click({ target: { closest: () => button } }) };
}

test('delete buttons respect role and safely encode record identifiers', () => {
  const { context } = deleteUI();
  assert.match(context.deleteRecordButton('form', 'a"b'), /a&quot;b/);
  context.currentUser.role = 'doctor';
  assert.equal(context.deleteRecordButton('form', '1'), '');
});

test('PHP restores account identity before rendering Delete after a page reload', async t => {
  const phpBinary = [process.env.PHP_BINARY, 'php', '/opt/homebrew/bin/php', '/usr/local/bin/php'].filter(Boolean)
    .find(binary => spawnSync(binary, ['--version'], { stdio: 'ignore' }).status === 0);
  if (!phpBinary) return t.skip('PHP is unavailable');
  const php = await readFile(new URL('../api/admin-data.php', import.meta.url), 'utf8');
  const identity = php.slice(php.indexOf("    'currentUser' =>"), php.indexOf("    'analytics' =>", php.indexOf("    'currentUser' =>")));
  assert.ok(identity.includes("$authenticatedUser['role']"));
  const fetchUI = html.slice(html.indexOf('    async function fetchAdminData('), html.indexOf('    function updateStats('));
  for (const role of ['admin', 'manager', 'doctor', 'diagnostic_provider']) {
    const response = JSON.parse(execFileSync(phpBinary, ['-r', `
      $authenticatedUser = ['user_id' => 'test-user', 'name' => 'Test', 'email' => 'test@example.org', 'role' => '${role}', 'status' => 'active'];
      echo json_encode(['status' => 'ok', ${identity} 'data' => []]);
    `], { encoding: 'utf8' }));
    const { context } = deleteUI();
    context.currentUser = null;
    let renderedButton;
    Object.assign(context, {
      fetch: async () => ({ status: 200, json: async () => response }),
      syncCurrentUserChrome() {}, applyRolePermissions() {}, updateStats() {}, loadGoogleAnalytics() {},
      renderCurrentTab() { renderedButton = context.deleteRecordButton('form', 'SUB-1'); }
    });
    vm.runInNewContext(fetchUI, context);
    assert.equal(await context.fetchAdminData(), true);
    assert.equal(context.currentUser.role, role);
    assert.equal(renderedButton.includes('data-delete-type'), ['admin', 'manager'].includes(role));
  }
});

test('delete confirmation cancels without a request; success refreshes; failure allows retry', async () => {
  const cancelled = deleteUI({ confirm: false });
  await cancelled.click();
  assert.equal(cancelled.calls.length, 0);
  const success = deleteUI();
  await success.click();
  assert.deepEqual(success.calls[0], { action: 'delete_record', type: 'form', id: 'SUB-1' });
  assert.ok(success.calls.includes('refresh'));
  const failed = deleteUI({ ok: false });
  await failed.click();
  assert.ok(!failed.calls.includes('refresh'));
  assert.equal(failed.button.disabled, false);
});

test('booking, log and campaign deletion persists without changing unrelated records', async t => {
  const { mkdtemp, writeFile, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { fileURLToPath, pathToFileURL } = await import('node:url');
  const dir = await mkdtemp(join(tmpdir(), 'admin-records-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const original = new URL('../services/healthcare/healthcareDb.mjs', import.meta.url);
  const source = (await readFile(original, 'utf8'))
    .replace('fileURLToPath(import.meta.url)', JSON.stringify(fileURLToPath(original)))
    .replace("join(__dirname, '../../cache')", JSON.stringify(dir))
    .replaceAll("'./diagnosticValidation.mjs'", JSON.stringify(new URL('./diagnosticValidation.mjs', original).href))
    .replaceAll("'./healthcareAuthService.mjs'", JSON.stringify(new URL('./healthcareAuthService.mjs', original).href));
  const moduleFile = join(dir, 'database.mjs');
  await writeFile(moduleFile, source);
  await writeFile(join(dir, 'healthcare_db.json'), JSON.stringify({
    appointments: [{ id: 'a' }, { booking_id: 'b' }], testBookings: [{ id: 't' }],
    notificationLogs: [{ id: 'n' }], activityLogs: [{ log_id: 'l' }],
    crowdfundingCampaigns: [{ campaign_id: 'c' }, { id: 'd' }], users: [], diagnosticProviders: []
  }));
  const db = await import(pathToFileURL(moduleFile).href);
  for (const [type, id] of [['doctor', 'a'], ['diagnostic', 't'], ['email', 'n'], ['activity', 'l']]) {
    assert.equal(await db.deleteAdminRecord(type, id), true);
    assert.equal(await db.deleteAdminRecord(type, id), false);
  }
  await assert.rejects(db.deleteAdminRecord('users', '1'), /Unsupported/);
  assert.equal(await db.deleteCrowdfundingCampaign('c'), true);
  const reloaded = await import(pathToFileURL(moduleFile).href + '?reload');
  assert.deepEqual((await reloaded.getCrowdfundingCampaigns()).map(row => row.campaign_id || row.id), ['d']);
  assert.deepEqual((await reloaded.getDb()).appointments, [{ booking_id: 'b' }]);
});
