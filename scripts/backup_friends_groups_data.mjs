import fs from 'fs';
import path from 'path';
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

async function createBackup() {
  const backupDir = path.join(process.cwd(), 'data', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `friends_groups_phase0_backup_${timestamp}.json`);

  console.log(`Starting read-only backup to ${backupFile}...`);

  const tables = ['profiles', 'follows', 'follow_requests', 'groups', 'notifications', 'app_settings'];
  const backupData = {
    timestamp: new Date().toISOString(),
    supabase: {},
    serverStore: null
  };

  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*');
    if (error) {
      console.warn(`Table ${t} read error:`, error.message);
      backupData.supabase[t] = { error: error.message };
    } else {
      backupData.supabase[t] = data;
      console.log(`Backed up ${t}: ${data.length} rows`);
    }
  }

  if (fs.existsSync('data/server_store.json')) {
    backupData.serverStore = JSON.parse(fs.readFileSync('data/server_store.json', 'utf8'));
    console.log('Backed up data/server_store.json');
  }

  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
  console.log(`Backup successfully written: ${backupFile} (${(fs.statSync(backupFile).size / 1024).toFixed(2)} KB)`);
}

createBackup().catch(console.error);
