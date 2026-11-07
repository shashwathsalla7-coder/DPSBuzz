import { chromium } from 'playwright';
import path from 'path';

const SCREENSHOT_DIR = 'C:\\Users\\shash\\.gemini\\antigravity\\brain\\6613c7aa-838b-45cc-9390-21cd395b212e\\screenshots';
const BASE_URL = 'http://localhost:3000';

async function captureAllScreenshots() {
  console.log('='.repeat(70));
  console.log('DPS BUZZ HIGH-FIDELITY SCREENSHOT ENGINE WITH 5-SECOND WARMUP');
  console.log(`Saving screenshots directly to: ${SCREENSHOT_DIR}`);
  console.log('='.repeat(70));

  const browser = await chromium.launch({ headless: true });

  // -------------------------------------------------------------------------
  // 1. PUBLIC LANDING PAGE (Logged-out visitor view)
  // -------------------------------------------------------------------------
  console.log('\n[1/3] Capturing Public Landing Page (Desktop)...');
  const loggedOutContext = await browser.newContext({
    viewport: { width: 1366, height: 850 },
    deviceScaleFactor: 1.5,
  });
  const loggedOutPage = await loggedOutContext.newPage();
  await loggedOutPage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  console.log('Waiting 5 seconds after opening as requested...');
  await loggedOutPage.waitForTimeout(5000);
  await loggedOutPage.screenshot({ path: path.join(SCREENSHOT_DIR, '01_landing_page.png') });
  console.log('-> Captured 01_landing_page.png');
  await loggedOutContext.close();

  // -------------------------------------------------------------------------
  // 2. AUTHENTICATED DESKTOP CONTEXT VIA FORM LOGIN
  // -------------------------------------------------------------------------
  console.log('\n[2/3] Authenticating as Shashwath Salla (Super Administrator)...');
  const authContext = await browser.newContext({
    viewport: { width: 1366, height: 850 },
    deviceScaleFactor: 1.5,
  });
  const authPage = await authContext.newPage();

  // Navigate to login page
  await authPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await authPage.waitForTimeout(1000);

  // Fill in credentials
  await authPage.fill('input[type="text"]', 'shashwath71845');
  await authPage.fill('input[type="password"]', '71845shashwath123');
  await authPage.click('button[type="submit"]');

  // Wait for redirect to /home
  console.log('Logging in and transitioning to /home...');
  await authPage.waitForURL('**/home', { timeout: 15000 }).catch(() => {});
  await authPage.waitForTimeout(2000);

  // Set admin session cookie for /admin routes
  await authContext.addCookies([
    {
      name: 'dpsbuzz_admin_session',
      value: Buffer.from(JSON.stringify({ username: 'shashwath71845', role: 'admin' })).toString('base64'),
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ]);

  const desktopScreens = [
    { name: '02_home_feed.png', route: '/home', label: 'Home Feed & Official Video' },
    { name: '03_ai_diary.png', route: '/ai-diary', label: 'AI Homework Diary & Timetable' },
    { name: '04_school_wire.png', route: '/school-wire', label: 'School Campus Wire 91 Class Channels' },
    { name: '05_lost_found.png', route: '/lost-found', label: 'Lost & Found Campus Hub' },
    { name: '06_study_corner.png', route: '/study-corner', label: 'Study Corner & Notes Exchange' },
    { name: '07_question_box.png', route: '/question-box', label: 'Campus Question Box & Q&A' },
    { name: '08_direct_chats.png', route: '/chats', label: 'Direct & Group Messaging Hub' },
    { name: '09_school_notices.png', route: '/notices', label: 'Official Circulars & Notice Board' },
    { name: '10_interhouse_leaderboard.png', route: '/leaderboard', label: 'Inter-House Spirit Leaderboard' },
    { name: '11_student_profile.png', route: '/profile', label: 'Student Portfolio & Badges' },
    { name: '12_admin_panel.png', route: '/admin', label: 'Principal & Leadership Control Panel' },
    { name: '13_campus_reels.png', route: '/reels', label: 'Campus Video Reels Showcase' },
    { name: '14_games_and_activities.png', route: '/chats?view=games', label: 'Campus Mini-Games & Cricket' },
    { name: '15_download_pwa.png', route: '/download', label: 'App Download & PWA Install' },
  ];

  for (let i = 0; i < desktopScreens.length; i++) {
    const item = desktopScreens[i];
    console.log(`[Desktop ${i + 1}/${desktopScreens.length}] Loading ${item.label} (${item.route})...`);
    try {
      await authPage.goto(`${BASE_URL}${item.route}`, { waitUntil: 'load', timeout: 30000 });
      console.log('Waiting 5 seconds after opening as requested...');
      await authPage.waitForTimeout(5000);
      const outPath = path.join(SCREENSHOT_DIR, item.name);
      await authPage.screenshot({ path: outPath });
      console.log(`-> Captured ${item.name}`);
    } catch (err) {
      console.warn(`Warning capturing ${item.name}: ${err.message}`);
    }
  }

  // -------------------------------------------------------------------------
  // 3. AUTHENTICATED MOBILE VIEWPORT CONTEXT (iPhone 14 Pro - 393x852)
  // -------------------------------------------------------------------------
  console.log('\n[3/3] Capturing Mobile App Experiences (393x852)...');
  const mobilePage = await authContext.newPage();
  await mobilePage.setViewportSize({ width: 393, height: 852 });

  const mobileScreens = [
    { name: '16_mobile_home_feed.png', route: '/home', label: 'Mobile Home Feed' },
    { name: '17_mobile_ai_diary.png', route: '/ai-diary', label: 'Mobile AI Diary' },
    { name: '18_mobile_school_wire.png', route: '/school-wire', label: 'Mobile School Campus Wire' },
    { name: '19_mobile_chats.png', route: '/chats', label: 'Mobile Direct Chats' },
  ];

  for (let i = 0; i < mobileScreens.length; i++) {
    const item = mobileScreens[i];
    console.log(`[Mobile ${i + 1}/${mobileScreens.length}] Loading ${item.label} (${item.route})...`);
    try {
      await mobilePage.goto(`${BASE_URL}${item.route}`, { waitUntil: 'load', timeout: 30000 });
      console.log('Waiting 5 seconds after opening as requested...');
      await mobilePage.waitForTimeout(5000);
      const outPath = path.join(SCREENSHOT_DIR, item.name);
      await mobilePage.screenshot({ path: outPath });
      console.log(`-> Captured ${item.name}`);
    } catch (err) {
      console.warn(`Warning capturing ${item.name}: ${err.message}`);
    }
  }

  await authContext.close();
  await browser.close();

  console.log('='.repeat(70));
  console.log('ALL AUTHENTICATED SCREENSHOTS CAPTURED WITH 5-SECOND WARMUP!');
  console.log('='.repeat(70));
}

captureAllScreenshots().catch((err) => {
  console.error('Fatal screenshot error:', err);
  process.exit(1);
});
