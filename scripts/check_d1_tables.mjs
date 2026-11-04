import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
    env[match[1]] = val;
  }
}

async function queryD1(sql, params = []) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${env.CLOUDFLARE_D1_DATABASE_ID}/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  });
  const json = await res.json();
  return json.result?.[0]?.results || [];
}

async function main() {
  const tables = await queryD1("SELECT name FROM sqlite_master WHERE type='table'");
  console.log('D1 tables:', tables.map(t => t.name));

  const hasPosts = tables.some(t => t.name === 'posts');
  if (hasPosts) {
    const d1Posts = await queryD1('SELECT id, image_url FROM posts LIMIT 10');
    console.log('D1 posts count:', d1Posts.length);
  }
}

main().catch(console.error);
