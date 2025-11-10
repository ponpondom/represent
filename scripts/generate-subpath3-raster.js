#!/usr/bin/env node
/*
  Script: generate-subpath3-raster.js
  Purpose: extract subpath index 3 from components/representGlyphPath.ts and render it
  to a PNG at assets/images/represent-subpath3.png using sharp.

  Usage:
    npm install --save-dev sharp
    node ./scripts/generate-subpath3-raster.js

  Notes:
  - This script runs outside the app. After it produces the PNG at
    assets/images/represent-subpath3.png you can re-run Metro and the overlay
    will be able to require that image (we can add the require after you
    confirm the asset exists).
*/

const fs = require('fs');
const path = require('path');

async function main() {
  const root = path.resolve(__dirname, '..');
  const glyphFile = path.join(root, 'components', 'representGlyphPath.ts');
  if (!fs.existsSync(glyphFile)) {
    console.error('representGlyphPath.ts not found at', glyphFile);
    process.exit(1);
  }

  const src = fs.readFileSync(glyphFile, 'utf8');
  const m = src.match(/export const GLYPH_PATH\s*=\s*`?['"]([\s\S]*?)['"]`?;/);
  // Fallback: try to capture without backticks
  const pathMatch = m ? m[1] : (() => {
    const m2 = src.match(/export const GLYPH_PATH\s*=\s*['"]([\s\S]*?)['"];/);
    return m2 ? m2[1] : null;
  })();

  if (!pathMatch) {
    console.error('Failed to extract GLYPH_PATH from', glyphFile);
    process.exit(1);
  }

  const parts = pathMatch.split(/(?=\sM)/).map(s => s.trim()).filter(Boolean);
  const idx = 3;
  if (idx >= parts.length) {
    console.error('Subpath index', idx, 'out of range (parts length=', parts.length, ')');
    process.exit(1);
  }

  const sub = parts[idx];
  const assetsDir = path.join(root, 'assets', 'images');
  if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"360\" height=\"140\" viewBox=\"0 0 360 140\">\n  <path d=\"${sub.replace(/\"/g, '&quot;')}\" fill=\"none\" stroke=\"#E31C23\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n</svg>`;

  const svgPath = path.join(assetsDir, 'represent-subpath3.svg');
  const pngPath = path.join(assetsDir, 'represent-subpath3.png');
  fs.writeFileSync(svgPath, svgContent, 'utf8');
  console.log('Wrote', svgPath);

  // Try to render to PNG using sharp if available.
  let sharp;
  try {
    sharp = require('sharp');
  } catch (e) {
    console.warn('sharp not installed. Install with `npm install --save-dev sharp` and re-run this script to create a PNG.');
    console.log('SVG saved at', svgPath, '— you can convert it to PNG manually and place it at', pngPath);
    process.exit(0);
  }

  try {
    const buffer = Buffer.from(svgContent, 'utf8');
    await sharp(buffer).png({ quality: 90 }).toFile(pngPath);
    console.log('Rendered PNG to', pngPath);
  } catch (err) {
    console.error('sharp failed to render PNG:', err);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
