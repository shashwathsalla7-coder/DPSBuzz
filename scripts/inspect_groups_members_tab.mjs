import fs from 'fs';
const c = fs.readFileSync('src/app/(main)/groups/page.tsx', 'utf8');
const idx = c.indexOf("activeTab === 'members'");
console.log(c.slice(idx, idx + 1500));
