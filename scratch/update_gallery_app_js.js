import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, '..');

async function run() {
  const seedJsonStr = await readFile(join(root, 'data', 'seed_galleries.json'), 'utf-8');
  const seedItems = JSON.parse(seedJsonStr);

  const jsPath = join(root, 'js', 'gallery-app.js');
  let jsContent = await readFile(jsPath, 'utf-8');

  // Replace getFallbackDemoData implementation
  const fallbackStr = `function getFallbackDemoData() {\n    return ${JSON.stringify(seedItems, null, 2)};\n  }`;

  jsContent = jsContent.replace(/function getFallbackDemoData\(\)\s*\{[\s\S]*?\n  \}/, fallbackStr);

  // Replace check for 30 -> 100
  jsContent = jsContent.replace(/galleryItems\.length < 30/g, 'galleryItems.length < 100');

  // Update initial displayed masonry count to 12 and increment by 12
  jsContent = jsContent.replace(/displayedMasonryCount = 6;/g, 'displayedMasonryCount = 12;');
  jsContent = jsContent.replace(/displayedMasonryCount \+= 6;/g, 'displayedMasonryCount += 12;');

  await writeFile(jsPath, jsContent, 'utf-8');
  console.log(`Successfully updated js/gallery-app.js with ${seedItems.length} fallback seed items and 100 count checks!`);
}

run();
