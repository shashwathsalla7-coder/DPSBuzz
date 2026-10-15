import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('--- Running Story Reply Perspective Tests ---');

// ==============================================================================
// 1. Functional Logic Test: Regex & Perspective Resolution
// ==============================================================================
const parseStoryReply = (text, isMe) => {
  const storyMatch = text.match(
    /^(?:You replied to their story|Replied to their story|Replied to your story|Replied to story):\s*["']?([\s\S]*?)["']?\s*(?:💬)?$/i
  );
  if (!storyMatch) return null;
  const rawContent = storyMatch[1].replace(/^["']|["']$/g, '').trim();
  return {
    isStoryReply: true,
    content: rawContent,
    bubbleHeader: isMe ? 'You replied to their story' : 'Replied to your story',
    inboxPreview: isMe
      ? `You replied to their story: "${rawContent}" 💬`
      : `Replied to your story: "${rawContent}" 💬`,
  };
};

// Case A: Canonical server format: Replied to story: "Awesome shot!" 💬
const sample1 = 'Replied to story: "Awesome shot!" 💬';

// Sender view (isMe = true):
const senderView1 = parseStoryReply(sample1, true);
assert.strictEqual(senderView1.bubbleHeader, 'You replied to their story');
assert.strictEqual(senderView1.inboxPreview, 'You replied to their story: "Awesome shot!" 💬');
assert.strictEqual(senderView1.content, 'Awesome shot!');
console.log('✓ PASS: Sender sees "You replied to their story" for canonical replies');

// Recipient view (isMe = false):
const recipientView1 = parseStoryReply(sample1, false);
assert.strictEqual(recipientView1.bubbleHeader, 'Replied to your story');
assert.strictEqual(recipientView1.inboxPreview, 'Replied to your story: "Awesome shot!" 💬');
assert.strictEqual(recipientView1.content, 'Awesome shot!');
console.log('✓ PASS: Story creator sees "Replied to your story" for canonical replies');

// Case B: Backward compatibility with legacy "Replied to your story: 'Hello' 💬"
const legacy1 = 'Replied to your story: "Hello" 💬';
const senderLegacy1 = parseStoryReply(legacy1, true);
assert.strictEqual(senderLegacy1.bubbleHeader, 'You replied to their story');
assert.strictEqual(senderLegacy1.inboxPreview, 'You replied to their story: "Hello" 💬');

const recipientLegacy1 = parseStoryReply(legacy1, false);
assert.strictEqual(recipientLegacy1.bubbleHeader, 'Replied to your story');
assert.strictEqual(recipientLegacy1.inboxPreview, 'Replied to your story: "Hello" 💬');
console.log('✓ PASS: Legacy "Replied to your story" automatically adapts to sender perspective');

// Case C: Backward compatibility with legacy "You replied to their story: 'Hello' 💬"
const legacy2 = 'You replied to their story: "Hello" 💬';
const recipientLegacy2 = parseStoryReply(legacy2, false);
assert.strictEqual(recipientLegacy2.bubbleHeader, 'Replied to your story');
assert.strictEqual(recipientLegacy2.inboxPreview, 'Replied to your story: "Hello" 💬');
console.log('✓ PASS: Legacy "You replied to their story" automatically adapts to story creator perspective');

// ==============================================================================
// 2. Codebase Assertions
// ==============================================================================

// A. Check src/lib/dataStore.ts
const dataStoreCode = fs.readFileSync(path.resolve('src/lib/dataStore.ts'), 'utf8');
assert(
  dataStoreCode.includes('sendStoryReplyToChat(story: Story, replyText: string'),
  'sendStoryReplyToChat must exist in DataStore'
);
assert(
  dataStoreCode.includes('const canonicalMsgText = `Replied to story: "${replyText}" 💬`;'),
  'Canonical message text in DataStore must use neutral "Replied to story: ..."'
);
assert(
  dataStoreCode.includes('const senderPreview = `You replied to their story: "${replyText}" 💬`;'),
  'Sender conversation preview in DataStore must be "You replied to their story: ..."'
);
assert(
  dataStoreCode.includes('title: `💬 @${cur} replied to your story`'),
  'Story author notification in DataStore must announce "@user replied to your story"'
);
console.log('✓ PASS: DataStore stores neutral canonical message, sender preview, and author notification');

// B. Check src/app/(main)/chats/page.tsx
const chatsCode = fs.readFileSync(path.resolve('src/app/(main)/chats/page.tsx'), 'utf8');

// Check message bubble rendering in active chat
assert(
  chatsCode.includes("isMe ? 'You replied to their story' : 'Replied to your story'"),
  'Chat message bubble must render "You replied to their story" for isMe, and "Replied to your story" for recipient'
);

// Check conversation inbox preview
assert(
  chatsCode.includes("msgPreview = isMe\n              ? `You replied to their story: \"${rawContent}\" 💬`\n              : `Replied to your story: \"${rawContent}\" 💬`;") ||
  chatsCode.includes("isMe\n              ? `You replied to their story: \"${rawContent}\" 💬`"),
  'Chats inbox preview must distinguish sender from recipient'
);
console.log('✓ PASS: Chat message bubbles & conversation previews display correct perspective in UI');

// C. Check src/components/layout/GlobalNotificationListener.tsx
const notifCode = fs.readFileSync(path.resolve('src/components/layout/GlobalNotificationListener.tsx'), 'utf8');
assert(
  notifCode.includes('toastText = `Replied to your story: "${content}" 💬`;'),
  'GlobalNotificationListener must format incoming story reply toast as "Replied to your story: ..."'
);
assert(
  notifCode.includes('notifTitle = `📖 @${senderUser} replied to your story`;'),
  'GlobalNotificationListener must format incoming story reply notification title with story icon'
);
console.log('✓ PASS: Global notification banner displays "Replied to your story" to story recipient');

console.log('\nAll Story Reply Perspective tests passed successfully! 📖💬✨');
