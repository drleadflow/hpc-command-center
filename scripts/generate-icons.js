#!/usr/bin/env node
/**
 * Generates PWA icons (192x192 and 512x512 PNG) from the SVG source.
 * Requires: npm install --save-dev sharp
 *
 * Run: node scripts/generate-icons.js
 */

const path = require('path');
const fs = require('fs');

const publicDir = path.join(__dirname, '..', 'public');
const svgPath = path.join(publicDir, 'icon.svg');

async function run() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.log('sharp not installed. Run: npm install --save-dev sharp');
    console.log('Then re-run: node scripts/generate-icons.js');
    console.log('');
    console.log('Alternatively, convert public/icon.svg to PNG manually using:');
    console.log('  - https://cloudconvert.com/svg-to-png');
    console.log('  - Figma / Sketch / Inkscape');
    console.log('  - ImageMagick: convert -size 192x192 icon.svg icon-192.png');
    process.exit(0);
  }

  const svgBuffer = fs.readFileSync(svgPath);

  for (const size of [192, 512]) {
    const outPath = path.join(publicDir, `icon-${size}.png`);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`Created ${outPath}`);
  }

  console.log('Icons generated successfully.');
}

run().catch((err) => {
  console.error('Error generating icons:', err.message);
  process.exit(1);
});
