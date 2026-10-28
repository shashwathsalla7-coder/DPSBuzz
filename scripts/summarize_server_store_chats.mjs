import fs from 'fs';

const store = JSON.parse(fs.readFileSync('data/server_store.json', 'utf8'));
const chatMessages = store.chatMessages || {};

let totalMessages = 0;
const summary = {};

for (const [convId, msgs] of Object.entries(chatMessages)) {
  if (!Array.isArray(msgs)) continue;
  summary[convId] = msgs.length;
  totalMessages += msgs.length;
}

console.log('Total messages in server_store.json:', totalMessages);
console.log('Breakdown by conversation:');
for (const [c, n] of Object.entries(summary)) {
  console.log(`  ${c}: ${n} messages`);
}
