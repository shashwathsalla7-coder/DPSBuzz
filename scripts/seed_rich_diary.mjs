import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
}

async function queryD1(sql, params = []) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${env.CLOUDFLARE_D1_DATABASE_ID}/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.errors?.[0]?.message || 'D1 query failed');
  return json.result?.[0]?.results || [];
}

const todayStr = '2026-11-05';
const yesterdayStr = '2026-11-04';
const twoDaysAgoStr = '2026-11-03';
const threeDaysAgoStr = '2026-11-02';

const richDiaryEntries = [
  // ==========================================
  // CLASS 8-G (Anita Madam / Shashwath / Rishi)
  // ==========================================
  {
    id: 'diary-c8g-today',
    class_grade: '8',
    section: 'G',
    date_str: todayStr,
    image_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=1200',
    homework_summary: '• Mathematics: Ex 4.2 Q1 to Q6 (Linear equations in one variable)\n• Science: Write reflection laws & ray diagrams in lab file\n• English: Complete Chapter 4 "The Summit Within" word meanings (pg 58)\n• Social Science: Revise Chapter 3 Judiciary notes',
    uploaded_by_username: 'shashwath71845',
    uploaded_by_name: 'Shashwath Salla',
    is_first_submission: 1,
    points_awarded: 50,
    created_at: '2026-11-05T08:45:00.000Z',
  },
  {
    id: 'diary-c8g-yesterday',
    class_grade: '8',
    section: 'G',
    date_str: yesterdayStr,
    image_url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=1200',
    homework_summary: '• Mathematics: Exercise 4.1 Questions 7-12 in Fair Notebook\n• Hindi: Vasant Chapter 6 "Bhagwan ke Dakiye" question answers\n• Science: Read Chapter 5 Coal & Petroleum highlights',
    uploaded_by_username: 'rishi_6f',
    uploaded_by_name: 'Y Rishikesh Reddy',
    is_first_submission: 1,
    points_awarded: 50,
    created_at: '2026-11-04T09:10:00.000Z',
  },
  {
    id: 'diary-c8g-nov3',
    class_grade: '8',
    section: 'G',
    date_str: twoDaysAgoStr,
    image_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=1200',
    homework_summary: '• English: Letter writing practice (formal complaint letter to municipal commissioner)\n• Sanskrit: Ruchira pg 42 shlokas 1 to 4 with anvaya\n• Computer: Python loop program submission',
    uploaded_by_username: 'himaksh_tf',
    uploaded_by_name: 'Himaksh',
    is_first_submission: 1,
    points_awarded: 50,
    created_at: '2026-11-03T08:50:00.000Z',
  },

  // ==========================================
  // CLASS 8-A
  // ==========================================
  {
    id: 'diary-c8a-today',
    class_grade: '8',
    section: 'A',
    date_str: todayStr,
    image_url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=1200',
    homework_summary: '• Maths: Ex 5.1 Data Handling bar graph questions\n• Science: Friction activity 12.3 write-up in physics fair copy\n• Sanskrit: Dhaturup practice table',
    uploaded_by_username: 'rohan_jaddu',
    uploaded_by_name: 'Rohan Kamboj',
    is_first_submission: 1,
    points_awarded: 50,
    created_at: '2026-11-05T09:05:00.000Z',
  },
  {
    id: 'diary-c8a-yesterday',
    class_grade: '8',
    section: 'A',
    date_str: yesterdayStr,
    image_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=1200',
    homework_summary: '• Social Studies: Resources & Development Q1-Q5\n• English: Honeydew poem "The Ant and the Cricket" summary',
    uploaded_by_username: 'krishna_dps',
    uploaded_by_name: 'Krishna',
    is_first_submission: 1,
    points_awarded: 50,
    created_at: '2026-11-04T08:40:00.000Z',
  },

  // ==========================================
  // CLASS 6-F (Rishikesh 6f Shashwath Friend)
  // ==========================================
  {
    id: 'diary-c6f-today',
    class_grade: '6',
    section: 'F',
    date_str: todayStr,
    image_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=1200',
    homework_summary: '• Maths: Chapter 6 Integers Ex 6.1 on number line\n• Science: Components of Food test tube vitamins chart\n• English: A Tale of Two Birds reading comprehension',
    uploaded_by_username: 'rishi_6f',
    uploaded_by_name: 'Rishikesh 6f Shashwath Friend',
    is_first_submission: 1,
    points_awarded: 50,
    created_at: '2026-11-05T08:30:00.000Z',
  },
  {
    id: 'diary-c6f-yesterday',
    class_grade: '6',
    section: 'F',
    date_str: yesterdayStr,
    image_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=1200',
    homework_summary: '• Hindi: Bal Ramkatha Ch 3 questions\n• Social Studies: Globe Latitudes & Longitudes map drawing\n• Bring chocolates for club celebration!',
    uploaded_by_username: 'rishi_6f',
    uploaded_by_name: 'Rishikesh 6f Shashwath Friend',
    is_first_submission: 1,
    points_awarded: 50,
    created_at: '2026-11-04T08:15:00.000Z',
  },

  // ==========================================
  // CLASS 7-B
  // ==========================================
  {
    id: 'diary-c7b-today',
    class_grade: '7',
    section: 'B',
    date_str: todayStr,
    image_url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=1200',
    homework_summary: '• Maths: Fractions & Decimals Ex 2.4 multiplication problems\n• Science: Heat transfer conduction & convection diagram\n• English: Honeycomb Chapter 3 Gopal and the Hilsa Fish comic script',
    uploaded_by_username: 'priya_art',
    uploaded_by_name: 'Priya Patel',
    is_first_submission: 1,
    points_awarded: 50,
    created_at: '2026-11-05T09:12:00.000Z',
  },

  // ==========================================
  // CLASS 9-A
  // ==========================================
  {
    id: 'diary-c9a-today',
    class_grade: '9',
    section: 'A',
    date_str: todayStr,
    image_url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=1200',
    homework_summary: '• Mathematics: Polynomials Ex 2.5 identity proofs (Q1-Q8)\n• Physics: Equations of motion numericals pg 108 (Q3, Q5, Q7)\n• Chemistry: Matter in Our Surroundings states of matter evaporation experiment notes',
    uploaded_by_username: 'rishi_sunak_9',
    uploaded_by_name: 'Rishi Sunak',
    is_first_submission: 1,
    points_awarded: 50,
    created_at: '2026-11-05T08:55:00.000Z',
  },
  {
    id: 'diary-c9a-yesterday',
    class_grade: '9',
    section: 'A',
    date_str: yesterdayStr,
    image_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=1200',
    homework_summary: '• Biology: Cell organelle table (Mitochondria & Chloroplast structure)\n• Economics: Story of Village Palampur factors of production',
    uploaded_by_username: 'aarav_sharma',
    uploaded_by_name: 'Aarav Sharma',
    is_first_submission: 1,
    points_awarded: 50,
    created_at: '2026-11-04T09:20:00.000Z',
  },

  // ==========================================
  // CLASS 10-A (CBSE Board Batch)
  // ==========================================
  {
    id: 'diary-c10a-today',
    class_grade: '10',
    section: 'A',
    date_str: todayStr,
    image_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=1200',
    homework_summary: '• Mathematics: Quadratic Equations CBSE 10-year previous questions (Section B & C)\n• Physics: Ohm\'s law resistance in series & parallel circuit problems\n• Chemistry: Balance 10 redox & displacement chemical equations\n• Biology: Life Processes human heart double circulation diagram with labeling',
    uploaded_by_username: 'aarav_sharma',
    uploaded_by_name: 'Aarav Sharma',
    is_first_submission: 1,
    points_awarded: 50,
    created_at: '2026-11-05T08:10:00.000Z',
  },
  {
    id: 'diary-c10a-yesterday',
    class_grade: '10',
    section: 'A',
    date_str: yesterdayStr,
    image_url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=1200',
    homework_summary: '• Social Science: Nationalism in India timeline of Non-Cooperation Movement\n• English: Footprints Without Feet Chapter 1 "A Triumph of Surgery" character sketch of Mrs. Pumphrey',
    uploaded_by_username: 'aarav_sharma',
    uploaded_by_name: 'Aarav Sharma',
    is_first_submission: 1,
    points_awarded: 50,
    created_at: '2026-11-04T08:25:00.000Z',
  },
  {
    id: 'diary-c10a-nov3',
    class_grade: '10',
    section: 'A',
    date_str: twoDaysAgoStr,
    image_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=1200',
    homework_summary: '• Maths: Trigonometry standard values table revision & proofs\n• Hindi: Sanchayan Chapter 1 Harihar Kaka discussion points',
    uploaded_by_username: 'sri_admin',
    uploaded_by_name: 'Sri',
    is_first_submission: 1,
    points_awarded: 50,
    created_at: '2026-11-03T09:00:00.000Z',
  },

  // ==========================================
  // CLASS 10-B
  // ==========================================
  {
    id: 'diary-c10b-today',
    class_grade: '10',
    section: 'B',
    date_str: todayStr,
    image_url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=1200',
    homework_summary: '• Maths: Arithmetic Progression nth term formula exercise 5.2\n• Science: Magnetic effects of electric current Fleming\'s Left Hand Rule\n• Computer Applications: HTML tables and CSS styling assignment',
    uploaded_by_username: 'vikas_faculty',
    uploaded_by_name: 'Vikas Sir (Faculty)',
    is_first_submission: 1,
    points_awarded: 50,
    created_at: '2026-11-05T08:40:00.000Z',
  },

  // ==========================================
  // PRIMARY - CLASS 5-A
  // ==========================================
  {
    id: 'diary-c5a-today',
    class_grade: '5',
    section: 'A',
    date_str: todayStr,
    image_url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=1200',
    homework_summary: '• Maths: Area and Perimeter word problems pg 88\n• EVS: Super Senses activity sheet\n• English: Marigold Chapter 4 poem recitation',
    uploaded_by_username: 'anita_faculty',
    uploaded_by_name: 'Anita Madam (Faculty)',
    is_first_submission: 1,
    points_awarded: 50,
    created_at: '2026-11-05T08:20:00.000Z',
  },
];

async function seed() {
  console.log(`Seeding ${richDiaryEntries.length} verified diary entries into Cloudflare D1...`);

  for (const entry of richDiaryEntries) {
    await queryD1(
      `INSERT OR REPLACE INTO campus_diary_entries (
        id, class_grade, section, date_str, image_url, homework_summary,
        uploaded_by_username, uploaded_by_name, is_first_submission, points_awarded, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        entry.id,
        entry.class_grade,
        entry.section,
        entry.date_str,
        entry.image_url,
        entry.homework_summary,
        entry.uploaded_by_username,
        entry.uploaded_by_name,
        entry.is_first_submission,
        entry.points_awarded,
        entry.created_at,
      ]
    );
  }

  const check = await queryD1('SELECT count(*) as count FROM campus_diary_entries;');
  console.log('✓ Success! Total diary entries in Cloudflare D1 now:', check[0].count);
}

seed().catch(console.error);
