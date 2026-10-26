import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const auth=readFileSync(new URL('../api/admin-auth.php',import.meta.url),'utf8');
test('staff login verifies an existing password without account provisioning',()=>{
 assert.match(auth,/password_verify\(\$password/);
 const login=auth.slice(auth.indexOf('// Action: Login'),auth.indexOf('session_regenerate_id'));
 assert.doesNotMatch(login,/INSERT INTO|UPDATE|password_hash\(|seedDefaultUsers/);
});
test('legacy reset routes are disabled and legacy sessions rejected',()=>{
 assert.match(auth,/Account reset is unavailable/);
 assert.match(readFileSync(new URL('../api/db.php',import.meta.url),'utf8'),/!str_starts_with\(\$token, 'AVG2-SESS-'/);
});
test('analytics never forwards caller-supplied fields',()=>{
 const src=readFileSync(new URL('../js/analytics.js',import.meta.url),'utf8');
 assert.doesNotMatch(src,/event: function \(name, params\)/);
 assert.match(src,/includes\(name\)/);
});
