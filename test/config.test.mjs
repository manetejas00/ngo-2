import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadEnvironment } from '../config/environment.mjs';
import { MIME_TYPES } from '../config/mime-types.mjs';

test('loads the selected environment file without replacing supplied values', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'avinya-config-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await writeFile(join(directory, '.env'), '# comment\nLOCAL="hello"\nEXISTING=file\nTOKEN=a=b\n');
  await writeFile(join(directory, '.env.production'), 'LOCAL=production\n');
  const local = { EXISTING: 'external', EMPTY: '' };
  await writeFile(join(directory, '.env'), '# comment\nLOCAL="hello"\nEXISTING=file\nEMPTY=file\nTOKEN=a=b\n');
  await loadEnvironment(directory, local);
  assert.deepEqual(local, { EXISTING: 'external', EMPTY: '', LOCAL: 'hello', TOKEN: 'a=b' });
  const production = { NODE_ENV: 'production' };
  await loadEnvironment(directory, production);
  assert.equal(production.LOCAL, 'production');
});

test('reports environment file read errors other than a missing file', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'avinya-config-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await import('node:fs/promises').then(({ mkdir }) => mkdir(join(directory, '.env')));
  await assert.rejects(loadEnvironment(directory, {}), { code: 'EISDIR' });
});

test('missing environment files are optional and MIME mappings remain available', async () => {
  await loadEnvironment(join(tmpdir(), 'avinya-nonexistent-config-test'), {});
  assert.equal(MIME_TYPES['.html'], 'text/html; charset=utf-8');
  assert.equal(MIME_TYPES['.mp4'], 'video/mp4');
});
