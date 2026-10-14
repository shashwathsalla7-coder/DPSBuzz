const path = require('path');
const { execSync } = require('child_process');

const brainDir = 'C:\\Users\\shash\\.gemini\\antigravity\\brain\\6613c7aa-838b-45cc-9390-21cd395b212e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const urls = [
  { url: 'http://localhost:3000/home?theme=light', out: 'home_stories_light_375px.png' },
  { url: 'http://localhost:3000/home?theme=dark', out: 'home_stories_dark_375px.png' },
];

for (const item of urls) {
  const outPath = path.join(brainDir, item.out);
  const cmd = `"${edgePath}" --headless=new --no-sandbox --disable-gpu --virtual-time-budget=3000 --screenshot="${outPath}" --window-size=430,932 "${item.url}"`;
  console.log(`Capturing ${item.out}...`);
  try {
    execSync(cmd, { stdio: 'ignore', timeout: 20000 });
    console.log(`Saved ${outPath}`);
  } catch (err) {
    console.error(`Failed: ${item.out}`, err.message);
  }
}

console.log('Capture finished!');
