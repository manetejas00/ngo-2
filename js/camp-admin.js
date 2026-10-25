let campRows = [];
let campLoadVersion = 0;
const campColumns = {
  id: 'Reference', createdAt: 'Registered at', name: 'Full name', age: 'Age', gender: 'Gender', phone: 'Mobile', email: 'Email', location: 'Locality', previousScreening: 'Previous screening', testsInterested: 'Tests interested in', healthConcerns: 'Health concerns', diagnosedCondition: 'Diagnosed condition', familyHistory: 'Family history', consent: 'Consent', consentVersion: 'Consent version', emailStatus: 'Email status'
};
async function loadCampRegistrations() {
  const version = ++campLoadVersion;
  const status = document.getElementById('campAdminStatus');
  const body = document.getElementById('campAdminBody');
  const exportButton = document.getElementById('campExport');
  campRows = []; body.replaceChildren(); exportButton.disabled = true;
  status.textContent = 'Loading registrations…';
  try {
    const response = await fetch(getApiBaseUrl() + '/api/admin-data.php', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }, body: JSON.stringify({ action: 'camp_registrations' }), cache: 'no-store' });
    const result = await response.json();
    if (version !== campLoadVersion) return;
    if (!response.ok || result.status !== 'ok') throw new Error(result.message || 'Unable to load registrations.');
    campRows = result.registrations;
    for (const row of campRows) {
      const tr = document.createElement('tr');
      for (const key of Object.keys(campColumns)) {
        const td = document.createElement('td'); td.textContent = row[key] == null || row[key] === '' ? '—' : String(row[key]);
        td.style.cssText = 'padding:12px;min-width:130px;max-width:300px;white-space:normal;overflow-wrap:anywhere;border-bottom:1px solid #8883;vertical-align:top'; tr.append(td);
      }
      body.append(tr);
    }
    status.textContent = campRows.length ? `${campRows.length} camp registration(s). All responses are included in the CSV export.` : 'No camp registrations yet.';
    exportButton.disabled = !campRows.length;
  } catch (error) { if (version === campLoadVersion) status.textContent = error.message; }
}
function exportCampRegistrations() {
  if (!campRows.length) return;
  const cell = value => {
    let text = String(value ?? '');
    if (/^[\s]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  const csv = [Object.values(campColumns).map(cell).join(','), ...campRows.map(row => Object.keys(campColumns).map(key => cell(row[key])).join(','))].join('\r\n');
  const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = 'Avinya_Camp_Registrations.csv'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
