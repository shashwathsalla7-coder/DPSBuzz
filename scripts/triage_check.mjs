import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
    env[match[1]] = val;
  }
}

async function runTriage() {
  console.log('--- 1. SUPABASE HEALTH CHECK ---');
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const startTime = Date.now();
  const { data: pingData, error: pingError } = await supabase.from('profiles').select('id').limit(1);
  const pingDuration = Date.now() - startTime;
  
  if (pingError) {
    console.log('Supabase Status: ERROR / UNREACHABLE:', pingError.message);
  } else {
    console.log(`Supabase Status: ACTIVE & HEALTHY (Latency: ${pingDuration}ms)`);
  }

  // Check table row counts
  const tables = ['profiles', 'messages', 'posts', 'comments', 'likes', 'follows', 'follow_requests', 'stories'];
  for (const t of tables) {
    const { count, error } = await supabase.from(t).select('id', { count: 'exact', head: true });
    if (error) console.log(`Table ${t}: Error (${error.message})`);
    else console.log(`Table ${t}: ${count} rows`);
  }

  console.log('\n--- 2. CLOUDFLARE R2 CHECK ---');
  const hasR2 = Boolean(env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY);
  console.log(`R2 Account ID: ${env.R2_ACCOUNT_ID ? 'SET' : 'MISSING'}`);
  console.log(`R2 Access Key: ${env.R2_ACCESS_KEY_ID ? 'SET' : 'MISSING'}`);
  console.log(`R2 Secret Key: ${env.R2_SECRET_ACCESS_KEY ? 'SET' : 'MISSING'}`);
  console.log(`R2 Bucket: ${env.R2_BUCKET || 'dpsbuzz-media'}`);

  if (hasR2) {
    try {
      const s3 = new S3Client({
        region: 'auto',
        endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: env.R2_ACCESS_KEY_ID,
          secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        },
      });
      const res = await s3.send(new ListObjectsV2Command({ Bucket: env.R2_BUCKET || 'dpsbuzz-media', MaxKeys: 10 }));
      console.log(`R2 Connection: SUCCESS! Objects in bucket: ${res.KeyCount ?? 0}`);
    } catch (r2Err) {
      console.log('R2 Connection Error:', r2Err.message);
    }
  } else {
    console.log('R2 Connection: Secret key missing in local env, checking Cloudinary fallback...');
    console.log(`Cloudinary Cloud Name: ${env.CLOUDINARY_CLOUD_NAME || 'ogfaxmjw'}`);
  }
}

runTriage();
