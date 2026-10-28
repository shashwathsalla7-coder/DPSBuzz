import fs from 'fs';

const store = JSON.parse(fs.readFileSync('data/server_store.json', 'utf8'));
const chatMessages = store.chatMessages || {};

let emptyText = 0;
for (const [convId, msgs] of Object.entries(chatMessages)) {
  if (!Array.isArray(msgs)) continue;
  for (const m of msgs) {
    if (!m.text && !m.sharedPost && !m.image && !m.mediaUrl && !m.gameInvite) {
      emptyText++;
      console.log(`Empty message in ${convId}:`, m);
    }
  }
}
console.log('Total messages with empty text/media:', emptyText);
