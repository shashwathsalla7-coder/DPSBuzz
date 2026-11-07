import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/shash/.gemini/antigravity/brain/6613c7aa-838b-45cc-9390-21cd395b212e/mobile_screenshots';

async function testCampus Wire() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15',
  });

  const page = await context.newPage();

  console.log('Logging in as shashwath71845...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'load' });
  await page.fill('input[type="text"]', 'shashwath71845');
  await page.fill('input[type="password"]', '71845shashwath123');
  await page.click('button[type="submit"]', { timeout: 5000 });
  await page.waitForURL('**/home', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);

  console.log('Navigating to http://localhost:3000/wire...');
  await page.goto('http://localhost:3000/wire', { waitUntil: 'load' });
  console.log('Waiting 5 seconds for Campus Wire mobile inbox to settle...');
  await page.waitForTimeout(5000);

  const shot1 = path.join(ARTIFACT_DIR, '24_mobile_wire_inbox.png');
  await page.screenshot({ path: shot1 });
  console.log('✅ [CAPTURED] 24_mobile_wire_inbox.png');

  // Click on the first chat item
  const chatButtons = page.locator('aside button.w-full');
  const count = await chatButtons.count();
  console.log(`Found ${count} chat room buttons.`);
  if (count > 0) {
    console.log('Clicking first classroom conversation button...');
    await chatButtons.first().click();
    console.log('Waiting 5 seconds for conversation screen to settle...');
    await page.waitForTimeout(5000);

    const shot2 = path.join(ARTIFACT_DIR, '25_mobile_wire_classroom_chat.png');
    await page.screenshot({ path: shot2 });
    console.log('✅ [CAPTURED] 25_mobile_wire_classroom_chat.png');

    // Open faculty notice modal
    const noticeBtn = page.locator('button[title*="Notice"]').first();
    if (await noticeBtn.isVisible()) {
      console.log('Opening faculty notice modal...');
      await noticeBtn.click();
      console.log('Waiting 5 seconds for notice modal to settle...');
      await page.waitForTimeout(5000);

      const shot3 = path.join(ARTIFACT_DIR, '26_mobile_wire_faculty_notice.png');
      await page.screenshot({ path: shot3 });
      console.log('✅ [CAPTURED] 26_mobile_wire_faculty_notice.png');
    }
  }

  await browser.close();
  console.log('Test completed successfully!');
}

testCampus Wire().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
