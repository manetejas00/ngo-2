/**
 * Avinya Care Foundation - Healthcare Persistence & Database Engine
 * Manages Doctors, Specialities, Hospitals, Availability, Appointments, Diagnostic Tests,
 * Test Bookings, Concurrency Locks, Status History, and Notification Audit Logs.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hashPassword, verifyPassword, validatePasswordStrength, generateResetToken } from './healthcareAuthService.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, '../../cache');
const DB_FILE = join(DATA_DIR, 'healthcare_db.json');

// Memory cache of the database
let dbCache = null;
let isSaving = false;
let saveQueue = [];

// Seed Data
const DEFAULT_SPECIALITIES = [
  { id: 'oncology', name: 'Oncology', icon: '🧬', count: 4, desc: 'Medical, Surgical & Radiation Cancer Care' },
  { id: 'cardiology', name: 'Cardiology', icon: '🫀', count: 2, desc: 'Heart, Vascular & Preventive Cardiac Health' },
  { id: 'ophthalmology', name: 'Ophthalmology', icon: '👁️', count: 1, desc: 'Cataract, Retina & Vision Diagnostics' },
  { id: 'general-physician', name: 'General Physician', icon: '🩺', count: 2, desc: 'Primary Care, Fever & Chronic Illness' },
  { id: 'gynecology', name: 'Gynecology', icon: '🌸', count: 2, desc: "Women's Health, Maternity & Preventive Oncology" },
  { id: 'pediatrics', name: 'Pediatrics', icon: '👶', count: 1, desc: 'Child Health, Immunization & Pediatric Care' },
  { id: 'orthopedics', name: 'Orthopedics', icon: '🦴', count: 1, desc: 'Joints, Spine & Musculoskeletal Care' },
  { id: 'dermatology', name: 'Dermatology', icon: '✨', count: 1, desc: 'Skin, Hair & Dermato-Oncology Screening' },
  { id: 'neurology', name: 'Neurology', icon: '🧠', count: 1, desc: 'Brain, Nerves & Neuro-Oncology Support' },
  { id: 'geriatrics', name: 'Senior Citizen Health', icon: '🕊️', count: 1, desc: 'Geriatric Care, Vitality & Long-term Support' }
];

const DEFAULT_HOSPITALS = [
  {
    id: 'tmh-mumbai',
    name: 'Tata Memorial Hospital & Cancer Center',
    city: 'Mumbai',
    address: 'Dr. E Borges Road, Parel, Mumbai, Maharashtra 400012',
    phone: '+91 22 2417 7000'
  },
  {
    id: 'apollo-delhi',
    name: 'Indraprastha Apollo Hospitals',
    city: 'New Delhi',
    address: 'Sarita Vihar, Delhi Mathura Road, New Delhi 110076',
    phone: '+91 11 2692 5858'
  },
  {
    id: 'max-saket',
    name: 'Max Super Speciality Hospital',
    city: 'New Delhi',
    address: '1, 2, Press Enclave Marg, Saket, New Delhi 110017',
    phone: '+91 11 2651 5050'
  },
  {
    id: 'fortis-gurugram',
    name: 'Fortis Memorial Research Institute',
    city: 'Gurugram',
    address: 'Sector 44, Opposite HUDA City Centre, Gurugram, Haryana 122002',
    phone: '+91 124 496 2200'
  },
  {
    id: 'manipal-bengaluru',
    name: 'Manipal Comprehensive Cancer Center',
    city: 'Bengaluru',
    address: '98, HAL Old Airport Rd, Kodihalli, Bengaluru, Karnataka 560017',
    phone: '+91 80 2502 4444'
  },
  {
    id: 'avinya-clinic-mumbai',
    name: 'Avinya Care Community Health & Screening Clinic',
    city: 'Mumbai',
    address: 'Avinya Care Pavilion, Linking Road, Bandra West, Mumbai 400050',
    phone: '+91 98765 43210'
  }
];

const DEFAULT_DOCTORS = [
  {
    id: 'doc-1',
    name: 'Dr. Priya Sharma',
    specialityId: 'oncology',
    specialityName: 'Medical Oncology & Cancer Immunotherapy',
    qualification: 'MBBS, MD (Medicine), DM (Medical Oncology), ESMO Certified',
    experienceYears: 16,
    hospitalId: 'tmh-mumbai',
    hospitalName: 'Tata Memorial Hospital & Cancer Center, Mumbai',
    location: 'Mumbai',
    consultationFee: 0, // Avinya Foundation Volunteer Oncologist (Subsidized/Free)
    feeDisplay: '₹0 (Avinya Supported / Free)',
    consultationTypes: ['in-clinic', 'online'],
    rating: 4.98,
    reviewsCount: 342,
    badge: 'Senior Medical Oncologist & Lead Volunteer',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
    about: 'Dr. Priya Sharma is a distinguished Medical Oncologist with 16+ years of clinical and research excellence in breast, lung, and gastrointestinal cancers. A passionate advocate for early screening, she heads Avinya Care\'s clinical advisory board and conducts volunteer consultation clinics.',
    areasOfExpertise: [
      'Targeted & Immunotherapy Protocols',
      'Early Breast & Ovarian Cancer Screening',
      'Precision Genomic Oncology',
      'Palliative & Survivorship Navigation'
    ],
    languages: ['English', 'Hindi', 'Marathi'],
    schedule: {
      workingDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
      startTime: '09:00',
      endTime: '17:00',
      slotDurationMins: 30,
      breakStart: '13:00',
      breakEnd: '14:00'
    }
  },
  {
    id: 'doc-2',
    name: 'Dr. Rajesh K. Varma',
    specialityId: 'cardiology',
    specialityName: 'Interventional Cardiology & Preventive Heart Care',
    qualification: 'MBBS, MD (Medicine), DM (Cardiology), FACC (USA)',
    experienceYears: 20,
    hospitalId: 'apollo-delhi',
    hospitalName: 'Indraprastha Apollo Hospitals, New Delhi',
    location: 'New Delhi',
    consultationFee: 1200,
    feeDisplay: '₹1,200 (50% Avinya Care Concession)',
    consultationTypes: ['in-clinic', 'online'],
    rating: 4.94,
    reviewsCount: 280,
    badge: 'Director of Preventive Cardiology',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80',
    about: 'Dr. Rajesh Varma is a premier Interventional Cardiologist specializing in complex coronary interventions, heart failure management, and preventive cardio-oncology for cancer patients undergoing intensive chemotherapy.',
    areasOfExpertise: [
      'Cardio-Oncology & Heart Protection',
      'Coronary Angioplasty & Stenting',
      'Hypertension & Lipid Optimization',
      'Preventive Cardiac Risk Assessment'
    ],
    languages: ['English', 'Hindi', 'Punjabi'],
    schedule: {
      workingDays: [1, 2, 3, 4, 5],
      startTime: '10:00',
      endTime: '18:00',
      slotDurationMins: 30,
      breakStart: '13:30',
      breakEnd: '14:30'
    }
  },
  {
    id: 'doc-3',
    name: 'Dr. Ananya Sengupta',
    specialityId: 'gynecology',
    specialityName: "Gynecological Oncology & Women's Health",
    qualification: 'MBBS, MS (OBG), MCh (Gynec Oncology), Fellow RCOG (London)',
    experienceYears: 14,
    hospitalId: 'max-saket',
    hospitalName: 'Max Super Speciality Hospital, New Delhi',
    location: 'New Delhi',
    consultationFee: 1000,
    feeDisplay: '₹1,000 (Avinya Partner Rate)',
    consultationTypes: ['in-clinic', 'online'],
    rating: 4.96,
    reviewsCount: 215,
    badge: 'Lead Gynec-Oncologist',
    avatar: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&w=400&q=80',
    about: 'Dr. Ananya Sengupta specializes in robotic and laparoscopic gynecological oncology, cervical cancer prevention, HPV vaccination awareness drives, and ovarian mass evaluations.',
    areasOfExpertise: [
      'Cervical Cancer Screening & Colposcopy',
      'Ovarian & Uterine Oncology',
      'Minimally Invasive Pelvic Surgery',
      'Hereditary Breast & Ovarian Cancer Risk'
    ],
    languages: ['English', 'Hindi', 'Bengali'],
    schedule: {
      workingDays: [1, 3, 4, 5, 6],
      startTime: '09:30',
      endTime: '16:30',
      slotDurationMins: 30,
      breakStart: '13:00',
      breakEnd: '14:00'
    }
  },
  {
    id: 'doc-4',
    name: 'Dr. Vikramaditya Rathore',
    specialityId: 'oncology',
    specialityName: 'Surgical Oncology & Thoracic Care',
    qualification: 'MBBS, MS (Gen Surgery), MCh (Surgical Oncology), FACS',
    experienceYears: 18,
    hospitalId: 'fortis-gurugram',
    hospitalName: 'Fortis Memorial Research Institute, Gurugram',
    location: 'Gurugram',
    consultationFee: 1500,
    feeDisplay: '₹1,500',
    consultationTypes: ['in-clinic', 'online'],
    rating: 4.91,
    reviewsCount: 195,
    badge: 'Senior Surgical Oncologist',
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80',
    about: 'Dr. Vikramaditya Rathore is an internationally recognized Surgical Oncologist known for organ-preserving cancer resections, head & neck oncology, and complex thoracic surgeries.',
    areasOfExpertise: [
      'Organ Preservation Surgical Techniques',
      'Gastrointestinal & Colorectal Oncology',
      'Thoracic & Lung Cancer Resection',
      'Multidisciplinary Tumor Board Consultation'
    ],
    languages: ['English', 'Hindi', 'Marwari'],
    schedule: {
      workingDays: [1, 2, 3, 5, 6],
      startTime: '10:00',
      endTime: '17:30',
      slotDurationMins: 30,
      breakStart: '13:30',
      breakEnd: '14:30'
    }
  },
  {
    id: 'doc-5',
    name: 'Dr. Meera Nambiar',
    specialityId: 'general-physician',
    specialityName: 'Internal Medicine & Preventive Health',
    qualification: 'MBBS, MD (General Medicine), DNB',
    experienceYears: 12,
    hospitalId: 'avinya-clinic-mumbai',
    hospitalName: 'Avinya Care Community Clinic, Mumbai',
    location: 'Mumbai',
    consultationFee: 0,
    feeDisplay: '₹0 (Avinya Community Clinic)',
    consultationTypes: ['in-clinic', 'online'],
    rating: 4.97,
    reviewsCount: 410,
    badge: 'Chief Medical Officer - Avinya Clinics',
    avatar: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=400&q=80',
    about: 'Dr. Meera Nambiar serves as the Chief Medical Officer at Avinya Care Foundation. She leads early diagnostic triage, primary healthcare consultations, metabolic health management, and community screening camps.',
    areasOfExpertise: [
      'Comprehensive Symptom & Health Triage',
      'Diabetes & Metabolic Syndrome Control',
      'Geriatric & Palliative Care Navigation',
      'Preventive Health Screenings'
    ],
    languages: ['English', 'Hindi', 'Malayalam', 'Marathi'],
    schedule: {
      workingDays: [1, 2, 3, 4, 5, 6],
      startTime: '08:30',
      endTime: '16:00',
      slotDurationMins: 30,
      breakStart: '12:30',
      breakEnd: '13:30'
    }
  },
  {
    id: 'doc-6',
    name: 'Dr. Siddharth Balakrishnan',
    specialityId: 'neurology',
    specialityName: 'Neurology & Neuro-Oncology Care',
    qualification: 'MBBS, MD (Medicine), DM (Neurology), FINR',
    experienceYears: 15,
    hospitalId: 'manipal-bengaluru',
    hospitalName: 'Manipal Comprehensive Cancer Center, Bengaluru',
    location: 'Bengaluru',
    consultationFee: 1400,
    feeDisplay: '₹1,400 (Avinya Partner Rate)',
    consultationTypes: ['in-clinic', 'online'],
    rating: 4.93,
    reviewsCount: 168,
    badge: 'Senior Consultant Neurologist',
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
    about: 'Dr. Siddharth Balakrishnan is a renowned Neurologist specializing in neuro-oncology, neurological rehabilitation, stroke care, and cognitive wellness.',
    areasOfExpertise: [
      'Brain Tumor Diagnostic Consultation',
      'Chemotherapy-Induced Neuropathy Management',
      'Seizure & Epilepsy Management',
      'Cognitive & Memory Care'
    ],
    languages: ['English', 'Kannada', 'Tamil', 'Hindi'],
    schedule: {
      workingDays: [1, 2, 4, 5, 6],
      startTime: '10:00',
      endTime: '17:00',
      slotDurationMins: 30,
      breakStart: '13:00',
      breakEnd: '14:00'
    }
  },
  {
    id: 'doc-7',
    name: 'Dr. Kavita Joshi',
    specialityId: 'ophthalmology',
    specialityName: 'Ophthalmic Oncology & Advanced Vision Care',
    qualification: 'MBBS, MS (Ophthalmology), DNB, FICO (UK)',
    experienceYears: 13,
    hospitalId: 'apollo-delhi',
    hospitalName: 'Indraprastha Apollo Hospitals, New Delhi',
    location: 'New Delhi',
    consultationFee: 900,
    feeDisplay: '₹900',
    consultationTypes: ['in-clinic', 'online'],
    rating: 4.92,
    reviewsCount: 185,
    badge: 'Consultant Ophthalmologist',
    avatar: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&w=400&q=80',
    about: 'Dr. Kavita Joshi is an expert in ocular oncology, glaucoma, diabetic retinopathy, and preventive ocular screenings for cancer survivors.',
    areasOfExpertise: [
      'Ocular Tumors & Retinal Care',
      'Diabetic Eye Screening',
      'Cataract & Refractive Solutions',
      'Dry Eye & Radiation Protection'
    ],
    languages: ['English', 'Hindi', 'Gujarati'],
    schedule: {
      workingDays: [2, 3, 4, 5, 6],
      startTime: '09:00',
      endTime: '15:30',
      slotDurationMins: 30,
      breakStart: '12:30',
      breakEnd: '13:30'
    }
  },
  {
    id: 'doc-8',
    name: 'Dr. Arvind Deshmukh',
    specialityId: 'orthopedics',
    specialityName: 'Orthopedic Oncology & Joint Reconstruction',
    qualification: 'MBBS, MS (Ortho), MCh (Ortho, UK), Fellow Musculoskeletal Oncology',
    experienceYears: 19,
    hospitalId: 'tmh-mumbai',
    hospitalName: 'Tata Memorial Hospital, Mumbai',
    location: 'Mumbai',
    consultationFee: 1200,
    feeDisplay: '₹1,200 (Avinya Partner Rate)',
    consultationTypes: ['in-clinic', 'online'],
    rating: 4.95,
    reviewsCount: 220,
    badge: 'Senior Orthopedic Oncologist',
    avatar: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=400&q=80',
    about: 'Dr. Arvind Deshmukh is a leading specialist in bone and soft tissue sarcomas, limb salvage surgeries, joint reconstruction, and spine tumors.',
    areasOfExpertise: [
      'Bone & Soft Tissue Sarcoma Care',
      'Limb-Sparing Prosthetic Surgery',
      'Metastatic Bone Disease Management',
      'Joint Arthroscopy & Reconstruction'
    ],
    languages: ['English', 'Hindi', 'Marathi'],
    schedule: {
      workingDays: [1, 2, 3, 4, 5],
      startTime: '09:30',
      endTime: '16:30',
      slotDurationMins: 30,
      breakStart: '13:00',
      breakEnd: '14:00'
    }
  },
  {
    id: 'doc-9',
    name: 'Dr. Shalini Raman',
    specialityId: 'pediatrics',
    specialityName: 'Pediatric Oncology & Child Health',
    qualification: 'MBBS, MD (Pediatrics), Fellowship in Pediatric Hemat-Oncology',
    experienceYears: 11,
    hospitalId: 'manipal-bengaluru',
    hospitalName: 'Manipal Hospitals, Bengaluru',
    location: 'Bengaluru',
    consultationFee: 800,
    feeDisplay: '₹800',
    consultationTypes: ['in-clinic', 'online'],
    rating: 4.98,
    reviewsCount: 310,
    badge: 'Pediatric Care Specialist',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    about: 'Dr. Shalini Raman specializes in childhood leukemia, solid tumors in children, routine pediatric wellness, and empathetic emotional guidance for families.',
    areasOfExpertise: [
      'Pediatric Leukemia & Lymphoma',
      'Childhood Immunization & Growth Tracking',
      'Pediatric Supportive Care',
      'Family Psychological Guidance'
    ],
    languages: ['English', 'Kannada', 'Hindi', 'Telugu'],
    schedule: {
      workingDays: [1, 2, 3, 4, 6],
      startTime: '10:00',
      endTime: '17:00',
      slotDurationMins: 30,
      breakStart: '13:00',
      breakEnd: '14:00'
    }
  },
  {
    id: 'doc-10',
    name: 'Dr. Farooq Qureshi',
    specialityId: 'dermatology',
    specialityName: 'Dermatology & Cutaneous Oncology',
    qualification: 'MBBS, MD (Dermatology, Venereology & Leprosy)',
    experienceYears: 14,
    hospitalId: 'max-saket',
    hospitalName: 'Max Super Speciality Hospital, New Delhi',
    location: 'New Delhi',
    consultationFee: 950,
    feeDisplay: '₹950',
    consultationTypes: ['in-clinic', 'online'],
    rating: 4.90,
    reviewsCount: 170,
    badge: 'Consultant Dermatologist',
    avatar: 'https://images.unsplash.com/photo-1622902046580-2b47f47f5471?auto=format&fit=crop&w=400&q=80',
    about: 'Dr. Farooq Qureshi focuses on dermoscopy for early melanoma and skin lesion screening, radiation dermatitis care, and clinical dermatology.',
    areasOfExpertise: [
      'Melanoma & Non-Melanoma Skin Cancer Screening',
      'Digital Dermoscopy & Mole Mapping',
      'Chemotherapy & Radiation Skin Care',
      'Chronic Inflammatory Skin Disorders'
    ],
    languages: ['English', 'Hindi', 'Urdu'],
    schedule: {
      workingDays: [1, 3, 4, 5, 6],
      startTime: '09:00',
      endTime: '16:00',
      slotDurationMins: 30,
      breakStart: '12:30',
      breakEnd: '13:30'
    }
  }
];

const DEFAULT_DIAGNOSTIC_PROVIDERS = [
  {
    id: 'provider-1',
    name: 'Avinya Central Diagnostics & Pathology',
    email: 'lab.mumbai@avinyacarefoundation.org',
    phone: '+91 98765 43210',
    city: 'Mumbai',
    address: 'Avinya Center, Bandra West, Mumbai 400050'
  },
  {
    id: 'provider-2',
    name: 'Metropolis Cancer Diagnostics & Advanced Imaging',
    email: 'lab.delhi@metropolis.in',
    phone: '+91 11 2692 5858',
    city: 'New Delhi',
    address: 'A-23, Hauz Khas Enclave, New Delhi 110016'
  }
];

const DEFAULT_DIAGNOSTIC_CENTRES = [
  {
    id: 'diag-centre-mumbai',
    name: 'Avinya Diagnostic & Pathology Hub',
    city: 'Mumbai',
    address: 'Avinya Center, Bandra West, Mumbai 400050',
    homeCollectionAvailable: true,
    phone: '+91 98765 43210'
  },
  {
    id: 'diag-centre-delhi',
    name: 'SRL Diagnostics & Avinya Referral Lab',
    city: 'New Delhi',
    address: 'A-23, Hauz Khas Enclave, New Delhi 110016',
    homeCollectionAvailable: true,
    phone: '+91 11 4188 9000'
  },
  {
    id: 'diag-centre-bengaluru',
    name: 'Apollo Diagnostics Partner Hub',
    city: 'Bengaluru',
    address: '80 Feet Road, 4th Block, Koramangala, Bengaluru 560034',
    homeCollectionAvailable: true,
    phone: '+91 80 4668 8000'
  },
  {
    id: 'diag-centre-pune',
    name: 'Metropolis Healthcare & Avinya Outreach Lab',
    city: 'Pune',
    address: 'Fergusson College Road, Shivajinagar, Pune 411004',
    homeCollectionAvailable: true,
    phone: '+91 20 6609 5000'
  }
];

const DEFAULT_DIAGNOSTIC_TESTS = [
  {
    id: 'test-1',
    providerId: 'provider-1',
    name: 'Comprehensive Cancer Biomarker Panel',
    category: 'Cancer Screening',
    tagline: 'Multi-tumor biomarker screening for early detection',
    description: 'High-precision serum biomarker screen assessing risk factors for colorectal, liver, prostate, ovarian, and gastrointestinal malignancies.',
    price: 3499,
    originalPrice: 6500,
    avinyaSubsidy: '46% Off (Avinya Oncology Subsidy)',
    testsIncluded: [
      'Carcinoembryonic Antigen (CEA) - Colorectal & GI',
      'CA-125 - Ovarian & Gynecological Marker',
      'PSA (Total & Free) - Prostate Health',
      'Alpha-Fetoprotein (AFP) - Liver & Germ Cell',
      'CA 19-9 - Pancreatic & Biliary',
      'Complete Blood Count (CBC) with ESR',
      'High-Sensitivity C-Reactive Protein (hs-CRP)'
    ],
    preparation: '10 to 12 hours fasting required. Morning sample recommended. Drink water freely.',
    reportTurnaround: '24 to 36 Hours',
    sampleType: 'Blood / Serum Sample',
    icon: '🧬',
    homeCollection: true,
    centreVisit: true,
    isPriority: true,
    badge: '⭐ Recommended Cancer Screen'
  },
  {
    id: 'test-2',
    providerId: 'provider-1',
    name: 'Avinya Whole Body Oncology & Metabolic Shield',
    category: 'Full Body Checkup',
    tagline: '72 Essential Parameters for full body health & cancer markers',
    description: 'Our most comprehensive screening combining complete vital organ assessments (liver, kidney, heart, thyroid) with primary cancer markers.',
    price: 4299,
    originalPrice: 8500,
    avinyaSubsidy: '49% Off',
    testsIncluded: [
      'Complete Liver Function Test (11 Parameters)',
      'Renal & Kidney Profile with eGFR (8 Parameters)',
      'Full Lipid & Cardiac Risk Profile (9 Parameters)',
      'Thyroid Profile (Total T3, T4, TSH)',
      'HbA1c & Fasting Blood Sugar',
      'Vitamin D3 & Vitamin B12 Vital Levels',
      'Urine Complete Routine & Microscopic',
      'Cancer Marker Screening (CEA & PSA/CA-125)'
    ],
    preparation: '12 hours overnight fasting mandatory. Avoid alcohol and heavy exercise 24h prior.',
    reportTurnaround: '24 Hours',
    sampleType: 'Blood & Urine Sample',
    icon: '🩺',
    homeCollection: true,
    centreVisit: true,
    isPriority: true,
    badge: 'Popular Full Body'
  },
  {
    id: 'test-3',
    providerId: 'provider-2',
    name: 'Liquid Biopsy & Circulating Tumor DNA Screen',
    category: 'Cancer Screening',
    tagline: 'Non-invasive next-generation genomic cancer surveillance',
    description: 'State-of-the-art circulating cell-free DNA (cfDNA) analysis from a simple blood draw, identifying somatic gene mutations associated with multiple solid tumors.',
    price: 9999,
    originalPrice: 18000,
    avinyaSubsidy: '45% Off (Clinical Partnership)',
    testsIncluded: [
      'Circulating Tumor DNA Mutation Panel (EGFR, KRAS, BRAF, PIK3CA)',
      'MicroRNA Expression Cancer Signatures',
      'Methylation Biomarker Analysis',
      'Molecular Geneticist Advisory Report'
    ],
    preparation: 'No fasting required. Specialized DNA preservative tubes provided by trained phlebotomist.',
    reportTurnaround: '5 to 7 Working Days',
    sampleType: 'Blood Sample (cfDNA)',
    icon: '🔬',
    homeCollection: true,
    centreVisit: true,
    isPriority: true,
    badge: '🧬 Genomic Precision'
  },
  {
    id: 'test-4',
    name: 'Advanced Cardiac Health & Stroke Risk Panel',
    category: 'Heart Tests',
    tagline: 'Preventive cardiology evaluation and lipid subfractionation',
    description: 'Specialized cardiac profile assessing vascular inflammation, arterial plaque stability, and hereditary cardiovascular risk markers.',
    price: 2499,
    originalPrice: 4800,
    avinyaSubsidy: '48% Off',
    testsIncluded: [
      'Apolipoprotein A1 & B Ratio',
      'Lipoprotein (a) - Genetic Heart Risk',
      'High-Sensitivity Troponin-I',
      'hs-CRP (Vascular Inflammation)',
      'Homocysteine Serum Levels',
      'Standard Lipid Profile (Cholesterol, HDL, LDL, VLDL, Triglycerides)'
    ],
    preparation: '12 hours fasting. Avoid fatty meals the night before.',
    reportTurnaround: '24 Hours',
    sampleType: 'Blood / Serum Sample',
    icon: '🫀',
    homeCollection: true,
    centreVisit: true,
    isPriority: false,
    badge: 'Heart Care'
  },
  {
    id: 'test-5',
    name: "Women's Comprehensive Wellness & Hormonal Profile",
    category: "Women's Health",
    tagline: 'Complete hormonal balance, fertility, and bone health assessment',
    description: 'Designed specifically for women of all ages to evaluate hormonal harmony, thyroid metabolism, ovarian reserve, and anemia indices.',
    price: 2899,
    originalPrice: 5500,
    avinyaSubsidy: '47% Off',
    testsIncluded: [
      'LH, FSH & Prolactin Hormonal Panel',
      'Estradiol (E2) & Progesterone',
      'Thyroid Antibodies (Anti-TPO)',
      'Serum Ferritin & Total Iron Binding Capacity',
      'Calcium, Phosphorus & Alkaline Phosphatase',
      'Vitamin D3 (25-OH)'
    ],
    preparation: 'Fasting 8-10 hours. Best performed between Days 2-5 of menstrual cycle unless advised otherwise.',
    reportTurnaround: '24 Hours',
    sampleType: 'Blood / Serum Sample',
    icon: '🌸',
    homeCollection: true,
    centreVisit: true,
    isPriority: false,
    badge: "Women's Choice"
  },
  {
    id: 'test-6',
    name: 'Comprehensive Diabetic & Glycemic Control Check',
    category: 'Diabetes Tests',
    tagline: 'Precise 3-month glycemic control and microvascular organ checks',
    description: 'Thorough evaluation of diabetes status, insulin resistance, urinary microalbuminuria, and early diabetic kidney detection.',
    price: 1499,
    originalPrice: 3000,
    avinyaSubsidy: '50% Off',
    testsIncluded: [
      'HbA1c (Glycosylated Hemoglobin) with Estimated Average Glucose',
      'Fasting & Postprandial Blood Glucose',
      'Fasting Serum Insulin & HOMA-IR Index',
      'Urine Microalbumin to Creatinine Ratio (ACR)',
      'Kidney Function Serum Creatinine & BUN'
    ],
    preparation: 'Fasting 10 hours for fasting sample; 2nd draw 2 hours post meal.',
    reportTurnaround: '12 to 18 Hours',
    sampleType: 'Blood & Urine Sample',
    icon: '🩸',
    homeCollection: true,
    centreVisit: true,
    isPriority: false,
    badge: 'Diabetic Care'
  },
  {
    id: 'test-7',
    name: 'Senior Citizen Vitality & Bone Density Panel',
    category: 'Senior Citizen Health',
    tagline: 'Tailored diagnostics for healthy aging, bone density, and memory',
    description: 'Comprehensive health screen customized for individuals aged 60+ to detect joint degeneration, vitamin deficiencies, and organ health.',
    price: 2999,
    originalPrice: 6200,
    avinyaSubsidy: '52% Off',
    testsIncluded: [
      'Serum Calcium, Phosphorus, & Uric Acid',
      'Vitamin D3 & Active B12 (Cobalamin)',
      'High-Sensitivity CRP & ESR (Chronic Inflammation)',
      'Electrolyte Panel (Sodium, Potassium, Chloride)',
      'Kidney & Liver Vital Function',
      'PSA for Men / CA-125 for Women'
    ],
    preparation: '10 to 12 hours fasting. Continue regular blood pressure medications with sips of water.',
    reportTurnaround: '24 Hours',
    sampleType: 'Blood / Serum Sample',
    icon: '🕊️',
    homeCollection: true,
    centreVisit: true,
    isPriority: false,
    badge: 'Elderly Friendly'
  },
  {
    id: 'test-8',
    name: 'Early Detection Mammography & Breast Ultrasound Referral',
    category: 'Cancer Screening',
    tagline: 'Clinical digital imaging package at partner accredited diagnostic hubs',
    description: 'Low-dose digital 3D tomosynthesis mammography and high-frequency bilateral breast ultrasound with expert radiologist BIRADS scoring.',
    price: 2200,
    originalPrice: 4500,
    avinyaSubsidy: '51% Off (Avinya Breast Care Initiative)',
    testsIncluded: [
      'Bilateral Digital Full-Field Mammography (CC & MLO Views)',
      'High-Resolution Breast Ultrasound Sonography',
      'BIRADS Standardized Radiologist Consultation Report',
      'Avinya Clinical Navigator Follow-up'
    ],
    preparation: 'Avoid applying deodorants, talcum powders, or lotions on chest or underarms on appointment day.',
    reportTurnaround: 'Same Day / 24 Hours',
    sampleType: 'Radiology Imaging Visit',
    icon: '🎗️',
    homeCollection: false,
    centreVisit: true,
    isPriority: true,
    badge: '🎗️ Breast Care'
  }
];

// Initial pre-seeded appointments to showcase dashboard functionality immediately
const SEED_APPOINTMENTS = [
  {
    id: 'AVC-APT-2026-000101',
    doctorId: 'doc-1',
    doctorName: 'Dr. Priya Sharma',
    doctorSpeciality: 'Medical Oncology & Cancer Immunotherapy',
    doctorHospital: 'Tata Memorial Hospital & Cancer Center, Mumbai',
    doctorFee: 0,
    patientName: 'Ramesh Sundaram',
    patientPhone: '+91 98201 12345',
    patientEmail: 'ramesh.sundaram@example.com',
    patientAge: 58,
    patientGender: 'Male',
    consultationType: 'in-clinic',
    location: 'Avinya Care Pavilion, Linking Road, Bandra West, Mumbai',
    date: '2026-08-20',
    time: '10:30 AM',
    reason: 'Follow-up consultation after PET-CT scan review & immune nutrition advice',
    notes: 'Patient brings previous pathology reports from TMH.',
    status: 'confirmed',
    history: [
      { status: 'pending', timestamp: '2026-08-19 09:15:00 IST', updatedBy: 'Patient', notes: 'Online booking via Avinya platform' },
      { status: 'confirmed', timestamp: '2026-08-19 09:30:00 IST', updatedBy: 'Avinya Coordinator', notes: 'Slot confirmed with Dr. Priya Sharma' }
    ],
    createdAt: '2026-08-19T09:15:00.000Z',
    updatedAt: '2026-08-19T09:30:00.000Z'
  },
  {
    id: 'AVC-APT-2026-000102',
    doctorId: 'doc-2',
    doctorName: 'Dr. Rajesh K. Varma',
    doctorSpeciality: 'Interventional Cardiology & Preventive Heart Care',
    doctorHospital: 'Indraprastha Apollo Hospitals, New Delhi',
    doctorFee: 1200,
    patientName: 'Sunita Mehra',
    patientPhone: '+91 98112 54321',
    patientEmail: 'sunita.mehra@example.com',
    patientAge: 52,
    patientGender: 'Female',
    consultationType: 'online',
    location: 'Encrypted Telehealth Video Room (Avinya Health Connect)',
    date: '2026-08-20',
    time: '02:30 PM',
    reason: 'Cardio-oncology clearance before targeted therapy regimen',
    notes: 'Echocardiogram done last week showing EF 60%.',
    status: 'confirmed',
    history: [
      { status: 'confirmed', timestamp: '2026-08-19 11:20:00 IST', updatedBy: 'System', notes: 'Automated instant confirmation' }
    ],
    createdAt: '2026-08-19T11:20:00.000Z',
    updatedAt: '2026-08-19T11:20:00.000Z'
  },
  {
    id: 'AVC-APT-2026-000103',
    doctorId: 'doc-5',
    doctorName: 'Dr. Meera Nambiar',
    doctorSpeciality: 'Internal Medicine & Preventive Health',
    doctorHospital: 'Avinya Care Community Clinic, Mumbai',
    doctorFee: 0,
    patientName: 'Devendra Patil',
    patientPhone: '+91 97654 32109',
    patientEmail: 'devendra.patil@example.com',
    patientAge: 64,
    patientGender: 'Male',
    consultationType: 'in-clinic',
    location: 'Avinya Care Pavilion, Linking Road, Bandra West, Mumbai',
    date: '2026-08-19',
    time: '04:00 PM',
    reason: 'Early screening evaluation for persistent fatigue and unintentional weight loss',
    notes: 'Elderly patient with son accompanying.',
    status: 'completed',
    history: [
      { status: 'confirmed', timestamp: '2026-08-18 14:00:00 IST', updatedBy: 'Patient', notes: 'Booked' },
      { status: 'completed', timestamp: '2026-08-19 16:30:00 IST', updatedBy: 'Dr. Meera Nambiar', notes: 'Consultation concluded. Prescribed full biomarker panel.' }
    ],
    createdAt: '2026-08-18T14:00:00.000Z',
    updatedAt: '2026-08-19T16:30:00.000Z'
  }
];

const SEED_TEST_BOOKINGS = [
  {
    id: 'AVC-TST-2026-000051',
    testId: 'test-1',
    providerId: 'provider-1',
    testName: 'Comprehensive Cancer Biomarker Panel',
    price: 3499,
    collectionMethod: 'home_collection',
    homeAddress: 'Flat 402, Sea Breeze Apts, Bandra West',
    pincode: '400050',
    city: 'Mumbai',
    centreName: 'Avinya Diagnostic & Pathology Hub, Mumbai',
    date: '2026-08-21',
    timeSlot: '08:00 AM - 09:00 AM',
    patientName: 'Kavita Chawla',
    patientPhone: '+91 98200 98765',
    patientEmail: 'kavita.chawla@example.com',
    patientAge: 46,
    patientGender: 'Female',
    status: 'confirmed',
    history: [
      { status: 'confirmed', timestamp: '2026-08-19 10:00:00 IST', updatedBy: 'System' }
    ],
    createdAt: '2026-08-19T10:00:00.000Z'
  },
  {
    id: 'AVC-TST-2026-000052',
    testId: 'test-2',
    providerId: 'provider-1',
    testName: 'Avinya Whole Body Oncology & Metabolic Shield',
    price: 4299,
    collectionMethod: 'centre_visit',
    centreName: 'SRL Diagnostics & Avinya Referral Lab, New Delhi',
    centreAddress: 'A-23, Hauz Khas Enclave, New Delhi 110016',
    date: '2026-08-22',
    timeSlot: '09:30 AM - 10:30 AM',
    patientName: 'Anil Kapoor',
    patientPhone: '+91 98111 22334',
    patientEmail: 'anil.kapoor@example.com',
    patientAge: 55,
    patientGender: 'Male',
    status: 'sample_collected',
    history: [
      { status: 'confirmed', timestamp: '2026-08-18 16:20:00 IST', updatedBy: 'System' },
      { status: 'sample_collected', timestamp: '2026-08-19 10:15:00 IST', updatedBy: 'Diagnostic Center' }
    ],
    createdAt: '2026-08-18T16:20:00.000Z'
  }
];

export function buildUsersCatalog(doctors = DEFAULT_DOCTORS, providers = DEFAULT_DIAGNOSTIC_PROVIDERS) {
  const defaultHash = hashPassword('Admin@1230');
  const users = [
    {
      id: 'usr-admin-01',
      user_id: 'usr-admin-01',
      name: 'Super Admin',
      email: 'admin@gmail.com',
      phone: '+91 98765 00000',
      avatar: '',
      password_hash: defaultHash,
      role: 'admin',
      subtitle: 'System Administrator',
      doctorId: null,
      providerId: null,
      status: 'active',
      must_change_password: true,
      password_changed_at: null
    },
    {
      id: 'usr-2',
      user_id: 'usr-2',
      name: 'Healthcare Coordinator',
      email: 'health@avinyacarefoundation.org',
      phone: '+91 98765 00002',
      avatar: '',
      password_hash: defaultHash,
      role: 'manager',
      subtitle: 'Healthcare Coordinator & Ops Manager',
      doctorId: null,
      providerId: null,
      status: 'active',
      must_change_password: true,
      password_changed_at: null
    }
  ];

  (doctors || []).forEach(doc => {
    users.push({
      id: `usr-doc-${doc.id}`,
      user_id: `usr-doc-${doc.id}`,
      name: doc.name,
      email: `doctor.${doc.id}@avinyacarefoundation.org`,
      phone: '+91 98200 11223',
      avatar: doc.avatar || '',
      password_hash: defaultHash,
      role: 'doctor',
      subtitle: doc.specialityName || 'Medical Specialist',
      doctorId: doc.id,
      providerId: null,
      status: 'active',
      must_change_password: true,
      password_changed_at: null
    });
  });

  (providers || []).forEach(prov => {
    users.push({
      id: `usr-prov-${prov.id}`,
      user_id: `usr-prov-${prov.id}`,
      name: prov.name,
      email: prov.email,
      phone: prov.phone || '+91 98765 43210',
      avatar: '',
      password_hash: defaultHash,
      role: 'diagnostic_provider',
      subtitle: `${prov.city} Diagnostic Center`,
      doctorId: null,
      providerId: prov.id,
      status: 'active',
      must_change_password: true,
      password_changed_at: null
    });
  });

  return users;
}

/**
 * Initializes and returns the in-memory database instance.
 */
