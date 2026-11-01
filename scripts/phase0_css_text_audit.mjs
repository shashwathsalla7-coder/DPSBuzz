import fs from 'fs';
import path from 'path';

const SRC_DIR = 'src';

function getAllFiles(dir, exts = ['.tsx', '.ts', '.css']) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getAllFiles(fullPath, exts));
    } else if (exts.some(ext => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

const allFiles = getAllFiles(SRC_DIR);
console.log(`Auditing ${allFiles.length} files in ${SRC_DIR}...`);

// 1. Color extraction
const hexColors = new Set();
const tailwindColors = new Set();
const fontSizes = new Set();
const borderRadii = new Set();
const shadows = new Set();
const spacingValues = new Set();
const iconSizes = new Set();

// 2. Text inspection
const inconsistentTexts = [];
const duplicateControlLocations = [];

const TARGET_PHRASES = [
  'Od Streak',
  'Strike Pts',
  'Star Points',
  'Habit Points',
  '0 storage cost',
  '100% legal',
  'Class Staff-Admin Only',
  'Staff-Admin',
  'Describe the photo',
  'New Group',
  '+ Post',
  'Star of the Week',
  'Live',
];

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');

  // Hex colors #xxx or #xxxxxx
  const hexMatches = content.match(/#(?:[0-9a-fA-F]{3,8})\b/g) || [];
  hexMatches.forEach(c => hexColors.add(c.toLowerCase()));

  // Tailwind color classes like bg-*, text-*, border-*
  const twColorMatches = content.match(/\b(?:bg|text|border|ring|from|to|via)-(?:red|blue|emerald|green|yellow|amber|purple|pink|indigo|rose|cyan|teal|slate|gray|zinc|neutral|stone)-(?:[0-9]{2,3})\b/g) || [];
  twColorMatches.forEach(c => tailwindColors.add(c));

  // Font sizes: text-xs, text-sm, text-base, text-lg, text-xl, text-2xl, text-[...px]
  const fsMatches = content.match(/\btext-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|\[[0-9]+px\])\b/g) || [];
  fsMatches.forEach(f => fontSizes.add(f));

  // Border radii: rounded-*, rounded-[...px]
  const brMatches = content.match(/\brounded-(?:none|sm|md|lg|xl|2xl|3xl|full|\[[0-9]+px\])\b/g) || [];
  brMatches.forEach(r => borderRadii.add(r));

  // Shadows: shadow-*, shadow-[...]
  const shMatches = content.match(/\bshadow-(?:sm|md|lg|xl|2xl|inner|none|\[[^\]]+\])\b/g) || [];
  shMatches.forEach(s => shadows.add(s));

  // Spacing: p-*, m-*, gap-*
  const spMatches = content.match(/\b(?:p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap)-(?:[0-9.]+|\[[0-9]+px\])\b/g) || [];
  spMatches.forEach(sp => spacingValues.add(sp));

  // Lucide icon sizes size={...}
  const icMatches = content.match(/\bsize=\{([0-9]+)\}/g) || [];
  icMatches.forEach(ic => iconSizes.add(ic));

  // Target phrases check
  for (const phrase of TARGET_PHRASES) {
    if (content.includes(phrase)) {
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes(phrase)) {
          inconsistentTexts.push({
            file: path.relative(process.cwd(), file),
            line: idx + 1,
            phrase,
            snippet: line.trim().slice(0, 100),
          });
        }
      });
    }
  }

  // Check search placeholders missing class 9
  if (content.includes('Class') || content.includes('class')) {
    const classRangeMatches = content.match(/classes?\s*6[,\s]*7[,\s]*8[,\s]*(?:and\s*)?10/gi);
    if (classRangeMatches) {
      inconsistentTexts.push({
        file: path.relative(process.cwd(), file),
        phrase: 'Missing Class 9 in range',
        snippet: classRangeMatches[0],
      });
    }
  }
}

console.log('=== CSS & TOKEN VARIATION AUDIT RESULTS ===');
console.log(`Distinct Hex Colors: ${hexColors.size}`);
console.log(`Distinct Tailwind Named Colors: ${tailwindColors.size}`);
console.log(`Distinct Font Sizes: ${fontSizes.size}`);
console.log(`Distinct Border Radii: ${borderRadii.size}`);
console.log(`Distinct Shadows: ${shadows.size}`);
console.log(`Distinct Spacing Classes: ${spacingValues.size}`);
console.log(`Distinct Icon Sizes: ${iconSizes.size}`);

console.log('\n--- Sample Hex Colors (Top 25) ---');
console.log(Array.from(hexColors).slice(0, 25).join(', '));

console.log('\n--- Sample Tailwind Color Classes (Top 25) ---');
console.log(Array.from(tailwindColors).slice(0, 25).join(', '));

console.log('\n--- Font Sizes Found ---');
console.log(Array.from(fontSizes).sort().join(', '));

console.log('\n--- Border Radii Found ---');
console.log(Array.from(borderRadii).sort().join(', '));

console.log('\n--- Shadows Found ---');
console.log(Array.from(shadows).sort().join(', '));

console.log('\n--- Icon Sizes Found ---');
console.log(Array.from(iconSizes).sort().join(', '));

console.log(`\n=== INCONSISTENT / DEVELOPER TEXTS FOUND: ${inconsistentTexts.length} occurrences ===`);
inconsistentTexts.forEach(item => {
  console.log(`[${item.file}:${item.line || '?'}] (${item.phrase}) -> "${item.snippet}"`);
});

fs.writeFileSync('scripts/audit_mess_report.json', JSON.stringify({
  stats: {
    hexColorsCount: hexColors.size,
    tailwindColorsCount: tailwindColors.size,
    fontSizesCount: fontSizes.size,
    borderRadiiCount: borderRadii.size,
    shadowsCount: shadows.size,
    spacingCount: spacingValues.size,
    iconSizesCount: iconSizes.size,
  },
  hexColors: Array.from(hexColors),
  tailwindColors: Array.from(tailwindColors),
  fontSizes: Array.from(fontSizes),
  borderRadii: Array.from(borderRadii),
  shadows: Array.from(shadows),
  iconSizes: Array.from(iconSizes),
  inconsistentTexts,
}, null, 2));

console.log('\nAudit written to scripts/audit_mess_report.json');
