import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('🧪 Starting Launch Video & Reels Verification Test Suite...\n');

// 1. Verify Cloudinary Upload & URL in DEFAULT_LAUNCH_POST
const dataStoreCode = fs.readFileSync(path.resolve('src/lib/dataStore.ts'), 'utf8');

const expectedCloudinaryUrl = 'https://res.cloudinary.com/ogfaxmjw/video/upload/v1793295157/dpsbuzz/videos/dpsbuzz_launch_video_rishi_shashwath.mp4';

assert.ok(
  dataStoreCode.includes(expectedCloudinaryUrl),
  `DEFAULT_LAUNCH_POST must use the new Cloudinary video URL: ${expectedCloudinaryUrl}`
);
console.log('✅ PASS: DEFAULT_LAUNCH_POST points to the new Cloudinary video URL');

// 2. Verify Post Author is Strictly dpsbuzz
assert.ok(
  dataStoreCode.includes("userId: 'dpsbuzz'") && dataStoreCode.includes("username: 'dpsbuzz'"),
  'Launch video must be authored strictly by dpsbuzz'
);
assert.ok(
  dataStoreCode.includes('Edited by Shashwath & Rishi'),
  'Launch video caption must credit Shashwath & Rishi'
);
assert.ok(
  dataStoreCode.includes('isReel: true') && dataStoreCode.includes('isVideo: true'),
  'Launch video must be configured as both a video post and a reel'
);
console.log('✅ PASS: Launch video author is strictly dpsbuzz with Rishi & Shashwath credit');

// 3. Verify Local Video Fallback exists and has matching length
const localVideoPath = path.resolve('public/videos/launch_video.mp4');
assert.ok(fs.existsSync(localVideoPath), 'public/videos/launch_video.mp4 must exist as local video fallback');
const localStats = fs.statSync(localVideoPath);
assert.ok(localStats.size > 40 * 1024 * 1024, `Local video fallback must be the new video file (>40MB). Got ${localStats.size}`);
console.log('✅ PASS: public/videos/launch_video.mp4 is synced with the new edited video');

// 4. Verify server_store.json contains the new launch video
const serverStore = JSON.parse(fs.readFileSync(path.resolve('data/server_store.json'), 'utf8'));
const launchPostInStore = serverStore.posts.find((p) => p.id === 'post-launch-video');
assert.ok(launchPostInStore, 'server_store.json must contain post-launch-video');
assert.strictEqual(launchPostInStore.username, 'dpsbuzz', 'post-launch-video must be authored by dpsbuzz');
assert.strictEqual(launchPostInStore.videoUrl, expectedCloudinaryUrl, 'post-launch-video must have the new Cloudinary URL');
assert.ok(launchPostInStore.caption.includes('Edited by Shashwath & Rishi'), 'Caption in server_store must credit Shashwath & Rishi');
console.log('✅ PASS: data/server_store.json contains the new launch video under dpsbuzz');

// 5. Verify no shashwath video or reel exists in server_store
const shashwathVideoInStore = serverStore.posts.find(
  (p) => p.username?.toLowerCase() === 'shashwath71845' && (p.isVideo || p.videoUrl || p.isReel)
);
assert.strictEqual(shashwathVideoInStore, undefined, 'No video or reel post under shashwath must exist in server_store');
console.log('✅ PASS: No videos or reels under shashwath exist in server_store');

// 6. Verify dataStore filters out any shashwath video or reel
assert.ok(
  dataStoreCode.includes("clean === 'shashwath71845' && (p.isVideo || p.videoUrl || p.isReel)"),
  'dataStore.ts must explicitly filter out any video or reel authored by shashwath'
);
console.log('✅ PASS: dataStore.ts strictly filters out any video or reel authored by shashwath');

console.log('\n🎉 ALL 6/6 LAUNCH VIDEO & REELS TESTS PASSED SUCCESSFULLY!');
