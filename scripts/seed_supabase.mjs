import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
    env[match[1]] = val;
  }
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// 🛡️ Safety check: Refuse to run against the live production Supabase database
if (env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_URL.includes('xdvoeddebquguuqgyscl.supabase.co') && process.env.ALLOW_LIVE_SEED !== 'true') {
  console.error('\n🛑 SAFETY BLOCK: Refusing to run seed script against the LIVE production Supabase database (xdvoeddebquguuqgyscl)!');
  console.error('This protects live student accounts from being overwritten by localhost seed data.');
  console.error('To run in a test environment, point NEXT_PUBLIC_SUPABASE_URL to your test instance.\n');
  process.exit(1);
}

async function seed() {
  console.log('--- Checking if database tables exist ---');
  const { error: postCheck } = await supabase.from('posts').select('id').limit(1);
  if (postCheck) {
    console.error('Cannot seed yet: tables do not exist in Supabase database schema cache.');
    console.error('Please run supabase/complete_database_schema.sql in the Supabase SQL Editor first!');
    return;
  }

  console.log('Tables exist! Starting seed from data/server_store.json...');
  const content = fs.readFileSync('data/server_store.json', 'utf8');
  const store = JSON.parse(content);

  // 1. Seed Profiles
  if (Array.isArray(store.profiles)) {
    console.log(`Seeding ${store.profiles.length} profiles...`);
    for (const p of store.profiles) {
      if (!p || !p.username) continue;
      const cleanUser = p.username.toLowerCase().trim();
      const { error } = await supabase.from('profiles').upsert({
        username: cleanUser,
        full_name: p.fullName || cleanUser,
        avatar_url: p.avatar || null,
        bio: p.bio || '',
        class: p.class || '8',
        section: p.section || 'A',
        role: p.role || 'student',
        is_verified: Boolean(p.isVerified),
        is_private: Boolean(p.isPrivate),
        is_approved: true,
        follower_count: p.followerCount || 0,
        following_count: p.followingCount || 0,
        post_count: p.postCount || 0,
        spirit_points: p.spiritPoints || 50,
      }, { onConflict: 'username' });
      if (error) console.warn(`Error seeding profile ${cleanUser}:`, error.message);
    }
  }

  // 2. Seed Posts
  if (Array.isArray(store.posts)) {
    console.log(`Seeding ${store.posts.length} posts...`);
    for (const post of store.posts) {
      if (!post || !post.id || !post.username) continue;
      const firstImg = post.imageUrl || (post.images && post.images.length > 0 ? post.images[0] : null);
      const { error } = await supabase.from('posts').upsert({
        id: post.id,
        user_id: post.userId || post.username,
        username: post.username,
        full_name: post.fullName || post.username,
        user_avatar: post.avatar || null,
        class: post.class || null,
        caption: post.caption || '',
        image_url: firstImg,
        images: Array.isArray(post.images) ? post.images : (firstImg ? [firstImg] : []),
        song: post.song || null,
        habit_category: post.habitCategory || null,
        habit_tag: post.habitTag || null,
        likes_count: post.likes || 0,
        comments_count: post.comments || 0,
        repost_count: post.repostCount || 0,
        is_repost: Boolean(post.isRepost),
        reposted_from: post.repostedFrom || null,
        created_at: post.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
      if (error) console.warn(`Error seeding post ${post.id}:`, error.message);
    }
  }

  // 3. Seed Follows
  if (Array.isArray(store.follows)) {
    console.log(`Seeding ${store.follows.length} follows...`);
    for (const f of store.follows) {
      if (!f || !f.follower || !f.following) continue;
      const fol = f.follower.toLowerCase().trim();
      const fing = f.following.toLowerCase().trim();
      if (fol && fing && fol !== fing) {
        const { error } = await supabase.from('follows').upsert({
          follower: fol,
          following: fing,
        }, { onConflict: 'follower,following' });
        if (error) console.warn(`Error seeding follow ${fol}->${fing}:`, error.message);
      }
    }
  }

  // 4. Seed Follow Requests
  if (Array.isArray(store.followRequests)) {
    console.log(`Seeding ${store.followRequests.length} follow requests...`);
    for (const r of store.followRequests) {
      if (!r || !r.requester || !r.target) continue;
      const req = r.requester.toLowerCase().trim();
      const tar = r.target.toLowerCase().trim();
      if (req && tar && req !== tar) {
        const { error } = await supabase.from('follow_requests').upsert({
          requester: req,
          target: tar,
          status: 'pending',
        }, { onConflict: 'requester,target' });
        if (error) console.warn(`Error seeding follow request ${req}->${tar}:`, error.message);
      }
    }
  }

  // 5. Seed Comments
  if (store.comments && typeof store.comments === 'object') {
    let commentCount = 0;
    for (const [postId, list] of Object.entries(store.comments)) {
      if (Array.isArray(list)) {
        for (const c of list) {
          if (!c || !c.username) continue;
          commentCount++;
          const { error } = await supabase.from('comments').upsert({
            id: c.id || `c-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            post_id: postId,
            username: c.username,
            user_avatar: c.userAvatar || null,
            text: c.text || '',
            image: c.image || null,
            created_at: new Date().toISOString(),
          }, { onConflict: 'id' });
          if (error) console.warn(`Error seeding comment:`, error.message);
        }
      }
    }
    console.log(`Seeded ${commentCount} comments.`);
  }

  // 6. Seed Likes
  if (store.likes && typeof store.likes === 'object') {
    let likeCount = 0;
    for (const [postId, usernames] of Object.entries(store.likes)) {
      if (Array.isArray(usernames)) {
        for (const u of usernames) {
          if (!u) continue;
          likeCount++;
          const { error } = await supabase.from('likes').upsert({
            post_id: postId,
            username: u.toLowerCase().trim(),
          }, { onConflict: 'post_id,username' });
          if (error) console.warn(`Error seeding like:`, error.message);
        }
      }
    }
    console.log(`Seeded ${likeCount} likes.`);
  }

  console.log('=== Database Seeding Complete! ===');
}

seed();
