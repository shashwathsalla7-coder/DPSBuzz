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

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, supabaseKey);

const CF_ACCOUNT_ID = env.CLOUDFLARE_ACCOUNT_ID || env.R2_ACCOUNT_ID || '';
const CF_DATABASE_ID = env.CLOUDFLARE_D1_DATABASE_ID || '';
const CF_API_TOKEN = env.CLOUDFLARE_API_TOKEN || env.CLOUDFLARE_D1_TOKEN || '';

async function queryD1(sql, params = []) {
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_DATABASE_ID}/query`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  });
  const data = await res.json();
  return data.result?.[0]?.results || [];
}

async function takeFullBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = `backups/full_backup_${timestamp}`;
  fs.mkdirSync(backupDir, { recursive: true });
  console.log(`=== TAKING COMPLETE LIVE BACKUP TO ${backupDir} ===`);

  // Supabase tables
  const tables = ['profiles', 'follows', 'follow_requests', 'posts', 'messages', 'stories', 'groups', 'app_settings'];
  for (const t of tables) {
    try {
      const { data, error } = await sb.from(t).select('*');
      if (error) {
        console.warn(`Supabase ${t} warning:`, error.message);
      } else {
        fs.writeFileSync(`${backupDir}/supabase_${t}.json`, JSON.stringify(data || [], null, 2));
        console.log(`✓ Supabase table "${t}": ${data?.length || 0} rows backed up`);
      }
    } catch (e) {
      console.warn(`Supabase ${t} error:`, e.message);
    }
  }

  // D1 tables
  const d1Tables = ['profiles', 'follows', 'follow_requests', 'posts', 'messages', 'groups'];
  for (const t of d1Tables) {
    try {
      const rows = await queryD1(`SELECT * FROM ${t}`);
      fs.writeFileSync(`${backupDir}/d1_${t}.json`, JSON.stringify(rows || [], null, 2));
      console.log(`✓ Cloudflare D1 table "${t}": ${rows?.length || 0} rows backed up`);
    } catch (e) {
      console.warn(`D1 ${t} error:`, e.message);
    }
  }

  console.log(`\n🎉 Full pre-migration backup complete at: ${backupDir}`);
}

takeFullBackup().catch(console.error);
