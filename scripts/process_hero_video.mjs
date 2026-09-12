import ffmpegPath from 'ffmpeg-static';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execFileAsync = promisify(execFile);

async function processHeroVideo() {
  const videoPath = path.resolve('assets/Create_a_premium_–_second_c (1).mp4');
  const outputDir = path.resolve('hero-sequence');

  if (!fs.existsSync(videoPath)) {
    console.error(`Error: Video not found at ${videoPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`Processing video: ${videoPath}`);
  console.log(`Output directory: ${outputDir}`);

  // Create temporary extraction folder to avoid partial states
  const tempDir = path.resolve('hero-sequence-temp');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  const tempPattern = path.join(tempDir, 'ezgif-frame-%03d.jpg');

  console.log('Extracting high-quality frames with FFmpeg...');
  // -q:v 2 provides high-quality JPEG output
  await execFileAsync(ffmpegPath, [
    '-i', videoPath,
    '-q:v', '2',
    tempPattern
  ]);

  const extractedFiles = fs.readdirSync(tempDir).filter(f => f.endsWith('.jpg')).sort();
  console.log(`Extracted ${extractedFiles.length} frames into temp directory.`);

  if (extractedFiles.length === 0) {
    console.error('Error: No frames were extracted.');
    process.exit(1);
  }

  // Clear existing files in hero-sequence
  const oldFiles = fs.readdirSync(outputDir).filter(f => f.startsWith('ezgif-frame-') && f.endsWith('.jpg'));
  for (const file of oldFiles) {
    fs.unlinkSync(path.join(outputDir, file));
  }

  // Move new frames to hero-sequence
  for (const file of extractedFiles) {
    fs.copyFileSync(path.join(tempDir, file), path.join(outputDir, file));
  }

  // Clean up temp directory
  fs.rmSync(tempDir, { recursive: true, force: true });

  console.log(`Successfully updated ${outputDir} with ${extractedFiles.length} frames.`);
  console.log(`Frame range: ${extractedFiles[0]} to ${extractedFiles[extractedFiles.length - 1]}`);
}

processHeroVideo().catch(err => {
  console.error('Extraction failed:', err);
  process.exit(1);
});
