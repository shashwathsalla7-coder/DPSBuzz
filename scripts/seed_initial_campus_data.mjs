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
  const existingNotes = await d1Query('SELECT id FROM campus_study_notes WHERE id = ?;', ['note-optics-class10']);
  if (existingNotes.length === 0) {
    console.log('Inserting initial curated study notes including photo/diagram note...');
    await d1Execute(
      `INSERT INTO campus_study_notes (id, title, subject, class_grade, description, author_name, author_username, author_role, author_class, likes, liked_by, downloads, file_type, badge, content_preview, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        'note-optics-class10',
        'Class 10 Physics: Ray Diagrams for Concave & Convex Mirrors',
        'Science',
        'Class 10',
        'Complete handwritten geometric ray diagrams for object at infinity, beyond C, at C, between C and F, and between F and P with Cartesian sign convention.',
        'Shashwath Salla',
        'shashwath71845',
        'student',
        'Class 10-A',
        18,
        JSON.stringify(['shashwath71845', 'vignesh', 'chandan', 'rohan728', 'ishanvi']),
        45,
        'image',
        'NCERT Verified 📐',
        'Rule 1: Ray parallel to principal axis passes through focus after reflection. Rule 2: Ray through center of curvature retraces path. Real & inverted when object is beyond F; virtual & erect when between F and Pole (used for shaving mirrors and headlights).',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Concave_mirror_ray_diagram.svg/800px-Concave_mirror_ray_diagram.svg.png'
      ]
    );
    console.log('Optics ray diagram note seeded successfully.');
  }

  // Clean up any test notes like 'hi'
  await d1Execute("DELETE FROM campus_study_notes WHERE title = 'hi' OR description = 'hi';");

  // Seed sample real homework
  const existingHw = await d1Query('SELECT count(*) as count FROM campus_homework;');
  if (existingHw[0].count === 0) {
    console.log('Inserting initial curriculum homework tasks...');
    await d1Execute(`
      INSERT INTO campus_homework (id, class_grade, section, subject, task, due_date, teacher_name)
      VALUES 
      ('hw-10-math', 'Class 10', 'All', 'Mathematics', 'Complete Exercise 8.4 Q5 (Trigonometric Identities proofs 1 to 5) in classwork notebook.', 'Tomorrow', 'Mr. Sharma (Senior Math Faculty)'),
      ('hw-10-sci', 'Class 10', 'All', 'Science', 'Draw ray diagrams for concave mirror with Cartesian sign conventions in record book.', 'Friday', 'Mrs. Kulkarni (Physics Faculty)'),
      ('hw-9-eng', 'Class 9', 'All', 'English', 'Write a 150-word analytical paragraph on The Road Not Taken theme in literature notebook.', 'Tomorrow', 'Mrs. Ananya Sen (English Faculty)');
    `);
    console.log('Curriculum homework seeded successfully.');
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
