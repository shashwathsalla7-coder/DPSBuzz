import http from 'node:http';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <style>
    @font-face {
      font-family: 'Satoshi';
      src: url('http://localhost:3333/fonts/Satoshi-Variable.woff2') format('woff2');
      font-weight: 300 900;
    }
    @font-face {
      font-family: 'Cabinet Grotesk';
      src: url('http://localhost:3333/fonts/CabinetGrotesk-Variable.woff2') format('woff2');
      font-weight: 100 900;
    }
    @font-face {
      font-family: 'IBM Plex Mono';
      src: url('http://localhost:3333/fonts/IBMPlexMono-Regular.woff2') format('woff2');
      font-weight: 400;
    }
    .test { font-size: 36px; display: inline-block; }
  </style>
</head>
<body>
  <div style="position: absolute; opacity: 0; pointer-events: none;">
    <span style="font-family: 'Satoshi'">0123456789</span>
    <span style="font-family: 'Cabinet Grotesk'">0123456789</span>
    <span style="font-family: 'IBM Plex Mono'">0123456789</span>
  </div>
  <script>
    window.addEventListener('load', async () => {
      const f1 = new FontFace('Satoshi', 'url(/fonts/Satoshi-Variable.woff2)');
      const f2 = new FontFace('Cabinet Grotesk', 'url(/fonts/CabinetGrotesk-Variable.woff2)');
      const f3 = new FontFace('IBM Plex Mono', 'url(/fonts/IBMPlexMono-Regular.woff2)');
      await Promise.all([f1.load(), f2.load(), f3.load()]);
      document.fonts.add(f1);
      document.fonts.add(f2);
      document.fonts.add(f3);
      await document.fonts.ready;

      const satoshiLoaded = document.fonts.check('36px "Satoshi"');
      const cabinetLoaded = document.fonts.check('36px "Cabinet Grotesk"');
      const ibmLoaded = document.fonts.check('36px "IBM Plex Mono"');
      console.log({ satoshiLoaded, cabinetLoaded, ibmLoaded });

      const digits = ['0','1','2','3','4','5','6','7','8','9'];
      function measure(family, tabular) {
        const widths = [];
        digits.forEach(d => {
          const el = document.createElement('span');
          el.className = 'test';
          el.style.fontFamily = family + ', sans-serif';
          if (tabular) {
            el.style.fontVariantNumeric = 'tabular-nums';
            el.style.fontFeatureSettings = '"tnum" 1';
          }
          el.textContent = d;
          document.body.appendChild(el);
          const rect = el.getBoundingClientRect();
          widths.push({ digit: d, width: Math.round(rect.width * 100) / 100 });
          document.body.removeChild(el);
        });
        const allSame = widths.every(w => Math.abs(w.width - widths[0].width) < 0.1);
        return { family, tabular, allSame, widths };
      }
      const data = {
        fontLoadStatus: { satoshiLoaded, cabinetLoaded, ibmLoaded },
        satoshiDefault: measure('Satoshi', false),
        satoshiTabular: measure('Satoshi', true),
        cabinetDefault: measure('Cabinet Grotesk', false),
        cabinetTabular: measure('Cabinet Grotesk', true),
        ibmDefault: measure('IBM Plex Mono', false)
      };
      await fetch('/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    });
  </script>
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
  } else if (req.url === '/report' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      console.log('--- TABULAR NUMERAL MEASUREMENT RESULTS ---');
      const data = JSON.parse(body);
      console.log(JSON.stringify(data, null, 2));
      fs.writeFileSync('public/tabular_results.json', body);
      res.writeHead(200);
      res.end('OK');
      server.close();
      process.exit(0);
    });
  }
});

server.listen(3333, () => {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const proc = spawn(chromePath, ['--headless', '--disable-gpu', 'http://localhost:3333/']);
  setTimeout(() => {
    console.error('Timed out after 10s');
    server.close();
    process.exit(1);
  }, 10000);
});
