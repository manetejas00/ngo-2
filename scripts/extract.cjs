const fs = require('fs');
const code = fs.readFileSync('services/healthcare/healthcareDb.mjs', 'utf8');

const vars = [
  'DEFAULT_SPECIALITIES', 'DEFAULT_HOSPITALS', 'DEFAULT_DOCTORS',
  'DEFAULT_DIAGNOSTIC_PROVIDERS', 'DEFAULT_DIAGNOSTIC_CENTRES',
  'DEFAULT_DIAGNOSTIC_TESTS', 'SEED_APPOINTMENTS', 'SEED_TEST_BOOKINGS'
];

if (!fs.existsSync('data')) fs.mkdirSync('data');

for (const v of vars) {
  const start = code.indexOf('const ' + v + ' = ');
  if (start === -1) {
    console.log('Not found ' + v);
    continue;
  }
  
  let end = -1;
  let brackets = 0;
  let inString = false;
  let escape = false;
  
  for (let i = start + ('const ' + v + ' = ').length; i < code.length; i++) {
    if (escape) {
      escape = false;
      continue;
    }
    if (code[i] === '\\\\') {
      escape = true;
      continue;
    }
    if (code[i] === "'" || code[i] === '"' || code[i] === "`") {
      if (inString === code[i]) inString = false;
      else if (!inString) inString = code[i];
      continue;
    }
    if (!inString) {
      if (code[i] === '[') brackets++;
      if (code[i] === ']') {
        brackets--;
        if (brackets === 0) {
          end = i + 1;
          break;
        }
      }
    }
  }
  
  if (end !== -1) {
    let arrCode = code.substring(start + ('const ' + v + ' = ').length, end);
    try {
      const arr = eval(arrCode);
      fs.writeFileSync('data/seed_' + v.replace('DEFAULT_', '').replace('SEED_', '').toLowerCase() + '.json', JSON.stringify(arr, null, 2));
      console.log('Extracted ' + v);
    } catch(e) { console.log('Error eval ' + v, e.message); }
  }
}
