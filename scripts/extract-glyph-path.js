/*
  extract-glyph-path.js
  - Loads a font with opentype.js and outputs a combined SVG path for the given text.

  Usage:
    npm install opentype.js minimist
    node scripts/extract-glyph-path.js --font "./assets/fonts/Magnolia Script.otf" --text "Represent" --out "./assets/svgs/represent-glyph-path.txt" --width 320 --height 100

  This script does NOT rasterize or skeletonize; it returns the vector path describing the glyph outlines scaled to the requested box.
*/

const fs = require('fs');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));

function getArgs() {
  return {
    font: argv.font || './assets/fonts/Magnolia Script.otf',
    text: argv.text || 'Represent',
    out: argv.out || './assets/svgs/represent-glyph-path.txt',
    width: Number(argv.width || 320),
    height: Number(argv.height || 100),
    fontSize: Number(argv.fontSize || 72),
  };
}

async function main() {
  const { font, text, out, width, height, fontSize } = getArgs();
  if (!fs.existsSync(font)) {
    console.error('Font not found at', font);
    process.exit(1);
  }

  const opentype = require('opentype.js');
  const fontObj = await opentype.load(font);

  // Measure text width at given fontSize
  const scale = fontSize / fontObj.unitsPerEm;
  const glyphs = fontObj.stringToGlyphs(text);
  let x = 0;
  const glyphPathObj = new opentype.Path();

  glyphs.forEach((g, i) => {
    const glyphPath = g.getPath(x, 0, fontSize);
    // append commands
  glyphPath.commands.forEach(cmd => glyphPathObj.commands.push(cmd));
    x += g.advanceWidth * scale;
  });

  const box = glyphPathObj.getBoundingBox();
  const textWidth = box.x2 - box.x1;
  const textHeight = box.y2 - box.y1;

  // compute scale to fit into width x height with padding
  const padding = 8;
  const scaleToFit = Math.min((width - padding * 2) / textWidth, (height - padding * 2) / textHeight);

  // translate to center
  const translateX = (width - textWidth * scaleToFit) / 2 - box.x1 * scaleToFit;
  const translateY = (height - textHeight * scaleToFit) / 2 - box.y1 * scaleToFit;

  // build SVG path string by applying scale & translate to commands
  function cmdToStr(cmd) {
    if (cmd.type === 'M') return `M ${cmd.x * scaleToFit + translateX} ${cmd.y * scaleToFit + translateY}`;
    if (cmd.type === 'L') return `L ${cmd.x * scaleToFit + translateX} ${cmd.y * scaleToFit + translateY}`;
    if (cmd.type === 'C') return `C ${cmd.x1 * scaleToFit + translateX} ${cmd.y1 * scaleToFit + translateY} ${cmd.x2 * scaleToFit + translateX} ${cmd.y2 * scaleToFit + translateY} ${cmd.x * scaleToFit + translateX} ${cmd.y * scaleToFit + translateY}`;
    if (cmd.type === 'Q') return `Q ${cmd.x1 * scaleToFit + translateX} ${cmd.y1 * scaleToFit + translateY} ${cmd.x * scaleToFit + translateX} ${cmd.y * scaleToFit + translateY}`;
    if (cmd.type === 'Z') return 'Z';
    return '';
  }

  const d = glyphPathObj.commands.map(cmdToStr).join(' ');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, d, 'utf8');
  console.log('Wrote glyph path to', out);
}

main().catch(err => { console.error(err); process.exit(1); });
