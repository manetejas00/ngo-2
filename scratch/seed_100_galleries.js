import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, '..');

const medicalImages = [
  "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1581056771107-24ca5f033842?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80"
];

const categories = [
  {
    name: "Healthcare",
    topics: [
      "Mobile Diagnostic & Tele-Pathology Outreach",
      "Pediatric Care & Specialized Oncology Screening",
      "Geriatric Consultation & Mobility Health Drive",
      "Cardiology Consultation & 12-Lead ECG Camp",
      "Rural Vision & Subsidized Cataract Surgery Mission",
      "Subsidized Surgical Reconstruction Program",
      "Telemedicine Kiosk Network Inauguration",
      "Oncology Nursing & Grassroots Caregiver Training",
      "Pathology Diagnostic Camp for Tribal Hamlets",
      "Prosthetics Distribution & Orthotic Rehab Camp",
      "Community Dental & Oral Hygiene Drive",
      "Subsidized Chemotherapy Access Initiative",
      "Neurology Evaluation & Brain Health Awareness",
      "Orthopedic Mobility & Joint Screening Mission",
      "Subsidized Radiation Therapy Guidance Kiosk",
      "Maternal Care & Prenatal Diagnostic Camp",
      "Diabetes & Hypertension Early Intervention",
      "Renal Health & Free Dialysis Counselling Hub",
      "Dermatology & Skin Cancer Diagnostic Drive",
      "Pulmonology & Respiratory Health Checkup Camp"
    ]
  },
  {
    name: "Events",
    topics: [
      "Pediatric Oncology Ward Art & Joy Workshop",
      "National Cancer Survivors' Triumph Celebration",
      "Annual Hope Gala & Benefactor Recognition Night",
      "World Cancer Day Public Transit Flash Mob",
      "Caregiver Stress Resilience & Mental Health Workshop",
      "Oncology Survivors' Stories of Courage Forum",
      "Volunteer Appreciation & Milestone Awards Ceremony",
      "Children's Healthcare & Play Therapy Festival",
      "Community Health Workers' Graduation Day",
      "Benefactor & Medical Partners' Roundtable",
      "Oncology Research & Innovation Symposium",
      "Hospice Comfort & Memorial Remembrance Evening",
      "Youth Leadership for Cancer Awareness Summit",
      "Grassroots Health Champions Honor Ceremony",
      "Cancer Patient Caregiver Wellness Retreat",
      "Art for Healing Exhibition & Fundraiser",
      "Medical Students' Healthcare Service Convention",
      "National Doctor's Day Recognition Forum",
      "Survivors' Choir & Musical Evening of Hope",
      "Palliative Care Pioneers Annual Assembly"
    ]
  },
  {
    name: "Awareness",
    topics: [
      "Breast Cancer Early Self-Examination Workshop",
      "Cervical Cancer Awareness Rally & HPV Walkathon",
      "Oral Cancer Prevention in Industrial Factory Belts",
      "Women's Wellness & Anemia Prevention Seminar",
      "Tobacco Cessation Counselling Kiosk Setup",
      "Lifestyle Medicine & Cancer Risk Mitigation Forum",
      "Sun Protection & Skin Melanoma Warning Signals",
      "Pediatric Cancer Symptoms Guidance for Teachers",
      "Dietary Nutrition & Anti-Oxidant Health Lecture",
      "Prostate Cancer Screening Awareness Rally",
      "Colorectal Health & Early Diagnostic Seminar",
      "Occupational Health & Chemical Safety Workshop",
      "Youth Anti-Vaping & Nicotine Harm Education",
      "Breast Health Awareness Bus Tour",
      "Genetic Counselling & Hereditary Cancer Talk",
      "Environmental Health & Pollution Risks Forum",
      "Empowering Rural Women with Hygiene Knowledge",
      "Corporate Workplace Health & Cancer Awareness",
      "Community Radio Broadcast on Early Symptoms",
      "Pap Smear & Cervical Screening Information Drive"
    ]
  },
  {
    name: "Campaigns",
    topics: [
      "Free Community Mammography & Screening Campaign",
      "Youth Anti-Smoking School Campaign Across 25 Schools",
      "Free Diabetes & Hypertension Screening Marathon",
      "Mobile Mammography Van Slum Cluster Outreach",
      "Early Diagnostic Screening Campaign for Urban Poor",
      "HPV Immunization Drive for Young Girls",
      "Industrial Belt Tobacco Harm Elimination Campaign",
      "Childhood Cancer Early Diagnosis Campus Campaign",
      "Community Health Worker Door-to-Door Screening",
      "Senior Citizen Preventive Health Assessment Tour",
      "Clean Air & Lung Health Screening Campaign",
      "Mass Blood Pressure & Heart Risk Campaign",
      "Women's Reproductive Health Screening Fortnight",
      "Subsidized Lab Testing Campaign for Rural Families",
      "Clean Water & Gastro-Intestinal Health Campaign",
      "Scalp Cooling & Chemotherapy Support Campaign",
      "Early Detection Drives in Coastal Fishing Hamlets",
      "Free Ultrasound & Abdominal Screening Campaign",
      "Community Hygiene & Infection Prevention Tour",
      "Zero Tobacco Workplace Certification Campaign"
    ]
  },
  {
    name: "Community",
    topics: [
      "Chemotherapy Care Kit Distribution Drive",
      "Voluntary Blood Donation Marathon for Leukaemia",
      "Emergency Medical Supplies & Oxygen Relief Support",
      "Hospice Caregiver Support Group Monthly Gathering",
      "Clean Water Filter & Hygiene Kit Distribution",
      "Single Donor Platelet (SDP) Apheresis Drive",
      "Patient Family Rations & Support Package Drive",
      "Prosthetic Limb Fitting & Mobility Aid Donation",
      "Warm Blankets & Care Package Winter Distribution",
      "Nutritional Supplement Support for Cancer Patients",
      "Community Kitchen Free Meals for Hospital Attendants",
      "Transportation Voucher Assistance for Rural Patients",
      "Children's Educational Toy Drive for Oncology Wards",
      "Subsidized Prescription Distribution Kiosk",
      "Voluntary Blood Donors' Network Registration",
      "Wheelchair & Mobility Aid Community Handover",
      "Maternal & Infant Health Pack Distribution",
      "Grassroots Health Worker Support Kit Handover",
      "Shelter & Transit Home Support for Patient Families",
      "Emergency Blood Transfusion Assistance Cell"
    ]
  }
];

