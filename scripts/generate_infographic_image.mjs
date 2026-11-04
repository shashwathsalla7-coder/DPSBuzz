import { chromium } from 'playwright';
import path from 'path';

const OUTPUT_PATH = 'C:/Users/shash/.gemini/antigravity/brain/6613c7aa-838b-45cc-9390-21cd395b212e/architecture_comparison_infographic.png';

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>DPS Buzz - Architecture Comparison</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      background: #0B0F19;
      color: #F8FAFC;
      padding: 40px;
      width: 1400px;
      height: 960px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    header {
      text-align: center;
      margin-bottom: 24px;
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: rgba(43, 75, 255, 0.15);
      border: 1px solid rgba(43, 75, 255, 0.4);
      padding: 6px 16px;
      border-radius: 9999px;
      color: #60A5FA;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    h1 {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #FFFFFF;
      margin-bottom: 8px;
    }
    p.subtitle {
      font-size: 15px;
      color: #94A3B8;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 28px;
      flex: 1;
    }
    .card {
      background: #111827;
      border: 1px solid #1F2937;
      border-radius: 20px;
      padding: 28px;
      display: flex;
      flex-direction: column;
      position: relative;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    }
    .card.free {
      border-color: rgba(34, 197, 94, 0.35);
      background: linear-gradient(180deg, rgba(34, 197, 94, 0.05) 0%, rgba(17, 24, 39, 1) 100%);
    }
    .card.paid {
      border-color: rgba(59, 130, 246, 0.35);
      background: linear-gradient(180deg, rgba(59, 130, 246, 0.05) 0%, rgba(17, 24, 39, 1) 100%);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      font-size: 12px;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 9999px;
      width: fit-content;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge.free {
      background: rgba(34, 197, 94, 0.2);
      color: #4ADE80;
      border: 1px solid rgba(34, 197, 94, 0.4);
    }
    .badge.paid {
      background: rgba(59, 130, 246, 0.2);
      color: #60A5FA;
      border: 1px solid rgba(59, 130, 246, 0.4);
    }
    .card-title {
      font-size: 22px;
      font-weight: 700;
      color: #FFFFFF;
      margin-bottom: 4px;
    }
    .price-row {
      display: flex;
      align-items: baseline;
      gap: 6px;
      margin-bottom: 18px;
      padding-bottom: 14px;
      border-bottom: 1px solid #1F2937;
    }
    .price {
      font-size: 36px;
      font-weight: 800;
      color: #FFFFFF;
    }
    .period {
      font-size: 14px;
      color: #64748B;
    }
    .section-label {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .section-label.pros {
      color: #34D399;
    }
    .section-label.cons {
      color: #F87171;
      margin-top: 14px;
    }
    ul.item-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 7px;
    }
    li.item {
      font-size: 13.5px;
      line-height: 1.45;
      display: flex;
      align-items: flex-start;
      gap: 8px;
      color: #E2E8F0;
    }
    .icon {
      font-size: 14px;
      margin-top: 1px;
      flex-shrink: 0;
    }
    .item strong {
      color: #FFFFFF;
    }
    .footer-note {
      text-align: center;
      font-size: 13px;
      color: #64748B;
      margin-top: 18px;
      padding-top: 12px;
      border-top: 1px solid #1F2937;
    }
  </style>
</head>
<body>

  <header>
    <div class="brand">DPS BUZZ • SCALING ARCHITECTURE COMPARISON</div>
    <h1>Comparing the Two Paths for 5,500 Students</h1>
    <p class="subtitle">A clear breakdown of Advantages vs. Disadvantages: Almost Free ($0/mo) vs. Paid Cloud ($45/mo)</p>
  </header>

  <div class="grid">

    <!-- OPTION A: ALMOST FREE -->
    <div class="card free">
      <div class="badge free">Option A • Smart Edge Architecture</div>
      <div class="card-title">Almost 100% Free Plan</div>
      <div class="price-row">
        <span class="price">$0.00</span>
        <span class="period">/ month (Max ~$1-$2 at heavy volume)</span>
      </div>

      <div class="section-label pros">
        <span>✓</span> ADVANTAGES (THE PROS)
      </div>
      <ul class="item-list">
        <li class="item"><span class="icon">💰</span> <div><strong>Zero Monthly Bill:</strong> Completely free for the school with no recurring charges.</div></li>
        <li class="item"><span class="icon">📸</span> <div><strong>100,000 Free Photos:</strong> Cloudflare R2 gives 10 GB free with <strong>$0 egress fees</strong> forever.</div></li>
        <li class="item"><span class="icon">⚡</span> <div><strong>5 Million Free Reads Daily:</strong> Cloudflare D1 handles high-traffic student reads for $0.</div></li>
        <li class="item"><span class="icon">🚀</span> <div><strong>Ultra-Fast Edge Caching:</strong> 15ms feed load times directly from Mumbai edge cache.</div></li>
        <li class="item"><span class="icon">🏖️</span> <div><strong>No Waste During Vacations:</strong> Zero fees during 2-month summer and winter breaks.</div></li>
      </ul>

      <div class="section-label cons">
        <span>✕</span> DISADVANTAGES (THE CONS)
      </div>
      <ul class="item-list">
        <li class="item"><span class="icon">⏳</span> <div><strong>30–60s Feed Delay:</strong> Friends see new posts after a short cache delay (not 0ms).</div></li>
        <li class="item"><span class="icon">📞</span> <div><strong>10,000-Min Monthly Call Cap:</strong> Free ZEGOCLOUD minutes limit long group calls.</div></li>
        <li class="item"><span class="icon">🔄</span> <div><strong>Dual-Database Sync:</strong> Must synchronize Cloudflare D1 edge store and Supabase.</div></li>
        <li class="item"><span class="icon">📱</span> <div><strong>1-2s Image Compression Delay:</strong> Budget phones take a second to shrink big photos.</div></li>
        <li class="item"><span class="icon">💤</span> <div><strong>Holiday Inactivity Rule:</strong> Must log in once every 7 days during holidays to prevent Supabase sleep.</div></li>
      </ul>
    </div>

    <!-- OPTION B: PAID CLOUD -->
    <div class="card paid">
      <div class="badge paid">Option B • Enterprise Cloud Setup</div>
      <div class="card-title">Dedicated Paid Cloud</div>
      <div class="price-row">
        <span class="price">~$45.00</span>
        <span class="period">/ month (Supabase Pro $25 + Vercel Pro $20)</span>
      </div>

      <div class="section-label pros">
        <span>✓</span> ADVANTAGES (THE PROS)
      </div>
      <ul class="item-list">
        <li class="item"><span class="icon">⚡</span> <div><strong>Instant 0-Second Sync:</strong> Friends see new posts and comments the exact millisecond they post.</div></li>
        <li class="item"><span class="icon">🏢</span> <div><strong>10,000 Simultaneous Connections:</strong> Supavisor pooler easily absorbs all 5,500 students online at once.</div></li>
        <li class="item"><span class="icon">🛡️</span> <div><strong>99.99% Uptime SLA:</strong> Enterprise priority support with automated daily database backups.</div></li>
        <li class="item"><span class="icon">📞</span> <div><strong>Reliable Calling Everywhere:</strong> Dedicated TURN relay bypasses strict school Wi-Fi firewalls.</div></li>
        <li class="item"><span class="icon">😌</span> <div><strong>Zero Maintenance Peace of Mind:</strong> Never pauses during holidays, no manual caching tricks.</div></li>
      </ul>

      <div class="section-label cons">
        <span>✕</span> DISADVANTAGES (THE CONS)
      </div>
      <ul class="item-list">
        <li class="item"><span class="icon">💸</span> <div><strong>Recurring Cost:</strong> ₹3,800 to ₹4,200 INR charged every month ($540/year).</div></li>
        <li class="item"><span class="icon">💳</span> <div><strong>Credit Card Required:</strong> Requires an international payment card for automatic recurring billing.</div></li>
        <li class="item"><span class="icon">📉</span> <div><strong>Charged When Idle:</strong> You still pay full price during 2-month summer school holidays.</div></li>
        <li class="item"><span class="icon">⚖️</span> <div><strong>Overkill for Early Stage:</strong> Unnecessary expense while user activity is still growing.</div></li>
      </ul>
    </div>

  </div>

  <div class="footer-note">
    Recommendation: Start with <strong>Option A (Almost Free)</strong> to launch without cost. If student calling surges or real-time needs demand it, upgrade seamlessly to <strong>Option B</strong> later.
  </div>

</body>
</html>
`;

async function renderImage() {
  console.log('Rendering infographic with Playwright...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1400, height: 960 },
    deviceScaleFactor: 2, // 2x retina crispness
  });

  await page.setContent(htmlContent, { waitUntil: 'networkidle' });
  await page.screenshot({ path: OUTPUT_PATH, fullPage: true });
  await browser.close();

  console.log('✅ Infographic image successfully generated at:', OUTPUT_PATH);
}

renderImage();
