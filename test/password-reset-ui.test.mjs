import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const page = readFileSync(new URL('../admin.html', import.meta.url), 'utf8');
const start = page.indexOf('    async function handleForgotPasswordSubmit(');
const end = page.indexOf('    async function handleResetPasswordSubmit(', start);
const source = page.slice(start, end);

async function submit(response, error) {
  const nodes = {
    forgotEmail: {value:'info@avinyacarefoundation.org'},
    forgotMsg: {style:{}},
    forgotBtn: {},
  };
  const context = vm.createContext({
    document: {getElementById: id => nodes[id]},
    getApiBaseUrl: () => 'https://avinyacarefoundation.org',
    fetch: async () => { if (error) throw error; return response; },
    TypeError,
  });
  vm.runInContext(source, context);
  await context.handleForgotPasswordSubmit({preventDefault(){}});
  assert.equal(nodes.forgotBtn.disabled, false, 'retry button is restored');
  return nodes.forgotMsg;
}

test('reset request only reports success for an accepted API response', async () => {
  const message = await submit({ok:true,json:async()=>({status:'ok',message:'Check your email.'})});
  assert.equal(message.innerText, 'Check your email.');
  assert.equal(message.style.color, 'var(--primary)');
});

test('SMTP failures and rate limits show the actual API error with error styling', async () => {
  for (const text of ['The reset email could not be delivered.', 'Too many requests. Try again later.']) {
    const message = await submit({ok:false,json:async()=>({status:'error',message:text})});
    assert.equal(message.innerText, text);
    assert.equal(message.style.color, 'var(--danger)');
  }
});

test('a proxy HTML error gives a useful retry message instead of a JSON parsing failure', async () => {
  const message = await submit({ok:false,json:async()=>{throw new SyntaxError('Unexpected token <');}});
  assert.match(message.innerText, /temporarily unavailable/);
  assert.equal(message.style.color, 'var(--danger)');
});

test('connection failures explain that the reset service could not be reached', async () => {
  const message = await submit(null, new TypeError('Failed to fetch'));
  assert.match(message.innerText, /Check your connection/);
  assert.equal(message.style.color, 'var(--danger)');
});

test('password save persists a verifiable hash and atomically revokes the link and sessions', async () => {
  const { execFileSync } = await import('node:child_process');
  const result = execFileSync('php', [new URL('./password-reset-store.test.php', import.meta.url).pathname], {encoding:'utf8'});
  assert.match(result, /rollback passed/);
});
