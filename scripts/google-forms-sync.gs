// LEGACY HMAC SYNC PROTOTYPE: not used by the deployed camp form.
// The active camp integration uses scripts/google-forms/mega-health-camp.gs
// and bearer authentication documented in docs/google-form-preregistration.md.
// Do not run this prototype against the active camp endpoint.

// ============================================================
//  Avinya Care Foundation — Google Forms → DB Sync
//  Handles TWO forms:
//    1. Mega Health Camp Pre-Registration  ← auto-created by createPreregForm()
//    2. Volunteer Applications
//
//  ── FIRST-TIME SETUP ─────────────────────────────────────────
//  Step 1. Open https://script.google.com → New Project
//  Step 2. Paste this entire file (replace all existing code)
//  Step 3. Project Settings → Script Properties → Add property:
//             SYNC_SECRET = <copy exact value of GOOGLE_FORMS_SYNC_SECRET from your server .env>
//  Step 4. Run  createPreregForm()  ← creates the Google Form & logs its ID
//  Step 5. Run  installAllSyncs()   ← installs submit triggers + backfills
//  Step 6. Grant permissions when prompted (both runs)
//  Done! Every new submission will auto-sync to your DB.
// ============================================================

const AVINYA_SYNC_URL = 'https://avinyacarefoundation.org/api/google-form-sync.php';

// ── Form IDs (FORM_PREREG is written automatically by createPreregForm) ───
// After running createPreregForm(), copy the logged ID here if needed:
let FORM_PREREG    = PropertiesService.getScriptProperties().getProperty('FORM_PREREG_ID') || '';
const FORM_VOLUNTEER = '1UVgzhzhWTUvwals3B997bIdFKocLsxWUiveiP93APjU';

