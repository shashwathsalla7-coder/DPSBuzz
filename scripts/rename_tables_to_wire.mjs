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
  if (!json.success) {
    throw new Error(`D1 Query Error: ${JSON.stringify(json.errors)}`);
  }
  return json.result[0]?.results || [];
}

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
  const tables = await queryD1("SELECT name FROM sqlite_master WHERE type='table';");
  console.log('Existing tables:', tables.map(t => t.name));

  const tableNames = new Set(tables.map(t => t.name));

  if (tableNames.has('campus_wire_channels')) {
    console.log('Renaming campus_wire_channels to campus_wire_channels...');
    await executeD1('ALTER TABLE campus_wire_channels RENAME TO campus_wire_channels;');
  }

  if (tableNames.has('campus_wire_messages')) {
    console.log('Renaming campus_wire_messages to campus_wire_messages...');
    await executeD1('ALTER TABLE campus_wire_messages RENAME TO campus_wire_messages;');
  }

  const updated = await queryD1("SELECT name FROM sqlite_master WHERE type='table';");
  console.log('Updated tables:', updated.map(t => t.name));

  const channelCount = await queryD1('SELECT COUNT(*) as c FROM campus_wire_channels;');
  const messageCount = await queryD1('SELECT COUNT(*) as c FROM campus_wire_messages;');
  console.log(`Verified campus_wire_channels: ${channelCount[0].c} rows`);
  console.log(`Verified campus_wire_messages: ${messageCount[0].c} rows`);
}

main().catch(console.error);
