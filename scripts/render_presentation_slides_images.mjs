import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/shash/.gemini/antigravity/brain/6613c7aa-838b-45cc-9390-21cd395b212e/presentation_slides';
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

const slides = [
  {
    num: 1,
    title: 'DPS BUZZ',
    subtitle: 'The Smart School Super App (Nursery to Class 10)',
    tag: 'SCHOOL PLATFORM PRESENTATION',
    content: `
      <div style="margin-top: 40px;">
        <h2 style="font-size: 32px; color: #94A3B8; font-weight: 500; margin-bottom: 30px; line-height: 1.4;">
          Connecting 5,500 Students, Parents & School Leadership<br/>
          on One Safe, Modern, All-in-One Digital Campus.
        </h2>
        <div style="display: flex; gap: 20px; margin-top: 50px;">
          <div style="background: rgba(43,75,255,0.15); border: 1px solid #2B4BFF; padding: 14px 28px; border-radius: 9999px; font-size: 18px; font-weight: 700; color: #60A5FA;">
            🏫 Nursery to Class 10
          </div>
          <div style="background: rgba(34,197,94,0.15); border: 1px solid #22C55E; padding: 14px 28px; border-radius: 9999px; font-size: 18px; font-weight: 700; color: #4ADE80;">
            🛡️ 100% Child-Safe & Private
          </div>
          <div style="background: rgba(245,158,11,0.15); border: 1px solid #F59E0B; padding: 14px 28px; border-radius: 9999px; font-size: 18px; font-weight: 700; color: #FBBF24;">
            💰 $0 Monthly Hosting Cost
          </div>
        </div>
      </div>
      <div style="margin-top: 100px; font-size: 16px; color: #64748B;">
        Presented to: The Principal & School Management • Live at dpsbuzz.in
      </div>
    `
  },
  {
    num: 2,
    title: 'Two Connected Hubs in One App',
    subtitle: 'A single platform tailored for both young children and teenagers',
    tag: 'THE CORE VISION',
    content: `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 30px;">
        <div style="background: #111827; border: 1.5px solid rgba(34,197,94,0.4); border-radius: 20px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <div style="display: inline-block; background: rgba(34,197,94,0.2); color: #4ADE80; font-size: 13px; font-weight: 700; padding: 4px 14px; border-radius: 9999px; margin-bottom: 12px;">
            JUNIOR SCHOOL (Nursery to Class 5)
          </div>
          <h3 style="font-size: 26px; font-weight: 700; color: #FFFFFF; margin-bottom: 16px;">The Smart Parent Portal</h3>
          <ul style="list-style: none; display: flex; flex-direction: column; gap: 14px; color: #CBD5E1; font-size: 16px; line-height: 1.5;">
            <li>📱 <strong>Used by Parents:</strong> Daily homework & digital diary right on their phones.</li>
            <li>👑 <strong>Direct from Madam:</strong> Official morning audio thoughts & circulars.</li>
            <li>🚌 <strong>Bus & Event Alerts:</strong> Photo updates of sports day and bus notifications.</li>
            <li>🔒 <strong>100% Private:</strong> Photos restricted strictly to verified class parents.</li>
            <li>🚫 <strong>Zero Phone Leaks:</strong> No spammy, unorganized Campus Wire groups.</li>
          </ul>
        </div>

        <div style="background: #111827; border: 1.5px solid rgba(43,75,255,0.4); border-radius: 20px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <div style="display: inline-block; background: rgba(43,75,255,0.2); color: #60A5FA; font-size: 13px; font-weight: 700; padding: 4px 14px; border-radius: 9999px; margin-bottom: 12px;">
            SENIOR SCHOOL (Classes 6 to 10)
          </div>
          <h3 style="font-size: 26px; font-weight: 700; color: #FFFFFF; margin-bottom: 16px;">The Student Academic Hub</h3>
          <ul style="list-style: none; display: flex; flex-direction: column; gap: 14px; color: #CBD5E1; font-size: 16px; line-height: 1.5;">
            <li>💻 <strong>Used by Students:</strong> Clean, calm school social network.</li>
            <li>📚 <strong>Study Corner:</strong> Share chapter notes, mind maps & formula sheets.</li>
            <li>🔥 <strong>Daily Question Box:</strong> 8:00 AM brain teaser maintains daily streaks.</li>
            <li>👥 <strong>Auto Class Groups:</strong> Class 6-A to 10-A channels created automatically.</li>
            <li>⭐ <strong>Star Board Leaderboard:</strong> Rewards academic curiosity over popularity.</li>
          </ul>
        </div>
      </div>
    `
  },
  {
    num: 3,
    title: 'Messages from Madam & Official Notices',
    subtitle: 'The Principal’s direct megaphone with zero teacher manual effort',
    tag: 'DIRECT SCHOOL LEADERSHIP',
    content: `
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; margin-top: 30px;">
        <div style="background: #111827; border: 1px solid #1F2937; border-radius: 18px; padding: 26px;">
          <div style="font-size: 32px; margin-bottom: 12px;">👑</div>
          <h3 style="font-size: 20px; color: #F59E0B; font-weight: 700; margin-bottom: 12px;">Verified Golden Crest</h3>
          <p style="color: #94A3B8; font-size: 15px; line-height: 1.6;">
            Every message from <strong>@madam</strong> displays an official golden crest badge 🛡️.<br/><br/>
            Parents & students immediately know announcements are 100% authentic from the Principal, eliminating fake rumors.
          </p>
        </div>
        <div style="background: #111827; border: 1px solid #1F2937; border-radius: 18px; padding: 26px;">
          <div style="font-size: 32px; margin-bottom: 12px;">⏰</div>
          <h3 style="font-size: 20px; color: #60A5FA; font-weight: 700; margin-bottom: 12px;">Automated Scheduling</h3>
          <p style="color: #94A3B8; font-size: 15px; line-height: 1.6;">
            Teachers do <strong>not</strong> need to type messages every day.<br/><br/>
            • 7:30 AM: Morning quote & assembly thought.<br/>
            • 3:30 PM: Daily homework wrap-up.<br/>
            • Festival greetings trigger automatically from schedule queue.
          </p>
        </div>
        <div style="background: #111827; border: 1px solid #1F2937; border-radius: 18px; padding: 26px;">
          <div style="font-size: 32px; margin-bottom: 12px;">📢</div>
          <h3 style="font-size: 20px; color: #34D399; font-weight: 700; margin-bottom: 12px;">Urgent Notice Banner</h3>
          <p style="color: #94A3B8; font-size: 15px; line-height: 1.6;">
            A high-priority alert bar pinned to the top of all phones with 1 click:<br/><br/>
            • Rain holiday alerts<br/>
            • Exam timetable releases<br/>
            • Uniform inspection circulars
          </p>
        </div>
      </div>
    `
  },
  {
    num: 4,
    title: 'Smart AI Diary & Homework Helper',
    subtitle: 'Answering parents’ daily questions automatically with zero teacher workload',
    tag: 'THE AI ACADEMIC ASSISTANT',
    content: `
      <div style="display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 32px; margin-top: 30px;">
        <div style="background: #111827; border: 1.5px solid rgba(43,75,255,0.4); border-radius: 20px; padding: 28px;">
          <div style="font-size: 14px; font-weight: 700; color: #60A5FA; margin-bottom: 16px; text-transform: uppercase;">
            🤖 Live Interactive Preview
          </div>
          <div style="background: #1E293B; padding: 14px 18px; border-radius: 14px; margin-bottom: 14px; color: #F8FAFC; font-size: 15px;">
            <strong>Parent:</strong> "What is today's Class 4 Science homework?"
          </div>
          <div style="background: #2B4BFF; padding: 18px 22px; border-radius: 14px; color: #FFFFFF; font-size: 15px; line-height: 1.6;">
            <strong>AI Diary Assistant:</strong><br/>
            "Here is today's Class 4 Science diary:<br/>
            • Read Chapter 5 (Water Cycle), pages 42–45.<br/>
            • Draw the water cycle diagram in homework notebook.<br/>
            • <em>Reminder: Unit test on Friday, Nov 7th!</em>"
          </div>
          <div style="margin-top: 18px; font-size: 13px; color: #4ADE80; font-weight: 600;">
            ✓ Powered by Google Gemini AI (100% Free School Tier)
          </div>
        </div>

        <div style="background: #111827; border: 1px solid #1F2937; border-radius: 20px; padding: 28px; display: flex; flex-direction: column; justify-content: center;">
          <h3 style="font-size: 22px; color: #FFFFFF; font-weight: 700; margin-bottom: 16px;">Why Parents Love This:</h3>
          <ul style="list-style: none; display: flex; flex-direction: column; gap: 14px; color: #94A3B8; font-size: 15px; line-height: 1.5;">
            <li>📖 <strong>No Lost Notebooks:</strong> If a child forgets their diary at school, parents can check anytime.</li>
            <li>👩‍🏫 <strong>Zero Teacher Calls:</strong> Teachers post the diary once. The AI answers hundreds of parent queries automatically.</li>
            <li>🗓️ <strong>Instant Exam Syllabuses:</strong> Parents can ask: "What chapters are in the midterm?" and get instant answers.</li>
          </ul>
        </div>
      </div>
    `
  },
  {
    num: 5,
    title: '52 Auto-Generated Class Groups (Nursery to 10)',
    subtitle: 'Zero manual teacher setup — instant community for every grade and section',
    tag: 'STRUCTURED CLASS CHANNELS',
    content: `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 30px;">
        <div style="background: #111827; border: 1px solid #1F2937; border-radius: 20px; padding: 30px;">
          <div style="font-size: 28px; margin-bottom: 12px;">👥</div>
          <h3 style="font-size: 22px; color: #FFFFFF; font-weight: 700; margin-bottom: 14px;">Instant Auto-Enrollment</h3>
          <ul style="list-style: none; display: flex; flex-direction: column; gap: 12px; color: #94A3B8; font-size: 15px; line-height: 1.5;">
            <li>• Official channels from <strong>Nursery-A</strong> all the way to <strong>Class 10-A</strong> created automatically.</li>
            <li>• When a student or parent registers, they are automatically placed into their verified class room.</li>
            <li>• No need for teachers to manually invite 5,500 students or manage phone contact lists.</li>
          </ul>
        </div>

        <div style="background: #111827; border: 1px solid #1F2937; border-radius: 20px; padding: 30px;">
          <div style="font-size: 28px; margin-bottom: 12px;">🛡️</div>
          <h3 style="font-size: 22px; color: #FFFFFF; font-weight: 700; margin-bottom: 14px;">Complete Teacher Control</h3>
          <ul style="list-style: none; display: flex; flex-direction: column; gap: 12px; color: #94A3B8; font-size: 15px; line-height: 1.5;">
            <li>• <strong>Announcement-Only Mode:</strong> Teachers can silence chat during class hours so students aren't distracted.</li>
            <li>• <strong>Pin Messages:</strong> Homework and circulars stay pinned at the top.</li>
            <li>• <strong>Strict Boundaries:</strong> A Class 6 student cannot enter a Class 9 group. Every class is safely isolated.</li>
          </ul>
        </div>
      </div>
    `
  },
  {
    num: 6,
    title: 'Study Corner: Peer Notes Sharing',
    subtitle: 'Students photograph neat notes and formulas to help each other revise',
    tag: 'COLLABORATIVE LEARNING',
    content: `
      <div style="display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 32px; margin-top: 30px;">
        <div style="background: #111827; border: 1.5px solid rgba(34,197,94,0.4); border-radius: 20px; padding: 28px;">
          <div style="font-size: 14px; font-weight: 700; color: #4ADE80; margin-bottom: 14px; text-transform: uppercase;">
            📚 Organized by Subject & Class
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px;">
            <span style="background: #1E293B; padding: 6px 14px; border-radius: 9999px; font-size: 13px; color: #FFFFFF;">📐 Mathematics</span>
            <span style="background: #1E293B; padding: 6px 14px; border-radius: 9999px; font-size: 13px; color: #FFFFFF;">🔬 Science</span>
            <span style="background: #1E293B; padding: 6px 14px; border-radius: 9999px; font-size: 13px; color: #FFFFFF;">🌍 Social Studies</span>
            <span style="background: #1E293B; padding: 6px 14px; border-radius: 9999px; font-size: 13px; color: #FFFFFF;">📖 English</span>
            <span style="background: #1E293B; padding: 6px 14px; border-radius: 9999px; font-size: 13px; color: #FFFFFF;">💻 Computer Science</span>
          </div>
          <p style="color: #CBD5E1; font-size: 15px; line-height: 1.6;">
            Students take photos of their handwritten diagrams, chapter summaries, and formula charts to help classmates who missed a class.<br/><br/>
            <strong>Automatic Image Shrinking:</strong> Photos are compressed to 100 KB WebP right on the phone, loading instantly for $0.
          </p>
        </div>

        <div style="background: #111827; border: 1px solid #1F2937; border-radius: 20px; padding: 28px;">
          <h3 style="font-size: 20px; color: #F59E0B; font-weight: 700; margin-bottom: 12px;">⭐ Star Points Reward System</h3>
          <p style="color: #94A3B8; font-size: 15px; line-height: 1.6;">
            When classmates tap <em>"Helpful! ⭐"</em> on uploaded notes:<br/><br/>
            • The author earns <strong>+15 Star Points</strong> on the school Star Board.<br/>
            • Encourages positive academic contribution instead of superficial likes.<br/>
            • Turns studying into a celebrated school culture.
          </p>
        </div>
      </div>
    `
  },
  {
    num: 7,
    title: 'Daily Question Box (8:00 AM Brain Teaser)',
    subtitle: 'Building a positive daily intellectual habit before morning assembly',
    tag: 'DAILY STUDENT ENGAGEMENT',
    content: `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 30px;">
        <div style="background: #111827; border: 1.5px solid rgba(245,158,11,0.4); border-radius: 20px; padding: 28px;">
          <div style="font-size: 14px; font-weight: 700; color: #F59E0B; margin-bottom: 12px; text-transform: uppercase;">
            🔥 Today's Question Card (Preview)
          </div>
          <div style="background: #1E293B; padding: 16px; border-radius: 12px; font-size: 16px; font-weight: 600; color: #FFFFFF; margin-bottom: 14px;">
            "Which planet in our solar system rotates clockwise?"
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div style="background: #0F172A; border: 1px solid #334155; padding: 10px 14px; border-radius: 8px; font-size: 14px; color: #CBD5E1;">A) Mars</div>
            <div style="background: #166534; border: 1px solid #22C55E; padding: 10px 14px; border-radius: 8px; font-size: 14px; color: #FFFFFF; font-weight: 600;">B) Venus (Correct Answer ✓)</div>
            <div style="background: #0F172A; border: 1px solid #334155; padding: 10px 14px; border-radius: 8px; font-size: 14px; color: #CBD5E1;">C) Jupiter</div>
            <div style="background: #0F172A; border: 1px solid #334155; padding: 10px 14px; border-radius: 8px; font-size: 14px; color: #CBD5E1;">D) Mercury</div>
          </div>
        </div>

        <div style="background: #111827; border: 1px solid #1F2937; border-radius: 20px; padding: 28px; display: flex; flex-direction: column; justify-content: center;">
          <h3 style="font-size: 22px; color: #FFFFFF; font-weight: 700; margin-bottom: 14px;">Why It Works:</h3>
          <ul style="list-style: none; display: flex; flex-direction: column; gap: 14px; color: #94A3B8; font-size: 15px; line-height: 1.5;">
            <li>⏱️ <strong>1 Try Per Day:</strong> Students think carefully before tapping; no spamming.</li>
            <li>🔥 <strong>Daily Streak Flame:</strong> Missing a day resets the streak. Students build the habit of checking in every morning.</li>
            <li>🏆 <strong>Academic Celebration:</strong> High streak students receive recognition on the school leaderboard.</li>
          </ul>
        </div>
      </div>
    `
  },
  {
    num: 8,
    title: 'Child Safety & $0 Financial Guarantee',
    subtitle: 'Total peace of mind for the school administration',
    tag: 'EXECUTIVE SUMMARY',
    content: `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 30px;">
        <div style="background: #111827; border: 1.5px solid rgba(34,197,94,0.4); border-radius: 20px; padding: 28px;">
          <div style="font-size: 14px; font-weight: 700; color: #4ADE80; margin-bottom: 12px; text-transform: uppercase;">
            🛡️ Child Safety & Privacy
          </div>
          <ul style="list-style: none; display: flex; flex-direction: column; gap: 12px; color: #CBD5E1; font-size: 15px; line-height: 1.5;">
            <li>• <strong>Junior School (Nursery–5) 100% Private:</strong> Photos of young kids never exposed to the public.</li>
            <li>• <strong>No Phone Number Leaks:</strong> Parent contact numbers are permanently hidden.</li>
            <li>• <strong>School-Only Access:</strong> Verified invite codes prevent strangers from registering.</li>
          </ul>
        </div>

        <div style="background: #111827; border: 1.5px solid rgba(43,75,255,0.4); border-radius: 20px; padding: 28px;">
          <div style="font-size: 14px; font-weight: 700; color: #60A5FA; margin-bottom: 12px; text-transform: uppercase;">
            💰 Zero Cost Architecture
          </div>
          <ul style="list-style: none; display: flex; flex-direction: column; gap: 12px; color: #CBD5E1; font-size: 15px; line-height: 1.5;">
            <li>• <strong>100,000 Photos Free:</strong> Cloudflare R2 stores media with $0 download fees.</li>
            <li>• <strong>5 Million Reads Daily:</strong> Cloudflare D1 edge database serves thousands for $0.</li>
            <li>• <strong>$0 During Holidays:</strong> Zero wasted server fees when school is on break.</li>
          </ul>
        </div>
      </div>
      <div style="margin-top: 40px; text-align: center; background: rgba(43,75,255,0.15); border: 1px solid #2B4BFF; border-radius: 14px; padding: 16px; color: #FFFFFF; font-size: 16px; font-weight: 600;">
        🚀 Ready to deploy on dpsbuzz.in • A modern, prestigious digital campus for the school!
      </div>
    `
  }
];