// ============================================================
//  STEP 1 — Run this function ONCE to create the Google Form
// ============================================================
function createPreregForm() {
  // ── Create the form ────────────────────────────────────────
  const form = FormApp.create('Mega Health Camp Pre-Registration — Avinya Care Foundation');

  form.setDescription(
    'Register for the FREE Mega Health Checkup & Diagnostic Camp on Sunday, 29 November 2026 ' +
    'at Yashwant Nagar, Virar West (9:00 AM – 4:00 PM). ' +
    'Available checkups depend on medical eligibility and partner availability. ' +
    'For assistance call: +91 74474 41116'
  );
  form.setCollectEmail(false);          // we collect email via our own field
  form.setLimitOneResponsePerUser(false); // allow re-submission for corrections
  form.setShowLinkToRespondAgain(false);
  form.setConfirmationMessage(
    'Thank you! Your pre-registration has been received. ' +
    'Please note your Reference ID shown on screen. ' +
    'If you provided your email, a confirmation will be sent. ' +
    'For queries call: +91 74474 41116'
  );

  // ── Section 1: Required Fields ─────────────────────────────
  form.addSectionHeaderItem()
      .setTitle('Section 1 — Required Details')
      .setHelpText('Please fill all fields marked with * accurately.');

  // Q1 — Full Name (required)
  form.addTextItem()
      .setTitle('Full Name')
      .setHelpText('Enter your full name as per Aadhaar / ID proof.')
      .setRequired(true);

  // Q2 — Age (required)
  const ageItem = form.addTextItem()
      .setTitle('Age')
      .setHelpText('Enter your age in years (e.g. 42).')
      .setRequired(true);
  ageItem.setValidation(
    FormApp.createTextValidation()
      .requireNumberBetween(1, 120)
      .setHelpText('Please enter a valid age between 1 and 120.')
      .build()
  );

  // Q3 — Gender (required)
  form.addMultipleChoiceItem()
      .setTitle('Gender')
      .setRequired(true)
      .setChoiceValues(['Male', 'Female', 'Other', 'Prefer not to say']);

  // Q4 — Mobile (required)
  const mobileItem = form.addTextItem()
      .setTitle('Mobile / WhatsApp Number')
      .setHelpText('10-digit Indian mobile number. Used for camp slot confirmation.')
      .setRequired(true);
  mobileItem.setValidation(
    FormApp.createTextValidation()
      .requireTextMatchesPattern('^[6-9][0-9]{9}$')
      .setHelpText('Please enter a valid 10-digit Indian mobile number starting with 6–9.')
      .build()
  );

  // Q5 — Area / Locality (required)
  form.addTextItem()
      .setTitle('Area / Locality')
      .setHelpText('Your neighborhood or locality (e.g. Yashwant Nagar, Virar West).')
      .setRequired(true);

  // Q6 — Email (optional)
  const emailItem = form.addTextItem()
      .setTitle('Email Address')
      .setHelpText('Optional — only if you want an email confirmation sent to you.')
      .setRequired(false);
  emailItem.setValidation(
    FormApp.createTextValidation()
      .requireTextIsEmail()
      .setHelpText('Please enter a valid email address.')
      .build()
  );

  // ── Section 2: Optional Health Questions ───────────────────
  form.addPageBreakItem()
      .setTitle('Section 2 — Optional Health Questions')
      .setHelpText('These questions help us plan the camp better. All fields are optional.');

  // Q7 — Checkups wanted (checkboxes)
  form.addCheckboxItem()
      .setTitle('Which checkups would you like?')
      .setHelpText('Select all that apply. Availability depends on medical eligibility.')
      .setRequired(false)
      .setChoiceValues([
        'General health',
        'Eye screening',
        'Dental checkup',
        'ENT examination',
        'Cancer screening',
        'Diagnostic / Lab tests',
        'Not sure — any available',
      ]);

  // Q8 — Current health concerns (paragraph)
  form.addParagraphTextItem()
      .setTitle('Current health concerns')
      .setHelpText('Briefly describe any current symptoms, ongoing conditions, or medications (optional).')
      .setRequired(false);

  // Q9 — Prior health screening (radio)
  form.addMultipleChoiceItem()
      .setTitle('Prior health screening')
      .setHelpText('Have you undergone a health or cancer screening before?')
      .setRequired(false)
      .setChoiceValues(['Yes', 'No', 'Not sure']);

  // Q10 — Prior cancer diagnosis (radio)
  form.addMultipleChoiceItem()
      .setTitle('Previously diagnosed with cancer?')
      .setRequired(false)
      .setChoiceValues(['Yes', 'No', 'Prefer not to say']);

  // Q11 — Family history of cancer (radio)
  form.addMultipleChoiceItem()
      .setTitle('Family history of cancer?')
      .setRequired(false)
      .setChoiceValues(['Yes', 'No', 'Not sure', 'Prefer not to say']);

  // ── Section 3: Consent ─────────────────────────────────────
  form.addPageBreakItem()
      .setTitle('Section 3 — Consent')
      .setHelpText('Please read and accept the consent statement to complete your registration.');

  // Q12 — Consent (required checkbox)
  form.addCheckboxItem()
      .setTitle('Consent')
      .setHelpText('You must check the box below to submit your registration.')
      .setRequired(true)
      .setChoiceValues([
        'I agree to be contacted by Avinya Care Foundation regarding my registration and camp arrangements. I understand that available checkups depend on medical eligibility and partner availability.',
      ]);

  // ── Store form ID in Script Properties ─────────────────────
  const formId  = form.getId();
  const formUrl = form.getPublishedUrl();
  const editUrl = form.getEditUrl();

  PropertiesService.getScriptProperties().setProperty('FORM_PREREG_ID', formId);

  Logger.log('==============================================');
  Logger.log('✅ FORM CREATED SUCCESSFULLY');
  Logger.log('==============================================');
  Logger.log('Form ID       : ' + formId);
  Logger.log('Public URL    : ' + formUrl);
  Logger.log('Edit URL      : ' + editUrl);
  Logger.log('');
  Logger.log('NEXT STEP: Run  installAllSyncs()  to set up DB sync triggers.');
  Logger.log('==============================================');

  return formId;
}

// ============================================================
//  STEP 2 — Run this AFTER createPreregForm()
// ============================================================
function installAllSyncs() {
  if (!PropertiesService.getScriptProperties().getProperty('SYNC_SECRET')) {
    throw new Error('⛔ Set SYNC_SECRET in Script Properties first, then re-run installAllSyncs().');
  }

  // Reload prereg ID (may have just been written by createPreregForm)
  const preregId = PropertiesService.getScriptProperties().getProperty('FORM_PREREG_ID') || '';
  if (!preregId) {
    throw new Error('⛔ FORM_PREREG_ID not set. Run createPreregForm() first, then re-run installAllSyncs().');
  }

  const existingHandlers = ScriptApp.getProjectTriggers().map(t => t.getHandlerFunction());

  // ── Pre-registration triggers ───────────────────────────────
  if (!existingHandlers.includes('onPreregSubmit')) {
    ScriptApp.newTrigger('onPreregSubmit').forForm(preregId).onFormSubmit().create();
    Logger.log('✅ onPreregSubmit trigger installed for form: ' + preregId);
  } else {
    Logger.log('ℹ️  onPreregSubmit trigger already exists.');
  }
  if (!existingHandlers.includes('syncRecentPreregs')) {
    ScriptApp.newTrigger('syncRecentPreregs').timeBased().everyHours(1).create();
    Logger.log('✅ syncRecentPreregs hourly trigger installed.');
  }

  // ── Volunteer triggers ──────────────────────────────────────
  if (!existingHandlers.includes('onVolunteerSubmit')) {
    ScriptApp.newTrigger('onVolunteerSubmit').forForm(FORM_VOLUNTEER).onFormSubmit().create();
    Logger.log('✅ onVolunteerSubmit trigger installed.');
  } else {
    Logger.log('ℹ️  onVolunteerSubmit trigger already exists.');
  }
  if (!existingHandlers.includes('syncRecentVolunteers')) {
    ScriptApp.newTrigger('syncRecentVolunteers').timeBased().everyHours(1).create();
    Logger.log('✅ syncRecentVolunteers hourly trigger installed.');
  }

  // ── Backfill any existing responses ────────────────────────
  Logger.log('Backfilling existing pre-registration responses...');
  syncBatch_(preregId, FormApp.openById(preregId).getResponses());
  Logger.log('Backfilling existing volunteer responses...');
  syncBatch_(FORM_VOLUNTEER, FormApp.openById(FORM_VOLUNTEER).getResponses());

  Logger.log('');
  Logger.log('==============================================');
  Logger.log('🎉 ALL SYNC TRIGGERS INSTALLED SUCCESSFULLY');
  Logger.log('Every new Google Form submission will now auto-sync to your DB.');
  Logger.log('==============================================');
}

