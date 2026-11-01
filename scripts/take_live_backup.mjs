import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
}

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function backupLiveProfiles() {
  if (!fs.existsSync('backups')) {
    fs.mkdirSync('backups', { recursive: true });
  }

  const { data: profiles, error } = await sb.from('profiles').select('*');
  if (error || !profiles) {
    console.error('Backup failed:', error);
    process.exit(1);
  }

  const backupPath = 'backups/backup_profiles_before_reconcile_20261031.json';
  fs.writeFileSync(backupPath, JSON.stringify(profiles, null, 2), 'utf8');
  console.log(`✅ Successfully backed up ${profiles.length} profiles to ${backupPath}`);

  const { data: follows } = await sb.from('follows').select('*');
  if (follows) {
    const followsBackupPath = 'backups/backup_follows_20261031.json';
    fs.writeFileSync(followsBackupPath, JSON.stringify(follows, null, 2), 'utf8');
    console.log(`✅ Successfully backed up ${follows.length} follows to ${followsBackupPath}`);
  }
}

backupLiveProfiles();
