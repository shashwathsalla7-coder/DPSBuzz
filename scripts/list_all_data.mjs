import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
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
  console.log('=== DATA AUDIT IN CLOUDFLARE D1 ===');
  const posts = await queryD1('SELECT id, author_username, content FROM posts;');
  console.log('Posts in D1:', posts);
  const diary = await queryD1('SELECT id, class_grade, section, uploaded_by_username, date_str FROM campus_diary_entries;');
  console.log('Diary entries in D1:', diary);
  const wmsgs = await queryD1('SELECT id, channel_id, sender_username, text FROM campus_whatsapp_messages LIMIT 10;');
  console.log('Sample WhatsApp msgs in D1:', wmsgs);
  const lf = await queryD1('SELECT id, title, status FROM campus_lost_found;');
  console.log('Lost and Found in D1:', lf);
  const channels = await queryD1('SELECT id, name, grade, section FROM campus_whatsapp_channels WHERE id LIKE "%class%" LIMIT 30;');
  console.log('Channels in D1:', channels);
}

main().catch(console.error);
