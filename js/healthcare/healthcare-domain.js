/** Pure healthcare scheduling and fee formatting helpers. */
(function (global) {
  'use strict';

  function getInitialBookingDate() {
    const d = new Date();
    d.setDate(d.getDate() + 1); // Tomorrow
    return formatLocalDate(d);
  }

  function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function getDoctorBookingDates(doctor, limit = 7) {
    const schedule = doctor?.schedule || {};
    const tomorrow = new Date();
    tomorrow.setHours(12, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minimum = formatLocalDate(tomorrow);
    const explicitDates = Array.isArray(schedule.availableDates)
      ? [...new Set(schedule.availableDates)].filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= minimum).sort()
      : [];
    if (explicitDates.length) return explicitDates.slice(0, limit);

    const workingDays = Array.isArray(schedule.workingDays) ? schedule.workingDays.map(Number) : [1,2,3,4,5,6];
    const dates = [];
    for (let offset = 0; offset < 60 && dates.length < limit; offset++) {
      const date = new Date(tomorrow);
      date.setDate(tomorrow.getDate() + offset);
      if (workingDays.includes(date.getDay())) dates.push(formatLocalDate(date));
    }
    return dates;
  }

  function parseFeeDisplay(doc) {
    const raw = doc.feeDisplay || (doc.consultationFee === 0 ? '₹0 (Free / Avinya Supported)' : `₹${doc.consultationFee || 0}`);
    const match = raw.match(/^([^(\n]+)(?:\s*\((.+)\))?$/);

    let price = raw.trim();
    let rawTag = '';

    if (match) {
      price = match[1].trim();
      if (match[2]) rawTag = match[2].trim();
    }

    let tag = rawTag;
    if (rawTag.includes('50% AvinyaCareFoundation Concession')) tag = '50% Concession';
    else if (rawTag.includes('Avinya Supported')) tag = 'Avinya Supported';
    else if (rawTag.includes('Community Clinic')) tag = 'Community Clinic';
    else if (rawTag.includes('Partner Rate')) tag = 'Partner Rate';

    const isFree = price === '₹0' || price.toLowerCase().includes('free');

    return { price, tag, rawTag, isFree };
  }

  global.AvinyaHealthcareDomain = { getInitialBookingDate, formatLocalDate, getDoctorBookingDates, parseFeeDisplay };
})(window);
