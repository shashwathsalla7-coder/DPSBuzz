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

async function fetchOpenAPI() {
  const url = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/?apikey=${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  console.log('Definitions/Tables in OpenAPI:', Object.keys(data.definitions || {}));
  console.log('Paths/Endpoints in OpenAPI:', Object.keys(data.paths || {}));
}

fetchOpenAPI().catch(console.error);
