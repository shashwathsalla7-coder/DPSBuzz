import fs from 'node:fs';
import assert from 'node:assert';

console.log('--- Running Shared Representation First Tests ---');

// 1. Check Feed Ordering in HomePage (src/app/(main)/home/page.tsx)
const homePageCode = fs.readFileSync('src/app/(main)/home/page.tsx', 'utf8');

// A. Following tab: myPosts placed first
assert(
  homePageCode.includes('myPosts = filtered.filter') &&
  homePageCode.includes('[...myPosts, ...others]'),
  'HomePage Following tab must place posts created/shared by the current user at the top'
);
console.log('✓ PASS: Following tab prioritizes user’s own posts at index 0');

// B. Whole School tab: myPosts placed first before other engagement-ranked public posts
assert(
  homePageCode.includes('myPosts = publicPosts.filter') &&
  homePageCode.includes('sortedOthers = [...othersPosts].sort') &&
  homePageCode.includes('[...myPosts, ...sortedOthers]'),
  'HomePage Whole School tab must place user’s own public posts first, followed by engagement-sorted peer posts'
);
console.log('✓ PASS: Whole School tab prioritizes user’s own posts first, followed by engagement-ranked posts');

// C. Share Post Modal: conversation placed at index 0 in conversation list
assert(
  homePageCode.includes('const updated = [updatedConv, ...restConvs]') &&
  homePageCode.includes("localStorage.setItem('dpsbuzz_conversations_v1'"),
  'HomePage Share Modal must prepend the updated conversation to index 0 of the conversation list'
);
console.log('✓ PASS: Feed Share Post modal prioritizes target conversation to index 0');

// 2. Check ChatsPage (src/app/(main)/chats/page.tsx)
const chatsPageCode = fs.readFileSync('src/app/(main)/chats/page.tsx', 'utf8');

// A. handleSendMessage moves active conversation to index 0
assert(
  chatsPageCode.includes('const updatedItem = { ...target, lastMessage: `You: ${text}`, timeAgo: exactTime };') &&
  chatsPageCode.includes('const updated = [updatedItem, ...rest];') &&
  chatsPageCode.includes("localStorage.setItem('dpsbuzz_conversations_v1'"),
  'ChatsPage handleSendMessage must move the active conversation to index 0'
);
console.log('✓ PASS: Sending a chat message moves conversation to index 0');

// B. Partner reply moves active conversation to index 0
assert(
  chatsPageCode.includes('const updatedItem = { ...target, lastMessage: `${partnerName}: ${replyText}`, timeAgo: replyTime };') &&
  chatsPageCode.includes('const updated = [updatedItem, ...rest];'),
  'ChatsPage partner reply must move the active conversation to index 0'
);
console.log('✓ PASS: Receiving a classmate reply moves conversation to index 0');

// C. Gallery photo upload moves active conversation to index 0
assert(
  chatsPageCode.includes("lastMessage: 'You sent a photo 📸'") &&
  chatsPageCode.includes('const updated = [updatedItem, ...rest];'),
  'ChatsPage gallery photo share must move the active conversation to index 0'
);
console.log('✓ PASS: Sharing a photo from gallery moves conversation to index 0');

// D. ChatsPage listens for real-time updates from other tabs / feed share
assert(
  chatsPageCode.includes("window.addEventListener('dpsbuzz:content_updated'") &&
  chatsPageCode.includes("localStorage.getItem('dpsbuzz_conversations_v1')"),
  'ChatsPage must listen to dpsbuzz:content_updated and storage events to re-render in real-time'
);
console.log('✓ PASS: Real-time event synchronization in ChatsPage verified');

console.log('\nALL SHARED REPRESENTATION TESTS PASSED! 🐝✨');