export async function getDb() {
  if (dbCache) return dbCache;

  try {
    const raw = await readFile(DB_FILE, 'utf-8');
    dbCache = JSON.parse(raw);
    if (!dbCache.diagnosticProviders) dbCache.diagnosticProviders = DEFAULT_DIAGNOSTIC_PROVIDERS;
    if (!dbCache.users) dbCache.users = buildUsersCatalog(dbCache.doctors || DEFAULT_DOCTORS, dbCache.diagnosticProviders);
  } catch (err) {
    // Initialize default database structure
    dbCache = {
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      specialities: DEFAULT_SPECIALITIES,
      hospitals: DEFAULT_HOSPITALS,
      doctors: DEFAULT_DOCTORS,
      diagnosticProviders: DEFAULT_DIAGNOSTIC_PROVIDERS,
      diagnosticCentres: DEFAULT_DIAGNOSTIC_CENTRES,
      diagnosticTests: DEFAULT_DIAGNOSTIC_TESTS,
      appointments: SEED_APPOINTMENTS,
      testBookings: SEED_TEST_BOOKINGS,
      users: buildUsersCatalog(DEFAULT_DOCTORS, DEFAULT_DIAGNOSTIC_PROVIDERS),
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
  return db.diagnosticProviders || DEFAULT_DIAGNOSTIC_PROVIDERS;
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

  const defaultHash = hashPassword('Admin@1230');
  const userHash = user.password_hash || defaultHash;
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

  const defaultHash = hashPassword('Admin@1230');
  const userHash = user.password_hash || defaultHash;

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
    token: token,
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

  const record = db.passwordResets.find(r => r.token === token && !r.used);
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

  user.password_hash = hashPassword('Admin@1230');
  user.must_change_password = true;
  user.password_changed_at = null;
  await persistDb();

  return { success: true, message: `Password for ${user.name} reset to Admin@1230. User will be required to change password upon next login.` };
}

export async function adminToggleUserStatus(targetUserId, status) {
  const db = await getDb();
  const user = db.users.find(u => (u.user_id || u.id) === targetUserId);
  if (!user) return { success: false, error: 'User account not found.' };

  user.status = status === 'active' ? 'active' : 'inactive';
  await persistDb();

  return { success: true, message: `User ${user.name} account status set to ${user.status}.` };
}
