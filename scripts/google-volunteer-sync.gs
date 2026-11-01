// Install in the NGO account's Apps Script project. Never put the secret in this file.
const AVINYA_FORM_ID = '1UVgzhzhWTUvwals3B997bIdFKocLsxWUiveiP93APjU';
const AVINYA_SYNC_URL = 'https://avinyacarefoundation.org/api/google-volunteer-sync.php';

function sendVolunteerResponse_(response) {
  const secret = PropertiesService.getScriptProperties().getProperty('SYNC_SECRET');
  if (!secret) throw new Error('Set SYNC_SECRET in Script Properties first.');
  const answers = {};
  response.getItemResponses().forEach(item => answers[item.getItem().getTitle()] = item.getResponse());
  const body = JSON.stringify({form_id:AVINYA_FORM_ID,response_id:response.getId(),submitted_at:response.getTimestamp().toISOString(),answers}).replace(/[\u007f-\uffff]/g, character => '\\u'+character.charCodeAt(0).toString(16).padStart(4,'0'));
  const timestamp = String(Math.floor(Date.now()/1000));
  const signature = Utilities.computeHmacSha256Signature(timestamp+'.'+body,secret,Utilities.Charset.UTF_8).map(b=>('0'+(b&255).toString(16)).slice(-2)).join('');
  const result = UrlFetchApp.fetch(AVINYA_SYNC_URL,{method:'post',contentType:'application/json',payload:body,headers:{'X-Avinya-Timestamp':timestamp,'X-Avinya-Signature':signature},muteHttpExceptions:true});
  if (result.getResponseCode() !== 200) {
    let status = '';
    let fields = [];
    try { const rejection = JSON.parse(result.getContentText()); status = rejection.status || ''; fields = Array.isArray(rejection.fields) ? rejection.fields.filter(field => ['name','phone','age','consent'].includes(field)) : []; } catch (_) {}
    if (!/^[a-z_]+$/.test(status)) status = 'unknown';
    throw new Error('Volunteer sync rejected: HTTP '+result.getResponseCode()+' ('+status+(fields.length ? ': '+fields.join(', ') : '')+')');
  }
}

function onVolunteerSubmit(event) { sendVolunteerResponse_(event.response); }

function syncRecentVolunteers() {
  // Retry a rolling window; the database safely deduplicates every response.
  syncVolunteerBatch_(FormApp.openById(AVINYA_FORM_ID).getResponses(new Date(Date.now()-7*86400000)));
}

function syncVolunteerBatch_(responses) {
  let failures = 0;
  responses.forEach(response => {
    try { sendVolunteerResponse_(response); }
    catch (error) { failures++; console.error(String(error.message)); }
  });
  console.log('Volunteer sync: '+(responses.length-failures)+' succeeded, '+failures+' failed.');
  if (failures) throw new Error(failures+' responses could not sync; review validation and retry.');
}

function installVolunteerSync() {
  if (!PropertiesService.getScriptProperties().getProperty('SYNC_SECRET')) throw new Error('Set SYNC_SECRET first.');
  const handlers = ScriptApp.getProjectTriggers().map(t=>t.getHandlerFunction());
  if (!handlers.includes('onVolunteerSubmit')) ScriptApp.newTrigger('onVolunteerSubmit').forForm(AVINYA_FORM_ID).onFormSubmit().create();
  if (!handlers.includes('syncRecentVolunteers')) ScriptApp.newTrigger('syncRecentVolunteers').timeBased().everyHours(1).create();
  syncVolunteerBatch_(FormApp.openById(AVINYA_FORM_ID).getResponses());
}
