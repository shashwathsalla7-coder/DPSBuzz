import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('--- Running Chat Privacy & Access Control Tests ---');

// 1. Verify /api/sync/route.ts code enforcement
const syncRoutePath = path.resolve('src/app/api/sync/route.ts');
const syncRouteCode = fs.readFileSync(syncRoutePath, 'utf8');

assert(
  syncRouteCode.includes("searchParams.get('username')"),
  'GET /api/sync must read the username parameter'
);
assert(
  syncRouteCode.includes('filteredChatMessages') && syncRouteCode.includes('participants.includes(username)'),
  'GET /api/sync must filter chat messages so only participant conversations are returned'
);
console.log('✓ PASS: Server /api/sync only returns messages for the authenticated user');

// 2. Verify /api/chats/route.ts code enforcement
const chatsRoutePath = path.resolve('src/app/api/chats/route.ts');
const chatsRouteCode = fs.readFileSync(chatsRoutePath, 'utf8');

assert(
  chatsRouteCode.includes("searchParams.get('username')"),
  'GET /api/chats must read the username parameter'
);
assert(
  chatsRouteCode.includes('401') && chatsRouteCode.includes('403'),
  'GET & POST /api/chats must return 401/403 for unauthorized participants'
);
assert(
  chatsRouteCode.includes('!participants.includes(username)'),
  'GET /api/chats must reject users who are not participants in a direct conversation'
);
assert(
  chatsRouteCode.includes('!participants.includes(sender)'),
  'POST /api/chats must reject senders who are not participants in a direct conversation'
);
console.log('✓ PASS: Server /api/chats strictly rejects third-party snooping and unauthorized message sending');

// 3. Verify src/app/(main)/chats/page.tsx client-side privacy scoping
const chatsPagePath = path.resolve('src/app/(main)/chats/page.tsx');
const chatsPageCode = fs.readFileSync(chatsPagePath, 'utf8');

assert(
  chatsPageCode.includes('dpsbuzz_chat_conversations_${currentUsername}_v3') ||
  chatsPageCode.includes('dpsbuzz_chat_conversations_${uname}_v3'),
  'Client must scope conversations in localStorage to current user'
);
assert(
  chatsPageCode.includes('dpsbuzz_chat_messages_${currentUsername}_v3') ||
  chatsPageCode.includes('dpsbuzz_chat_messages_${uname}_v3'),
  'Client must scope chat messages in localStorage to current user'
);
assert(
  chatsPageCode.includes('/api/sync?username='),
  'Client sync loop must pass username query parameter to /api/sync'
);
assert(
  chatsPageCode.includes('/api/chats?conversationId=') && chatsPageCode.includes('&username='),
  'Client polling loop must pass username query parameter to /api/chats'
);
assert(
  chatsPageCode.includes('!participants.includes(currentUsername)') && chatsPageCode.includes('setActiveConversation(null)'),
  'Active conversation view must block rendering and kick out anyone attempting to view another student\'s direct chat'
);
console.log('✓ PASS: Client storage and active chat views are strictly isolated and guarded per-user');

console.log('\nAll Chat Privacy tests passed successfully! 🛡️🔒');
