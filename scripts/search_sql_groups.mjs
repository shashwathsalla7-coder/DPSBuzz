import fs from 'fs';
import path from 'path';

function searchSupabase(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) searchSupabase(full);
    else if (f.endsWith('.sql')) {
      const content = fs.readFileSync(full, 'utf8');
      if (/groups/i.test(content)) {
        console.log('Found in', full);
        const lines = content.split('\n');
        lines.forEach((l, i) => {
          if (/groups/i.test(l)) console.log(`  L${i+1}: ${l.trim()}`);
        });
      }
    }
  }
}
searchSupabase('supabase');
