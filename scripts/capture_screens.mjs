import { spawn } from 'node:child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\shash\\.gemini\\antigravity\\brain\\6613c7aa-838b-45cc-9390-21cd395b212e';

const targets = [
  { name: 'home_375px_new_fonts.png', url: 'http://localhost:3000/home' },
  { name: 'starboard_375px_new_fonts.png', url: 'http://localhost:3000/leaderboard' },
  { name: 'notices_375px_new_fonts.png', url: 'http://localhost:3000/notices' }
];

async function captureAll() {
  for (const t of targets) {
    const outputPath = `${artifactDir}\\${t.name}`;
    console.log(`Capturing ${t.name} from ${t.url}...`);
    await new Promise((resolve) => {
      const proc = spawn(chromePath, [
        '--headless',
        '--hide-scrollbars',
        '--window-size=375,812',
        '--virtual-time-budget=3000',
        `--screenshot=${outputPath}`,
        t.url
      ]);
      proc.on('close', (code) => {
        console.log(`Saved ${t.name} (exit code ${code})`);
        resolve();
      });
    });
  }
}

captureAll();
