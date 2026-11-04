import { d1Execute, d1Query, isD1Configured } from '../src/lib/cloudflare/d1.ts';

async function initLostFoundTable() {
  console.log('Initializing campus_lost_found table in Cloudflare D1...');
  if (!isD1Configured()) {
    console.error('D1 not configured in environment!');
    process.exit(1);
  }

  await d1Execute(`
    CREATE TABLE IF NOT EXISTS campus_lost_found (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'LOST',
      location TEXT NOT NULL,
      specific_spot TEXT DEFAULT '',
      description TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      
      reporter_username TEXT NOT NULL,
      reporter_name TEXT NOT NULL,
      reporter_class TEXT NOT NULL,
      reporter_section TEXT NOT NULL,
      reporter_role TEXT DEFAULT 'student',
      
      finder_username TEXT DEFAULT '',
      finder_name TEXT DEFAULT '',
      finder_class TEXT DEFAULT '',
      finder_section TEXT DEFAULT '',
      finder_notes TEXT DEFAULT '',
      
      storage_location TEXT DEFAULT '',
      urgent INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      resolved_at TIMESTAMP
    );
  `);
  console.log('Table campus_lost_found created successfully!');

  // Check table info
  const info = await d1Query('PRAGMA table_info(campus_lost_found);');
  console.log('Columns in campus_lost_found:', info.map(c => c.name).join(', '));

  // Seed sample real campus items if empty
  const count = await d1Query('SELECT count(*) as count FROM campus_lost_found;');
  if (count[0].count === 0) {
    console.log('Seeding initial authentic Lost & Found items...');
    await d1Execute(`
      INSERT INTO campus_lost_found (
        id, title, category, status, location, specific_spot, description, image_url,
        reporter_username, reporter_name, reporter_class, reporter_section, reporter_role,
        storage_location, urgent
      ) VALUES
      (
        'DPS-LF-1042',
        'Casio fx-991EX Scientific Calculator',
        'Electronics',
        'LOST',
        'Science Block',
        'Physics Lab 2, Workbench 4',
        'Black scientific calculator with small AM initials on back sliding cover. Needed urgently for upcoming practicals.',
        '',
        'shashwath71845',
        'Shashwath Salla',
        'Class 10',
        'A',
        'student',
        'Not yet turned in',
        1
      ),
      (
        'DPS-LF-1041',
        'Matte Cobalt Blue Insulated Water Bottle (750ml)',
        'Water Bottles & Lunchboxes',
        'FOUND',
        'Sports Ground',
        'Basketball Court Bleachers',
        'Insulated metal bottle with school badge sticker on side. Turned in to Main Reception.',
        'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        'vignesh',
        'Vignesh Kumar',
        'Class 9',
        'A',
        'student',
        'Main Reception — Lost & Found Shelf 2',
        0
      ),
      (
        'DPS-LF-1039',
        'Green DPS Winter Blazer (Size 38)',
        'Uniform & Apparel',
        'FOUND',
        'Library',
        'Quiet Reading Room Zone',
        'Green wool blend blazer with Prefect lapel pin attached. Name label inside slightly faded.',
        '',
        'rohan728',
        'Rohan Kumar',
        'Class 9',
        'B',
        'student',
        'Main Reception — Coat Rack B',
        0
      );
    `);
    console.log('Initial Lost & Found items seeded successfully!');
  }

  const finalItems = await d1Query('SELECT id, title, status, reporter_name, reporter_class, reporter_section FROM campus_lost_found;');
  console.log('Current items in D1:', finalItems);
}

initLostFoundTable().catch(err => {
  console.error('Init error:', err);
  process.exit(1);
});
