import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/shash/.gemini/antigravity/brain/6613c7aa-838b-45cc-9390-21cd395b212e/phase3_screenshots';
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

const WIDTHS = [360, 390, 430, 1280];
const BASE_URL = 'http://localhost:3005';

const SCREENS = [
  { name: 'login', path: '/login', requiresAuth: false },
  { name: 'signup', path: '/signup', requiresAuth: false },
  { name: 'home', path: '/home', requiresAuth: true },
  { name: 'reels', path: '/reels', requiresAuth: true },
  { name: 'create_post', path: '/post/new', requiresAuth: true },
  { name: 'search_explore', path: '/search', requiresAuth: true },
  { name: 'notifications', path: '/notifications', requiresAuth: true },
  { name: 'chats_list', path: '/chats', requiresAuth: true },
  { name: 'chats_single', path: '/chats?u=rohan728', requiresAuth: true },
  { name: 'groups', path: '/groups', requiresAuth: true },
  { name: 'profile_own', path: '/profile', requiresAuth: true },
  { name: 'profile_other', path: '/u/rohan728', requiresAuth: true },
  { name: 'leaderboard', path: '/leaderboard', requiresAuth: true },
  { name: 'games', path: '/chats?view=games', requiresAuth: true },
  { name: 'settings', path: '/settings', requiresAuth: true },
  { name: 'admin_login', path: '/admin/login', requiresAuth: false },
  { name: 'admin_panel', path: '/admin', requiresAdmin: true },
];

async function captureAll() {
  console.log(`Starting Phase 3 Screenshot Capture across ${WIDTHS.length} viewports...`);
  const browser = await chromium.launch({ headless: true });

  const studentUser = {
    id: 'user-rohan728',
    username: 'rohan728',
    name: 'Rohan Sharma',
    fullName: 'Rohan Sharma',
    class: '8',
    section: 'A',
    avatar: 'https://res.cloudinary.com/ogfaxmjw/image/upload/v1793467674/dpsbuzz/avatars/avatar_shashwath71845.jpg',
    spiritPoints: 125,
    streakDays: 5,
    role: 'student',
    bio: 'Class 8-A Student • DPS Buzz Community ✨',
  };

  const adminUser = {
    id: 'admin-uuid',
    username: 'shashwath71845',
    fullName: 'Shashwath Salla',
    role: 'admin',
    class: 'Staff',
    section: 'Admin',
  };

  for (const width of WIDTHS) {
    const height = width === 1280 ? 800 : 844;
    console.log(`\n--- Capturing Viewport ${width}x${height} ---`);

    for (const screen of SCREENS) {
      try {
        const context = await browser.newContext({
          viewport: { width, height },
          deviceScaleFactor: 1.5,
        });

        if (screen.requiresAdmin) {
          await context.addCookies([
            {
              name: 'dpsbuzz_user',
              value: encodeURIComponent(JSON.stringify(adminUser)),
              url: BASE_URL,
            },
            {
              name: 'dpsbuzz_admin_session',
              value: Buffer.from(JSON.stringify(adminUser)).toString('base64'),
              url: BASE_URL,
            },
          ]);

          await context.addInitScript((adm) => {
            localStorage.setItem('dpsbuzz_admin_token', 'admin_session_valid');
            localStorage.setItem('dpsbuzz_admin_authenticated', 'true');
            localStorage.setItem('dpsbuzz_shashwath_authenticated', 'true');
            localStorage.setItem('dpsbuzz_user', JSON.stringify(adm));
            localStorage.setItem('dpsbuzz_role', 'admin');
          }, adminUser);
        } else if (screen.requiresAuth) {
          await context.addCookies([
            {
              name: 'dpsbuzz_user',
              value: encodeURIComponent(JSON.stringify(studentUser)),
              url: BASE_URL,
            },
          ]);

          await context.addInitScript((stu) => {
            localStorage.setItem('dpsbuzz_user', JSON.stringify(stu));
            localStorage.setItem('dpsbuzz_role', 'student');
          }, studentUser);
        }

        const page = await context.newPage();
        const url = `${BASE_URL}${screen.path}`;
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(600); // allow hydration & fonts to render

        const fileName = `${screen.name}_${width}px.png`;
        const filePath = path.join(ARTIFACT_DIR, fileName);
        await page.screenshot({ path: filePath, fullPage: false });
        console.log(`✓ Saved ${fileName} (URL: ${page.url()})`);

        await context.close();
      } catch (err) {
        console.error(`✗ Error capturing ${screen.name} at ${width}px:`, err.message);
      }
    }
  }

  await browser.close();
  console.log(`\n🎉 All Phase 3 screenshots captured and saved to: ${ARTIFACT_DIR}`);
}

captureAll();
