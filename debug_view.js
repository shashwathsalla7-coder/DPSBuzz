const { execSync } = require('child_process');
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const cmd = `"${edgePath}" --headless=new --no-sandbox --disable-gpu --virtual-time-budget=2000 --dump-dom "http://localhost:3000/home?nosplash=1"`;
const html = execSync(cmd, { encoding: 'utf8' });

// Let's inspect where header is in HTML
const headerIndex = html.indexOf('<header');
console.log(html.slice(headerIndex, headerIndex + 1200));
