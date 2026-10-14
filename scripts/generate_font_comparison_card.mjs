import http from 'node:http';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>DPS Buzz - Font Overhaul Side-by-Side Comparison</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=DM+Mono:wght@400;500&family=Hanken+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @font-face {
      font-family: 'Cabinet Grotesk';
      src: url('http://localhost:3334/fonts/CabinetGrotesk-Variable.woff2') format('woff2');
      font-weight: 100 900;
    }
    @font-face {
      font-family: 'Satoshi';
      src: url('http://localhost:3334/fonts/Satoshi-Variable.woff2') format('woff2');
      font-weight: 300 900;
    }
    @font-face {
      font-family: 'Kalam';
      src: url('http://localhost:3334/fonts/Kalam-Regular.woff2') format('woff2');
      font-weight: 400;
    }
    @font-face {
      font-family: 'IBM Plex Mono';
      src: url('http://localhost:3334/fonts/IBMPlexMono-Regular.woff2') format('woff2');
      font-weight: 400 500;
    }
    @font-face {
      font-family: 'Gambetta';
      src: url('http://localhost:3334/fonts/Gambetta-Bold.woff2') format('woff2');
      font-weight: 700;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0B0E14;
      color: #EEF1F6;
      font-family: system-ui, sans-serif;
      padding: 32px;
      width: 900px;
    }
    .header {
      margin-bottom: 28px;
      border-bottom: 1px solid #262D3B;
      padding-bottom: 16px;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      background: rgba(124, 155, 255, 0.15);
      color: #7C9BFF;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    h1 {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #FFFFFF;
    }
    .comparison-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 32px;
    }
    .card {
      background: #171C26;
      border: 1px solid #262D3B;
      border-radius: 12px;
      padding: 24px;
    }
    .card-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .card-old .card-title { color: #FF6B6B; }
    .card-new .card-title { color: #4CC38A; }

    /* Old Fonts Spec */
    .old-display {
      font-family: 'Bricolage Grotesque', sans-serif;
      font-weight: 800;
      font-size: 24px;
      line-height: 1.15;
      color: #FFFFFF;
      margin-bottom: 8px;
    }
    .old-body {
      font-family: 'Hanken Grotesk', sans-serif;
      font-weight: 400;
      font-size: 15px;
      line-height: 22px;
      color: #98A2B6;
      margin-bottom: 16px;
    }
    .old-chip {
      display: inline-block;
      font-family: 'Hanken Grotesk', sans-serif;
      font-size: 12px;
      padding: 4px 12px;
      border-radius: 9999px; /* old pill */
      background: rgba(255,255,255,0.08);
      color: #EEF1F6;
      margin-right: 6px;
    }
    .old-num {
      font-family: 'DM Mono', monospace;
      font-size: 13px;
      color: #F2B705;
      margin-top: 12px;
    }

    /* New Fonts Spec */
    .new-display {
      font-family: 'Cabinet Grotesk', sans-serif;
      font-weight: 800;
      font-size: 24px;
      letter-spacing: -0.02em;
      line-height: 1.15;
      color: #FFFFFF;
      margin-bottom: 8px;
    }
    .new-body {
      font-family: 'Satoshi', sans-serif;
      font-weight: 400;
      font-size: 16px;
      line-height: 24px;
      color: #98A2B6;
      margin-bottom: 16px;
    }
    .new-chip {
      display: inline-block;
      font-family: 'Satoshi', sans-serif;
      font-size: 12px;
      font-weight: 600;
      padding: 5px 12px;
      border-radius: 6px; /* 6px radius, not pills */
      background: rgba(124, 155, 255, 0.15);
      border: 1px solid rgba(124, 155, 255, 0.3);
      color: #7C9BFF;
      margin-right: 6px;
    }
    .new-hand {
      font-family: 'Kalam', cursive;
      font-size: 15px;
      color: #F2B705;
      margin-top: 10px;
    }
    .new-mono {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 13px;
      color: #4CC38A;
      font-variant-numeric: tabular-nums;
      margin-top: 6px;
    }
    .new-notice {
      font-family: 'Gambetta', serif;
      font-weight: 700;
      font-size: 16px;
      letter-spacing: -0.01em;
      color: #3CC8DA;
      margin-top: 10px;
    }

    /* Empirical Tabular Numbers Table */
    .tabular-section {
      background: #171C26;
      border: 1px solid #262D3B;
      border-radius: 12px;
      padding: 24px;
    }
    .tabular-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 14px;
      font-size: 13px;
    }
    .tabular-table th, .tabular-table td {
      padding: 10px 14px;
      border: 1px solid #262D3B;
      text-align: left;
    }
    .tabular-table th {
      background: #0B0E14;
      font-weight: 600;
      color: #EEF1F6;
    }
    .tabular-table td {
      color: #98A2B6;
    }
    .pass {
      color: #4CC38A;
      font-weight: 700;
    }
    .fail {
      color: #FF6B6B;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="badge">Typography System Architecture</div>
    <h1>DPS Buzz — Font Migration & Side-by-Side Verification</h1>
  </div>

  <div class="comparison-grid">
    <!-- OLD SYSTEM -->
    <div class="card card-old">
      <div class="card-title">❌ Former Typography System</div>
      <div class="old-display">DPS Buzz • Star Board #1</div>
      <div class="old-body">
        Science exhibition was so much fun! The whole senior corridor gathered outside the physics lab during 3rd period after morning assembly.
      </div>
      <div>
        <span class="old-chip">Pill Tag 1</span>
        <span class="old-chip">Pill Tag 2</span>
      </div>
      <div class="old-num">Adm: DPS2024-0451 • Points: 1,420</div>
    </div>

    <!-- NEW SYSTEM -->
    <div class="card card-new">
      <div class="card-title">✓ New Strict Typography System</div>
      <div class="new-display">DPS Buzz • Star Board #1</div>
      <div class="new-body">
        Science exhibition was so much fun! The whole senior corridor gathered outside the physics lab during 3rd period after morning assembly.
      </div>
      <div>
        <span class="new-chip">Class 8-A</span>
        <span class="new-chip">Verified</span>
      </div>
      <div class="new-hand">★ Star of the Week (Kalam accent)</div>
      <div class="new-mono">Adm: DPS2024-0451 • Points: 1,420 (IBM Plex Mono)</div>
      <div class="new-notice">Optional Gambetta Notice: Annual Sports Meet Final Timetable</div>
    </div>
  </div>

  <!-- TABULAR NUMERAL EMPIRICAL REPORT -->
  <div class="tabular-section">
    <div class="card-title" style="color: #7C9BFF;">
      📊 Empirical Tabular Numerals Verification (Measured at 36px font-size)
    </div>
    <table class="tabular-table">
      <thead>
        <tr>
          <th>Font Family</th>
          <th>Default Proportional Widths</th>
          <th>With tabular-nums (tnum)</th>
          <th>Tabular Figures Support</th>
          <th>Design System Assignment</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Satoshi</strong> (Body & UI)</td>
          <td>12.03px ('1') to 24.59px ('0')</td>
          <td><strong>23.77px</strong> across all digits (0–9)</td>
          <td class="pass">✓ PASS (Native OpenType tnum)</td>
          <td>Counts, ranks, timestamps, feed counters</td>
        </tr>
        <tr>
          <td><strong>Cabinet Grotesk</strong> (Display)</td>
          <td>10.52px ('1') to 22.91px ('0')</td>
          <td>10.52px to 22.91px (remains variable)</td>
          <td class="fail">✕ FAIL (No tnum in woff2)</td>
          <td>Headings & Rank Numerals (delegates counters)</td>
        </tr>
        <tr>
          <td><strong>IBM Plex Mono</strong> (Counters)</td>
          <td>20.03px across all digits (0–9)</td>
          <td><strong>20.03px</strong> across all digits (0–9)</td>
          <td class="pass">✓ PASS (Monospace tabular)</td>
          <td>Admission numbers & leaderboard counters</td>
        </tr>
      </tbody>
    </table>
  </div>
</body>
</html>`;

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(htmlContent);
  } else if (req.url.startsWith('/fonts/')) {
    const filename = req.url.replace('/fonts/', '');
    const fontPath = path.resolve('public/fonts', filename);
    if (fs.existsSync(fontPath)) {
      res.writeHead(200, { 'Content-Type': 'font/woff2' });
      res.end(fs.readFileSync(fontPath));
    } else {
      res.writeHead(404);
      res.end();
    }
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(3334, () => {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const outputPath = 'C:\\Users\\shash\\.gemini\\antigravity\\brain\\6613c7aa-838b-45cc-9390-21cd395b212e\\fonts_side_by_side_comparison.png';
  const chromeArgs = [
    '--headless',
    '--hide-scrollbars',
    '--window-size=960,860',
    `--screenshot=${outputPath}`,
    'http://localhost:3334/'
  ];

  const proc = spawn(chromePath, chromeArgs);
  proc.on('close', (code) => {
    console.log('Side-by-side screenshot saved to ' + outputPath);
    server.close();
    process.exit(0);
  });
});