const locations = [
  "Palghar, Maharashtra", "Dharavi, Mumbai", "Thane West, Maharashtra", "Virar West, Mumbai",
  "Navi Mumbai", "Pune, Maharashtra", "Nashik, Maharashtra", "Aurangabad, Maharashtra",
  "Ratnagiri, Maharashtra", "Vasai, Maharashtra", "Bhiwandi, Maharashtra", "Andheri, Mumbai",
  "Borivali, Mumbai", "Kalyan, Maharashtra", "Taloja, Navi Mumbai", "Malad, Mumbai",
  "Vashi, Navi Mumbai", "Kurla West, Mumbai", "Panvel, Maharashtra", "Dadar, Mumbai",
  "Jawhar, Palghar", "Bandra West, Mumbai", "Ghatkopar, Mumbai", "Chembur, Mumbai",
  "Sion, Mumbai", "Worli, Mumbai", "Mira Road, Mumbai", "Ulhasnagar, Maharashtra"
];

const photographers = [
  "Avinya Media Team", "Sneha Kulkarni", "Rajesh Mehta", "Avinya Care Outreach",
  "Vikram Desai", "Ananya Roy", "Avinya Outreach Team", "Rohit Verma",
  "Dr. S. Patil", "Avinya Events", "Tech Health Media", "Karan Sharma",
  "Pooja Hegde", "Avinya Vision Wing", "Siddharth Rao", "Meera Nair"
];

