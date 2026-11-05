import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
}

async function check() {
  const url = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${env.CLOUDFLARE_D1_DATABASE_ID}/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sql: 'SELECT class_grade, section, uploaded_by_name, date_str FROM campus_diary_entries ORDER BY date_str DESC LIMIT 20;',
    }),
  });
  const data = await res.json();
  console.log('D1 Diary Entries count:', data.result?.[0]?.results?.length || 0);
  console.log('Entries:', data.result?.[0]?.results || []);
}

check().catch(console.error);
