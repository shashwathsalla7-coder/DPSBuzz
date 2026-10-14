const path = require('path');
const { execSync } = require('child_process');

const brainDir = 'C:\\Users\\shash\\.gemini\\antigravity\\brain\\6613c7aa-838b-45cc-9390-21cd395b212e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const screens = [
  { url: 'http://localhost:3000/home?theme=light&nosplash=1', out: 'home_curved_tabbar_light.png' },
  { url: 'http://localhost:3000/home?theme=dark&nosplash=1', out: 'home_curved_tabbar_dark.png' },
  { url: 'http://localhost:3000/post/new?theme=dark&nosplash=1', out: 'post_new_mandatory_photo.png' },
  { url: 'http://localhost:3000/search?chip=Notices&theme=dark&nosplash=1', out: 'search_notices_working.png' },
  { url: 'http://localhost:3000/chats?theme=dark&nosplash=1', out: 'chats_classmates_and_group.png' },
  { url: 'http://localhost:3000/leaderboard?theme=dark&nosplash=1', out: 'leaderboard_neat_curved.png' },
  { url: 'http://localhost:3000/u/arjun_8a?theme=dark&nosplash=1', out: 'profile_curved_posts.png' },
];

for (const item of screens) {
  const outPath = path.join(brainDir, item.out);
  const cmd = `"${edgePath}" --headless=new --no-sandbox --disable-gpu --virtual-time-budget=4000 --screenshot="${outPath}" --window-size=488,960 "${item.url}"`;
  console.log(`Capturing ${item.out}...`);
  try {
    execSync(cmd, { stdio: 'ignore', timeout: 25000 });
    console.log(`✓ Saved ${item.out}`);
  } catch (err) {
    console.error(`✗ Failed: ${item.out} - ${err.message}`);
  }
}

console.log('All screen captures finished!');
