import { createClient } from '@supabase/supabase-js';

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || 'a674b4cebe06334d4a0e284e138cc6a1';
const CF_DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID || 'a88d4fa9-4472-4876-bf32-045b966b0f77';
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';

const ENDPOINT = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_DATABASE_ID}/query`;

async function executeSql(sql, params = []) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(`SQL Failed: ${JSON.stringify(data.errors || data)}`);
  }
  return data.result?.[0]?.results || [];
}

async function syncAllPosts() {
  console.log('--- Two-Way Sync: Supabase Posts -> Cloudflare D1 ---');
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!sbUrl || !sbKey) {
    console.error('Supabase credentials missing!');
    return;
  }

  const sb = createClient(sbUrl, sbKey);
  const { data: sbPosts, error } = await sb.from('posts').select('*');
  if (error) {
    console.error('Failed to fetch posts from Supabase:', error);
    return;
  }

  console.log(`Found ${sbPosts?.length || 0} posts in Supabase.`);
  for (const p of sbPosts || []) {
    const mediaUrls = Array.isArray(p.images) && p.images.length > 0
      ? p.images
      : (p.image_url ? [p.image_url] : []);

    await executeSql(
      `INSERT OR REPLACE INTO posts (id, author_id, author_username, content, media_urls, likes_count, comments_count, is_announcement, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        p.id,
        p.user_id || p.username,
        (p.username || '').toLowerCase().trim(),
        p.caption || '',
        JSON.stringify(mediaUrls),
        p.likes_count || 0,
        p.comments_count || 0,
        p.is_pinned ? 1 : 0,
        p.created_at || new Date().toISOString(),
      ]
    );
    console.log(`Synced post ${p.id} by @${p.username} to Cloudflare D1.`);
  }

  // Also query Cloudflare D1 to show all current posts
  const allD1Posts = await executeSql('SELECT id, author_username, content, media_urls, created_at FROM posts ORDER BY created_at DESC;');
  console.log('\n--- Current Posts in Cloudflare D1 ---');
  console.log(allD1Posts);
}

syncAllPosts().catch(console.error);
