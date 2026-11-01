import fs from 'fs';
const lines = fs.readFileSync('src/app/(main)/home/page.tsx', 'utf8').split('\n');
lines.forEach((l, i) => {
  if (l.includes('/chats?view=games')) {
    console.log(lines.slice(Math.max(0, i - 15), i + 20).join('\n'));
  }
});
