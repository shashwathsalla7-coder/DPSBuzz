import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  for (const item of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, item);
    if (['node_modules', '.next', '.git', 'out', 'dist'].includes(item)) continue;
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath, callback);
    } else if (/\.(tsx|ts|jsx|js|css)$/.test(item)) {
      callback(fullPath);
    }
  }
}

const hexColors = new Set();
const fontSizes = new Set();
const borderRadii = new Set();
const shadows = new Set();
const spacingValues = new Set();

walkDir('./src', (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');

  // Hex colors
  const hexMatches = content.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
  hexMatches.forEach((c) => hexColors.add(c.toLowerCase()));

  // Font sizes
  const fontMatches = content.match(/text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|\[\d+px\])/g) || [];
  fontMatches.forEach((f) => fontSizes.add(f));

  // Border radii
  const roundedMatches = content.match(/rounded-(none|sm|md|lg|xl|2xl|3xl|full|\[\d+px\])/g) || [];
  roundedMatches.forEach((r) => borderRadii.add(r));

  // Shadows
  const shadowMatches = content.match(/shadow-(none|sm|md|lg|xl|2xl|inner|\[[^\]]+\])/g) || [];
  shadowMatches.forEach((s) => shadows.add(s));

  // Spacing
  const spacingMatches = content.match(/(p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap)-(\d+|\[\d+px\])/g) || [];
  spacingMatches.forEach((sp) => spacingValues.add(sp));
});

console.log(JSON.stringify({
  uniqueHexColors: hexColors.size,
  uniqueFontSizes: fontSizes.size,
  uniqueBorderRadii: borderRadii.size,
  uniqueShadows: shadows.size,
  uniqueSpacingClasses: spacingValues.size
}, null, 2));
