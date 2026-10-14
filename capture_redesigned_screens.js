const path = require('path');
const { execSync } = require('child_process');

const brainDir = 'C:\\Users\\shash\\.gemini\\antigravity\\brain\\6613c7aa-838b-45cc-9390-21cd395b212e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const screens = [
  { url: 'http://localhost:3000/home?theme=light&nosplash=1', out: 'home_375px_light.png' },
  { url: 'http://localhost:3000/home?theme=dark&nosplash=1', out: 'home_375px_dark.png' },
  { url: 'http://localhost:3000/home?state=loading&theme=dark&nosplash=1', out: 'home_loading_375px.png' },
  { url: 'http://localhost:3000/home?state=empty&theme=dark&nosplash=1', out: 'home_empty_375px.png' },
  { url: 'http://localhost:3000/search?theme=light&nosplash=1', out: 'search_375px_light.png' },
  { url: 'http://localhost:3000/search?theme=dark&nosplash=1', out: 'search_375px_dark.png' },
  { url: 'http://localhost:3000/search?q=priya&theme=dark&nosplash=1', out: 'search_results_375px.png' },
  { url: 'http://localhost:3000/chats?theme=light&nosplash=1', out: 'chats_inbox_375px_light.png' },
  { url: 'http://localhost:3000/chats?theme=dark&nosplash=1', out: 'chats_inbox_375px_dark.png' },
  { url: 'http://localhost:3000/chats?view=requests&theme=dark&nosplash=1', out: 'chats_requests_375px.png' },
  { url: 'http://localhost:3000/chats?state=empty&theme=dark&nosplash=1', out: 'chats_empty_375px.png' },
];

for (const item of screens) {
  const outPath = path.join(brainDir, item.out);
  const cmd = `"${edgePath}" --headless=new --no-sandbox --disable-gpu --virtual-time-budget=3500 --screenshot="${outPath}" --window-size=488,960 "${item.url}"`;
  console.log(`Capturing ${item.out}...`);
  try {
    execSync(cmd, { stdio: 'ignore', timeout: 25000 });
    console.log(`✓ Saved ${item.out}`);
  } catch (err) {
    console.error(`✗ Failed: ${item.out} - ${err.message}`);
  }
}

console.log('All screen captures finished!');
