import { d1Execute, d1Query } from '../src/lib/cloudflare/d1.ts';

async function alterTable() {
  try {
    await d1Execute("ALTER TABLE campus_whatsapp_channels ADD COLUMN enrolled_usernames TEXT DEFAULT '[]';");
    console.log('Added enrolled_usernames column successfully');
  } catch (e) {
    console.log('Notice:', e.message);
  }
  const cols = await d1Query('PRAGMA table_info(campus_whatsapp_channels);');
  console.log('Columns in campus_whatsapp_channels:', cols.map(c => c.name));
}

alterTable().catch(console.error);
