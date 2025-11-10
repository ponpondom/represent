/*
  generate-centerline.js
  - Loads a font from assets/fonts (Magnolia Script.otf)
  - Renders the requested text to a high-resolution PNG using node-canvas
  - Runs potrace to vectorize and outputs a simplified centerline SVG

  Usage:
    npm install canvas opentype.js potrace pngjs
    node scripts/generate-centerline.js --font "./assets/fonts/Magnolia Script.otf" --text "Represent" --out "./assets/svgs/represent-centerline.svg"

  Notes:
  - node-canvas on Windows may require native build tools and cairo. If installation fails, follow: https://github.com/Automattic/node-canvas#installation
  - potrace npm package bundles native binaries on many platforms; if it fails you may need to install potrace separately.
*/

const fs = require('fs');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));

async function main() {
  const fontPath = argv.font || './assets/fonts/Magnolia Script.otf';
  const text = argv.text || 'Represent';
  const outPath = argv.out || './assets/svgs/represent-centerline.svg';

  if (!fs.existsSync(fontPath)) {
    console.error('Font not found at', fontPath);
    process.exit(1);
  }

  // Try to require native deps; print helpful messages if missing
  let Canvas, loadImage;
  try {
    ({ createCanvas: Canvas, loadImage } = require('canvas'));
  } catch (e) {
    console.error('\nMissing dependency: node-canvas.');
    console.error('Install with: npm install canvas');
    console.error('On Windows you may need: windows-build-tools and cairo dev libs. See: https://github.com/Automattic/node-canvas#installation\n');
    process.exit(1);
  }

  let opentype;
  try {
    opentype = require('opentype.js');
  } catch (e) {
    console.error('\nMissing dependency: opentype.js');
    console.error('Install with: npm install opentype.js\n');
    process.exit(1);
  }

  let potrace;
  try {
    potrace = require('potrace');
  } catch (e) {
    console.error('\nMissing dependency: potrace (npm package).');
    console.error('Install with: npm install potrace\n');
    process.exit(1);
  }

  // Load font, render text to high-res canvas
  const font = opentype.loadSync(fontPath);
  const fontSize = 200; // high-res
  const padding = 40;

  // get path metrics
  const pathObj = font.getPath(text, 0, 0, fontSize);
  const metrics = pathObj.getBoundingBox();
  const width = Math.ceil(metrics.x2 - metrics.x1 + padding * 2);
  const height = Math.ceil(metrics.y2 - metrics.y1 + padding * 2);

  const canvas = Canvas(width, height);
  const ctx = canvas.getContext('2d');

  // background black
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);

  // translate so glyph fits with padding
  ctx.translate(-metrics.x1 + padding, -metrics.y1 + padding);

  // draw thick white stroke of the glyph so potrace can trace center lines better
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  pathObj.draw(ctx);
  ctx.fill();

  // write temporary PNG
  const tmpPng = path.join(__dirname, 'tmp_represent.png');
  const outStream = fs.createWriteStream(tmpPng);
  const pngStream = canvas.createPNGStream();
  pngStream.pipe(outStream);

  await new Promise((resolve, reject) => outStream.on('finish', resolve).on('error', reject));

  console.log('Raster written to', tmpPng);

  // Run potrace to vectorize
  await new Promise((resolve, reject) => {
    potrace.trace(tmpPng, { color: 'black', optCurve: true }, (err, svg) => {
      if (err) return reject(err);

      // Potrace returns a full SVG. We'll try to extract the main path(s) and save.
      // Optionally we could simplify/clean the paths here.
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, svg, 'utf8');
      console.log('Vector SVG written to', outPath);
      resolve();
    });
  });

  // cleanup tmp
  try { fs.unlinkSync(tmpPng); } catch (e) {}
}

main().catch(err => {
  console.error('Error generating centerline:', err);
  process.exit(1);
});
