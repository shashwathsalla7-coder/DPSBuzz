import { d1Execute, d1Query, isD1Configured } from '../src/lib/cloudflare/d1.ts';

async function seedInitialCampusData() {
  console.log('Seeding initial campus data...');
  if (!isD1Configured()) {
    console.error('Cloudflare D1 is not configured in environment!');
    process.exit(1);
  }

  // 1. Check if broadcast exists
  const existingBroadcasts = await d1Query('SELECT id FROM campus_broadcasts LIMIT 1;');
  if (existingBroadcasts.length === 0) {
    console.log('Inserting initial Principal Madam broadcast...');
    await d1Execute(
      `INSERT INTO campus_broadcasts (id, title, message, sender, sender_role, sender_avatar, target_audience, target_audience_label, priority, acknowledged_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        'broadcast-welcome-madam',
        'Welcome to the DPS Campus Digital Network',
        'Dear Students, Teachers, and Parents — DPSBuzz is our verified academic network connecting Nursery to Class 10. Check your AI Daily Diary for personalized schedules, solve the Question of the Day in the Question Box to earn House Points, and share revision summaries in the Study Corner. Together, let us achieve academic excellence!',
        'Office of the Principal',
        'Principal • Delhi Public School',
        '',
        'all',
        'Nursery to Class 10 (All Students & Parents)',
        'high',
        '[]'
      ]
    );
    console.log('Principal broadcast seeded successfully.');
  } else {
    console.log('Broadcasts already present (' + existingBroadcasts.length + ' found).');
  }

  // 2. Check if study notes exist
  const existingNotes = await d1Query('SELECT id FROM campus_study_notes LIMIT 1;');
  if (existingNotes.length === 0) {
    console.log('Inserting initial curated study notes...');
    await d1Execute(
      `INSERT INTO campus_study_notes (id, title, subject, class_grade, description, author_name, author_username, author_role, author_class, likes, liked_by, downloads, file_type, badge, content_preview)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        'note-chem-class10',
        'Chemical Reactions & Equations — Complete Chapter Summary',
        'Science',
        'Class 10',
        'Handwritten-style revision notes covering Combination, Decomposition, Displacement, Redox reactions, and Corrosion with NCERT balanced equations.',
        'Shashwath Salla',
        'shashwath71845',
        'student',
        'Class 10-A',
        14,
        JSON.stringify(['shashwath71845', 'vignesh', 'chandan', 'rohan728']),
        38,
        'pdf',
        'Top Rated ⭐',
        '1. Chemical Equations: Representation using chemical symbols. 2. Law of Conservation of Mass: Mass cannot be created nor destroyed. 3. Balancing by hit-and-trial. 4. Types: Combination, Decomposition (Thermal, Electrolytic, Photolytic), Single/Double Displacement, Oxidation-Reduction (LEO/GER).'
      ]
    );

    await d1Execute(
      `INSERT INTO campus_study_notes (id, title, subject, class_grade, description, author_name, author_username, author_role, author_class, likes, liked_by, downloads, file_type, badge, content_preview)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        'note-math-class9',
        'Polynomials & Factor Theorem Cheat Sheet',
        'Mathematics',
        'Class 9',
        'Quick formula cards covering degree of polynomials, Remainder Theorem, Factor Theorem, and algebraic identities (a+b+c)², x³+y³+z³-3xyz.',
        'Rohan Kumar',
        'rohan728',
        'student',
        'Class 9-B',
        9,
        JSON.stringify(['rohan728', 'shashwath71845', 'ashwith']),
        22,
        'summary',
        'NCERT Gold 🏆',
        'Identity 1: (x+y+z)² = x²+y²+z²+2xy+2yz+2zx. Identity 2: x³+y³+z³ - 3xyz = (x+y+z)(x²+y²+z² - xy - yz - zx). Remainder Theorem: When p(x) is divided by (x - a), the remainder is p(a). Factor Theorem: (x - a) is a factor if p(a) = 0.'
      ]
    );
    console.log('Curated study notes seeded successfully.');
  } else {
    console.log('Study notes already present (' + existingNotes.length + ' found).');
  }

  // 3. Verify counts
  const qCount = await d1Query('SELECT count(*) as count FROM campus_questions;');
  const bCount = await d1Query('SELECT count(*) as count FROM campus_broadcasts;');
  const nCount = await d1Query('SELECT count(*) as count FROM campus_study_notes;');
  console.log('Current D1 Campus Data:');
  console.log(`- Questions: ${qCount[0].count}`);
  console.log(`- Broadcasts: ${bCount[0].count}`);
  console.log(`- Study Notes: ${nCount[0].count}`);
}

seedInitialCampusData().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
