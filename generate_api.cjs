const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'cache', 'healthcare_db.json');
const apiDir = path.join(__dirname, 'api', 'healthcare');

if (!fs.existsSync(apiDir)) {
  fs.mkdirSync(apiDir, { recursive: true });
}

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const doctors = {
  status: "ok",
  doctors: db.doctors
};

const specialities = {
  status: "ok",
  specialities: db.specialities
};

const tests = {
  status: "ok",
  tests: db.diagnosticTests
};

fs.writeFileSync(path.join(apiDir, 'doctors.json'), JSON.stringify(doctors, null, 2));
fs.writeFileSync(path.join(apiDir, 'specialities.json'), JSON.stringify(specialities, null, 2));
fs.writeFileSync(path.join(apiDir, 'tests.json'), JSON.stringify(tests, null, 2));

console.log('Successfully generated JSON files in api/healthcare');
