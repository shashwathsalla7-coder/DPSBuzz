import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('🧪 Starting Owner Permissions & Video Smoothness Test Suite...\n');

// 1. Check Home Page Post Delete Restrictions
const homePageCode = fs.readFileSync(path.resolve('src/app/(main)/home/page.tsx'), 'utf8');

// Find the delete button block in the post options modal
const deleteBlockMatch = homePageCode.match(/selectedOptionsPost\.username[\s\S]*?Delete post/);
assert.ok(deleteBlockMatch, 'Must find delete post button in home/page.tsx');
assert.ok(
  !deleteBlockMatch[0].includes('shashwath71845'),
  'Delete post button in home/page.tsx must not contain shashwath71845 bypass'
);
assert.ok(
  !deleteBlockMatch[0].includes('currentUser.role'),
  'Delete post button in home/page.tsx must not contain admin bypass'
);
assert.ok(
  homePageCode.includes('selectedOptionsPost.username.toLowerCase() === currentUser.username.toLowerCase()'),
  'home/page.tsx must strictly enforce author ownership check for post deletion'
);
console.log('✅ PASS: Home feed post deletion strictly restricted to author');

// 2. Check Profile Client Post Delete Restrictions
const profileClientCode = fs.readFileSync(path.resolve('src/app/(main)/u/[username]/ProfileClient.tsx'), 'utf8');

assert.ok(
  profileClientCode.includes('cur.username.toLowerCase() === selectedPostDetail.username.toLowerCase()'),
  'ProfileClient.tsx must strictly check author ownership in post detail modal deletion'
);
assert.ok(
  profileClientCode.includes('currentUser.username.toLowerCase() === peekPost.username.toLowerCase()'),
  'ProfileClient.tsx must strictly check author ownership in peek post deletion'
);
console.log('✅ PASS: ProfileClient post deletion strictly restricted to author');

// 3. Check StoryViewer Delete Story Restrictions
const storyViewerCode = fs.readFileSync(path.resolve('src/components/story/StoryViewer.tsx'), 'utf8');

assert.ok(
  storyViewerCode.includes('handleDeleteOwnStory'),
  'StoryViewer must define handleDeleteOwnStory handler'
);
assert.ok(
  storyViewerCode.includes('{isOwnStory && ('),
  'StoryViewer must guard story delete button with isOwnStory'
);
assert.ok(
  storyViewerCode.includes('DataStore.deleteStory'),
  'StoryViewer handleDeleteOwnStory must call DataStore.deleteStory'
);
console.log('✅ PASS: StoryViewer story deletion strictly restricted to story owner');

// 4. Check Video Smoothness Decoupling in ReelCard
const reelCardCode = fs.readFileSync(path.resolve('src/components/reels/ReelCard.tsx'), 'utf8');

assert.ok(
  !reelCardCode.includes('setProgress('),
  'ReelCard must not update React progress state on every frame in onTimeUpdate'
);
assert.ok(
  reelCardCode.includes('progressBarRef.current.style.width'),
  'ReelCard must update progress bar via direct DOM ref for 60fps smoothness'
);
assert.ok(
  reelCardCode.includes('isBuffering'),
  'ReelCard must track isBuffering state'
);
assert.ok(
  reelCardCode.includes('onWaiting=') && reelCardCode.includes('onPlaying='),
  'ReelCard must handle onWaiting and onPlaying video buffering events'
);
console.log('✅ PASS: ReelCard video playback decoupled from React state thrashing');

// 5. Check Video Smoothness in PostImage
const postImageCode = fs.readFileSync(path.resolve('src/components/home/PostImage.tsx'), 'utf8');

assert.ok(
  postImageCode.includes('scrubberFillRef.current.style.width'),
  'PostImage must update video scrubber via direct DOM ref'
);
assert.ok(
  postImageCode.includes('lastReportedSecondRef'),
  'PostImage must throttle time update re-renders to whole seconds'
);
assert.ok(
  postImageCode.includes('onWaiting=') && postImageCode.includes('onPlaying='),
  'PostImage must handle onWaiting and onPlaying events'
);
console.log('✅ PASS: PostImage video playback decoupled from React state thrashing');

console.log('\n🎉 ALL OWNER PERMISSIONS & VIDEO SMOOTHNESS TESTS PASSED!');
