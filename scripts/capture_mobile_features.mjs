import { chromium } from 'playwright';
import path from 'path';

const MOBILE_DIR = 'C:/Users/shash/.gemini/antigravity/brain/6613c7aa-838b-45cc-9390-21cd395b212e/mobile_screenshots';
const BASE_URL = 'http://localhost:3000';

async function runMobileFeatureCapture() {
  console.log('='.repeat(70));
  console.log('DPS BUZZ MOBILE FEATURE CAPTURE SUITE (5-SEC WARMUP & INTERACTIVE CLICKS)');
  console.log(`Target: ${MOBILE_DIR}`);
  console.log('='.repeat(70));

  const browser = await chromium.launch({ headless: true });

  // Mobile Context Definition (iPhone 14 Pro - 393x852 @ 2x)
  const mobileContext = await browser.newContext({
    viewport: { width: 393, height: 852 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  });

  const page = await mobileContext.newPage();

  async function snap(filename, label) {
    console.log(`Waiting 5 seconds for [${label}] to settle...`);
    await page.waitForTimeout(5000);
    const targetPath = path.join(MOBILE_DIR, filename);
    await page.screenshot({ path: targetPath });
    console.log(`✅ [CAPTURED] ${filename} - ${label}`);
  }

  // 1. Mobile Landing Page
  console.log('\n--- Step 1: Mobile Landing Page ---');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'load' });
  await snap('01_mobile_landing.png', 'Public Mobile Landing View');

  // 2. Mobile Login Page
  console.log('\n--- Step 2: Mobile Login Screen ---');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'load' });
  await snap('02_mobile_login.png', 'Student & Faculty Login Portal');

  // Perform authentic UI login as Shashwath Salla
  console.log('\n--- Authenticating as Shashwath Salla (Super Administrator) ---');
  await page.fill('input[type="text"]', 'shashwath71845');
  await page.fill('input[type="password"]', process.env.ADMIN_PASSWORD || '');
  await page.click('button[type="submit"]', { timeout: 5000 });
  await page.waitForURL('**/home', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);

  // Set admin session cookie
  await mobileContext.addCookies([
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

  // 3. Mobile Home Feed
  console.log('\n--- Step 3: Mobile Home Feed & Official Launch Video ---');
  await page.goto(`${BASE_URL}/home`, { waitUntil: 'load' });
  await snap('03_mobile_home_feed.png', 'Mobile Home Feed with Official Video & Stories');

  // 4. Mobile AI Homework Diary
  console.log('\n--- Step 4: Mobile AI Homework Diary ---');
  await page.goto(`${BASE_URL}/ai-diary`, { waitUntil: 'load' });
  await snap('04_mobile_ai_diary.png', 'Mobile AI Section Homework Diary');

  // 5. Mobile AI Diary Section Selector / Action Click
  console.log('\n--- Step 5: Mobile AI Diary Class Selector Click ---');
  try {
    const classSelect = await page.$('select, button:has-text("Class"), div[role="combobox"]');
    if (classSelect) {
      await classSelect.click({ timeout: 2000, force: true }).catch(() => {});
      console.log('Clicked Section Selector...');
      await page.waitForTimeout(1000);
    }
  } catch {}
  await snap('05_mobile_ai_diary_classes.png', 'Mobile AI Diary Section Picker');

  // 6. Mobile School Campus Wire (91 Class Channels)
  console.log('\n--- Step 6: Mobile School Campus Wire ---');
  await page.goto(`${BASE_URL}/school-wire`, { waitUntil: 'load' });
  await snap('06_mobile_school_wire.png', 'Mobile 91 Class Campus Wire Channels');

  // 7. Click into Class Channel (e.g. Class 10-A)
  console.log('\n--- Step 7: Click into Official Class Campus Wire Channel ---');
  try {
    const channelItem = await page.$('div:has-text("Class 10"), button:has-text("Class 10"), div[class*="channel"], div:has-text("10-A")');
    if (channelItem) {
      await channelItem.click({ timeout: 2000, force: true }).catch(() => {});
      console.log('Clicked Class Channel row...');
      await page.waitForTimeout(2000);
    }
  } catch {}
  await snap('07_mobile_class_channel_chat.png', 'Inside Official Class Campus Wire Channel');

  // 8. Mobile Lost & Found Hub
  console.log('\n--- Step 8: Mobile Lost & Found Campus Hub ---');
  await page.goto(`${BASE_URL}/lost-found`, { waitUntil: 'load' });
  await snap('08_mobile_lost_found.png', 'Mobile Campus Lost & Found System');

  // 9. Mobile Study Corner
  console.log('\n--- Step 9: Mobile Study Corner & Notes Exchange ---');
  await page.goto(`${BASE_URL}/study-corner`, { waitUntil: 'load' });
  await snap('09_mobile_study_corner.png', 'Mobile Study Corner & Peer Repository');

  // 10. Click Subject Filter in Study Corner
  console.log('\n--- Step 10: Click Filter in Study Corner ---');
  try {
    const filterBtn = await page.$('button:has-text("Mathematics"), button:has-text("Science"), button:has-text("Class")');
    if (filterBtn) {
      await filterBtn.click({ timeout: 2000, force: true }).catch(() => {});
      console.log('Clicked Subject Filter...');
      await page.waitForTimeout(1000);
    }
  } catch {}
  await snap('10_mobile_study_corner_filtered.png', 'Mobile Study Corner Filtered Notes');

  // 11. Mobile Campus Question Box
  console.log('\n--- Step 11: Mobile Campus Question Box & Q&A ---');
  await page.goto(`${BASE_URL}/question-box`, { waitUntil: 'load' });
  await snap('11_mobile_question_box.png', 'Mobile Student Question Box & Daily Quiz');

  // 12. Mobile Direct & Group Chats Hub
  console.log('\n--- Step 12: Mobile Direct & Group Chats Hub ---');
  await page.goto(`${BASE_URL}/chats`, { waitUntil: 'load' });
  await snap('12_mobile_chats_inbox.png', 'Mobile Chat Messaging Inbox');

  // 13. Click into a Conversation
  console.log('\n--- Step 13: Click into Active Chat Conversation ---');
  try {
    const chatRow = await page.$('div[class*="chat-item"], div:has-text("Sahana"), div:has-text("Rishi"), div[role="button"]:has-text("Chat")');
    if (chatRow) {
      await chatRow.click({ timeout: 2000, force: true }).catch(() => {});
      console.log('Clicked Chat row...');
      await page.waitForTimeout(2000);
    }
  } catch {}
  await snap('13_mobile_chat_conversation.png', 'Inside Active Mobile Direct Message');

  // 14. Mobile Official Circulars & Notices
  console.log('\n--- Step 14: Mobile Official Circulars & Notices ---');
  await page.goto(`${BASE_URL}/notices`, { waitUntil: 'load' });
  await snap('14_mobile_school_notices.png', 'Mobile Official School Notices & Circulars');

  // 15. Mobile Inter-House Spirit Leaderboard
  console.log('\n--- Step 15: Mobile Inter-House Spirit Leaderboard ---');
  await page.goto(`${BASE_URL}/leaderboard`, { waitUntil: 'load' });
  await snap('15_mobile_leaderboard.png', 'Mobile Inter-House Spirit Leaderboard');

  // 16. Mobile Student Profile & Badges
  console.log('\n--- Step 16: Mobile Student Profile & Portfolio ---');
  await page.goto(`${BASE_URL}/profile`, { waitUntil: 'load' });
  await snap('16_mobile_student_profile.png', 'Mobile Student Profile & Badges');

  // 17. Mobile Campus Video Reels
  console.log('\n--- Step 17: Mobile Campus Video Reels ---');
  await page.goto(`${BASE_URL}/reels`, { waitUntil: 'load' });
  await snap('17_mobile_campus_reels.png', 'Mobile Student Video Reels Player');

  // 18. Mobile Campus Mini-Games & Cricket Activities
  console.log('\n--- Step 18: Mobile Campus Games Arena ---');
  await page.goto(`${BASE_URL}/chats?view=games`, { waitUntil: 'load' });
  await snap('18_mobile_games_arena.png', 'Mobile Campus Cricket & Connect 4 Games');

  // 19. Mobile Super Admin & Principal Command Center
  console.log('\n--- Step 19: Mobile Admin & Principal Command Center ---');
  await page.goto(`${BASE_URL}/admin`, { waitUntil: 'load' });
  await snap('19_mobile_admin_command.png', 'Mobile Super Admin & Moderation Console');

  // 20. Mobile Student Circles & Clubs
  console.log('\n--- Step 20: Mobile Student Circles & Clubs ---');
  await page.goto(`${BASE_URL}/groups`, { waitUntil: 'load' });
  await snap('20_mobile_student_groups.png', 'Mobile Campus Clubs & Interest Circles');

  // 21. Mobile Student Alerts & Notifications
  console.log('\n--- Step 21: Mobile Student Alerts & Notifications ---');
  await page.goto(`${BASE_URL}/notifications`, { waitUntil: 'load' });
  await snap('21_mobile_notifications.png', 'Mobile Notification Alerts Feed');

  // 22. Mobile Account Settings & Privacy
  console.log('\n--- Step 22: Mobile Account Settings & Privacy ---');
  await page.goto(`${BASE_URL}/settings`, { waitUntil: 'load' });
  await snap('22_mobile_settings.png', 'Mobile Student Privacy & App Settings');

  // 23. Mobile PWA & Download Desk
  console.log('\n--- Step 23: Mobile PWA & APK Installation Desk ---');
  await page.goto(`${BASE_URL}/download`, { waitUntil: 'load' });
  await snap('23_mobile_download_pwa.png', 'Mobile App Download & PWA Install Desk');

  await mobileContext.close();
  await browser.close();

  console.log('='.repeat(70));
  console.log('ALL 23 MOBILE FEATURE SCREENSHOTS CAPTURED WITH 5-SEC WARMUP & CLICKS!');
  console.log('='.repeat(70));
}

runMobileFeatureCapture().catch((err) => {
  console.error('Fatal mobile capture error:', err);
  process.exit(1);
});
