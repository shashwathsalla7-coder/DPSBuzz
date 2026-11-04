import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
}

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME || 'ogfaxmjw',
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

const CF_ACCOUNT_ID = env.CLOUDFLARE_ACCOUNT_ID || env.R2_ACCOUNT_ID || '';
const CF_DATABASE_ID = env.CLOUDFLARE_D1_DATABASE_ID || '';
const CF_API_TOKEN = env.CLOUDFLARE_API_TOKEN || env.CLOUDFLARE_D1_TOKEN || '';

async function queryD1(sql, params = []) {
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_DATABASE_ID}/query`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  });
  const data = await res.json();
  return data.result?.[0]?.results || [];
}

async function run() {
  console.log('=== 1. TESTING CLOUDINARY PING ===');
  const ping = await cloudinary.api.ping();
  console.log('Cloudinary status:', ping.status);

  console.log('\n=== 2. READING BASE64 AVATARS FROM D1 ===');
  const rows = await queryD1('SELECT username, avatar_url FROM profiles WHERE length(avatar_url) > 1000');
  console.log(`Found ${rows.length} large base64 avatars in D1:`);
  
  const uploadResults = {};

  for (const r of rows) {
    const u = r.username;
    const len = r.avatar_url?.length || 0;
    console.log(` - Processing @${u} (${len} bytes)...`);

    if (r.avatar_url?.startsWith('data:image/')) {
      // Upload to Cloudinary
      const uploadRes = await cloudinary.uploader.upload(r.avatar_url, {
        folder: 'dpsbuzz/avatars',
        public_id: `avatar_${u}_cdn`,
        overwrite: true,
        resource_type: 'image',
      });
      console.log(`   ✓ Uploaded to CDN: ${uploadRes.secure_url}`);
      uploadResults[u] = uploadRes.secure_url;
    }
  }

  console.log('\n=== 3. SUMMARY OF GENERATED CDN URLS ===');
  console.log(JSON.stringify(uploadResults, null, 2));

  // Save results to file for use in migration
  fs.writeFileSync('scripts/migrated_avatar_urls.json', JSON.stringify(uploadResults, null, 2));
}

run().catch(console.error);
