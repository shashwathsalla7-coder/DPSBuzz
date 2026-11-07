import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/shash/.gemini/antigravity/brain/6613c7aa-838b-45cc-9390-21cd395b212e/mobile_screenshots';

async function testGroupInfo() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15',
  });

  const page = await context.newPage();

  await page.goto('http://localhost:3000/login', { waitUntil: 'load' });
  await page.fill('input[type="text"]', 'shashwath71845');
  await page.fill('input[type="password"]', '71845shashwath123');
  await page.click('button[type="submit"]', { timeout: 5000 });
  await page.waitForURL('**/home', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);

  await page.goto('http://localhost:3000/whatsapp', { waitUntil: 'load' });
  await page.waitForTimeout(4000);

  const chatButtons = page.locator('aside button.w-full');
  if (await chatButtons.count() > 0) {
    await chatButtons.first().click();
    await page.waitForTimeout(3000);

    // Tap on the chat room header to open Group Info
    const chatHeader = page.locator('main h2').first();
    if (await chatHeader.isVisible()) {
      await chatHeader.click();
      console.log('Opened Group Info sheet...');
      await page.waitForTimeout(5000);

      const shot3 = path.join(ARTIFACT_DIR, '26_mobile_whatsapp_classroom_info.png');
      await page.screenshot({ path: shot3 });
      console.log('✅ [CAPTURED] 26_mobile_whatsapp_classroom_info.png');
    }
  }

  await browser.close();
}

testGroupInfo().catch(console.error);
