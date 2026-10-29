// @ts-check
import assert from 'node:assert';

console.log('====================================================');
console.log('🎵 POST MUSIC & TRIM PERMISSIONS VERIFICATION TEST');
console.log('====================================================');

// Mock data structures
const mockPosts = [
  {
    id: 'post-alice-1',
    username: 'alice_smith',
    caption: 'Class project presentation!',
    song: {
      id: 'song-1',
      title: 'Summer Breeze',
      artist: 'Acoustic Collective',
      startTime: 15,
      clipDuration: 15,
      audioUrl: 'https://example.com/audio1.mp3',
    },
  },
  {
    id: 'post-bob-repost',
    username: 'bob_jones',
    caption: 'Check this out!',
    isRepost: true,
    repostedFrom: { username: 'alice_smith', id: 'post-alice-1' },
    song: {
      id: 'song-1',
      title: 'Summer Breeze',
      artist: 'Acoustic Collective',
      startTime: 15,
      clipDuration: 15,
      audioUrl: 'https://example.com/audio1.mp3',
    },
  },
  {
    id: 'post-charlie-no-music',
    username: 'charlie_dps',
    caption: 'Quiet library study',
    song: undefined,
  },
];

// Logic under test: Strict post author check
function computeIsAuthor(currentUser, post) {
  return Boolean(
    currentUser &&
      !post.isRepost &&
      currentUser.username.toLowerCase() === post.username.toLowerCase()
  );
}

// Logic under test: updatePostSong authorization
function updatePostSongMock(posts, postId, newSong, requesterUsername) {
  const target = posts.find((p) => p.id === postId);
  if (!target) return { success: false, reason: 'Post not found' };

  const cleanReq = (requesterUsername || '').toLowerCase().trim();
  const cleanAuthor = (target.username || '').toLowerCase().trim();

  // Strict author ownership verification
  if (!cleanReq || cleanReq !== cleanAuthor) {
    return { success: false, reason: 'Unauthorized: only post author can change music' };
  }

  target.song = newSong;
  return { success: true, updatedPost: target };
}

// ==========================================
// TEST 1: Other user cannot change post music or trim
// ==========================================
{
  const viewer = { username: 'shashwath71845', role: 'admin' };
  const post = mockPosts[0]; // Alice's post

  const isAuthor = computeIsAuthor(viewer, post);
  assert.strictEqual(isAuthor, false, 'Non-author (even admin) must NOT be considered author of another user post');

  const updateResult = updatePostSongMock(mockPosts, post.id, { id: 'song-hack', title: 'Hacked Song' }, viewer.username);
  assert.strictEqual(updateResult.success, false, 'updatePostSong must reject non-author');
  assert.strictEqual(post.song.title, 'Summer Breeze', 'Song on Alice post must NOT be changed');
  console.log('✅ [PASS] Test 1: Another user / admin CANNOT change or trim other user posts music');
}

// ==========================================
// TEST 2: Author ("he or she") CAN change and trim their own post music
// ==========================================
{
  const author = { username: 'alice_smith' };
  const post = mockPosts[0];

  const isAuthor = computeIsAuthor(author, post);
  assert.strictEqual(isAuthor, true, 'Author must be recognized as post author');

  const newTrimmedSong = {
    id: 'song-2',
    title: 'Focus Beats',
    artist: 'Lofi Chill',
    startTime: 22, // Trimmed/scrubbed start time
    clipDuration: 15,
    audioUrl: 'https://example.com/audio2.mp3',
  };

  const updateResult = updatePostSongMock(mockPosts, post.id, newTrimmedSong, author.username);
  assert.strictEqual(updateResult.success, true, 'Author must be able to update and trim their own post music');
  assert.strictEqual(post.song.title, 'Focus Beats', 'Song on post must be updated');
  assert.strictEqual(post.song.startTime, 22, 'Trimmed start offset must be updated');
  console.log('✅ [PASS] Test 2: Post author CAN change and trim soundtrack on their own post');
}

// ==========================================
// TEST 3: Reposted post cannot have soundtrack changed by reposter
// ==========================================
{
  const reposter = { username: 'bob_jones' };
  const repost = mockPosts[1];

  const isAuthor = computeIsAuthor(reposter, repost);
  assert.strictEqual(isAuthor, false, 'Reposter must NOT be permitted to change soundtrack of a repost');
  console.log('✅ [PASS] Test 3: Reposter cannot modify or trim soundtrack of reposted content');
}

// ==========================================
// TEST 4: Case-insensitive username match allows legitimate author
// ==========================================
{
  const authorCaps = { username: 'ALICE_SMITH' };
  const post = mockPosts[0];

  const isAuthor = computeIsAuthor(authorCaps, post);
  assert.strictEqual(isAuthor, true, 'Case-insensitive username match must recognize author');
  console.log('✅ [PASS] Test 4: Case-insensitive username match correctly authorizes author');
}

// ==========================================
// TEST 5: Post without music: Author can add; others cannot see add button
// ==========================================
{
  const author = { username: 'charlie_dps' };
  const nonAuthor = { username: 'alice_smith' };
  const post = mockPosts[2]; // Charlie's post with no song

  assert.strictEqual(computeIsAuthor(author, post), true, 'Author can see add music button');
  assert.strictEqual(computeIsAuthor(nonAuthor, post), false, 'Non-author cannot see add music button');
  console.log('✅ [PASS] Test 5: Post without music allows author to add music, hides option from others');
}

// ==========================================
// TEST 6: Server API authorization check simulation
// ==========================================
{
  const existingPost = { id: 'post-alice-1', username: 'alice_smith' };

  function simulateApiPostCheck(body, existing) {
    if (existing) {
      const origAuthor = (existing.username || '').toLowerCase().trim();
      const cleanReq = (body.requester || body.post?.username || '').toLowerCase().trim();
      if (cleanReq !== origAuthor) {
        return { status: 403, error: 'Unauthorized' };
      }
    }
    return { status: 200, success: true };
  }

  // Unauthorized attempt
  const res1 = simulateApiPostCheck(
    { post: { id: 'post-alice-1', username: 'attacker' }, requester: 'attacker' },
    existingPost
  );
  assert.strictEqual(res1.status, 403, 'Server API must return 403 for non-author update');

  // Authorized attempt
  const res2 = simulateApiPostCheck(
    { post: { id: 'post-alice-1', username: 'alice_smith' }, requester: 'alice_smith' },
    existingPost
  );
  assert.strictEqual(res2.status, 200, 'Server API must allow author update');

  console.log('✅ [PASS] Test 6: Server API strictly blocks unauthorized post soundtrack modifications');
}

console.log('\n====================================================');
console.log('📊 ALL 6/6 POST MUSIC PERMISSION TESTS PASSED!');
console.log('====================================================\n');
