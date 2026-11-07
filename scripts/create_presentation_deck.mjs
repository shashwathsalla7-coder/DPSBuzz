import pptxgen from 'pptxgenjs';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/shash/.gemini/antigravity/brain/6613c7aa-838b-45cc-9390-21cd395b212e';
const PPTX_PATH = path.join(ARTIFACT_DIR, 'DPS_Buzz_Presentation_for_Madam.pptx');
const SCRATCH_PPTX_PATH = path.join(process.cwd(), 'DPS_Buzz_Presentation_for_Madam.pptx');

async function createDeck() {
  console.log('Generating PowerPoint (.pptx) presentation...');
  const pptx = new pptxgen();

  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'DPS Buzz Team';
  pptx.company = 'DPS Buzz Smart School Platform';
  pptx.title = 'DPS Buzz - Presentation for School Leadership';

  const BG_NAVY = '0A0F1D';
  const CARD_BG = '131B2E';
  const BLUE = '2B4BFF';
  const TEXT_WHITE = 'FFFFFF';
  const TEXT_MUTED = '94A3B8';
  const GREEN = '22C55E';
  const GOLD = 'F59E0B';

  // SLIDE 1: TITLE SLIDE
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG_NAVY };

    slide.addText('SMART SCHOOL SUPER APP • NURSERY TO CLASS 10', {
      x: 1.0, y: 1.5, w: 11.3, h: 0.4,
      fontSize: 13, bold: true, color: '60A5FA', letterSpacing: 2
    });

    slide.addText('DPS BUZZ', {
      x: 1.0, y: 1.9, w: 11.3, h: 1.2,
      fontSize: 54, bold: true, color: TEXT_WHITE, letterSpacing: -1
    });

    slide.addText('Connecting 5,500 Students, Parents & School Leadership\non One Safe, Modern, All-in-One Digital Campus.', {
      x: 1.0, y: 3.2, w: 11.3, h: 1.0,
      fontSize: 22, color: TEXT_MUTED, lineSpacing: 30
    });

    // 3 Highlight Pills
    const pills = [
      { text: '🏫 Nursery to Class 10', x: 1.0 },
      { text: '🛡️ 100% Child-Safe & Private', x: 4.2 },
      { text: '💰 $0 Hosting & Zero Cost', x: 7.7 }
    ];
    pills.forEach(p => {
      slide.addShape(pptx.ShapeType.roundRect, {
        x: p.x, y: 4.7, w: 3.1, h: 0.6,
        fill: { color: '1E293B' }, line: { color: BLUE, width: 1.5 }, rectRadius: 0.3
      });
      slide.addText(p.text, {
        x: p.x, y: 4.7, w: 3.1, h: 0.6,
        fontSize: 13, bold: true, color: TEXT_WHITE, align: 'center', valign: 'middle'
      });
    });

    slide.addText('Presented to: The Principal & School Leadership\nLive Platform: dpsbuzz.in', {
      x: 1.0, y: 6.2, w: 11.3, h: 0.8,
      fontSize: 13, color: '64748B'
    });
  }

  // SLIDE 2: TWO CONNECTED HUBS
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG_NAVY };

    slide.addText('THE CORE ARCHITECTURE', { x: 0.8, y: 0.6, w: 10, h: 0.3, fontSize: 11, bold: true, color: '60A5FA' });
    slide.addText('Two Connected Hubs in One App', { x: 0.8, y: 0.9, w: 10, h: 0.6, fontSize: 28, bold: true, color: TEXT_WHITE });

    // Left Card: Junior School (Nursery - 5)
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.8, y: 1.8, w: 5.6, h: 5.0,
      fill: { color: CARD_BG }, line: { color: GREEN, width: 1.5 }, rectRadius: 0.2
    });
    slide.addText('JUNIOR SCHOOL (Nursery to Class 5)', { x: 1.1, y: 2.1, w: 5.0, h: 0.4, fontSize: 14, bold: true, color: GREEN });
    slide.addText('The Smart Parent Portal', { x: 1.1, y: 2.5, w: 5.0, h: 0.4, fontSize: 20, bold: true, color: TEXT_WHITE });
    slide.addText(
      '• Used by Parents on their phones\n' +
      '• Daily Homework & Digital Diary entries\n' +
      '• Official morning announcements from Madam\n' +
      '• School bus alerts & photo circulars\n' +
      '• 100% Private: Photos restricted to verified class parents\n' +
      '• Zero phone number leaks (replaces messy Campus Wire)',
      { x: 1.1, y: 3.1, w: 5.0, h: 3.4, fontSize: 13, color: TEXT_MUTED, lineSpacing: 24 }
    );

    // Right Card: Senior School (Classes 6 - 10)
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 6.8, y: 1.8, w: 5.6, h: 5.0,
      fill: { color: CARD_BG }, line: { color: BLUE, width: 1.5 }, rectRadius: 0.2
    });
    slide.addText('SENIOR SCHOOL (Classes 6 to 10)', { x: 7.1, y: 2.1, w: 5.0, h: 0.4, fontSize: 14, bold: true, color: '60A5FA' });
    slide.addText('The Student Academic Hub', { x: 7.1, y: 2.5, w: 5.0, h: 0.4, fontSize: 20, bold: true, color: TEXT_WHITE });
    slide.addText(
      '• Used by Students on phones & laptops\n' +
      '• Study Corner: Peer notes & formula sharing\n' +
      '• 8:00 AM Daily Brain Teaser Question Box\n' +
      '• Official class channels (6-A to 10-A)\n' +
      '• Star Board academic streak & points\n' +
      '• Supervised, positive school-only social network',
      { x: 7.1, y: 3.1, w: 5.0, h: 3.4, fontSize: 13, color: TEXT_MUTED, lineSpacing: 24 }
    );
  }

  // SLIDE 3: MESSAGES FROM MADAM & NOTICES
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG_NAVY };

    slide.addText('DIRECT SCHOOL LEADERSHIP COMMUNICATION', { x: 0.8, y: 0.6, w: 10, h: 0.3, fontSize: 11, bold: true, color: '60A5FA' });
    slide.addText('Automatic Messages from Madam & Official Notices', { x: 0.8, y: 0.9, w: 11, h: 0.6, fontSize: 28, bold: true, color: TEXT_WHITE });

    // Feature 1
    slide.addShape(pptx.ShapeType.roundRect, { x: 0.8, y: 1.8, w: 3.6, h: 4.9, fill: { color: CARD_BG }, line: { color: '1E293B', width: 1 }, rectRadius: 0.2 });
    slide.addText('👑 Verified Golden Crest', { x: 1.0, y: 2.1, w: 3.2, h: 0.4, fontSize: 16, bold: true, color: GOLD });
    slide.addText(
      'Messages from @madam carry an official golden crest badge 🛡️.\n\n' +
      'Parents & students immediately know the announcement is 100% genuine from the Principal.\n\n' +
      'Eliminates confusion and fake rumors entirely.',
      { x: 1.0, y: 2.7, w: 3.2, h: 3.7, fontSize: 13, color: TEXT_MUTED, lineSpacing: 22 }
    );

    // Feature 2
    slide.addShape(pptx.ShapeType.roundRect, { x: 4.8, y: 1.8, w: 3.6, h: 4.9, fill: { color: CARD_BG }, line: { color: '1E293B', width: 1 }, rectRadius: 0.2 });
    slide.addText('⏰ Zero-Effort Automation', { x: 5.0, y: 2.1, w: 3.2, h: 0.4, fontSize: 16, bold: true, color: '60A5FA' });
    slide.addText(
      'Teachers do NOT need to type and send messages every day.\n\n' +
      '• 7:30 AM: Morning quote & assembly thought.\n' +
      '• 3:30 PM: Daily homework wrap-up.\n' +
      '• Festival & holiday greetings trigger automatically from schedule queue.',
      { x: 5.0, y: 2.7, w: 3.2, h: 3.7, fontSize: 13, color: TEXT_MUTED, lineSpacing: 22 }
    );

    // Feature 3
    slide.addShape(pptx.ShapeType.roundRect, { x: 8.8, y: 1.8, w: 3.6, h: 4.9, fill: { color: CARD_BG }, line: { color: '1E293B', width: 1 }, rectRadius: 0.2 });
    slide.addText('📢 Urgent Notice Banner', { x: 9.0, y: 2.1, w: 3.2, h: 0.4, fontSize: 16, bold: true, color: GREEN });
    slide.addText(
      'Top-of-screen emergency alert bar:\n\n' +
      '• Rain holiday announcements\n' +
      '• Exam timetable releases\n' +
      '• Uniform & event circulars\n\n' +
      'Pins to the top of every parent & student phone instantly with 1 click.',
      { x: 9.0, y: 2.7, w: 3.2, h: 3.7, fontSize: 13, color: TEXT_MUTED, lineSpacing: 22 }
    );
  }

  // SLIDE 4: SMART AI DIARY
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG_NAVY };

    slide.addText('THE SMART ACADEMIC ASSISTANT', { x: 0.8, y: 0.6, w: 10, h: 0.3, fontSize: 11, bold: true, color: '60A5FA' });
    slide.addText('Smart AI Diary & Daily Homework Helper', { x: 0.8, y: 0.9, w: 11, h: 0.6, fontSize: 28, bold: true, color: TEXT_WHITE });

    // Mock Chat Box
    slide.addShape(pptx.ShapeType.roundRect, { x: 0.8, y: 1.8, w: 6.0, h: 4.9, fill: { color: CARD_BG }, line: { color: BLUE, width: 1.5 }, rectRadius: 0.2 });
    slide.addText('🤖 Interactive AI Diary Assistant', { x: 1.1, y: 2.1, w: 5.4, h: 0.4, fontSize: 16, bold: true, color: '60A5FA' });

    // Chat bubble 1
    slide.addShape(pptx.ShapeType.roundRect, { x: 1.1, y: 2.7, w: 4.8, h: 0.7, fill: { color: '1E293B' }, rectRadius: 0.15 });
    slide.addText('Parent: "What is today\'s Class 4 Science homework?"', { x: 1.3, y: 2.7, w: 4.4, h: 0.7, fontSize: 12, color: TEXT_WHITE, valign: 'middle' });

    // Chat bubble 2
    slide.addShape(pptx.ShapeType.roundRect, { x: 1.5, y: 3.6, w: 5.0, h: 1.5, fill: { color: '2B4BFF' }, rectRadius: 0.15 });
    slide.addText(
      'AI Diary: "Here is today\'s Class 4 Science:\n' +
      '• Read Chapter 5 (Water Cycle), pages 42-45.\n' +
      '• Draw the diagram in notebook.\n' +
      '• Unit test scheduled for Friday, Nov 7th!"',
      { x: 1.7, y: 3.7, w: 4.6, h: 1.3, fontSize: 12, color: TEXT_WHITE }
    );

    slide.addText('✓ Powered by Google Gemini AI (100% Free School Tier)', { x: 1.1, y: 5.7, w: 5.4, h: 0.4, fontSize: 12, bold: true, color: GREEN });

    // Right Explanation
    slide.addShape(pptx.ShapeType.roundRect, { x: 7.2, y: 1.8, w: 5.2, h: 4.9, fill: { color: CARD_BG }, line: { color: '1E293B', width: 1 }, rectRadius: 0.2 });
    slide.addText('Why Parents Love the AI Diary', { x: 7.5, y: 2.1, w: 4.6, h: 0.4, fontSize: 18, bold: true, color: TEXT_WHITE });
    slide.addText(
      '1. No Lost Notebooks:\n' +
      'If a student forgets to write the diary in school, parents can check anytime from their phone.\n\n' +
      '2. Zero Teacher Workload:\n' +
      'Teachers post the class diary once. The AI handles hundreds of parent questions automatically.\n\n' +
      '3. Instant Exam Prep:\n' +
      'Parents can ask: "What chapters are in the midterm syllabus?" and get immediate bulleted answers.',
      { x: 7.5, y: 2.7, w: 4.6, h: 3.8, fontSize: 13, color: TEXT_MUTED, lineSpacing: 22 }
    );
  }

  // SLIDE 5: CLASS GROUPS & STUDY CORNER
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG_NAVY };

    slide.addText('ACADEMIC COLLABORATION & PEER SUPPORT', { x: 0.8, y: 0.6, w: 10, h: 0.3, fontSize: 11, bold: true, color: '60A5FA' });
    slide.addText('Automated Class Groups & Study Corner', { x: 0.8, y: 0.9, w: 11, h: 0.6, fontSize: 28, bold: true, color: TEXT_WHITE });

    // Left: Class Groups
    slide.addShape(pptx.ShapeType.roundRect, { x: 0.8, y: 1.8, w: 5.6, h: 5.0, fill: { color: CARD_BG }, line: { color: '1E293B', width: 1 }, rectRadius: 0.2 });
    slide.addText('👥 52 Auto-Generated Class Groups', { x: 1.1, y: 2.1, w: 5.0, h: 0.4, fontSize: 18, bold: true, color: '60A5FA' });
    slide.addText(
      '• Official class channels from Nursery-A to 10-A created automatically.\n\n' +
      '• Students/parents automatically join their class upon registration with zero manual admin setup.\n\n' +
      '• Teachers have admin control: Announcement-only mode during school hours.\n\n' +
      '• Complete protection: Only verified classmates can enter.',
      { x: 1.1, y: 2.8, w: 5.0, h: 3.7, fontSize: 13.5, color: TEXT_MUTED, lineSpacing: 24 }
    );

    // Right: Study Corner
    slide.addShape(pptx.ShapeType.roundRect, { x: 6.8, y: 1.8, w: 5.6, h: 5.0, fill: { color: CARD_BG }, line: { color: '1E293B', width: 1 }, rectRadius: 0.2 });
    slide.addText('📚 Study Corner: Peer Notes Sharing', { x: 7.1, y: 2.1, w: 5.0, h: 0.4, fontSize: 18, bold: true, color: GREEN });
    slide.addText(
      '• Students photograph neat notebook pages, formula sheets & mind maps to help absent classmates.\n\n' +
      '• Neatly organized by Subject (Maths, Science, Social, English, Languages) and Class (6–10).\n\n' +
      '• Star Points Incentive: Helpful notes earn Star Points when classmates thank them ⭐.\n\n' +
      '• In-phone WebP compression: 100,000 photos stored for $0 on Cloudflare R2.',
      { x: 7.1, y: 2.8, w: 5.0, h: 3.7, fontSize: 13.5, color: TEXT_MUTED, lineSpacing: 24 }
    );
  }

  // SLIDE 6: QUESTION BOX & GAMIFICATION
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG_NAVY };

    slide.addText('DAILY STUDENT ENGAGEMENT', { x: 0.8, y: 0.6, w: 10, h: 0.3, fontSize: 11, bold: true, color: '60A5FA' });
    slide.addText('Daily Question Box & Star Points Gamification', { x: 0.8, y: 0.9, w: 11, h: 0.6, fontSize: 28, bold: true, color: TEXT_WHITE });

    // Mock Question Card
    slide.addShape(pptx.ShapeType.roundRect, { x: 0.8, y: 1.8, w: 6.0, h: 5.0, fill: { color: CARD_BG }, line: { color: GOLD, width: 1.5 }, rectRadius: 0.2 });
    slide.addText('🔥 Daily Brain Teaser (8:00 AM)', { x: 1.1, y: 2.1, w: 5.4, h: 0.4, fontSize: 16, bold: true, color: GOLD });

    slide.addShape(pptx.ShapeType.roundRect, { x: 1.1, y: 2.7, w: 5.4, h: 1.2, fill: { color: '1E293B' }, rectRadius: 0.15 });
    slide.addText('Today\'s Science Teaser:\n"Which planet in our solar system spins clockwise?"', { x: 1.3, y: 2.8, w: 5.0, h: 1.0, fontSize: 13, bold: true, color: TEXT_WHITE });

    const options = ['A) Mars', 'B) Venus (Correct ✓)', 'C) Jupiter', 'D) Mercury'];
    options.forEach((opt, idx) => {
      const isCorrect = idx === 1;
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 1.1, y: 4.1 + (idx * 0.55), w: 5.4, h: 0.45,
        fill: { color: isCorrect ? '166534' : '0F172A' },
        line: { color: isCorrect ? GREEN : '334155', width: 1 }, rectRadius: 0.1
      });
      slide.addText(opt, { x: 1.3, y: 4.1 + (idx * 0.55), w: 5.0, h: 0.45, fontSize: 12, color: TEXT_WHITE, valign: 'middle' });
    });

    // Right: Pedagogical value
    slide.addShape(pptx.ShapeType.roundRect, { x: 7.2, y: 1.8, w: 5.2, h: 5.0, fill: { color: CARD_BG }, line: { color: '1E293B', width: 1 }, rectRadius: 0.2 });
    slide.addText('Why This Builds Daily Habits', { x: 7.5, y: 2.1, w: 4.6, h: 0.4, fontSize: 18, bold: true, color: TEXT_WHITE });
    slide.addText(
      '• 1 Attempt Per Day:\n' +
      'Students cannot mindlessly spam; they think carefully before answering.\n\n' +
      '• Daily Streak Flame (`🔥 5d`):\n' +
      'Missing a day resets the streak. Students build the habit of checking in every morning before school.\n\n' +
      '• Academic Star Board:\n' +
      'Rewards intellectual curiosity over social popularity. Top academic scorers are celebrated weekly.',
      { x: 7.5, y: 2.7, w: 4.6, h: 3.9, fontSize: 13, color: TEXT_MUTED, lineSpacing: 22 }
    );
  }

  // SLIDE 7: SAFETY & PRIVACY
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG_NAVY };

    slide.addText('SAFETY, COMPLIANCE & PEACE OF MIND', { x: 0.8, y: 0.6, w: 10, h: 0.3, fontSize: 11, bold: true, color: '60A5FA' });
    slide.addText('Child Safety & Privacy by Design', { x: 0.8, y: 0.9, w: 11, h: 0.6, fontSize: 28, bold: true, color: TEXT_WHITE });

    const pillars = [
      {
        title: '🛡️ Private Junior School',
        desc: 'Nursery to Class 5 classes are strictly private. Photos of young children are never public on the web; only verified parents and teachers of that section can view them.',
        x: 0.8
      },
      {
        title: '🔒 Zero Phone Leaks',
        desc: 'Unlike Campus Wire where every parent sees everyone\'s phone number, DPS Buzz hides all phone numbers, email addresses, and admission IDs permanently.',
        x: 4.8
      },
      {
        title: '👮 Anti-Spam & Moderation',
        desc: 'Students cannot create duplicate accounts. Profanity filters and admin report queues give school staff 100% control over discussions.',
        x: 8.8
      }
    ];

    pillars.forEach(p => {
      slide.addShape(pptx.ShapeType.roundRect, { x: p.x, y: 1.8, w: 3.6, h: 4.9, fill: { color: CARD_BG }, line: { color: '1E293B', width: 1 }, rectRadius: 0.2 });
      slide.addText(p.title, { x: p.x + 0.2, y: 2.2, w: 3.2, h: 0.5, fontSize: 17, bold: true, color: TEXT_WHITE });
      slide.addText(p.desc, { x: p.x + 0.2, y: 2.8, w: 3.2, h: 3.6, fontSize: 13.5, color: TEXT_MUTED, lineSpacing: 24 });
    });
  }

  // SLIDE 8: SUMMARY & COST
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG_NAVY };

    slide.addText('MANAGEMENT SUMMARY & FINANCIAL GUARANTEE', { x: 0.8, y: 0.6, w: 10, h: 0.3, fontSize: 11, bold: true, color: '60A5FA' });
    slide.addText('Supporting 5,500 Students at $0 Monthly Cost', { x: 0.8, y: 0.9, w: 11, h: 0.6, fontSize: 28, bold: true, color: TEXT_WHITE });

    slide.addShape(pptx.ShapeType.roundRect, { x: 0.8, y: 1.8, w: 11.6, h: 3.2, fill: { color: CARD_BG }, line: { color: GREEN, width: 1.5 }, rectRadius: 0.2 });
    slide.addText('💰 Zero Financial Burden on the School', { x: 1.1, y: 2.1, w: 11.0, h: 0.4, fontSize: 20, bold: true, color: GREEN });

    slide.addText(
      '• 100,000 Photos Free: Cloudflare R2 stores all homework, notes & photos with $0 download fees.\n' +
      '• 5 Million Reads Daily: Cloudflare D1 edge database serves thousands of students with zero lag.\n' +
      '• Edge Caching: Serves 5,500 students in 15 milliseconds without crashing the database.\n' +
      '• No Summer Vacation Waste: $0 charges during holidays when school is closed.',
      { x: 1.1, y: 2.7, w: 11.0, h: 2.1, fontSize: 14, color: TEXT_WHITE, lineSpacing: 26 }
    );

    // Call to Action
    slide.addShape(pptx.ShapeType.roundRect, { x: 0.8, y: 5.3, w: 11.6, h: 1.5, fill: { color: '1E293B' }, line: { color: BLUE, width: 1.5 }, rectRadius: 0.2 });
    slide.addText('🚀 Ready to Deploy for the Entire School', { x: 1.1, y: 5.5, w: 11.0, h: 0.4, fontSize: 17, bold: true, color: '60A5FA' });
    slide.addText(
      'DPS Buzz is live at dpsbuzz.in. We can roll out these features class by class starting with Nursery to 10,\n' +
      'creating an unmatched, modern digital identity for the school.',
      { x: 1.1, y: 5.9, w: 11.0, h: 0.7, fontSize: 13, color: TEXT_MUTED }
    );
  }

  await pptx.writeFile({ fileName: PPTX_PATH });
  fs.copyFileSync(PPTX_PATH, SCRATCH_PPTX_PATH);
  console.log(`✅ PowerPoint successfully saved at:\n  - ${PPTX_PATH}\n  - ${SCRATCH_PPTX_PATH}`);
}

createDeck().catch(console.error);
