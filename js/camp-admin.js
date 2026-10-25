let campRows = [], campLoadVersion = 0, campPage = 1, campBusy = false;
const campColumns = {id:'Reference',createdAt:'Registered at',name:'Full name',age:'Age',gender:'Gender',phone:'Mobile',email:'Email',location:'Locality',previousScreening:'Previous screening',testsInterested:'Tests interested in',healthConcerns:'Health concerns',diagnosedCondition:'Diagnosed condition',familyHistory:'Family history',consent:'Consent',consentVersion:'Consent version',emailStatus:'Email status'};
function campNode(tag,text,className) {const el=document.createElement(tag);if(text!=null)el.textContent=text;if(className)el.className=className;return el;}
async function campRequest(action,extra={}) {
  const response=await fetch(getApiBaseUrl()+'/api/admin-data.php',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${adminToken}`},body:JSON.stringify({action,...extra}),cache:'no-store'});
  const result=await response.json();if(!response.ok||result.status!=='ok'){const error=new Error(result.message||'Action failed. Please try again.');error.fields=result.errors;throw error;}return result;
}
function setupCampPanel() {
  const panel=document.getElementById('campRegistrationsPanel');if(panel.dataset.enhanced)return;panel.dataset.enhanced='true';
  panel.innerHTML=`<div class="camp-admin-header"><div><span class="camp-admin-eyebrow">COMMUNITY HEALTH · 29 NOVEMBER 2026</span><h2>Camp registrations</h2><p>Ameya Classic Club · Manage attendees and confirmation emails.</p></div><div class="camp-admin-actions"><button class="btn btn-outline" id="campRefresh">Refresh</button><button class="btn btn-primary" id="campExport" disabled>Export filtered CSV</button></div></div><div class="camp-admin-filters"><label>Search<input id="campSearch" type="search" placeholder="Name, mobile, email or reference"></label><label>Email status<select id="campEmailFilter"><option value="">All statuses</option><option>SENT</option><option>FAILED</option><option>SKIPPED</option><option>PENDING</option></select></label><label>From date<input id="campFrom" type="date"></label><label>To date<input id="campTo" type="date"></label><label>Sort<select id="campSort"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="name">Name A–Z</option></select></label><button class="btn btn-outline" id="campClear">Clear filters</button></div><p id="campAdminStatus" role="status"></p><div class="camp-admin-table-wrap"><table class="camp-admin-table"><thead><tr><th>Attendee</th><th>Contact</th><th>Locality</th><th>Registered</th><th>Email</th><th>Actions</th></tr></thead><tbody id="campAdminBody"></tbody></table></div><div class="camp-admin-pagination"><button class="btn btn-outline" id="campPrevious">← Previous</button><span id="campPageLabel"></span><button class="btn btn-outline" id="campNext">Next →</button></div>`;
  document.getElementById('campRefresh').onclick=loadCampRegistrations;document.getElementById('campExport').onclick=exportCampRegistrations;
  for(const id of ['campSearch','campEmailFilter','campFrom','campTo','campSort'])document.getElementById(id).addEventListener(id==='campSearch'?'input':'change',()=>{campPage=1;renderCampRows();});
  document.getElementById('campClear').onclick=()=>{for(const id of ['campSearch','campEmailFilter','campFrom','campTo'])document.getElementById(id).value='';document.getElementById('campSort').value='newest';campPage=1;renderCampRows();};
  document.getElementById('campPrevious').onclick=()=>{campPage--;renderCampRows();};document.getElementById('campNext').onclick=()=>{campPage++;renderCampRows();};
}
function filteredCampRows() {
  const query=document.getElementById('campSearch').value.trim().toLowerCase(),status=document.getElementById('campEmailFilter').value,from=document.getElementById('campFrom').value,to=document.getElementById('campTo').value,sort=document.getElementById('campSort').value;
  return campRows.filter(row=>{const date=new Date(row.createdAt).toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});return(!query||[row.name,row.email,row.phone,row.id,row.location].some(value=>String(value||'').toLowerCase().includes(query)))&&(!status||row.emailStatus===status)&&(!from||date>=from)&&(!to||date<=to);}).sort((a,b)=>sort==='name'?a.name.localeCompare(b.name):sort==='oldest'?a.createdAt.localeCompare(b.createdAt):b.createdAt.localeCompare(a.createdAt));
}
async function loadCampRegistrations() {
  setupCampPanel();const version=++campLoadVersion;const status=document.getElementById('campAdminStatus');status.textContent='Loading registrations…';document.getElementById('campExport').disabled=true;
  try {const result=await campRequest('camp_registrations');if(version!==campLoadVersion)return;campRows=result.registrations;renderCampRows();}
  catch(error){if(version===campLoadVersion){campRows=[];document.getElementById('campAdminBody').replaceChildren();status.textContent=error.message;}}
}
function renderCampRows() {
  const rows=filteredCampRows(),pages=Math.max(1,Math.ceil(rows.length/15));campPage=Math.max(1,Math.min(campPage,pages));const body=document.getElementById('campAdminBody');body.replaceChildren();
  for(const row of rows.slice((campPage-1)*15,campPage*15)) {
    const tr=campNode('tr');const attendee=campNode('td');attendee.append(campNode('strong',row.name),campNode('small',`${row.age} years · ${row.gender}`),campNode('small',row.id,'camp-reference'));
    const contact=campNode('td');contact.append(campNode('div',row.phone),campNode('small',row.email||'No email provided'));
    const email=campNode('td');email.append(campNode('span',row.emailStatus||'PENDING','camp-mail-badge status-'+String(row.emailStatus||'PENDING').toLowerCase()));
    const actions=campNode('td',null,'camp-row-actions');for(const [label,mode] of [['View','view'],['Edit','edit'],['Send mail','mail'],['Delete','delete']]){const button=campNode('button',label,'btn btn-outline');button.type='button';button.setAttribute('aria-label',`${label}: ${row.name}`);if(mode==='mail'&&!row.email){button.disabled=true;button.title='Add an email address first';}button.onclick=()=>openCampRecord(row,mode,button);actions.append(button);}
    tr.append(attendee,contact,campNode('td',row.location),campNode('td',new Date(row.createdAt).toLocaleString('en-IN',{timeZone:'Asia/Kolkata',dateStyle:'medium',timeStyle:'short'})+' IST'),email,actions);body.append(tr);
  }
  if(!rows.length){const cell=campNode('td','No registrations match these filters.');cell.colSpan=6;const tr=campNode('tr');tr.append(cell);body.append(tr);}
  document.getElementById('campAdminStatus').textContent=`${rows.length} matching / ${campRows.length} total registrations. Export includes all matching rows.`;
  document.getElementById('campPageLabel').textContent=`Page ${campPage} of ${pages}`;document.getElementById('campPrevious').disabled=campPage===1;document.getElementById('campNext').disabled=campPage===pages;document.getElementById('campExport').disabled=!rows.length;
}
function openCampRecord(row,mode,opener) {
  document.getElementById('campRecordDialog')?.remove();const dialog=campNode('dialog',null,'camp-record-dialog');dialog.id='campRecordDialog';dialog.setAttribute('aria-labelledby','campRecordTitle');
  const close=campNode('button','×','camp-record-close');close.type='button';close.setAttribute('aria-label','Close registration');close.onclick=()=>{if(!campBusy)dialog.close();};
  const title=campNode('h2',mode==='edit'?'Edit registration':mode==='delete'?'Delete this registration?':mode==='mail'?'Send confirmation email?':'Registration details');title.id='campRecordTitle';
  dialog.append(close,title,campNode('p',row.name+' · '+row.id,'camp-record-subtitle'));
  const form=campNode('form');form.id='campEditForm';const message=campNode('p');message.setAttribute('role','status');message.className='camp-record-message';
  const editable=['name','age','gender','phone','email','location','previousScreening','testsInterested','healthConcerns','diagnosedCondition','familyHistory'];
  const choices={gender:['Female','Male','Other','Prefer not to say'],previousScreening:['','Yes','No','Not sure'],diagnosedCondition:['','Yes','No','Prefer not to say'],familyHistory:['','Yes','No','Not sure','Prefer not to say']};
  if(mode==='edit') {
    const grid=campNode('div',null,'camp-edit-grid');for(const key of editable){const label=campNode('label',campColumns[key]);let input=campNode(choices[key]?'select':key==='healthConcerns'?'textarea':'input');input.name=key;input.id='campEdit-'+key;
      if(choices[key])for(const value of choices[key]){const option=campNode('option',value||'Not specified');option.value=value;input.append(option);}
      if(input.tagName==='INPUT')input.type=key==='age'?'number':key==='email'?'email':key==='phone'?'tel':'text';
      input.value=row[key]??'';input.required=['name','age','gender','phone','location'].includes(key);if(key==='age'){input.min='1';input.max='120';}if(input.tagName!=='SELECT')input.maxLength=key==='healthConcerns'?2000:key==='testsInterested'?500:key==='email'?254:key==='phone'?20:key==='location'?160:120;
      label.append(input);grid.append(label);
    }form.append(grid,campNode('p','Consent is preserved from the original registration. Editing does not automatically send email.','camp-record-subtitle'));
  } else if(mode==='view') {
    const list=campNode('dl',null,'camp-record-details');for(const [key,label] of Object.entries(campColumns)){list.append(campNode('dt',label),campNode('dd',row[key]==null||row[key]===''?'Not provided':String(row[key])));}form.append(list);
  } else form.append(campNode('p',mode==='delete'?'This permanently removes this attendee’s registration. This action cannot be undone.':`Send the branded camp confirmation to ${row.email}. It includes the registration reference, date and venue; medical answers are excluded.`));
  form.append(message);const controls=campNode('div',null,'camp-record-controls');const cancel=campNode('button',mode==='view'?'Close':'Cancel','btn btn-outline');cancel.type='button';cancel.onclick=()=>dialog.close();controls.append(cancel);
  if(mode!=='view'){const submit=campNode('button',mode==='edit'?'Save changes':mode==='delete'?'Delete registration':'Send confirmation','btn '+(mode==='delete'?'camp-danger':'btn-primary'));submit.type='submit';controls.append(submit);
    form.onsubmit=async event=>{event.preventDefault();if(campBusy||!form.reportValidity())return;campBusy=true;close.disabled=true;cancel.disabled=true;submit.disabled=true;message.textContent='Processing…';
      try {const registration=Object.fromEntries(new FormData(form));const result=await campRequest(mode==='edit'?'camp_update':mode==='delete'?'camp_delete':'camp_send_email',{id:row.id,...(mode==='edit'?{registration}:{})});dialog.close();showToast(result.message,'success');await loadCampRegistrations();}
      catch(error){message.textContent=error.message;if(error.fields)message.textContent+=' '+Object.values(error.fields).flat().join(' ');}
      finally{campBusy=false;close.disabled=false;cancel.disabled=false;submit.disabled=false;}
    };
  }else form.onsubmit=event=>event.preventDefault();
  form.append(controls);dialog.append(form);document.body.append(dialog);dialog.addEventListener('cancel',event=>{if(campBusy)event.preventDefault();});dialog.addEventListener('close',()=>{opener?.focus();dialog.remove();},{once:true});dialog.showModal();
}
function exportCampRegistrations() {
  const rows=filteredCampRows();if(!rows.length)return;
  const cell=value=>{let text=String(value??'');if(/^[\s]*[=+@-]/.test(text)||/^[\t\r\n]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';};
  const csv=[Object.values(campColumns).map(cell).join(','),...rows.map(row=>Object.keys(campColumns).map(key=>cell(row[key])).join(','))].join('\r\n');
  const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));const link=campNode('a');link.href=url;link.download='Avinya_Camp_Registrations.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