function buildSlideHtml(slide) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    body {
      background: #0A0F1D;
      color: #F8FAFC;
      width: 1440px;
      height: 810px;
      padding: 50px 70px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }
    .header-tag {
      font-size: 13px;
      font-weight: 700;
      color: #60A5FA;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .slide-title {
      font-size: 38px;
      font-weight: 800;
      color: #FFFFFF;
      letter-spacing: -0.5px;
      margin-bottom: 6px;
    }
    .slide-subtitle {
      font-size: 17px;
      color: #94A3B8;
      font-weight: 400;
    }
    .footer-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #1E293B;
      padding-top: 16px;
      font-size: 13px;
      color: #64748B;
    }
  </style>
</head>
<body>
  <div>
    <div class="header-tag">${slide.tag}</div>
    <div class="slide-title">${slide.title}</div>
    <div class="slide-subtitle">${slide.subtitle}</div>
    ${slide.content}
  </div>
  <div class="footer-bar">
    <span>DPS BUZZ • Presentation for School Leadership</span>
    <span>Slide ${slide.num} of 8</span>
  </div>
</body>
</html>
  `;
}

async function renderSlides() {
  console.log('Rendering 8 high-resolution 16:9 presentation slides with Playwright...');
  const browser = await chromium.launch({ headless: true });

  for (const s of slides) {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 810 },
      deviceScaleFactor: 2, // 2x crispness
    });
    const html = buildSlideHtml(s);
    await page.setContent(html, { waitUntil: 'networkidle' });
    const imgPath = path.join(ARTIFACT_DIR, `slide_${s.num}.png`);
    await page.screenshot({ path: imgPath });
    console.log(`✓ Rendered slide_${s.num}.png`);
    await page.close();
  }

  await browser.close();
  console.log('🎉 All 8 presentation slide images rendered successfully!');
}

renderSlides().catch(console.error);
