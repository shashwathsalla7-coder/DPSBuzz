const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Modern SVG icon for DPS Buzz: Dark premium pill with radiant Instagram-style gradient and bee emblem
const createSvg = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#833AB4" />
      <stop offset="50%" stop-color="#C13584" />
      <stop offset="100%" stop-color="#F77737" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFE066" />
      <stop offset="100%" stop-color="#F59E0B" />
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#C13584" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>
  </defs>

  <!-- Background base -->
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="#0a0a0c" />
  
  <!-- Subtle ambient glow -->
  <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.45}" fill="url(#glow)" />
  
  <!-- Gradient squircle border -->
  <rect x="${size * 0.06}" y="${size * 0.06}" width="${size * 0.88}" height="${size * 0.88}" rx="${size * 0.18}" 
        fill="none" stroke="url(#brandGrad)" stroke-width="${size * 0.035}" />

  <!-- Inner Dark Tile -->
  <rect x="${size * 0.09}" y="${size * 0.09}" width="${size * 0.82}" height="${size * 0.82}" rx="${size * 0.16}" 
        fill="#121216" />

  <!-- Centered Bee Graphic / DPS Text -->
  <g transform="translate(${size / 2}, ${size * 0.45})">
    <!-- Wings -->
    <ellipse cx="-${size * 0.14}" cy="-${size * 0.1}" rx="${size * 0.13}" ry="${size * 0.075}" fill="#60A5FA" opacity="0.65" transform="rotate(-30)" />
    <ellipse cx="${size * 0.14}" cy="-${size * 0.1}" rx="${size * 0.13}" ry="${size * 0.075}" fill="#60A5FA" opacity="0.65" transform="rotate(30)" />
    
    <!-- Bee Body -->
    <ellipse cx="0" cy="0" rx="${size * 0.15}" ry="${size * 0.17}" fill="url(#goldGrad)" />
    
    <!-- Bee Stripes -->
    <path d="M -${size * 0.13} -${size * 0.05} Q 0 -${size * 0.02} ${size * 0.13} -${size * 0.05}" stroke="#18181B" stroke-width="${size * 0.035}" fill="none" stroke-linecap="round" />
    <path d="M -${size * 0.14} ${size * 0.04} Q 0 ${size * 0.07} ${size * 0.14} ${size * 0.04}" stroke="#18181B" stroke-width="${size * 0.035}" fill="none" stroke-linecap="round" />
    
    <!-- Bee Head -->
    <ellipse cx="0" cy="-${size * 0.15}" rx="${size * 0.09}" ry="${size * 0.08}" fill="#27272A" />
    <circle cx="-${size * 0.04}" cy="-${size * 0.16}" r="${size * 0.016}" fill="#FFFFFF" />
    <circle cx="${size * 0.04}" cy="-${size * 0.16}" r="${size * 0.016}" fill="#FFFFFF" />
    
    <!-- Antennae -->
    <path d="M -${size * 0.04} -${size * 0.22} Q -${size * 0.08} -${size * 0.28} -${size * 0.1} -${size * 0.26}" stroke="#F43F5E" stroke-width="${size * 0.018}" fill="none" stroke-linecap="round" />
    <circle cx="-${size * 0.1}" cy="-${size * 0.26}" r="${size * 0.018}" fill="#F43F5E" />
    <path d="M ${size * 0.04} -${size * 0.22} Q ${size * 0.08} -${size * 0.28} ${size * 0.1} -${size * 0.26}" stroke="#F43F5E" stroke-width="${size * 0.018}" fill="none" stroke-linecap="round" />
    <circle cx="${size * 0.1}" cy="-${size * 0.26}" r="${size * 0.018}" fill="#F43F5E" />
    
    <!-- Stinger -->
    <polygon points="0,${size * 0.22} -${size * 0.035},${size * 0.16} ${size * 0.035},${size * 0.16}" fill="#18181B" />
  </g>

  <!-- DPS BUZZ Typography at bottom -->
  <text x="${size / 2}" y="${size * 0.81}" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="${size * 0.11}" text-anchor="middle" fill="#FFFFFF" letter-spacing="${size * 0.01}">DPS BUZZ</text>
</svg>
`;

async function generate() {
  const sizes = [
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
    { name: 'icon-maskable.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
  ];

  for (const item of sizes) {
    const svgBuffer = Buffer.from(createSvg(item.size));
    const outPath = path.join(iconsDir, item.name);
    await sharp(svgBuffer)
      .resize(item.size, item.size)
      .png({ quality: 100 })
      .toFile(outPath);
    console.log(`Generated: ${item.name} (${item.size}x${item.size})`);
  }
  console.log('All icons generated successfully!');
}

generate().catch(console.error);
