const path = require('path');
const { execSync } = require('child_process');

const brainDir = 'C:\\Users\\shash\\.gemini\\antigravity\\brain\\6613c7aa-838b-45cc-9390-21cd395b212e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const urls = [
  { url: 'http://localhost:3000/chats?theme=light&state=normal', out: 'chats_normal_light_375px.png' },
  { url: 'http://localhost:3000/chats?theme=dark&state=normal', out: 'chats_normal_dark_375px.png' },
  { url: 'http://localhost:3000/chats?theme=light&state=unread', out: 'chats_unread_light_375px.png' },
  { url: 'http://localhost:3000/chats?theme=dark&state=unread', out: 'chats_unread_dark_375px.png' },
  { url: 'http://localhost:3000/chats?theme=light&state=empty', out: 'chats_empty_light_375px.png' },
  { url: 'http://localhost:3000/chats?theme=dark&state=empty', out: 'chats_empty_dark_375px.png' },
  { url: 'http://localhost:3000/chats?theme=light&state=loading', out: 'chats_loading_light_375px.png' },
  { url: 'http://localhost:3000/chats?theme=dark&state=loading', out: 'chats_loading_dark_375px.png' },
  { url: 'http://localhost:3000/chats?theme=light&q=Rohan', out: 'chats_search_light_375px.png' },
  { url: 'http://localhost:3000/chats?theme=dark&q=Rohan', out: 'chats_search_dark_375px.png' },
  { url: 'http://localhost:3000/chats?theme=light&view=requests', out: 'chats_requests_light_375px.png' },
  { url: 'http://localhost:3000/chats?theme=dark&view=requests', out: 'chats_requests_dark_375px.png' },
  { url: 'http://localhost:3000/chats?theme=light&view=newchat', out: 'chats_newsheet_light_375px.png' },
  { url: 'http://localhost:3000/chats?theme=dark&view=newchat', out: 'chats_newsheet_dark_375px.png' },
];

for (const item of urls) {
  const outPath = path.join(brainDir, item.out);
  const cmd = `"${edgePath}" --headless=new --no-sandbox --disable-gpu --virtual-time-budget=2000 --screenshot="${outPath}" --window-size=500,812 "${item.url}"`;
  console.log(`Capturing ${item.out}...`);
  try {
    execSync(cmd, { stdio: 'ignore', timeout: 20000 });
    console.log(`Saved ${outPath}`);
  } catch (err) {
    console.error(`Failed: ${item.out}`, err.message);
  }
}

console.log('All chat screens captured successfully!');
