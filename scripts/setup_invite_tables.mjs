import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
  }
}

const CF_ACCOUNT_ID = env.CLOUDFLARE_ACCOUNT_ID;
const CF_DATABASE_ID = env.CLOUDFLARE_D1_DATABASE_ID;
const CF_API_TOKEN = env.CLOUDFLARE_API_TOKEN;

async function executeD1(sql, params = []) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_DATABASE_ID}/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(`D1 Execute Error: ${JSON.stringify(json.errors)}`);
  }
  return json.result[0];
}

async function main() {
  console.log('Creating campus_wire_invite_links table...');
  await executeD1(`
    CREATE TABLE IF NOT EXISTS campus_wire_invite_links (
      id TEXT PRIMARY KEY,
      channel_id TEXT NOT NULL,
      channel_name TEXT NOT NULL,
      invite_code TEXT UNIQUE NOT NULL,
      created_by TEXT NOT NULL,
      role_granted TEXT DEFAULT 'member',
      password TEXT DEFAULT '',
      require_approval INTEGER DEFAULT 0,
      max_uses INTEGER DEFAULT 0,
      uses_count INTEGER DEFAULT 0,
      is_revoked INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Creating campus_wire_join_requests table...');
  await executeD1(`
    CREATE TABLE IF NOT EXISTS campus_wire_join_requests (
      id TEXT PRIMARY KEY,
      channel_id TEXT NOT NULL,
      channel_name TEXT NOT NULL,
      invite_code TEXT NOT NULL,
      requester_username TEXT NOT NULL,
      requester_name TEXT NOT NULL,
      requester_role TEXT DEFAULT 'student',
      requested_role TEXT DEFAULT 'member',
      status TEXT DEFAULT 'pending',
      reviewed_by TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      reviewed_at TIMESTAMP
    );
  `);

  console.log('Creating index on invite_code and channel_id...');
  await executeD1(`
    CREATE INDEX IF NOT EXISTS idx_wire_invites_code ON campus_wire_invite_links(invite_code);
    CREATE INDEX IF NOT EXISTS idx_wire_requests_channel ON campus_wire_join_requests(channel_id, status);
  `);

  console.log('✅ Tables created successfully in Cloudflare D1!');
}

main().catch(console.error);