const authors = [
  "Admin User", "Dr. S. Patil", "Avinya Outreach Lead", "Media Manager", 
  "Dr. K. Merchant", "Community Coordinator", "System Seeder"
];

const updaters = [
  "Admin User", "Media Manager", "System Seeder", "Avinya Content Editor"
];

let globalItems = [];
let idCounter = 1;

// Base timestamp: Current time (2026-09-24T02:25:00Z)
const nowMs = Date.now();

categories.forEach(cat => {
  cat.topics.forEach((topic, idx) => {
    const paddedId = String(idCounter).padStart(3, '0');
    const galId = `gal-${paddedId}`;
    const imgUrl = medicalImages[(idCounter - 1) % medicalImages.length];
    const loc = locations[(idCounter - 1) % locations.length];
    const photog = photographers[(idCounter - 1) % photographers.length];
    const createdBy = authors[(idCounter - 1) % authors.length];
    const updatedBy = updaters[(idCounter - 1) % updaters.length];
    
    // Spread created_at & updated_at timestamps so latest items are dynamically ordered
    // Every item is offset back by a variable number of hours/days so newest items show first per section
    const hoursAgo = (20 - idx) * 18 + (idCounter % 7) * 3; 
    const createdDate = new Date(nowMs - hoursAgo * 3600 * 1000);
    const updatedDate = new Date(createdDate.getTime() + (idCounter % 5) * 3600 * 1000);

    const dateStr = createdDate.toISOString().split('T')[0];
    const createdIso = createdDate.toISOString();
    const updatedIso = updatedDate.toISOString();

    // Image-only seeders: For items where idx % 3 === 2 (approx 33% of items), remove info/description
    const isImageOnly = (idx % 3 === 2);

    globalItems.push({
      id: galId,
      gallery_id: galId,
      title: isImageOnly ? `Photo Showcase #${paddedId}` : topic,
      slug: topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      short_description: isImageOnly ? "" : `Dedicated ${cat.name.toLowerCase()} initiative providing compassionate care, diagnostics, and patient support across the Mumbai-Virar belt.`,
      description: isImageOnly ? "" : `Avinya Care Foundation conducted this comprehensive ${topic.toLowerCase()} at ${loc}. Our healthcare practitioners and dedicated volunteers delivered free consultations, early diagnostic evaluations, and ongoing patient assistance to hundreds of community members.`,
      image: imgUrl,
      alt_text: `${topic} organized by Avinya Care Foundation at ${loc}`,
      category: cat.name,
      event_date: dateStr,
      location: loc,
      photographer: photog,
      created_by: createdBy,
      updated_by: updatedBy,
      created_at: createdIso,
      updated_at: updatedIso,
      external_link: "https://avinyacarefoundation.org",
      has_details: !isImageOnly,
      image_only: isImageOnly,
      is_featured: (!isImageOnly && (idx % 5 === 0)),
      is_published: true,
      sort_order: idCounter
    });

    idCounter++;
  });
});

// Sort global items latest updated_at / created_at first across each section
globalItems.sort((a, b) => {
  const dA = new Date(a.updated_at || a.created_at);
  const dB = new Date(b.updated_at || b.created_at);
  return dB - dA;
});

async function run() {
  const seedPath = join(root, 'data', 'seed_galleries.json');
  await writeFile(seedPath, JSON.stringify(globalItems, null, 2), 'utf-8');
  console.log(`Successfully generated ${globalItems.length} gallery items with latest-first ordering, metadata created_by/updated_by, and image-only items!`);

  const dbPath = join(root, 'cache', 'healthcare_db.json');
  try {
    const raw = await readFile(dbPath, 'utf-8');
    const db = JSON.parse(raw);
    db.galleries = globalItems;
    db.lastUpdated = new Date().toISOString();
    await writeFile(dbPath, JSON.stringify(db, null, 2), 'utf-8');
    console.log(`Successfully updated cache/healthcare_db.json with ${globalItems.length} items!`);
  } catch (e) {
    console.warn('cache/healthcare_db.json notice:', e.message);
  }
}

run();
