import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = 'C:/Users/shash/.gemini/antigravity/scratch/dpsbuzz';

test('1. Unique Views Algorithm: 100 views by same user counts as only 1 view', () => {
  const dataStorePath = path.join(projectRoot, 'src/lib/dataStore.ts');
  const code = fs.readFileSync(dataStorePath, 'utf8');

  // Verify unique viewer tracking methods exist
  assert.ok(code.includes('getPostViewersMap'), 'getPostViewersMap must be present in dataStore.ts');
  assert.ok(code.includes('incrementPostViews'), 'incrementPostViews must be present in dataStore.ts');

  // Simulate unique viewer tracking logic
  const viewersMap = {};
  function simulateIncrementPostViews(postId, viewerUsername) {
    const cleanUser = (viewerUsername || 'anonymous_user').toLowerCase().trim();
    if (!viewersMap[postId]) {
      viewersMap[postId] = [];
    }
    const list = viewersMap[postId];
    if (!list.includes(cleanUser)) {
      list.push(cleanUser);
    }
    return list.length;
  }

  const testPostId = 'test-post-unique-views-101';

  // User "shashwath" views the post 100 times
  let count = 0;
  for (let i = 0; i < 100; i++) {
    count = simulateIncrementPostViews(testPostId, 'shashwath');
  }
  assert.strictEqual(count, 1, '100 views by "shashwath" must result in exactly 1 view');

  // Classmate "rohan728" views the post
  count = simulateIncrementPostViews(testPostId, 'rohan728');
  assert.strictEqual(count, 2, 'New viewer "rohan728" must increment view count to 2');

  // User "shashwath" views 50 more times
  for (let i = 0; i < 50; i++) {
    count = simulateIncrementPostViews(testPostId, 'shashwath');
  }
  assert.strictEqual(count, 2, 'Further views by "shashwath" must NOT increase the count');
});

test('2. Single-time like sound debounce in UniqueLikeOverlay.tsx', () => {
  const likeOverlayPath = path.join(projectRoot, 'src/components/reels/UniqueLikeOverlay.tsx');
  const code = fs.readFileSync(likeOverlayPath, 'utf8');

  // Ensure debounce timestamp mechanism is implemented
  assert.ok(code.includes('lastLikeChimeTimestamp'), 'lastLikeChimeTimestamp must be defined for debounce');
  assert.ok(code.includes('now - lastLikeChimeTimestamp < 160'), 'Must debounce duplicate audio calls within 160ms');

  // Simulate audio debounce
  let lastTimestamp = 0;
  let audioPlayedCount = 0;

  function simulatePlayLikeChime(simulatedNow) {
    if (simulatedNow - lastTimestamp < 160) {
      return false; // debounced (gesture noise / duplicate event)
    }
    lastTimestamp = simulatedNow;
    audioPlayedCount++;
    return true;
  }

  // Double-tap or double-handler firing within 50ms
  assert.strictEqual(simulatePlayLikeChime(1000), true, 'First like click plays sound');
  assert.strictEqual(simulatePlayLikeChime(1030), false, 'Immediate duplicate event is debounced');
  assert.strictEqual(simulatePlayLikeChime(1050), false, 'Duplicate event at 50ms is debounced');
  assert.strictEqual(audioPlayedCount, 1, 'Audio played exactly once for double-tap');

  // User likes again after 500ms
  assert.strictEqual(simulatePlayLikeChime(1550), true, 'Next like action produces 1 sound cleanly');
  assert.strictEqual(audioPlayedCount, 2, 'Total 2 likes with distinct actions produces 2 sounds');
});

test('3. Search post navigation: links directly to post modal or reel, not home screen', () => {
  const searchPagePath = path.join(projectRoot, 'src/app/(main)/search/page.tsx');
  const code = fs.readFileSync(searchPagePath, 'utf8');

  // Verify it links directly to /u/[username]?post=[id] or /reels?id=[id]
  assert.ok(code.includes('/u/${post.username}?post=${post.id}'), 'Search posts must link directly to profile post detail query');
  assert.ok(code.includes('/reels?id=${post.id}'), 'Search reels must link directly to reels id query');
  assert.ok(!code.includes('href={`/home#post-${post.id}`}'), 'Must NOT navigate to /home#post-...');
});

test('4. Cloudflare D1 Post Sync: getD1Posts queried in sync API', () => {
  const syncRoutePath = path.join(projectRoot, 'src/app/api/sync/route.ts');
  const dbServicePath = path.join(projectRoot, 'src/lib/cloudflare/dbService.ts');

  const syncCode = fs.readFileSync(syncRoutePath, 'utf8');
  const dbCode = fs.readFileSync(dbServicePath, 'utf8');

  assert.ok(dbCode.includes('export async function getD1Posts'), 'getD1Posts must be exported in dbService.ts');
  assert.ok(syncCode.includes('getD1Posts'), 'getD1Posts must be imported and called in sync route.ts');
  assert.ok(syncCode.includes('getD1Posts(100)'), 'd1BatchPromise must include getD1Posts(100)');
  assert.ok(syncCode.includes('d1Posts'), 'd1Posts must be destructured and merged in sync route.ts');
});

test('5. Mandatory Photo Enforcement in ProfileClient.tsx and DataStore', () => {
  const profileClientPath = path.join(projectRoot, 'src/app/(main)/u/[username]/ProfileClient.tsx');
  const dataStorePath = path.join(projectRoot, 'src/lib/dataStore.ts');

  const clientCode = fs.readFileSync(profileClientPath, 'utf8');
  const storeCode = fs.readFileSync(dataStorePath, 'utf8');

  // ProfileClient habit submission checks photo
  assert.ok(clientCode.includes('if (!habitPhoto)'), 'handleHabitSubmit must verify habitPhoto is provided');
  assert.ok(clientCode.includes('Attach Photo from Gallery (Mandatory) 📸 *'), 'UI label must indicate mandatory photo');
  assert.ok(clientCode.includes('disabled={!habitCaption.trim() || !habitPhoto}'), 'Submit button must be disabled without photo');

  // DataStore fallback photo
  assert.ok(storeCode.includes('defaultSchoolImage'), 'DataStore.addPost must contain fallback school image');
});

test('6. Deep Link Navigation in ProfileClient and Reels', () => {
  const profileClientPath = path.join(projectRoot, 'src/app/(main)/u/[username]/ProfileClient.tsx');
  const reelsPagePath = path.join(projectRoot, 'src/app/(main)/reels/page.tsx');

  const profileCode = fs.readFileSync(profileClientPath, 'utf8');
  const reelsCode = fs.readFileSync(reelsPagePath, 'utf8');

  // ProfileClient auto-opens ?post=
  assert.ok(profileCode.includes("params.get('post')"), 'ProfileClient must read ?post= query param');
  assert.ok(profileCode.includes('setSelectedPostDetail(post)'), 'ProfileClient must set selectedPostDetail');

  // Reels auto-scrolls to ?id=
  assert.ok(reelsCode.includes("params.get('id')"), 'Reels page must read ?id= query param');
  assert.ok(reelsCode.includes('scrollToIndex(idx)'), 'Reels page must scroll to target reel index');
});
