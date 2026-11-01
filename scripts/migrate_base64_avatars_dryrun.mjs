import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
}

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME || 'ogfaxmjw',
  api_key: env.CLOUDINARY_API_KEY || '585871931796836',
  api_secret: env.CLOUDINARY_API_SECRET || 'Fpudf-0uhRPjKpFdmQzOiXZTh1M',
  secure: true,
});

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function prepareAvatarUploads() {
  console.log('Fetching profiles with base64 avatar_url...');
  const { data: profs, error } = await sb.from('profiles').select('id, username, avatar_url').ilike('avatar_url', '%data:image%');
  if (error || !profs) {
    console.error('Error fetching profiles:', error);
    return;
  }

  console.log(`Found ${profs.length} profiles with base64 avatar:`);
  const updates = [];

  for (const p of profs) {
    console.log(`Uploading avatar for @${p.username} to Cloudinary...`);
    try {
      const res = await cloudinary.uploader.upload(p.avatar_url, {
        folder: 'dpsbuzz/avatars',
        public_id: `avatar_${p.username}`,
        overwrite: true,
        resource_type: 'image',
      });
      console.log(`✅ Uploaded @${p.username}: ${res.secure_url}`);
      updates.push({
        username: p.username,
        id: p.id,
        secure_url: res.secure_url,
      });
    } catch (uploadErr) {
      console.error(`❌ Failed upload for @${p.username}:`, uploadErr);
    }
  }

  console.log('\n=== PROPOSED SQL (FOR USER APPROVAL) ===');
  for (const u of updates) {
    console.log(`UPDATE public.profiles SET avatar_url = '${u.secure_url}' WHERE username = '${u.username}';`);
  }
}

prepareAvatarUploads();
