import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/shash/.gemini/antigravity/brain/6613c7aa-838b-45cc-9390-21cd395b212e/phase0_screenshots';
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
  { name: 'games', path: '/game', requiresAuth: true },
  { name: 'settings', path: '/settings', requiresAuth: true },
  { name: 'admin_login', path: '/admin/login', requiresAuth: false },
  { name: 'admin_panel', path: '/admin', requiresAdmin: true },
];

async function captureAll() {
  console.log(`Starting Phase 0 Screenshot Capture across ${WIDTHS.length} viewports...`);
  const browser = await chromium.launch({ headless: true });

  for (const width of WIDTHS) {
    const height = width === 1280 ? 800 : 844;
    console.log(`\n--- Capturing Viewport ${width}x${height} ---`);

    for (const screen of SCREENS) {
      try {
        const context = await browser.newContext({
          viewport: { width, height },
          deviceScaleFactor: 1.5,
        });

        await context.addInitScript(({ requiresAuth, requiresAdmin }) => {
          if (requiresAdmin) {
            localStorage.setItem('dpsbuzz_admin_token', 'admin_session_valid');
            localStorage.setItem('dpsbuzz_admin_authenticated', 'true');
            localStorage.setItem('dpsbuzz_shashwath_authenticated', 'true');
            localStorage.setItem(
              'dpsbuzz_user',
              JSON.stringify({
                id: 'admin-uuid',
                username: 'shashwath71845',
                fullName: 'Shashwath Salla',
                role: 'admin',
              })
            );
          } else if (requiresAuth) {
            const testStudent = {
              id: 'test-student-uuid-001',
              username: 'testaccount',
              name: 'Test Student',
              fullName: 'Test Student',
              class: '8',
              section: 'B',
              admissionNumber: 'DPS-TEST-001',
              avatar:
                'https://res.cloudinary.com/ogfaxmjw/image/upload/v1793467674/dpsbuzz/avatars/avatar_shashwath71845.jpg',
              spiritPoints: 125,
              streakDays: 5,
              role: 'student',
              bio: 'Class 8-B Student • Tech & Sports enthusiast ✨',
            };
            localStorage.setItem('dpsbuzz_user', JSON.stringify(testStudent));
            localStorage.setItem('dpsbuzz_role', 'student');
          }
        }, { requiresAuth: screen.requiresAuth, requiresAdmin: screen.requiresAdmin });

        const page = await context.newPage();
        const url = `${BASE_URL}${screen.path}`;
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(1000); // allow hydration & fonts to render

        const fileName = `${screen.name}_${width}px.png`;
        const filePath = path.join(ARTIFACT_DIR, fileName);
        await page.screenshot({ path: filePath, fullPage: false });
        console.log(`✓ Saved ${fileName}`);

        await context.close();
      } catch (err) {
        console.error(`✗ Error capturing ${screen.name} at ${width}px:`, err.message);
      }
    }
  }

  await browser.close();
  console.log(`\n🎉 All Phase 0 screenshots captured and saved to: ${ARTIFACT_DIR}`);
}

captureAll();
