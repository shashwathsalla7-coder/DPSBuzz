import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  const adminObj = {
    id: 'admin-shashwath-id',
    username: 'shashwath71845',
    fullName: 'Shashwath Salla',
    role: 'admin',
  };

  const adminSessionB64 = Buffer.from(JSON.stringify(adminObj)).toString('base64');

  await context.addCookies([
    {
      name: 'dpsbuzz_user',
      value: encodeURIComponent(JSON.stringify(adminObj)),
      url: 'http://localhost:3005',
    },
    {
      name: 'dpsbuzz_admin_session',
      value: adminSessionB64,
      url: 'http://localhost:3005',
    },
  ]);

  await context.addInitScript((adm) => {
    localStorage.setItem('dpsbuzz_user', JSON.stringify(adm));
    localStorage.setItem('dpsbuzz_role', 'admin');
    localStorage.setItem('dpsbuzz_admin_token', 'admin_session_valid');
    localStorage.setItem('dpsbuzz_admin_authenticated', 'true');
    localStorage.setItem('dpsbuzz_shashwath_authenticated', 'true');
  }, adminObj);

  const page = await context.newPage();

  await page.goto('http://localhost:3005/admin');
  await page.waitForTimeout(2000);
  console.log('Final URL for /admin:', page.url());

  await browser.close();
}

test();
