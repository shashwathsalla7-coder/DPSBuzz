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

async function queryD1(sql, params = []) {
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
  return json.result[0]?.results || [];
}

async function main() {
  const info = await queryD1("PRAGMA table_info(campus_group_invites);");
  console.log('campus_group_invites columns:', info);
}

main().catch(console.error);
