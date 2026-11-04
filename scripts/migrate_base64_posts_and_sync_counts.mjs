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
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY && !env.SUPABASE_SERVICE_ROLE_KEY.includes('your-service') && !env.SUPABASE_SERVICE_ROLE_KEY.includes('placeholder')
  ? env.SUPABASE_SERVICE_ROLE_KEY
  : env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, supabaseKey);

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
  if (data.errors && data.errors.length > 0) {
    console.error('D1 error on SQL:', sql, data.errors);
  }
  return data.result?.[0]?.results || [];
}

async function run() {
  console.log('=== 1. FINDING POSTS WITH BASE64 IN SUPABASE ===');
  const { data: posts, error: pErr } = await sb.from('posts').select('id, caption, image_url, images');
  if (pErr) throw pErr;

  const b64Posts = (posts || []).filter(p => 
    (p.image_url && p.image_url.startsWith('data:')) || 
    (Array.isArray(p.images) && p.images.some(u => u && u.startsWith('data:')))
  );

  console.log(`Found ${b64Posts.length} posts with base64 data.`);

  if (b64Posts.length > 0) {
    // Get the base64 string from the first post
    const base64Data = b64Posts[0].image_url || b64Posts[0].images[0];
    console.log(`Uploading base64 image (size: ${base64Data.length} chars) to Cloudinary...`);

    const uploadRes = await cloudinary.uploader.upload(base64Data, {
      folder: 'dpsbuzz/posts',
      public_id: `post_three_legends_${Date.now()}`,
      resource_type: 'image',
    });

    const cdnUrl = uploadRes.secure_url;
    console.log('Successfully uploaded to Cloudinary CDN:', cdnUrl);

    for (const post of b64Posts) {
      console.log(`Updating post ${post.id} in Supabase with CDN URL...`);
      const { error: upErr } = await sb.from('posts').update({
        image_url: cdnUrl,
        images: [cdnUrl],
      }).eq('id', post.id);

      if (upErr) {
        console.error(`Failed to update post ${post.id}:`, upErr);
      } else {
        console.log(`Post ${post.id} updated successfully.`);
      }
    }
  }

  console.log('\n=== 2. SYNCING FOLLOWER / FOLLOWING COUNTS ===');
  const { data: follows, error: fErr } = await sb.from('follows').select('*');
  if (fErr) throw fErr;

  const { data: profiles, error: profErr } = await sb.from('profiles').select('id, username, follower_count, following_count');
  if (profErr) throw profErr;

  for (const p of profiles || []) {
    const u = (p.username || '').toLowerCase().trim();
    const realFers = (follows || []).filter(f => (f.following || '').toLowerCase().trim() === u).length;
    const realFing = (follows || []).filter(f => (f.follower || '').toLowerCase().trim() === u).length;

    if (p.follower_count !== realFers || p.following_count !== realFing) {
      console.log(`Fixing @${p.username}: stored [${p.follower_count}, ${p.following_count}] -> actual [${realFers}, ${realFing}]`);
      
      // Update Supabase
      const { error: upProfErr } = await sb.from('profiles').update({
        follower_count: realFers,
        following_count: realFing,
      }).eq('id', p.id);
      if (upProfErr) console.error(`Supabase update error for @${p.username}:`, upProfErr);
      else console.log(`  Supabase @${p.username} updated.`);

      // Update D1
      try {
        await queryD1('UPDATE profiles SET follower_count = ?, following_count = ? WHERE lower(username) = ?', [realFers, realFing, u]);
        console.log(`  Cloudflare D1 @${p.username} updated.`);
      } catch (err) {
        console.error(`  D1 update error for @${p.username}:`, err);
      }
    }
  }

  console.log('\n=== MIGRATION AND SYNC COMPLETE ===');
}

run().catch(console.error);
