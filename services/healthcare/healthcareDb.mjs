/**
 * Avinya Care Foundation - Healthcare Persistence & Database Engine
 * Manages Doctors, Specialities, Hospitals, Availability, Appointments, Diagnostic Tests,
 * Test Bookings, Concurrency Locks, Status History, and Notification Audit Logs.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hashPassword, verifyPassword, validatePasswordStrength, generateResetToken, generateTokenHash } from './healthcareAuthService.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, '../../cache');
const DB_FILE = join(DATA_DIR, 'healthcare_db.json');

// Memory cache of the database
let dbCache = null;
let isSaving = false;
let saveQueue = [];

export function buildUsersCatalog(doctors = [], providers = []) {
  // First-run access is explicitly provisioned by deployment configuration.
  // No demonstration or default accounts are created by application code.
  const bootstrapEmail = (process.env.BOOTSTRAP_ADMIN_EMAIL || '').trim().toLowerCase();
  const bootstrapPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD || '';
  if (!/^\S+@\S+\.\S+$/.test(bootstrapEmail) || !validatePasswordStrength(bootstrapPassword).valid) {
    return [];
  }
  const bootstrapHash = hashPassword(bootstrapPassword);
  const users = [
    {
      id: 'usr-admin-01',
      user_id: 'usr-admin-01',
      name: 'Super Admin',
      email: bootstrapEmail,
      phone: '+91 98765 00000',
      avatar: '',
      password_hash: bootstrapHash,
      role: 'admin',
      subtitle: 'System Administrator',
      doctorId: null,
      providerId: null,
      status: 'active',
      must_change_password: true,
      password_changed_at: null
    },
  ];

  return users;
}

/**
 * Initializes and returns the in-memory database instance.
 */
export async function getDb() {
  if (dbCache) return dbCache;

  const loadData = async (name) => {
    try {
      const p = join(__dirname, '../../data', `seed_${name}.json`);
      return JSON.parse(await readFile(p, 'utf-8'));
    } catch(e) { return []; }
  };

  try {
    const raw = await readFile(DB_FILE, 'utf-8');
    dbCache = JSON.parse(raw);
    if (!dbCache.diagnosticProviders) dbCache.diagnosticProviders = await loadData('diagnostic_providers');
    if (!dbCache.users) dbCache.users = buildUsersCatalog(dbCache.doctors || await loadData('doctors'), dbCache.diagnosticProviders);
  } catch (err) {
    const docs = await loadData('doctors');
    const provs = await loadData('diagnostic_providers');
    dbCache = {
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      specialities: await loadData('specialities'),
      hospitals: await loadData('hospitals'),
      doctors: docs,
      diagnosticProviders: provs,
      diagnosticCentres: await loadData('diagnostic_centres'),
      diagnosticTests: await loadData('diagnostic_tests'),
      appointments: await loadData('appointments'),
      testBookings: await loadData('test_bookings'),
      users: buildUsersCatalog(docs, provs),
      passwordResets: [],
      notificationLogs: []
    };
    await persistDb();
  }

  return dbCache;
}

/**
 * Persists the current database state to disk atomically.
 */
