const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const srcPath = 'C:/Users/shash/.gemini/antigravity/brain/6613c7aa-838b-45cc-9390-21cd395b212e/dps_buzz_logo_transparent.png';
const androidRes = 'C:/Users/shash/AppData/Local/Temp/dpsbuzz_apk_test/app/src/main/res';

const densities = [
  { name: 'mdpi', size: 48, fgSize: 108 },
  { name: 'hdpi', size: 72, fgSize: 162 },
  { name: 'xhdpi', size: 96, fgSize: 216 },
  { name: 'xxhdpi', size: 144, fgSize: 324 },
  { name: 'xxxhdpi', size: 192, fgSize: 432 },
];

async function generate() {
  const logoBuf = await fs.promises.readFile(srcPath);

  for (const d of densities) {
    const dir = path.join(androidRes, 'mipmap-' + d.name);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // 1. Foreground for adaptive icon (size: fgSize, logo occupies ~75% safe zone)
    const logoFgDim = Math.round(d.fgSize * 0.72);
    const resizedLogoFg = await sharp(logoBuf)
      .resize(logoFgDim, logoFgDim, { fit: 'inside' })
      .toBuffer();

    await sharp({
      create: {
        width: d.fgSize,
        height: d.fgSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
    .composite([{ input: resizedLogoFg, gravity: 'center' }])
    .png()
    .toFile(path.join(dir, 'ic_launcher_foreground.png'));

    // 2. Legacy square launcher icon with rounded white background
    const logoLegacyDim = Math.round(d.size * 0.82);
    const resizedLogoLegacy = await sharp(logoBuf)
      .resize(logoLegacyDim, logoLegacyDim, { fit: 'inside' })
      .toBuffer();

    const radius = Math.round(d.size * 0.18);
    const rectSvg = Buffer.from(
      '<svg width="' + d.size + '" height="' + d.size + '"><rect x="0" y="0" width="' + d.size + '" height="' + d.size + '" rx="' + radius + '" fill="#FFFFFF"/></svg>'
    );
    
    await sharp(rectSvg)
      .composite([{ input: resizedLogoLegacy, gravity: 'center' }])
      .png()
      .toFile(path.join(dir, 'ic_launcher.png'));

    // 3. Round launcher icon
    const circleSvg = Buffer.from(
      '<svg width="' + d.size + '" height="' + d.size + '"><circle cx="' + (d.size / 2) + '" cy="' + (d.size / 2) + '" r="' + (d.size / 2) + '" fill="#FFFFFF"/></svg>'
    );
    await sharp(circleSvg)
      .composite([{ input: resizedLogoLegacy, gravity: 'center' }])
      .png()
      .toFile(path.join(dir, 'ic_launcher_round.png'));

    console.log('Generated mipmap-' + d.name);
  }
}

generate().then(() => console.log('All icons generated successfully!')).catch(console.error);
