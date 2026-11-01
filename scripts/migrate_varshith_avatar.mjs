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

async function uploadVarshith() {
  const { data: p, error: pErr } = await sb.from('profiles').select('id, username, avatar_url').eq('username', 'varshithjella').single();
  if (pErr) {
    console.error('Error fetching varshithjella profile:', pErr);
    return;
  }
  if (p && p.avatar_url && p.avatar_url.startsWith('data:image')) {
    console.log(`Uploading avatar for @varshithjella (${Math.round(p.avatar_url.length / 1024)} KB) to Cloudinary...`);
    const res = await cloudinary.uploader.upload(p.avatar_url, {
      folder: 'dpsbuzz/avatars',
      public_id: 'avatar_varshithjella',
      overwrite: true,
      resource_type: 'image',
    });
    console.log('✅ Uploaded to Cloudinary:', res.secure_url);

    const { data: updateRes, error: uErr } = await sb
      .from('profiles')
      .update({ avatar_url: res.secure_url, updated_at: new Date().toISOString() })
      .eq('username', 'varshithjella')
      .select('username, avatar_url');

    if (uErr) {
      console.error('Failed to update DB:', uErr);
    } else {
      console.log('✅ Successfully updated @varshithjella avatar in Supabase:', updateRes);
    }
  } else {
    console.log('No base64 avatar for @varshithjella found:', p?.avatar_url);
  }
}

uploadVarshith();