export async function persistDb() {
  if (isSaving) {
    return new Promise((resolve) => {
      saveQueue.push(resolve);
    });
  }

  isSaving = true;
  try {
    await mkdir(DATA_DIR, { recursive: true });
    dbCache.lastUpdated = new Date().toISOString();
    await writeFile(DB_FILE, JSON.stringify(dbCache, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Healthcare DB Error] Failed to persist data:', err);
  } finally {
    isSaving = false;
    if (saveQueue.length > 0) {
      const next = saveQueue.shift();
      next();
    }
  }
}

// -------------------------------------------------------------
// DOCTORS & SPECIALITIES
// -------------------------------------------------------------

export async function getSpecialities() {
  const db = await getDb();
  return db.specialities;
}

export async function getHospitals() {
  const db = await getDb();
  return db.hospitals;
}

export async function getDoctors(filters = {}) {
  const db = await getDb();
  let list = [...db.doctors];

  if (filters.speciality && filters.speciality !== 'all') {
    list = list.filter(d => d.specialityId.toLowerCase() === filters.speciality.toLowerCase());
  }

  if (filters.location && filters.location !== 'all') {
    list = list.filter(d => d.location.toLowerCase().includes(filters.location.toLowerCase()));
  }

  if (filters.hospital && filters.hospital !== 'all') {
    list = list.filter(d => d.hospitalId === filters.hospital || d.hospitalName.toLowerCase().includes(filters.hospital.toLowerCase()));
  }

  if (filters.consultationType && filters.consultationType !== 'all') {
    list = list.filter(d => d.consultationTypes.includes(filters.consultationType));
  }

  if (filters.search) {
    const q = filters.search.toLowerCase().trim();
    list = list.filter(d => 
      d.name.toLowerCase().includes(q) ||
      d.specialityName.toLowerCase().includes(q) ||
      d.hospitalName.toLowerCase().includes(q) ||
      d.areasOfExpertise.some(area => area.toLowerCase().includes(q))
    );
  }

  return list;
}

export async function getDoctorById(id) {
  const db = await getDb();
  return db.doctors.find(d => d.id === id) || null;
}

export async function addDoctor(doctorData) {
  const db = await getDb();
  const newId = doctorData.id || `doc-${Date.now()}`;
  const newDoctor = {
    id: newId,
    name: doctorData.name || 'Dr. Specialist',
    specialityId: doctorData.specialityId || 'general-physician',
    specialityName: doctorData.specialityName || 'General Medicine',
    qualification: doctorData.qualification || 'MBBS, MD',
    experienceYears: Number(doctorData.experienceYears) || 5,
    hospitalId: doctorData.hospitalId || 'avinya-clinic-mumbai',
    hospitalName: doctorData.hospitalName || 'Avinya Care Community Clinic, Mumbai',
    location: doctorData.location || 'Mumbai',
    consultationFee: Number(doctorData.consultationFee) || 0,
    feeDisplay: doctorData.feeDisplay || (Number(doctorData.consultationFee) === 0 ? '₹0 (Avinya Supported / Free)' : `₹${doctorData.consultationFee}`),
    consultationTypes: doctorData.consultationTypes || ['in-clinic', 'online'],
    rating: Number(doctorData.rating) || 5.0,
    reviewsCount: Number(doctorData.reviewsCount) || 1,
    badge: doctorData.badge || 'Consultant Specialist',
    avatar: doctorData.avatar || '/assets/doctors/default-doctor.jpg',
    about: doctorData.about || 'Specialist Doctor at Avinya Care Foundation partner network.',
    areasOfExpertise: Array.isArray(doctorData.areasOfExpertise) ? doctorData.areasOfExpertise : ['Patient Care', 'Clinical Consultation'],
    languages: Array.isArray(doctorData.languages) ? doctorData.languages : ['English', 'Hindi'],
    schedule: doctorData.schedule || {
      workingDays: [1, 2, 3, 4, 5, 6],
      startTime: '09:00',
      endTime: '17:00',
      slotDurationMins: 30,
      breakStart: '13:00',
      breakEnd: '14:00'
    }
  };

  db.doctors.push(newDoctor);

  // A doctor profile does not automatically become a login account. An
  // administrator must separately create and link that account.

  await persistDb();
  return newDoctor;
}

export async function updateDoctor(id, updates) {
  const db = await getDb();
  const index = db.doctors.findIndex(d => d.id === id);
  if (index === -1) {
    throw new Error(`Doctor with ID ${id} not found.`);
  }

  const existing = db.doctors[index];
  const updated = {
    ...existing,
    ...updates,
    id: existing.id // preserve ID
  };

  if (updates.consultationFee !== undefined && !updates.feeDisplay) {
    updated.feeDisplay = Number(updates.consultationFee) === 0 ? '₹0 (Avinya Supported / Free)' : `₹${updates.consultationFee}`;
  }

  db.doctors[index] = updated;

  // Sync linked user
  const user = db.users.find(u => u.doctorId === id || u.id === `usr-doc-${id}`);
  if (user) {
    if (updates.name) user.name = updates.name;
    if (updates.avatar) user.avatar = updates.avatar;
    if (updates.specialityName) user.subtitle = updates.specialityName;
  }

  await persistDb();
  return updated;
}

export async function deleteDoctor(id) {
  const db = await getDb();
  const index = db.doctors.findIndex(d => d.id === id);
  if (index === -1) {
    throw new Error(`Doctor with ID ${id} not found.`);
  }

  const deleted = db.doctors.splice(index, 1)[0];
  db.users = db.users.filter(u => u.doctorId !== id && u.id !== `usr-doc-${id}`);
  await persistDb();
  return deleted;
}

export async function updateDoctorAvatar(id, avatarUrl) {
  return await updateDoctor(id, { avatar: avatarUrl });
}

// -------------------------------------------------------------
// SLOT GENERATION & CONCURRENCY
// -------------------------------------------------------------

function parseTimeToMins(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function formatMinsTo12H(mins) {
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const mStr = m < 10 ? `0${m}` : `${m}`;
  const hStr = h12 < 10 ? `0${h12}` : `${h12}`;
  return `${hStr}:${mStr} ${period}`;
}

/**
 * Computes available time slots for a given doctor and date.
 * Excludes booked appointments (where status is not cancelled).
 */
export async function getDoctorAvailableSlots(doctorId, dateStr) {
  const db = await getDb();
  const doctor = db.doctors.find(d => d.id === doctorId);
  if (!doctor) return [];

  const targetDate = new Date(dateStr + 'T00:00:00');
  if (isNaN(targetDate.getTime())) return [];

  // Day of week: 0 is Sun, 1 is Mon...
  const dayOfWeek = targetDate.getDay();
  const sched = doctor.schedule || {
    workingDays: [1, 2, 3, 4, 5, 6],
    startTime: '09:00',
    endTime: '17:00',
    slotDurationMins: 30,
    breakStart: '13:00',
    breakEnd: '14:00'
  };

  // Check if doctor works on this day
  if (!sched.workingDays.includes(dayOfWeek)) {
    return [];
  }

  const startMins = parseTimeToMins(sched.startTime);
  const endMins = parseTimeToMins(sched.endTime);
  const breakStartMins = sched.breakStart ? parseTimeToMins(sched.breakStart) : -1;
  const breakEndMins = sched.breakEnd ? parseTimeToMins(sched.breakEnd) : -1;
  const duration = sched.slotDurationMins || 30;

  // Existing active bookings for this doctor on this date
  const bookedSlots = db.appointments
    .filter(a => a.doctorId === doctorId && a.date === dateStr && a.status !== 'cancelled')
    .map(a => a.time.toUpperCase().trim());

  const slots = [];
  for (let m = startMins; m + duration <= endMins; m += duration) {
    // Skip if in break
    if (breakStartMins !== -1 && breakEndMins !== -1) {
      if (m >= breakStartMins && m < breakEndMins) continue;
    }

    const slotLabel = formatMinsTo12H(m);
    const isBooked = bookedSlots.includes(slotLabel.toUpperCase());

    slots.push({
      time: slotLabel,
      minutes: m,
      available: !isBooked,
      isBooked
    });
  }

  return slots;
}

// -------------------------------------------------------------
// APPOINTMENTS ENGINE & DOUBLE-BOOKING GUARD
// -------------------------------------------------------------

let bookingLock = Promise.resolve();

/**
 * Creates a new appointment with double-booking concurrency protection.
 */
export async function createAppointment(appointmentData) {
  // Chain through mutex lock to prevent race conditions
  return new Promise((resolve, reject) => {
    bookingLock = bookingLock.then(async () => {
      try {
        const db = await getDb();
        const {
          doctorId,
          date,
          time,
          consultationType = 'in-clinic',
          patientName,
          patientPhone,
          patientEmail,
          patientAge,
          patientGender,
          reason,
          notes
        } = appointmentData;

        // 1. Validation
        if (!doctorId || !date || !time || !patientName || !patientEmail || !patientPhone) {
          throw new Error('Missing required appointment booking fields');
        }

        const doctor = db.doctors.find(d => d.id === doctorId);
        if (!doctor) throw new Error('Selected doctor not found');

        // 2. Concurrency Check: Double Booking Guard
        const normalizedTime = time.toUpperCase().trim();
        const collision = db.appointments.find(a => 
          a.doctorId === doctorId &&
          a.date === date &&
          a.time.toUpperCase().trim() === normalizedTime &&
          a.status !== 'cancelled'
        );

        if (collision) {
          throw new Error(`The time slot ${time} on ${date} is no longer available. Please select another slot.`);
        }

        // 3. Generate Unique Appointment ID
        const currentCount = db.appointments.length + 125;
        const appointmentId = `AVC-APT-2026-${String(currentCount).padStart(6, '0')}`;

        const newAppointment = {
          id: appointmentId,
          doctorId,
          doctorName: doctor.name,
          doctorSpeciality: doctor.specialityName,
          doctorHospital: doctor.hospitalName,
          doctorFee: doctor.consultationFee,
          patientName: patientName.trim(),
          patientPhone: patientPhone.trim(),
          patientEmail: patientEmail.trim().toLowerCase(),
          patientAge: Number(patientAge) || 0,
          patientGender: patientGender || 'Unspecified',
          consultationType,
          location: consultationType === 'online' 
            ? 'Encrypted Telehealth Video Room (Avinya Care Connect)' 
            : `${doctor.hospitalName}, ${doctor.location}`,
          date,
          time: normalizedTime,
          reason: reason ? reason.trim() : 'General Oncology / Health Consultation',
          notes: notes ? notes.trim() : '',
          status: 'confirmed',
          history: [
            {
              status: 'confirmed',
              timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
              updatedBy: 'Patient / Web Booking',
              notes: 'Appointment scheduled and confirmed.'
            }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        db.appointments.unshift(newAppointment);
        await persistDb();

        resolve(newAppointment);
      } catch (err) {
        reject(err);
      }
    });
  });
}

export async function getAppointments(filters = {}) {
  const db = await getDb();
  let list = [...db.appointments];

  if (filters.doctorId) {
    list = list.filter(a => a.doctorId === filters.doctorId);
  }

  if (filters.patientEmail) {
    const qEmail = filters.patientEmail.toLowerCase().trim();
    list = list.filter(a => a.patientEmail.toLowerCase() === qEmail);
  }

  if (filters.patientPhone) {
    const cleanPhone = filters.patientPhone.replace(/\D/g, '');
    list = list.filter(a => a.patientPhone.replace(/\D/g, '').includes(cleanPhone));
  }

  if (filters.status && filters.status !== 'all') {
    list = list.filter(a => a.status === filters.status);
  }

  if (filters.search) {
    const q = filters.search.toLowerCase().trim();
    list = list.filter(a => 
      a.id.toLowerCase().includes(q) ||
      a.patientName.toLowerCase().includes(q) ||
      a.doctorName.toLowerCase().includes(q) ||
      a.patientEmail.toLowerCase().includes(q) ||
      a.patientPhone.includes(q)
    );
  }

  return list;
}

export async function getAppointmentById(id) {
  const db = await getDb();
  return db.appointments.find(a => a.id === id) || null;
}

export async function updateAppointmentStatus(id, newStatus, actor = 'Admin', notes = '', newDate = null, newTime = null) {
  const db = await getDb();
  const appointment = db.appointments.find(a => a.id === id);
  if (!appointment) throw new Error(`Appointment ${id} not found`);

  const allowedStatuses = ['pending', 'confirmed', 'rescheduled', 'cancelled', 'completed', 'no-show'];
  if (!allowedStatuses.includes(newStatus)) {
    throw new Error(`Invalid appointment status: ${newStatus}`);
  }

  appointment.status = newStatus;
  appointment.updatedAt = new Date().toISOString();

  if (newDate) appointment.date = newDate;
  if (newTime) appointment.time = newTime.toUpperCase().trim();

  appointment.history.push({
    status: newStatus,
    timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
    updatedBy: actor,
    notes: notes || `Status updated to ${newStatus}`
  });

  await persistDb();
  return appointment;
}

// -------------------------------------------------------------
// DIAGNOSTIC TESTS & BOOKINGS
// -------------------------------------------------------------

export async function getDiagnosticTests(filters = {}) {
  const db = await getDb();
  let list = [...db.diagnosticTests];

  if (filters.category && filters.category !== 'all') {
    list = list.filter(t => t.category.toLowerCase() === filters.category.toLowerCase());
  }

  if (filters.search) {
    const q = filters.search.toLowerCase().trim();
    list = list.filter(t => 
      t.name.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.testsIncluded.some(item => item.toLowerCase().includes(q))
    );
  }

  return list;
}

export async function getDiagnosticCentres() {
  const db = await getDb();
  return db.diagnosticCentres;
}

export async function getDiagnosticProviders() {
  const db = await getDb();
  return db.diagnosticProviders || [];
}

export async function getUsersCatalog() {
  const db = await getDb();
  const catalog = buildUsersCatalog(db.doctors, db.diagnosticProviders);
  if (!db.users || db.users.length < catalog.length) {
    db.users = catalog;
    await persistDb();
  } else {
    if (!db.users.some(u => (u.user_id || u.id) === 'usr-2')) {
      const usr2 = catalog.find(u => (u.user_id || u.id) === 'usr-2');
      if (usr2) db.users.splice(1, 0, usr2);
      await persistDb();
    }
  }
  return db.users;
}

export async function updateUserLastLogin(userId) {
  const db = await getDb();
  if (!db.users) return;
  const target = db.users.find(u => (u.user_id || u.id) === userId);
  if (target) {
    const nowIso = new Date().toISOString();
    target.last_login = nowIso;
    target.lastLogin = nowIso;
    await persistDb();
  }
}

export async function createTestBooking(bookingData) {
  const db = await getDb();
  const {
    testId,
    collectionMethod = 'home_collection',
    centreId,
    homeAddress,
    pincode,
    city = 'Mumbai',
    date,
    timeSlot,
    patientName,
    patientPhone,
    patientEmail,
    patientAge,
    patientGender,
    notes
  } = bookingData;

  if (!testId || !date || !timeSlot || !patientName || !patientEmail || !patientPhone) {
    throw new Error('Missing required test booking information');
  }

  const test = db.diagnosticTests.find(t => t.id === testId);
  if (!test) throw new Error('Selected diagnostic test package not found');

  const currentCount = db.testBookings.length + 88;
  const bookingId = `AVC-TST-2026-${String(currentCount).padStart(6, '0')}`;

  let centreName = 'Avinya Partner Laboratory';
  let centreAddress = '';

  if (centreId) {
    const centre = db.diagnosticCentres.find(c => c.id === centreId);
    if (centre) {
      centreName = centre.name;
      centreAddress = centre.address;
    }
  }

  const newBooking = {
    id: bookingId,
    testId,
    testName: test.name,
    testCategory: test.category,
    price: test.price,
    collectionMethod,
    homeAddress: collectionMethod === 'home_collection' ? (homeAddress || '').trim() : '',
    pincode: collectionMethod === 'home_collection' ? (pincode || '').trim() : '',
    city,
    centreId: centreId || '',
    centreName,
    centreAddress,
    date,
    timeSlot,
    patientName: patientName.trim(),
    patientPhone: patientPhone.trim(),
    patientEmail: patientEmail.trim().toLowerCase(),
    patientAge: Number(patientAge) || 0,
    patientGender: patientGender || 'Unspecified',
    notes: notes ? notes.trim() : '',
    status: 'confirmed',
    history: [
      {
        status: 'confirmed',
        timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
        updatedBy: 'Patient / Web Booking',
        notes: 'Test booking scheduled.'
      }
    ],
    createdAt: new Date().toISOString()
  };

  db.testBookings.unshift(newBooking);
  await persistDb();
  return newBooking;
}

export async function getTestBookings(filters = {}) {
  const db = await getDb();
  let list = [...db.testBookings];

  if (filters.patientEmail) {
    const qEmail = filters.patientEmail.toLowerCase().trim();
    list = list.filter(b => b.patientEmail.toLowerCase() === qEmail);
  }

  if (filters.patientPhone) {
    const cleanPhone = filters.patientPhone.replace(/\D/g, '');
    list = list.filter(b => b.patientPhone.replace(/\D/g, '').includes(cleanPhone));
  }

  if (filters.status && filters.status !== 'all') {
    list = list.filter(b => b.status === filters.status);
  }

  return list;
}

export async function updateTestBookingStatus(id, newStatus, actor = 'Admin', notes = '') {
  const db = await getDb();
  const booking = db.testBookings.find(b => b.id === id);
  if (!booking) throw new Error(`Test booking ${id} not found`);

  booking.status = newStatus;
  booking.history.push({
    status: newStatus,
    timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
    updatedBy: actor,
    notes: notes || `Status updated to ${newStatus}`
  });

  await persistDb();
  return booking;
}

// -------------------------------------------------------------
// NOTIFICATION AUDIT LOGS & RETRY
// -------------------------------------------------------------

export async function logNotification(entry) {
  const db = await getDb();
  const logId = `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const record = {
    id: logId,
    timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
    createdAt: new Date().toISOString(),
    ...entry
  };

  db.notificationLogs.unshift(record);
  if (db.notificationLogs.length > 300) {
    db.notificationLogs = db.notificationLogs.slice(0, 300);
  }

  await persistDb();
  return record;
}

export async function getNotificationLogs() {
  const db = await getDb();
  return db.notificationLogs || [];
}

export async function updateNotificationLogStatus(id, status, error = null) {
  const db = await getDb();
  const record = db.notificationLogs.find(l => l.id === id);
  if (record) {
    record.status = status;
    if (error) record.error = error;
    record.lastRetryAt = new Date().toISOString();
    await persistDb();
  }
  return record;
}

// -------------------------------------------------------------
// KPI & ADMIN METRICS
// -------------------------------------------------------------

export async function getHealthcareStats() {
  const db = await getDb();
  const todayStr = new Date().toISOString().split('T')[0];

  const totalAppointments = db.appointments.length;
  const todayAppointments = db.appointments.filter(a => a.date === todayStr).length;
  const upcomingAppointments = db.appointments.filter(a => a.date >= todayStr && a.status === 'confirmed').length;
  const completedAppointments = db.appointments.filter(a => a.status === 'completed').length;
  const cancelledAppointments = db.appointments.filter(a => a.status === 'cancelled').length;
  const pendingAppointments = db.appointments.filter(a => a.status === 'pending').length;

  const totalTests = db.testBookings.length;
  const activeDoctors = db.doctors.length;
  const activeSpecialities = db.specialities.length;

  return {
    totalAppointments,
    todayAppointments,
    upcomingAppointments,
    completedAppointments,
    cancelledAppointments,
    pendingAppointments,
    totalTests,
    activeDoctors,
    activeSpecialities,
    lastSyncTime: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST'
  };
}

// -------------------------------------------------------------
// AUTHENTICATION, PASSWORD RESETS & PROFILE MANAGEMENT
// -------------------------------------------------------------

export async function authenticateCredentials(emailOrUsername, password) {
  const db = await getDb();
  if (!emailOrUsername || !password) {
    return { success: false, error: 'Email/Username and Password are required.' };
  }

  const query = emailOrUsername.trim().toLowerCase();
  const user = db.users.find(u =>
    (u.email && u.email.toLowerCase() === query) ||
    (u.user_id && u.user_id.toLowerCase() === query) ||
    (u.id && u.id.toLowerCase() === query)
  );

  if (!user) {
    return { success: false, error: 'Invalid email/username or password.' };
  }

  const status = (user.status || 'active').toLowerCase();
  if (status !== 'active') {
    return { success: false, error: 'Your account is currently unavailable. Please contact the administrator.' };
  }

  const userHash = user.password_hash || '';
  const isMatch = verifyPassword(password, userHash);

  if (!isMatch) {
    return { success: false, error: 'Invalid email/username or password.' };
  }

  user.last_login = new Date().toISOString();
  user.lastLogin = user.last_login;
  await persistDb();

  return {
    success: true,
    user: {
      userId: user.user_id || user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      avatar: user.avatar || '',
      role: user.role,
      doctorId: user.doctorId || user.doctor_id || null,
      providerId: user.providerId || user.provider_id || null,
      must_change_password: user.must_change_password === undefined ? !user.password_changed_at : !!user.must_change_password,
      password_changed_at: user.password_changed_at || null
    }
  };
}

export async function updateUserPassword(userId, currentPassword, newPassword, isForced = false) {
  const db = await getDb();
  const user = db.users.find(u => (u.user_id || u.id) === userId);
  if (!user) {
    return { success: false, error: 'User account not found.' };
  }

  const userHash = user.password_hash || '';

  if (currentPassword) {
    const isMatch = verifyPassword(currentPassword, userHash);
    if (!isMatch) {
      return { success: false, error: 'Current password is incorrect.' };
    }
  }

  if (currentPassword && currentPassword === newPassword) {
    return { success: false, error: 'New password cannot be identical to current password.' };
  }

  const strengthCheck = validatePasswordStrength(newPassword);
  if (!strengthCheck.valid) {
    return { success: false, error: strengthCheck.message };
  }

  user.password_hash = hashPassword(newPassword);
  user.must_change_password = false;
  user.password_changed_at = new Date().toISOString();
  await persistDb();

  return { success: true, message: 'Password changed successfully.' };
}

export async function createPasswordResetToken(email) {
  const db = await getDb();
  if (!db.passwordResets) db.passwordResets = [];

  const query = (email || '').trim().toLowerCase();
  const user = db.users.find(u => u.email && u.email.toLowerCase() === query);

  const token = generateResetToken();
  if (!user || user.status === 'inactive') {
    return { success: true, token, userFound: false };
  }

  const expiresAt = new Date(Date.now() + 45 * 60 * 1000).toISOString();
  db.passwordResets.push({
    id: 'rst-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    email: user.email,
    user_id: user.user_id || user.id,
    user_name: user.name,
    token_hash: generateTokenHash(token),
    expires_at: expiresAt,
    used: false,
    created_at: new Date().toISOString()
  });

  await persistDb();
  return { success: true, token, userFound: true, user };
}

export async function resetPasswordWithToken(token, newPassword) {
  const db = await getDb();
  if (!db.passwordResets) db.passwordResets = [];

  const tokenHash = generateTokenHash(token);
  const record = db.passwordResets.find(r => r.token_hash === tokenHash && !r.used);
  if (!record) {
    return { success: false, error: 'Invalid or expired password reset link.' };
  }

  const now = new Date();
  const expiry = new Date(record.expires_at);
  if (now > expiry) {
    return { success: false, error: 'Password reset link has expired. Please request a new link.' };
  }

  const user = db.users.find(u => (u.user_id || u.id) === record.user_id || u.email === record.email);
  if (!user) {
    return { success: false, error: 'Associated user account not found.' };
  }

  const strengthCheck = validatePasswordStrength(newPassword);
  if (!strengthCheck.valid) {
    return { success: false, error: strengthCheck.message };
  }

  user.password_hash = hashPassword(newPassword);
  user.must_change_password = false;
  user.password_changed_at = new Date().toISOString();
  record.used = true;

  await persistDb();
  return { success: true, message: 'Your password has been reset successfully. Please login using your new password.' };
}

export async function updateUserProfile(userId, profileData) {
  const db = await getDb();
  const user = db.users.find(u => (u.user_id || u.id) === userId);
  if (!user) {
    return { success: false, error: 'User account not found.' };
  }

  if (profileData.name) user.name = profileData.name.trim();
  if (profileData.email) user.email = profileData.email.trim().toLowerCase();
  if (profileData.phone !== undefined) user.phone = profileData.phone.trim();
  if (profileData.avatar !== undefined) user.avatar = profileData.avatar.trim();

  if (user.role === 'doctor' && user.doctorId && db.doctors) {
    const doc = db.doctors.find(d => d.id === user.doctorId || d.doctor_id === user.doctorId);
    if (doc) {
      if (profileData.name) doc.name = profileData.name.trim();
      if (profileData.phone) doc.phone = profileData.phone.trim();
      if (profileData.avatar) doc.avatar = profileData.avatar.trim();
      if (profileData.qualification) doc.qualification = profileData.qualification.trim();
      if (profileData.about) doc.about = profileData.about.trim();
      if (profileData.experienceYears) doc.experienceYears = parseInt(profileData.experienceYears, 10) || doc.experienceYears;
      if (profileData.location) doc.location = profileData.location.trim();
    }
  }

  if (user.role === 'diagnostic_provider' && user.providerId && db.diagnosticProviders) {
    const prov = db.diagnosticProviders.find(p => p.id === user.providerId || p.provider_id === user.providerId);
    if (prov) {
      if (profileData.name) prov.name = profileData.name.trim();
      if (profileData.email) prov.email = profileData.email.trim();
      if (profileData.phone) prov.phone = profileData.phone.trim();
      if (profileData.city) prov.city = profileData.city.trim();
      if (profileData.address) prov.address = profileData.address.trim();
    }
  }

  await persistDb();
  return {
    success: true,
    message: 'Profile updated successfully.',
    user: {
      userId: user.user_id || user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      avatar: user.avatar || '',
      role: user.role,
      doctorId: user.doctorId || user.doctor_id || null,
      providerId: user.providerId || user.provider_id || null
    }
  };
}

export async function adminResetUserPassword(targetUserId) {
  const db = await getDb();
  const user = db.users.find(u => (u.user_id || u.id) === targetUserId);
  if (!user) return { success: false, error: 'User account not found.' };

  // Do not create or disclose a reusable default password. The account holder
  // must complete the existing reset-link flow to establish a new credential.
  user.password_hash = null;
  user.must_change_password = true;
  user.password_changed_at = null;
  await persistDb();

  return { success: true, message: `Password access for ${user.name} was revoked. Send the user a password-reset link to set a new password.` };
}

export async function addDiagnosticTest(testData) {
  const db = await getDb();
  const newId = testData.id || `test-${Date.now()}`;
  const newTest = {
    id: newId,
    name: testData.name || 'Diagnostic Package',
    category: testData.category || 'Cancer Screening',
    tagline: testData.tagline || '',
    description: testData.description || '',
    price: Number(testData.price) || 999,
    originalPrice: Number(testData.originalPrice) || Number(testData.price) * 1.5,
    avinyaSubsidy: testData.avinyaSubsidy || 'Subsidized',
    testsIncluded: Array.isArray(testData.testsIncluded) ? testData.testsIncluded : (typeof testData.testsIncluded === 'string' ? testData.testsIncluded.split(',').map(s => s.trim()).filter(Boolean) : []),
    preparation: testData.preparation || 'Follow standard preparation guidelines.',
    reportTurnaround: testData.reportTurnaround || '24 to 36 Hours',
    sampleType: testData.sampleType || 'Blood / Serum Sample',
    icon: testData.icon || '🧪',
    homeCollection: testData.homeCollection !== false,
    centreVisit: testData.centreVisit !== false,
    isPriority: !!testData.isPriority,
    badge: testData.badge || 'Recommended'
  };

  db.diagnosticTests.push(newTest);
  await persistDb();
  return newTest;
}

export async function updateDiagnosticTest(id, updates) {
  const db = await getDb();
  const index = db.diagnosticTests.findIndex(t => t.id === id);
  if (index === -1) throw new Error(`Test package ${id} not found.`);

  const updated = {
    ...db.diagnosticTests[index],
    ...updates,
    id // preserve ID
  };
  if (typeof updated.testsIncluded === 'string') {
    updated.testsIncluded = updated.testsIncluded.split(',').map(s => s.trim()).filter(Boolean);
  }

  db.diagnosticTests[index] = updated;
  await persistDb();
  return updated;
}

export async function deleteDiagnosticTest(id) {
  const db = await getDb();
  const index = db.diagnosticTests.findIndex(t => t.id === id);
  if (index === -1) throw new Error(`Test package ${id} not found.`);
  const deleted = db.diagnosticTests.splice(index, 1)[0];
  await persistDb();
  return deleted;
}

export async function saveUserAccount(userData) {
  const db = await getDb();
  const userId = userData.id || userData.user_id || `usr-${Date.now()}`;
  const index = db.users.findIndex(u => (u.user_id || u.id) === userId);
  
  const isNewUser = index === -1;
  const requestedPassword = typeof userData.password === 'string' ? userData.password : '';
  if (isNewUser && !validatePasswordStrength(requestedPassword).valid) {
    return { success: false, error: 'A strong temporary password is required for a new user.' };
  }
  const record = {
    id: userId,
    user_id: userId,
    name: userData.name || 'User',
    email: (userData.email || '').toLowerCase().trim(),
    phone: userData.phone || '',
    avatar: userData.avatar || '',
    password_hash: requestedPassword ? hashPassword(requestedPassword) : (index !== -1 ? db.users[index].password_hash : null),
    role: userData.role || 'manager',
    subtitle: userData.subtitle || (userData.role === 'admin' ? 'System Administrator' : 'Staff Member'),
    doctorId: userData.doctorId || null,
    providerId: userData.providerId || null,
    status: userData.status || 'active',
    must_change_password: isNewUser || Boolean(requestedPassword),
    password_changed_at: requestedPassword ? null : (index !== -1 ? db.users[index].password_changed_at : null)
  };

  if (index !== -1) {
    db.users[index] = { ...db.users[index], ...record };
  } else {
    db.users.push(record);
  }

  await persistDb();
  return record;
}

export async function deleteUserAccount(userId) {
  const db = await getDb();
  const user = db.users.find(u => (u.user_id || u.id) === userId);
  if (user) {
    user.status = 'inactive';
    await persistDb();
  }
  return user;
}

export async function adminToggleUserStatus(targetUserId, status) {
  const db = await getDb();
  const user = db.users.find(u => (u.user_id || u.id) === targetUserId);
  if (!user) return { success: false, error: 'User account not found.' };

  user.status = status === 'active' ? 'active' : 'inactive';
  await persistDb();

  return { success: true, message: `User ${user.name} account status set to ${user.status}.` };
}
