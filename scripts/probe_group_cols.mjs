import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
    env[match[1]] = val;
  }
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function probeColumns() {
  const candidateColumns = [
    'id', 'name', 'description', 'creator_username', 'member_count', 'created_at',
    'class', 'section', 'category', 'avatar_url', 'banner_url', 'is_official',
    'members', 'admin', 'icon_url', 'type', 'created_by'
  ];

  for (const col of candidateColumns) {
    const { error } = await supabase.from('groups').select(col).limit(1);
    if (error) {
      console.log(`Column '${col}': NOT FOUND (${error.message})`);
    } else {
      console.log(`Column '${col}': EXISTS`);
    }
  }
}

probeColumns().catch(console.error);
