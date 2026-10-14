const { spawn } = require('child_process');
const path = require('path');

const brainDir = 'C:\\Users\\shash\\.gemini\\antigravity\\brain\\6613c7aa-838b-45cc-9390-21cd395b212e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outPath = path.join(brainDir, 'profile_curved_posts.png');

// Use standard headless flags that reliably wait for page render
const args = [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--hide-scrollbars',
  '--window-size=488,960',
  `--screenshot=${outPath}`,
  'http://127.0.0.1:3000/u/arjun_8a?theme=dark&nosplash=1'
];

console.log('Running Edge screenshot for profile...');
const child = spawn(edgePath, args);

child.stdout.on('data', d => console.log('stdout:', d.toString()));
child.stderr.on('data', d => console.log('stderr:', d.toString()));

child.on('close', code => {
  console.log('Finished with code:', code);
});
