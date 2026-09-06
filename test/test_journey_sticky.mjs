import { readFileSync } from 'fs';
import { resolve } from 'path';

console.log('Testing Continuum of Care (#journey) Sticky Pinning & Timeline Logic...');

const indexPath = resolve('index.html');
const cssPath = resolve('css/styles.css');
const jsPath = resolve('js/timeline.js');

const indexHtml = readFileSync(indexPath, 'utf8');
const cssStyles = readFileSync(cssPath, 'utf8');
const jsTimeline = readFileSync(jsPath, 'utf8');

let errors = [];

// 1. Verify HTML Structure
if (!indexHtml.includes('id="journey"') || !indexHtml.includes('class="section-journey"')) {
  errors.push('Missing <section id="journey" class="section-journey"> in index.html');
}

if (!indexHtml.includes('<div class="journey-sticky-viewport">')) {
  errors.push('Missing <div class="journey-sticky-viewport"> inside section#journey in index.html');
}

if (!indexHtml.includes('id="nestjs-card-deck-track"')) {
  errors.push('Missing #nestjs-card-deck-track in index.html');
}

const cardMatches = indexHtml.match(/class="nestjs-deck-card[\s"]/g);
if (!cardMatches || cardMatches.length !== 5) {
  errors.push(`Expected 5 nestjs-deck-card elements, found ${cardMatches ? cardMatches.length : 0}`);
}

const dotMatches = indexHtml.match(/class="deck-dot[\s"]/g);
if (!dotMatches || dotMatches.length !== 5) {
  errors.push(`Expected 5 deck-dot elements, found ${dotMatches ? dotMatches.length : 0}`);
}

// 2. Verify CSS Sticky Rules
if (!cssStyles.includes('.section-journey') || !cssStyles.includes('350vh')) {
  errors.push('CSS missing .section-journey with height 350vh');
}

if (!cssStyles.includes('.journey-sticky-viewport') || !cssStyles.includes('position: sticky') || !cssStyles.includes('height: 100vh')) {
  errors.push('CSS missing .journey-sticky-viewport with position: sticky and height: 100vh');
}

// 3. Verify JS Timeline Sticky Controller Logic
if (!jsTimeline.includes('scrollDistance = rect.height - window.innerHeight') && !jsTimeline.includes('rect.height - window.innerHeight')) {
  errors.push('JS timeline missing sticky scroll distance calculation');
}

if (!jsTimeline.includes('goToStage(targetIndex')) {
  errors.push('JS timeline missing goToStage invocation on scroll progression');
}

if (errors.length > 0) {
  console.error('❌ Validation Errors:');
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
} else {
  console.log('✅ ALL Journey Sticky Stage & Timeline Checks Passed Perfectly!');
  process.exit(0);
}
