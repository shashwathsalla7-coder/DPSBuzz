import fs from 'fs';

const store = JSON.parse(fs.readFileSync('data/server_store.json', 'utf8'));
const chatMessages = store.chatMessages || {};

let missingSender = 0;
for (const [convId, msgs] of Object.entries(chatMessages)) {
  if (!Array.isArray(msgs)) continue;
  for (const m of msgs) {
    if (!m.senderUsername) {
      missingSender++;
      console.log(`Missing senderUsername in ${convId}:`, m);
    }
  }
}
console.log('Total messages missing senderUsername:', missingSender);
