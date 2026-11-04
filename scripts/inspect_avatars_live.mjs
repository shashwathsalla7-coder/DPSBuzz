import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
}

const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY && !env.SUPABASE_SERVICE_ROLE_KEY.includes('your-service')
  ? env.SUPABASE_SERVICE_ROLE_KEY
  : env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, supabaseKey);

async function checkAvatars() {
  const { data: profiles } = await supabase.from('profiles').select('id, username, full_name, avatar_url, class, section');
  console.log(`=== CHECKING ALL ${profiles.length} PROFILES IN SUPABASE ===`);
  for (const p of profiles) {
    const av = p.avatar_url || '';
    const isBase64 = av.startsWith('data:');
    const isCloudinary = av.includes('cloudinary');
    const isCloudflare = av.includes('r2') || av.includes('cloudflare');
    console.log(`@${p.username.padEnd(18)}: len=${String(av.length).padStart(7)} | base64=${isBase64} | CDN=${isCloudinary || isCloudflare} | class=${p.class}-${p.section}`);
  }
}

checkAvatars();
