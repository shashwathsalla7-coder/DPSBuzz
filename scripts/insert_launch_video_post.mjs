import fs from 'fs';
import path from 'path';

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const CF_DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID || '';
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

async function main() {
  console.log('Inserting Official Launch Video post under DPS Buzz...');

  const videoUrl = 'https://res.cloudinary.com/ogfaxmjw/video/upload/v1793295157/dpsbuzz/videos/dpsbuzz_launch_video_rishi_shashwath.mp4';
  const postId = 'post-launch-video';
  const nowIso = new Date().toISOString();
  const caption = 'Official Launch Video 🚀 • Welcome to DPS Buzz! Edited by Shashwath & Rishi 🐝✨ Tagged: @shashwath71845';

  const postObj = {
    id: postId,
    userId: 'dpsbuzz',
    username: 'dpsbuzz',
    fullName: 'DPS Buzz Official',
    class: 'Official',
    avatar: '/icons/logo.png',
    userAvatar: '/icons/logo.png',
    caption: caption,
    images: [videoUrl],
    imageUrl: videoUrl,
    videoUrl: videoUrl,
    isVideo: true,
    isReel: true,
    taggedUsers: ['shashwath71845'],
    isPinned: true,
    likes: 24,
    comments: 5,
    views: 180,
    createdAt: nowIso,
    timeAgo: 'Just now',
  };

  // 1. Insert into Cloudflare D1
  console.log('1. Inserting into Cloudflare D1...');
  await executeSql(
    `INSERT OR REPLACE INTO posts (id, author_id, author_username, content, media_urls, likes_count, comments_count, is_announcement, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      postId,
      'dpsbuzz',
      'dpsbuzz',
      caption,
      JSON.stringify([videoUrl]),
      24,
      5,
      1,
      nowIso,
    ]
  );
  console.log('Cloudflare D1 post inserted successfully!');

  // Also ensure dpsbuzz profile exists in D1 profiles
  await executeSql(
    `INSERT OR REPLACE INTO profiles (id, username, full_name, avatar_url, bio, class, section, role, is_verified, is_approved, post_count, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      'dpsbuzz_official_id',
      'dpsbuzz',
      'DPS Buzz Official',
      '/icons/logo.png',
      'Official pulse of Dilsukhnagar Public School. News, events, highlights and student life.',
      'Official',
      'All',
      'admin',
      1,
      1,
      1,
      nowIso,
    ]
  );
  console.log('Cloudflare D1 dpsbuzz profile verified!');

  // 2. Insert into data/server_store.json
  console.log('2. Updating data/server_store.json...');
  const serverStorePath = path.join(process.cwd(), 'data', 'server_store.json');
  if (fs.existsSync(serverStorePath)) {
    const raw = fs.readFileSync(serverStorePath, 'utf8');
    const store = JSON.parse(raw);

    if (!Array.isArray(store.posts)) store.posts = [];
    // Remove old launch video or any video post under shashwath
    store.posts = store.posts.filter((p) => {
      if (p.id === postId) return false;
      if (p.username?.toLowerCase() === 'shashwath71845' && (p.isVideo || p.videoUrl)) return false;
      return true;
    });
    store.posts.unshift(postObj);

    if (!Array.isArray(store.profiles)) store.profiles = [];
    const profIdx = store.profiles.findIndex((p) => p.username === 'dpsbuzz');
    const dpsProfile = {
      id: 'dpsbuzz_official_id',
      username: 'dpsbuzz',
      fullName: 'DPS Buzz Official',
      avatar: '/icons/logo.png',
      class: 'Official',
      role: 'admin',
      isVerified: true,
      bio: 'Official pulse of Dilsukhnagar Public School. News, events, highlights and student life.',
      postCount: 1,
      followerCount: 18,
      followingCount: 1,
    };
    if (profIdx >= 0) {
      store.profiles[profIdx] = { ...store.profiles[profIdx], ...dpsProfile };
    } else {
      store.profiles.push(dpsProfile);
    }

    fs.writeFileSync(serverStorePath, JSON.stringify(store, null, 2), 'utf8');
    console.log('data/server_store.json updated successfully!');
  }

  console.log('\nSUCCESS: Launch video post is live under DPS Buzz and tagged @shashwath71845!');
}

main().catch(console.error);
