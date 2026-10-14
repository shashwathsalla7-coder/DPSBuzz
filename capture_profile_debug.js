const { spawn } = require('child_process');
const path = require('path');

const brainDir = 'C:\\Users\\shash\\.gemini\\antigravity\\brain\\6613c7aa-838b-45cc-9390-21cd395b212e';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outPath = path.join(brainDir, 'profile_curved_posts.png');

const args = [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--virtual-time-budget=6000',
  `--screenshot=${outPath}`,
  '--window-size=488,960',
  'http://localhost:3000/u/arjun_8a'
];

console.log('Spawning Edge for /u/arjun_8a...');
const proc = spawn(edgePath, args);

proc.stdout.on('data', (d) => console.log('STDOUT:', d.toString()));
proc.stderr.on('data', (d) => console.log('STDERR:', d.toString()));

proc.on('close', (code) => {
  console.log('Edge exited with code:', code);
});
