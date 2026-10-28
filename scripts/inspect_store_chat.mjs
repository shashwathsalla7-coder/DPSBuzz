import fs from 'fs';

const content = fs.readFileSync('data/server_store.json', 'utf8');
const store = JSON.parse(content);

console.log('chatMessages keys in server_store.json:', Object.keys(store.chatMessages || {}));
for (const [k, v] of Object.entries(store.chatMessages || {})) {
  console.log(`Key: ${k} (${v.length} messages)`);
  if (v.length > 0) {
    console.log('Sample:', v.slice(-2));
  }
}
