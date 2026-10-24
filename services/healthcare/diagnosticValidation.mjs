export function validateDiagnosticRequest(data, today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date || '') || !Number.isFinite(Date.parse(`${data.date}T00:00:00Z`)) || new Date(`${data.date}T00:00:00Z`).toISOString().slice(0, 10) !== data.date || data.date < today) {
    throw new Error('Choose a valid date today or later.');
  }
  const slots = new Set(['07:30 AM - 08:30 AM', '08:30 AM - 09:30 AM', '09:30 AM - 10:30 AM', '11:00 AM - 12:00 PM']);
  if (!slots.has(data.timeSlot)) throw new Error('Choose a listed preferred time slot.');
  const method = data.collectionMethod || 'home_collection';
  if (!['home_collection', 'centre_visit'].includes(method)) throw new Error('Choose a valid collection method.');
  if (method === 'home_collection' && (!String(data.homeAddress || '').trim() || !/^[1-9]\d{5}$/.test(data.pincode || ''))) throw new Error('Enter your collection address and a valid six-digit PIN. Availability must be confirmed.');
  if (!['Male', 'Female', 'Other'].includes(data.patientGender)) throw new Error('Select a gender.');
  if (!Number.isInteger(Number(data.patientAge)) || Number(data.patientAge) < 1 || Number(data.patientAge) > 120) throw new Error('Enter an age between 1 and 120.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,63}$/.test(data.patientEmail || '')) throw new Error('Enter a valid email address.');
  if (!/^(?:\+91)?[6-9]\d{9}$/.test(String(data.patientPhone || '').replace(/[\s()-]/g, ''))) throw new Error('Enter a valid Indian mobile number.');
}
