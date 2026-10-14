const path = require('path');
const { execSync } = require('child_process');

const brainDir = 'C:\\Users\\shash\\.gemini\\antigravity\\brain\\6613c7aa-838b-45cc-9390-21cd395b212e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const urls = [
  // 1. Updated Chats (State bar removed, Messages logo increased, messages enlarged)
  { url: 'http://localhost:3000/chats?theme=light', out: 'chats_normal_light_375px.png' },
  { url: 'http://localhost:3000/chats?theme=dark', out: 'chats_normal_dark_375px.png' },

  // 2. Search Explore (3-column grid of small posts across all classes)
  { url: 'http://localhost:3000/search?theme=light&tab=explore', out: 'search_explore_light_375px.png' },
  { url: 'http://localhost:3000/search?theme=dark&tab=explore', out: 'search_explore_dark_375px.png' },

  // 3. Search Query Finding Groups and Classmates
  { url: 'http://localhost:3000/search?theme=light&q=Class', out: 'search_query_groups_light_375px.png' },
  { url: 'http://localhost:3000/search?theme=dark&q=Rohan', out: 'search_query_people_dark_375px.png' },

  // 4. Search Groups Tab
  { url: 'http://localhost:3000/search?theme=light&tab=groups', out: 'search_groups_light_375px.png' },
  { url: 'http://localhost:3000/search?theme=dark&tab=groups', out: 'search_groups_dark_375px.png' },

  // 5. Search Classmates Tab (with Mutuals & Public/Private badges)
  { url: 'http://localhost:3000/search?theme=light&tab=classmates', out: 'search_classmates_light_375px.png' },
];

for (const item of urls) {
  const outPath = path.join(brainDir, item.out);
  // Edge minimum window size on Windows is ~500px, responsive viewport fits 375px container
  const cmd = `"${edgePath}" --headless=new --no-sandbox --disable-gpu --virtual-time-budget=2500 --screenshot="${outPath}" --window-size=500,812 "${item.url}"`;
  console.log(`Capturing ${item.out}...`);
  try {
    execSync(cmd, { stdio: 'ignore', timeout: 20000 });
    console.log(`Saved ${outPath}`);
  } catch (err) {
    console.error(`Failed: ${item.out}`, err.message);
  }
}

console.log('Capture finished successfully!');
