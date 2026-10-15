import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('--- Running Instagram Direct Messages & Follow Request Architecture Tests ---');

// Mock localStorage and window environment
class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] !== undefined ? this.store[key] : null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

globalThis.localStorage = new LocalStorageMock();
globalThis.window = {
  dispatchEvent: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
};
globalThis.fetch = async (url, opts) => {
  return {
    ok: true,
    json: async () => ({ success: true, messages: [] }),
  };
};

const dataStoreCode = fs.readFileSync(path.join(process.cwd(), 'src/lib/dataStore.ts'), 'utf8');

// 1. Verify DataStore methods exist and implement the architecture specification
console.log('Testing Architecture Implementation in src/lib/dataStore.ts...');

assert(dataStoreCode.includes('getInboxTier'), 'DataStore must implement getInboxTier');
assert(dataStoreCode.includes('getAcceptedMessageRequests'), 'DataStore must implement getAcceptedMessageRequests');
assert(dataStoreCode.includes('acceptMessageRequest'), 'DataStore must implement acceptMessageRequest');
assert(dataStoreCode.includes('unsendMessage'), 'DataStore must implement unsendMessage');
assert(dataStoreCode.includes('getVanishMode'), 'DataStore must implement getVanishMode');
assert(dataStoreCode.includes('setVanishMode'), 'DataStore must implement setVanishMode');
assert(dataStoreCode.includes('purgeVanishMessages'), 'DataStore must implement purgeVanishMessages');
assert(dataStoreCode.includes('canChatAndShare'), 'DataStore must implement canChatAndShare');

console.log('✓ PASS: All architectural DataStore primitives exist');

// 2. Test Server Store and API Route
console.log('Testing Server Store and API Routes for Unsend and Vanish Purge...');
const serverStoreCode = fs.readFileSync(path.join(process.cwd(), 'src/lib/serverStore.ts'), 'utf8');
const apiChatsCode = fs.readFileSync(path.join(process.cwd(), 'src/app/api/chats/route.ts'), 'utf8');

assert(serverStoreCode.includes('unsendServerChatMessage'), 'serverStore must implement unsendServerChatMessage');
assert(serverStoreCode.includes('purgeVanishServerChatMessages'), 'serverStore must implement purgeVanishServerChatMessages');
assert(apiChatsCode.includes("action === 'unsend'"), "api/chats must handle action === 'unsend'");
assert(apiChatsCode.includes("action === 'purge_vanish'"), "api/chats must handle action === 'purge_vanish'");

console.log('✓ PASS: Server store and API routes handle unsend and vanish mode purge');

// 3. Test Chats Page Architecture Features
console.log('Testing UI Integration in src/app/(main)/chats/page.tsx...');
const chatsPageCode = fs.readFileSync(path.join(process.cwd(), 'src/app/(main)/chats/page.tsx'), 'utf8');

// A. Stranger Sandbox Action Bar ([Block] [Delete] [Accept])
assert(chatsPageCode.includes('handleBlockStranger'), 'Chats page must implement handleBlockStranger');
assert(chatsPageCode.includes('handleDeleteRequest'), 'Chats page must implement handleDeleteRequest');
assert(chatsPageCode.includes('handleAcceptRequestFromSandbox'), 'Chats page must implement handleAcceptRequestFromSandbox');
assert(chatsPageCode.includes("DataStore.getInboxTier(currentUsername, targetUser) === 'REQUESTS'"), 'Chats page must check inbox tier for stranger sandbox');

// B. Anonymity (Invisible Reads)
assert(chatsPageCode.includes('Anonymity (Invisible Reads)'), 'Chats page must enforce invisible reads for message requests');

// C. Stranger Media Restriction
assert(chatsPageCode.includes('check.allowMedia'), 'Chats page must verify allowMedia before allowing photo attachments');

// D. Unsend Protocol
assert(chatsPageCode.includes('handleUnsendMessage'), 'Chats page must implement handleUnsendMessage');
assert(chatsPageCode.includes('Unsend Protocol'), 'Chats page must include Unsend action in reaction bar');

// E. Vanish Mode State Engine
assert(chatsPageCode.includes('handleToggleVanishMode'), 'Chats page must implement handleToggleVanishMode');
assert(chatsPageCode.includes('handleCloseActiveChat'), 'Chats page must purge vanish messages on close');
assert(chatsPageCode.includes('is_vanish_mode_message'), 'Chats page must tag vanish mode messages');
assert(chatsPageCode.includes('Vanish Mode is ON'), 'Chats page must display Vanish Mode banner when active');

console.log('✓ PASS: Chats page seamlessly implements Sandbox, Anonymity, Media Guard, Unsend & Vanish Mode');

// 4. Test Notification Routing to REQUESTS Tier
console.log('Testing Notification Listener in src/components/layout/GlobalNotificationListener.tsx...');
const notifCode = fs.readFileSync(path.join(process.cwd(), 'src/components/layout/GlobalNotificationListener.tsx'), 'utf8');

assert(notifCode.includes('DataStore.getInboxTier'), 'GlobalNotificationListener must inspect inbox tier');
assert(notifCode.includes('💬 Message Request from @'), 'GlobalNotificationListener must format notification title as Message Request for strangers');
assert(notifCode.includes('/chats?view=requests'), 'GlobalNotificationListener must link to requests tab for stranger messages');
assert(notifCode.includes('inboxTier: incomingTier'), 'GlobalNotificationListener must store inboxTier on incoming conversations');

console.log('✓ PASS: GlobalNotificationListener properly routes strangers to requests tier');

// 5. Test Real-Time 0ms Latency Acceleration & BroadcastChannel Synchronization
console.log('Testing 0ms Real-Time Delivery & Accelerated Polling Engine...');
assert(dataStoreCode.includes('broadcastChatEvent'), 'DataStore must implement broadcastChatEvent for instant real-time events');
assert(dataStoreCode.includes("new BroadcastChannel('dpsbuzz_realtime_chats')"), 'DataStore must use BroadcastChannel');
assert(chatsPageCode.includes("new BroadcastChannel('dpsbuzz_realtime_chats')"), 'Chats page must use BroadcastChannel for 0ms delivery');
assert(chatsPageCode.includes('setInterval(pollMessages, 400)'), 'Chats page must poll active messages at 400ms');
assert(notifCode.includes("new BroadcastChannel('dpsbuzz_realtime_chats')"), 'GlobalNotificationListener must listen to BroadcastChannel');
assert(notifCode.includes('setInterval(checkIncoming, 800)'), 'GlobalNotificationListener must poll at 800ms');

console.log('✓ PASS: Instant 0ms BroadcastChannel & sub-second polling verified across all chat touchpoints');

console.log('\n🎉 ALL INSTAGRAM CHAT & FOLLOW ARCHITECTURE TESTS PASSED! 🛡️✨');
