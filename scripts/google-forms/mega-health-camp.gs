/** Run createMegaHealthCamp once. Configure Script Properties before enabling sync:
 * SYNC_URL: https://your-domain/api/google-form-sync.php
 * SYNC_SECRET: same as server GOOGLE_FORM_SYNC_SECRET (32+ random characters)
 * Server GOOGLE_PREREGISTRATION_FORM_ID must match FORM_ID created below.
 */
function createMegaHealthCamp() {
  const p = PropertiesService.getScriptProperties();
  if (p.getProperty('FORM_ID')) {
    console.log(FormApp.openById(p.getProperty('FORM_ID')).getEditUrl());
    return;
  }
  const f = FormApp.create('Mega Health Camp Pre-Registrations', false);
  p.setProperty('FORM_ID', f.getId());
  f.setDescription('Avinya Care Foundation – Mega Health Checkup with Free Tests\n29 November 2026 · 9:00 AM–4:00 PM IST\nYashwant Nagar, Virar West · Helpline: 7447441116\nTests depend on medical eligibility and partner availability. Registration does not guarantee a test or appointment.\nInformation is collected through Google Forms and securely synced to the foundation database for camp coordination and relevant follow-up. Access is restricted to authorized staff. Health questions and email are optional.');
  f.setCollectEmail(false).setLimitOneResponsePerUser(false).setPublishingSummary(false);
  f.setConfirmationMessage('Your response has been recorded. If you supplied an email address, confirmation will follow after database sync. Call 7447441116 for assistance.');
  f.addTextItem().setTitle('Full Name').setRequired(true);
  f.addTextItem().setTitle('Age').setRequired(true).setValidation(FormApp.createTextValidation().requireTextMatchesPattern('^([1-9]|[1-9][0-9]|1[01][0-9]|120)$').setHelpText('Enter an age from 1 to 120.').build());
  f.addMultipleChoiceItem().setTitle('Gender').setChoiceValues(['Male','Female','Other','Prefer not to say']).setRequired(true);
  f.addTextItem().setTitle('Mobile Number').setRequired(true).setValidation(FormApp.createTextValidation().requireTextMatchesPattern('^(\\+91)?[6-9][0-9]{9}$').setHelpText('10-digit Indian mobile, optionally prefixed with +91.').build());
  f.addTextItem().setTitle('Area / Location').setRequired(true);
  f.addTextItem().setTitle('Email Address').setHelpText('Optional — for confirmation email.').setValidation(FormApp.createTextValidation().requireTextIsEmail().build());
  f.addCheckboxItem().setTitle('Which checkups would you like?').setChoiceValues(['General health','Eye','Dental','ENT','Cancer screening','Not sure']);
  f.addParagraphTextItem().setTitle('Do you have any current health concerns?');
  f.addMultipleChoiceItem().setTitle('Have you undergone health or cancer screening before?').setChoiceValues(['Yes','No','Not sure']);
  f.addMultipleChoiceItem().setTitle('Have you previously been diagnosed with cancer?').setChoiceValues(['Yes','No','Prefer not to say']);
  f.addMultipleChoiceItem().setTitle('Is there a family history of cancer?').setChoiceValues(['Yes','No','Not sure','Prefer not to say']);
  f.addCheckboxItem().setTitle('Consent').setChoiceValues(['I agree to be contacted by Avinya Care Foundation regarding my registration and camp arrangements.']).setRequired(true);
  applyAnswerLimits();
  console.log('Edit: ' + f.getEditUrl());
  console.log('Form ID: ' + f.getId());
  console.log('Form created as draft. Configure sync, then run enableSyncAndPublish.');
}
function enableSyncAndPublish() {
  const p = PropertiesService.getScriptProperties();
  if (!/^https:\/\//.test(p.getProperty('SYNC_URL') || '') || (p.getProperty('SYNC_SECRET') || '').length < 32) throw new Error('Configure SYNC_URL and SYNC_SECRET first.');
  const f = FormApp.openById(p.getProperty('FORM_ID'));
  // Verify server credentials + form allowlist without creating a registration.
  const probe = UrlFetchApp.fetch(p.getProperty('SYNC_URL'), {method:'post',contentType:'application/json',headers:{Authorization:'Bearer '+p.getProperty('SYNC_SECRET')},payload:JSON.stringify({formId:f.getId()}),muteHttpExceptions:true});
  if (probe.getResponseCode() !== 422) throw new Error('Server is not ready. Expected validation response (422), got '+probe.getResponseCode());
  const handlers = ScriptApp.getProjectTriggers().map(t => t.getHandlerFunction());
  if (!handlers.includes('syncPendingResponses')) ScriptApp.newTrigger('syncPendingResponses').timeBased().everyMinutes(5).create();
  if (!handlers.includes('onCampFormSubmit')) ScriptApp.newTrigger('onCampFormSubmit').forForm(f).onFormSubmit().create();
  f.setPublished(true);
  console.log('Public form: ' + f.getPublishedUrl());
}
function onCampFormSubmit() { syncPendingResponses(); }
function syncPendingResponses() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    const p = PropertiesService.getScriptProperties();
    const url = p.getProperty('SYNC_URL');
    const secret = p.getProperty('SYNC_SECRET');
    if (!/^https:\/\//.test(url || '') || !secret) throw new Error('Sync is not configured.');
    const formId = p.getProperty('FORM_ID');
    const form = FormApp.openById(formId);
    if (Date.now() >= Date.parse('2026-11-29T00:00:00+05:30')) form.setAcceptingResponses(false);
    const responses = form.getResponses();
    let cursor = Number(p.getProperty('SYNC_CURSOR') || 0);
    const end = Math.min(cursor + 25, responses.length);
    for (; cursor < end; cursor++) {
      const r = responses[cursor];
      const answers = {};
      r.getItemResponses().forEach(i => answers[i.getItem().getTitle()] = i.getResponse());
      const payload = {formId:formId,responseId:r.getId(),name:answers['Full Name'],age:answers['Age'],gender:answers['Gender'],phone:answers['Mobile Number'],area_location:answers['Area / Location'],email:answers['Email Address'] || '',checkups:answers['Which checkups would you like?'] || [],health_concerns:answers['Do you have any current health concerns?'] || '',prior_screening:answers['Have you undergone health or cancer screening before?'] || '',prior_cancer_diagnosis:answers['Have you previously been diagnosed with cancer?'] || '',family_cancer_history:answers['Is there a family history of cancer?'] || '',consent:(answers['Consent'] || []).length === 1};
      const result = UrlFetchApp.fetch(url,{method:'post',contentType:'application/json',headers:{Authorization:'Bearer '+secret},payload:JSON.stringify(payload),muteHttpExceptions:true});
      if (result.getResponseCode() !== 200 || JSON.parse(result.getContentText()).status !== 'ok') throw new Error('Database sync failed with HTTP '+result.getResponseCode()+'. Responses remain in Google Forms; retry will resume.');
      p.setProperty('SYNC_CURSOR', String(cursor + 1));
    }
  } finally { lock.releaseLock(); }
}

function applyAnswerLimits() {
  const form = FormApp.openById(PropertiesService.getScriptProperties().getProperty('FORM_ID'));
  form.getItems(FormApp.ItemType.TEXT).forEach(item => {
    const title = item.getTitle();
    const max = title === 'Full Name' ? 120 : title === 'Area / Location' ? 160 : 0;
    if (max) item.asTextItem().setValidation(FormApp.createTextValidation().requireTextLengthLessThanOrEqualTo(max).setHelpText('Enter up to ' + max + ' characters.').build());
  });
  form.getItems(FormApp.ItemType.PARAGRAPH_TEXT).forEach(item => item.asParagraphTextItem().setValidation(FormApp.createParagraphTextValidation().requireTextLengthLessThanOrEqualTo(2000).setHelpText('Enter up to 2000 characters.').build()));
  console.log('Answer length limits applied.');
}
