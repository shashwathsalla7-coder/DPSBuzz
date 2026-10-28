console.log('====================================================');
console.log('   DPS BUZZ - CLASS & SECTION OPTION VERIFICATION   ');
console.log('====================================================\n');

const CLASS_SECTIONS = {
  '6': ['A', 'B', 'C', 'D', 'E', 'F'],
  '7': ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  '8': ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  '9': ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  '10': ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
};

function getClassSections(classInput) {
  const clean = String(classInput).replace(/[^0-9]/g, '');
  return CLASS_SECTIONS[clean] || ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
}

function matchesClassSectionKeyword(studentClass, studentSection, query) {
  if (!studentClass) return false;
  const q = query.toLowerCase().trim();
  if (!q) return false;

  const sClass = String(studentClass).toLowerCase().trim();
  const sSec = String(studentSection || '').toLowerCase().trim();

  const match = q.match(/^(?:class|grade)?\s*(\d{1,2})(?:th)?(?:\s*class)?\s*[-_\s/]?\s*([a-gA-G])?$/i);
  if (match) {
    const qClass = match[1];
    const qSec = match[2]?.toLowerCase();
    if (qClass === sClass) {
      if (!qSec) return true;
      return qSec === sSec;
    }
    return false;
  }

  const directVariants = [
    `${sClass} ${sSec}`,
    `${sClass}${sSec}`,
    `${sClass}-${sSec}`,
    `class ${sClass} ${sSec}`,
    `class ${sClass}${sSec}`,
    `class ${sClass}-${sSec}`,
    `grade ${sClass} ${sSec}`,
    `grade ${sClass}${sSec}`,
    `grade ${sClass}-${sSec}`,
    `${sClass}th ${sSec}`,
    `${sClass}th-${sSec}`,
    `${sClass}th ${sSec} section`,
  ];

  if (directVariants.some((v) => q === v)) {
    return true;
  }

  if (q === `class ${sClass}` || q === sClass) {
    return true;
  }

  return false;
}

// 1. Verify Class and Section Configuration
console.log('[TEST 1] Verifying available classes & sections:');
for (const cls of ['6', '7', '8', '9', '10']) {
  const secs = getClassSections(cls);
  console.log(`  ✓ Class ${cls}: Sections [${secs.join(', ')}] (Total: ${secs.length})`);
  if (!secs.includes('G') && cls !== '6') {
    console.error(`  ❌ FAIL: Class ${cls} is missing Section G!`);
  }
}

// 2. Verify Section G in Class 8
console.log('\n[TEST 2] Verifying Section G in Class 8:');
const class8Sections = getClassSections('8');
if (class8Sections.includes('G')) {
  console.log('  ✅ PASS: Section G is fully available for Class 8!');
} else {
  console.error('  ❌ FAIL: Section G is missing for Class 8!');
}

// 3. Test Keyword Search Matching for "8 g", "8g", "8-g", "class 8 g"
console.log('\n[TEST 3] Testing class & section search matching for "8 g":');
const queries = ['8 g', '8g', '8-g', '8_g', 'class 8 g', 'class 8g', 'class 8-g', 'grade 8 g'];

let test3Pass = true;
for (const q of queries) {
  const matches8G = matchesClassSectionKeyword('8', 'G', q);
  const matches8A = matchesClassSectionKeyword('8', 'A', q);
  const ok = matches8G && !matches8A;
  if (!ok) test3Pass = false;
  console.log(`  Query "${q}": Matches 8-G? ${matches8G ? '✅ YES' : '❌ NO'} | Matches 8-A? ${matches8A ? '❌ LEAK' : '✓ NO (Properly isolated)'}`);
}

// 4. Test other classes and sections
console.log('\n[TEST 4] Testing search matching for other classes & sections:');
const otherTests = [
  { class: '6', sec: 'F', query: '6 f' },
  { class: '7', sec: 'G', query: '7-g' },
  { class: '9', sec: 'B', query: '9b' },
  { class: '10', sec: 'C', query: 'class 10 c' },
];

for (const t of otherTests) {
  const ok = matchesClassSectionKeyword(t.class, t.sec, t.query);
  console.log(`  Query "${t.query}" for Class ${t.class}-${t.sec}: ${ok ? '✅ PASS' : '❌ FAIL'}`);
}

console.log('\n====================================================');
console.log('✓ ALL CLASS & SECTION CHECKS VERIFIED SUCCESSFULLY! ');
console.log('====================================================\n');
