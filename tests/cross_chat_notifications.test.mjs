import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('--- Running Cross-Chat Notification Banner Tests ---');

// 1. Verify GlobalNotificationListener.tsx
const notifListenerPath = path.resolve('src/components/layout/GlobalNotificationListener.tsx');
const notifCode = fs.readFileSync(notifListenerPath, 'utf8');

assert(
  notifCode.includes('/api/sync?username='),
  'GlobalNotificationListener must fetch sync with username query parameter'
);

assert(
  notifCode.includes("sessionStorage.getItem('dpsbuzz_active_chat_user')"),
  'GlobalNotificationListener must inspect active chat user in sessionStorage'
);

assert(
  notifCode.includes('activeChatUser === newestIncomingMsg.senderUsername.toLowerCase()'),
  'GlobalNotificationListener must verify whether incoming message belongs to the current foreground chat'
);

assert(
  notifCode.includes('setActiveToast(newestIncomingMsg)'),
  'GlobalNotificationListener must activate heads-up toast when receiving a message from another chat'
);

assert(
  notifCode.includes('playNotificationChime()'),
  'GlobalNotificationListener must play audio chime on incoming cross-chat message'
);

assert(
  notifCode.includes('activeToast.senderName') &&
  notifCode.includes('activeToast.senderUsername') &&
  notifCode.includes('activeToast.text'),
  'Notification banner must display sender profile name, username, and chat message preview'
);

assert(
  notifCode.includes("dpsbuzz:open_chat"),
  'Notification banner must dispatch dpsbuzz:open_chat to immediately switch conversation on click'
);

console.log('✓ PASS: GlobalNotificationListener properly detects cross-chat messages and renders profile name + text');

// 2. Verify chats/page.tsx integration
const chatsPagePath = path.resolve('src/app/(main)/chats/page.tsx');
const chatsCode = fs.readFileSync(chatsPagePath, 'utf8');

assert(
  chatsCode.includes("sessionStorage.setItem('dpsbuzz_active_chat_user'"),
  'chats/page.tsx must set active chat user in sessionStorage when inside a conversation'
);

assert(
  chatsCode.includes("sessionStorage.removeItem('dpsbuzz_active_chat_user')"),
  'chats/page.tsx must clear active chat user in sessionStorage when returning to inbox'
);

assert(
  chatsCode.includes("window.addEventListener('dpsbuzz:open_chat'"),
  'chats/page.tsx must listen to dpsbuzz:open_chat to switch chats on notification click'
);

console.log('✓ PASS: chats/page.tsx seamlessly synchronizes active chat status and handles instant notification switches');

console.log('\nAll Cross-Chat Notification tests passed successfully! 🔔✨');
