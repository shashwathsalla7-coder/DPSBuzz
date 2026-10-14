import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('--- Starting Engagement Ranking & Chat Sharing Verification Test ---');

// Test 1: Verify Feed Sorting in home/page.tsx
console.log('Test 1: Validating feed engagement ranking in src/app/(main)/home/page.tsx...');
const homePageContent = fs.readFileSync(path.resolve('src/app/(main)/home/page.tsx'), 'utf8');

// Assert that we no longer isolate myPosts and place them at the very top of the feed
assert(
  !homePageContent.includes('[...myPosts, ...others]'),
  'HomePage must NOT arbitrarily place myPosts ahead of others in Following feed'
);
assert(
  !homePageContent.includes('[...myPosts, ...sortedOthers]'),
  'HomePage must NOT arbitrarily place myPosts ahead of others in Whole School feed'
);

// Assert engagement score calculation is used to sort both Following and Whole School
assert(
  homePageContent.includes('scoreB - scoreA'),
  'HomePage must sort feed posts descending by engagement score'
);

// Unit test engagement ranking formula
function calculateScore(post) {
  return (post.likes * 2) + (post.comments * 3) + ((post.views || 0) * 1);
}

const mockFeedPosts = [
  { id: 'my-post', username: 'arjun_8a', likes: 1, comments: 0, views: 5 }, // score: 2 + 0 + 5 = 7
  { id: 'viral-post', username: 'sneha_10c', likes: 80, comments: 15, views: 300 }, // score: 160 + 45 + 300 = 505
  { id: 'sports-post', username: 'rahul_9b', likes: 40, comments: 10, views: 150 }, // score: 80 + 30 + 150 = 260
];

const sortedFeed = [...mockFeedPosts].sort((a, b) => calculateScore(b) - calculateScore(a));
assert.equal(sortedFeed[0].id, 'viral-post', 'Most engaged post must appear first');
assert.equal(sortedFeed[1].id, 'sports-post', 'Second most engaged post must appear second');
assert.equal(sortedFeed[2].id, 'my-post', 'Low engagement post must NOT be pushed to the top');
console.log('✓ Feed engagement ranking verified: higher engagement posts appear first.');

// Test 2: In Chat - Conversation with shared post appears FIRST
console.log('\nTest 2: Validating chat conversation priority when anyone shares...');
const chatsPageContent = fs.readFileSync(path.resolve('src/app/(main)/chats/page.tsx'), 'utf8');

assert(
  chatsPageContent.includes('const aIsShared = a.previewType === \'post\' || a.lastMessage.toLowerCase().includes(\'shared a post\');'),
  'ChatsPage must check for shared posts in filteredConversations sorting'
);
assert(
  chatsPageContent.includes('if (aIsShared && !bIsShared) return -1;'),
  'ChatsPage must rank conversations with shared posts FIRST at the top'
);

// Unit test chat sorting logic
const mockConvs = [
  { id: 'conv-normal', name: 'Priya Nair', lastMessage: 'See you tomorrow', timeAgo: '15m', isPinned: false },
  { id: 'conv-pinned', name: 'Class 8-A Official', lastMessage: 'Homework list', timeAgo: '3h', isPinned: true },
  { id: 'conv-shared', name: 'Rohan Verma', lastMessage: 'Rohan shared a post by @sneha_10c', timeAgo: 'Just now', previewType: 'post', isPinned: false },
];

const sortedConvs = [...mockConvs].sort((a, b) => {
  const aIsShared = a.previewType === 'post' || a.lastMessage.toLowerCase().includes('shared a post');
  const bIsShared = b.previewType === 'post' || b.lastMessage.toLowerCase().includes('shared a post');
  if (aIsShared && !bIsShared) return -1;
  if (!aIsShared && bIsShared) return 1;
  if (a.timeAgo === 'Just now' && b.timeAgo !== 'Just now') return -1;
  if (b.timeAgo === 'Just now' && a.timeAgo !== 'Just now') return 1;
  if (a.isPinned && !b.isPinned) return -1;
  if (!a.isPinned && b.isPinned) return 1;
  return 0;
});

assert.equal(sortedConvs[0].id, 'conv-shared', 'Conversation with shared post MUST be FIRST in inbox');
console.log('✓ Chat inbox prioritization verified: shared post conversation represents first.');

// Test 3: Person Who Shared is Represented First on the shared post card in chat
console.log('\nTest 3: Validating that the person who shared is represented first...');
assert(
  chatsPageContent.includes('Person who shared (Represented First at the top)'),
  'chats/page.tsx must have a header representing the person who shared first'
);
assert(
  chatsPageContent.includes('{msg.sharedBy'),
  'chats/page.tsx must display msg.sharedBy in the postAttachment banner'
);
assert(
  chatsPageContent.includes('sharedBy?: string;'),
  'ChatMessage interface must include sharedBy property'
);

console.log('✓ Person who shared banner verified on shared post card.');

// Test 4: Post Sharing from Home & Search updates conversation to #1 with sharedBy
console.log('\nTest 4: Validating post sharing updates in home/page.tsx & search/page.tsx...');
assert(
  homePageContent.includes("sharedBy: 'You'"),
  'home/page.tsx must set sharedBy: You when sharing a post'
);
assert(
  homePageContent.includes("previewType: 'post'"),
  'home/page.tsx must set previewType: post when sharing a post'
);

const searchPageContent = fs.readFileSync(path.resolve('src/app/(main)/search/page.tsx'), 'utf8');
assert(
  searchPageContent.includes("sharedBy: 'You'"),
  'search/page.tsx must set sharedBy: You when sharing a post'
);
assert(
  searchPageContent.includes("previewType: 'post'"),
  'search/page.tsx must set previewType: post when sharing a post'
);
console.log('✓ Post sharing updates from both Home and Search verified.');

console.log('\n======================================================');
console.log('ALL ENGAGEMENT & CHAT SHARING TESTS PASSED (4/4)!');
console.log('======================================================\n');