// ============================================================
//  CORE SYNC ENGINE (used internally)
// ============================================================
function syncResponse_(formId, response) {
  const secret = PropertiesService.getScriptProperties().getProperty('SYNC_SECRET');
  if (!secret) throw new Error('Set SYNC_SECRET in Script Properties first.');

  const answers = {};
  response.getItemResponses().forEach(item => {
    answers[item.getItem().getTitle()] = item.getResponse();
  });

  const body = JSON.stringify({
    form_id:      formId,
    response_id:  response.getId(),
    submitted_at: response.getTimestamp().toISOString(),
    answers,
  });

  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = Utilities
    .computeHmacSha256Signature(timestamp + '.' + body, secret)
    .map(b => ('0' + (b & 255).toString(16)).slice(-2))
    .join('');

  const result = UrlFetchApp.fetch(AVINYA_SYNC_URL, {
    method:             'post',
    contentType:        'application/json',
    payload:            body,
    headers: {
      'X-Avinya-Timestamp': timestamp,
      'X-Avinya-Signature': signature,
    },
    muteHttpExceptions: true,
  });

  const code = result.getResponseCode();
  if (code !== 200) {
    throw new Error(`Sync rejected for form ${formId}: HTTP ${code} — ${result.getContentText()}`);
  }
}

function syncBatch_(formId, responses) {
  let failures = 0;
  responses.forEach(response => {
    try { syncResponse_(formId, response); }
    catch (err) { console.error(err.message); failures++; }
  });
  if (failures) throw new Error(`${failures} response(s) failed to sync for form ${formId}.`);
}

// ── Triggers called automatically by Google Forms ─────────────
function onPreregSubmit(event) {
  const preregId = PropertiesService.getScriptProperties().getProperty('FORM_PREREG_ID') || '';
  if (!preregId) throw new Error('FORM_PREREG_ID not set in Script Properties.');
  syncResponse_(preregId, event.response);
}

function onVolunteerSubmit(event) {
  syncResponse_(FORM_VOLUNTEER, event.response);
}

// ── Hourly retry jobs ─────────────────────────────────────────
function syncRecentPreregs() {
  const preregId = PropertiesService.getScriptProperties().getProperty('FORM_PREREG_ID') || '';
  if (!preregId) { console.warn('FORM_PREREG_ID not set — skipping.'); return; }
  syncBatch_(preregId, FormApp.openById(preregId).getResponses(new Date(Date.now() - 7 * 86400000)));
}

function syncRecentVolunteers() {
  syncBatch_(FORM_VOLUNTEER, FormApp.openById(FORM_VOLUNTEER).getResponses(new Date(Date.now() - 7 * 86400000)));
}

// ── Utility: view current form IDs stored in Script Properties ─
function showConfig() {
  const preregId = PropertiesService.getScriptProperties().getProperty('FORM_PREREG_ID') || '(not set)';
  const secret   = PropertiesService.getScriptProperties().getProperty('SYNC_SECRET') ? '✅ set' : '⛔ MISSING';
  Logger.log('FORM_PREREG_ID : ' + preregId);
  Logger.log('SYNC_SECRET    : ' + secret);
  Logger.log('FORM_VOLUNTEER : ' + FORM_VOLUNTEER);
  Logger.log('SYNC_URL       : ' + AVINYA_SYNC_URL);

  const triggers = ScriptApp.getProjectTriggers().map(t => t.getHandlerFunction());
  Logger.log('Active triggers: ' + (triggers.length ? triggers.join(', ') : 'none'));
}
