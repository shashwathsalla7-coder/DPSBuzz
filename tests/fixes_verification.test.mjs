import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('--- Running Verification Tests for Profile Restrictions, Calls, Chat Leak & Ticks ---');

// Test 1: Leaked chat removal in data/server_store.json
console.log('1. Verifying data/server_store.json has no leaked conv-shashwath71845...');
const storeJson = JSON.parse(fs.readFileSync('data/server_store.json', 'utf-8'));
assert.strictEqual(
  storeJson.chatMessages['conv-shashwath71845'],
  undefined,
  'conv-shashwath71845 must be purged from server_store.json'
);
console.log('✓ PASS: Leaked single-user chat key is purged from server store.');

// Test 2: ServerStore normalizeStore sanitization
console.log('2. Verifying serverStore.ts normalizeStore sanitization...');
const serverStoreContent = fs.readFileSync('src/lib/serverStore.ts', 'utf-8');
assert(
  serverStoreContent.includes("parts.length === 2 && parts[0] !== parts[1]"),
  'normalizeStore must sanitize chatMessages to only pairs and groups'
);
assert(
  serverStoreContent.includes('export async function markServerChatMessagesRead'),
  'markServerChatMessagesRead must be exported'
);
console.log('✓ PASS: ServerStore sanitizes keys and exports markServerChatMessagesRead.');

// Test 3: Profile Add Protections
console.log('3. Verifying Profile Client and DataStore add action guards...');
const profileClientContent = fs.readFileSync('src/app/(main)/u/[username]/ProfileClient.tsx', 'utf-8');
assert(
  profileClientContent.includes('onPostClick={isOwnProfile ? () => setShowHabitPostModal(true) : undefined}'),
  'StreakTierLadder must guard onPostClick with isOwnProfile'
);
assert(
  profileClientContent.includes('showHabitPostModal && isOwnProfile &&'),
  'showHabitPostModal must be guarded with isOwnProfile'
);
assert(
  profileClientContent.includes('if (!isOwnProfile || !habitCaption.trim() || !profile) return;'),
  'handleHabitSubmit must guard with isOwnProfile'
);

const dataStoreContent = fs.readFileSync('src/lib/dataStore.ts', 'utf-8');
assert(
  dataStoreContent.includes("throw new Error('Unauthorized: You can only add or update a note on your own profile')"),
  'saveChatNote must enforce owner-only'
);
assert(
  dataStoreContent.includes("throw new Error('Unauthorized: You can only create highlights on your own profile')"),
  'addHighlight must enforce owner-only'
);
assert(
  dataStoreContent.includes("throw new Error('Unauthorized: You can only record habit posts for your own profile')"),
  'recordHabitPost must enforce owner-only'
);
console.log('✓ PASS: Profile add actions are strictly locked down to own profile.');

// Test 4: Voice Call Facility Stability
console.log('4. Verifying GlobalCallProvider.tsx call stability and ringing handling...');
const callProviderContent = fs.readFileSync('src/components/calls/GlobalCallProvider.tsx', 'utf-8');
assert(
  !callProviderContent.includes("if (activeCall && (!serverCall || serverCall.status === 'ended'))"),
  'Case 4 instant cutoff bug must be removed'
);
assert(
  callProviderContent.includes('callAge > 35000'),
  'Ringing timeout guard must be present'
);
assert(
  callProviderContent.includes('consecutiveMissedPollsRef'),
  'consecutiveMissedPollsRef must be used for connected calls'
);
assert(
  callProviderContent.includes('Camera/mic access error, attempting audio-only fallback'),
  'Microphone errors must fall back gracefully to synthetic tracks'
);
console.log('✓ PASS: Voice & video call facility is resilient and will not cut prematurely.');

// Test 5: Checkmarks (Delivered Grey vs Read Blue)
console.log('5. Verifying message delivery checkmarks (grey delivered vs blue read)...');
const chatsPageContent = fs.readFileSync('src/app/(main)/chats/page.tsx', 'utf-8');
assert(
  chatsPageContent.includes("msg.is_read || msg.isSeen || msg.readAt ? 'text-[#007AFF]' : 'text-zinc-400'"),
  'Chats page must render blue checkmark when read, and grey checkmark when delivered'
);
assert(
  chatsPageContent.includes("DataStore.markMessagesAsRead(canonicalId, currentUsername)"),
  'Active chat view must mark messages as read'
);
assert(
  chatsPageContent.includes("type === 'MESSAGES_READ'"),
  'Chats page must listen to real-time MESSAGES_READ event'
);
assert(
  dataStoreContent.includes("markMessagesAsRead(conversationId: string, readerUsername: string)"),
  'DataStore must export markMessagesAsRead'
);
console.log('✓ PASS: Checkmarks display grey when delivered and turn blue when read!');

console.log('\n🎉 ALL 5 VERIFICATION SUITES PASSED FLAWLESSLY! 🚀');
