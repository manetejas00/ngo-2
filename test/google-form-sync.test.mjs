import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { googleFormHandler, googleRegistration, validSyncToken } from '../services/registrations/google-form-sync.mjs';
import { createSubmissionStore } from '../services/submissions/submission-store.mjs';
const input = {formId:'test-form',responseId:'response-1',name:'Test Participant',age:35,gender:'Female',phone:'9876543210',area_location:'Virar West',email:'test@example.com',checkups:['Eye'],consent:true};
const secret = 'x'.repeat(64);
async function invoke(handler, payload, token=secret) {
  const req=Readable.from([JSON.stringify(payload)]); req.method='POST'; req.headers={authorization:'Bearer '+token};
  const response={setHeader(){},writeHead(code){this.code=code;},end(body){this.body=JSON.parse(body);}};
  await handler(req,response);return response;
}
test('sync rejects missing/incorrect credentials, unconfigured forms and invalid answers',async()=>{
  assert.equal(validSyncToken('', ''),false);
  assert.equal(validSyncToken(secret+'x',secret),false);
  const handler=googleFormHandler({}, {token:secret,formId:'test-form'});
  assert.equal((await invoke(handler,input,'wrong')).code,401);
  assert.equal((await invoke(handler,{...input,formId:'other'})).code,403);
  assert.equal((await invoke(handler,{...input,consent:false})).code,422);
  assert.equal((await invoke(handler,{...input,checkups:['unlisted']})).code,422);
  assert.equal(googleRegistration({...input,age:'35 years'}).errors.age !== undefined,true);
});
test('concurrent replay stores one registration, preserves medical answers and sends once',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'google-sync-'));
  try {
    const store=createSubmissionStore(join(dir,'responses.json')); let emails=0;
    const handler=googleFormHandler(store,{token:secret,formId:'test-form',sendConfirmation:async()=>{emails++;return 'FAILED';}});
    const responses=await Promise.all(Array.from({length:5},()=>invoke(handler,input)));
    assert.ok(responses.every(r=>r.code===200)); assert.equal(emails,1);
    const rows=await store.list();assert.equal(rows.length,1);assert.equal(rows[0].delivery_status,'FAILED');assert.deepEqual(rows[0].checkups,['Eye']);
    assert.equal(rows[0].form_type,'preregistration');assert.equal(rows[0].source,'google_forms');
    await store.setEmailStatus(rows[0].submission_id,'SENT');
    await invoke(handler,input);assert.equal((await store.list())[0].delivery_status,'SENT');assert.equal(emails,1);
    assert.notEqual(googleRegistration({...input,formId:'other-form'}).record.submissionId,rows[0].submission_id);
  } finally { await rm(dir,{recursive:true,force:true}); }
});
test('no email skips delivery, and storage failure never acknowledges sync',async()=>{
  const store={saveGoogleResponse:async record=>({record,duplicate:false}),setEmailStatus:async(id,status)=>assert.equal(status,'SKIPPED')};
  assert.equal((await invoke(googleFormHandler(store,{token:secret,formId:'test-form'}),{...input,email:''})).code,200);
  const broken={saveGoogleResponse:async()=>{throw new Error('private details');}};
  const result=await invoke(googleFormHandler(broken,{token:secret,formId:'test-form'}),input);
  assert.equal(result.code,503);assert.ok(!JSON.stringify(result.body).includes('private details'));
});
