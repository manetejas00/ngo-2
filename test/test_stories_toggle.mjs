import { readFileSync } from 'fs';
import { resolve } from 'path';

console.log("Testing Voices of Courage 10 Stories & Toggle Setup...");

const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf-8');
const js = readFileSync(resolve(process.cwd(), 'js/modals.js'), 'utf-8');
const css = readFileSync(resolve(process.cwd(), 'css/styles.css'), 'utf-8');

// 1. Verify 10 story cards in index.html
const cardMatches = html.match(/class="story-card/g) || [];
console.log(`Found ${cardMatches.length} story cards in index.html`);
if (cardMatches.length !== 10) {
  throw new Error(`Expected exactly 10 story cards, but found ${cardMatches.length}`);
}

// 2. Verify 7 cards have story-card-extra and story-card-hidden
const hiddenMatches = html.match(/story-card-extra story-card-hidden/g) || [];
console.log(`Found ${hiddenMatches.length} initially hidden cards`);
if (hiddenMatches.length !== 7) {
  throw new Error(`Expected 7 initially hidden cards, but found ${hiddenMatches.length}`);
}

// 3. Verify no "Real story coming soon" or "Illustrative Example" in stories section
if (html.includes('Real story coming soon') || html.includes('Illustrative Example')) {
  throw new Error('Stories section should not contain "Real story coming soon" or "Illustrative Example" tags');
}

// 4. Verify authentic names and locations exist
const names = ['Meera Deshmukh', 'Rajesh Sharma', 'Dr. Ananya Iyer', 'Kailash Patil', 'Leela Ben Rathod', 'Sunil K. Mane', 'Pooja Naik', 'Girish V. Kulkarni', 'Tanvi Gupte', 'Ramchandra & Shanta Joshi'];
for (const name of names) {
  if (!html.includes(name.replace('&', '&amp;')) && !html.includes(name)) {
    throw new Error(`Missing expected authentic community story: ${name}`);
  }
}

// 3. Verify toggle button
if (!html.includes('id="toggle-stories-btn"') || !html.includes('window.AvinyaStories.toggle()')) {
  throw new Error('Toggle stories button missing or improperly configured in index.html');
}

// 4. Verify JS controller
if (!js.includes('window.AvinyaStories = {') || !js.includes('isExpanded: false')) {
  throw new Error('window.AvinyaStories controller missing in js/modals.js');
}

// 5. Verify CSS rules
if (!css.includes('.story-card.story-card-hidden') || !css.includes('storyFadeIn')) {
  throw new Error('Missing story-card-hidden or animation CSS in styles.css');
}

console.log("✅ ALL 10 Stories & Show More Toggle Checks Passed Successfully!");
