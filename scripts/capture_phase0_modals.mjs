import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/shash/.gemini/antigravity/brain/6613c7aa-838b-45cc-9390-21cd395b212e/phase0_screenshots';

async function captureModals() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1.5,
  });

  await context.addInitScript(() => {
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
  });

  const page = await context.newPage();

  // 1. Capture Menu Open
  await page.goto('http://localhost:3005/home', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  const menuButton = page.locator('header button[aria-label="Open Menu"], header button:has(svg.lucide-menu)');
  if (await menuButton.count() > 0) {
    await menuButton.first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'menu_390px.png') });
    console.log('✓ Saved menu_390px.png');
  }

  // 2. Capture New Group Modal on Chats
  await page.goto('http://localhost:3005/chats', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  const newGroupBtn = page.locator('button:has-text("New Group")');
  if (await newGroupBtn.count() > 0) {
    await newGroupBtn.first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'new_group_modal_390px.png') });
    console.log('✓ Saved new_group_modal_390px.png');
  }

  // 3. Capture Edit Profile on Settings
  await page.goto('http://localhost:3005/settings', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  const editProfileBtn = page.locator('button:has-text("Edit Profile"), a:has-text("Edit Profile")');
  if (await editProfileBtn.count() > 0) {
    await editProfileBtn.first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'edit_profile_390px.png') });
    console.log('✓ Saved edit_profile_390px.png');
  }

  await browser.close();
}

captureModals();
