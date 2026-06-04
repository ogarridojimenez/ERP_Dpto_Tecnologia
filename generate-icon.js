const sharp = require('sharp');
const path = require('path');

const SIZES = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

const resDir = path.join(__dirname, 'apps/mobile/android/app/src/main/res');

async function createIcon(size) {
  const padding = Math.round(size * 0.15);
  const fontSize = Math.round(size * 0.32);
  const boxSize = Math.round(size * 0.38);
  const boxY = Math.round(size * 0.18);
  const textY = Math.round(size * 0.78);

  // Create SVG icon
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1e3a5f"/>
          <stop offset="100%" style="stop-color:#0f172a"/>
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="url(#bg)"/>
      <!-- Box icon -->
      <g transform="translate(${size/2 - boxSize/2}, ${boxY})">
        <rect x="2" y="${Math.round(boxSize * 0.35)}" width="${boxSize - 4}" height="${Math.round(boxSize * 0.6)}" rx="3" fill="none" stroke="#60a5fa" stroke-width="${Math.round(size * 0.025)}"/>
        <line x1="${boxSize/2}" y1="${Math.round(boxSize * 0.35)}" x2="${boxSize/2}" y2="${boxSize}" stroke="#60a5fa" stroke-width="${Math.round(size * 0.02)}"/>
        <path d="M${boxSize * 0.2} ${Math.round(boxSize * 0.35)} L${boxSize/2} ${Math.round(boxSize * 0.08)} L${boxSize * 0.8} ${Math.round(boxSize * 0.35)}" fill="none" stroke="#60a5fa" stroke-width="${Math.round(size * 0.025)}" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
      <!-- AFT text -->
      <text x="${size/2}" y="${textY}" text-anchor="middle" fill="#ffffff" font-family="Arial,Helvetica,sans-serif" font-size="${fontSize}" font-weight="900" letter-spacing="${Math.round(size * 0.02)}">AFT</text>
    </svg>
  `;

  return Buffer.from(svg);
}

async function generate() {
  for (const [folder, size] of Object.entries(SIZES)) {
    const dir = path.join(resDir, folder);
    const svgBuffer = await createIcon(size);

    // Regular icon
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(dir, 'ic_launcher.png'));

    // Round icon
    const roundSvg = svgBuffer.toString().replace(
      `rx="${Math.round(size * 0.22)}"`,
      `rx="${size / 2}"`
    );
    await sharp(Buffer.from(roundSvg))
      .resize(size, size)
      .png()
      .toFile(path.join(dir, 'ic_launcher_round.png'));

    console.log(`${folder}: ${size}x${size} OK`);
  }
  console.log('All icons generated.');
}

generate().catch(e => { console.error(e); process.exit(1); });
