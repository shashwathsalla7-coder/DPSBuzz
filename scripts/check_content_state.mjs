import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
    env[match[1]] = val;
  }
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  console.log('--- SUPABASE CHECK ---');
  const { data: posts, error: pErr } = await supabase.from('posts').select('id, username, caption, created_at');
  console.log('Posts:', posts?.length, pErr ? `Error: ${pErr.message}` : '');
  if (posts) {
    posts.forEach(p => console.log(`  [post] ${p.id} by @${p.username}: "${p.caption?.slice(0, 30)}"`));
  }

  const { data: stories, error: sErr } = await supabase.from('stories').select('*');
  console.log('Stories:', stories?.length, sErr ? `Error: ${sErr.message}` : '');
  if (stories) {
    stories.forEach(s => console.log(`  [story] ${s.id} by @${s.username}: "${s.caption || s.media_url}"`));
  }

  const { data: messages, error: mErr } = await supabase.from('chat_messages').select('id, sender_username, receiver_username, text, created_at').order('created_at', { ascending: false }).limit(10);
  console.log('Recent chat messages:', messages?.length, mErr ? `Error: ${mErr.message}` : '');
  if (messages) {
    messages.forEach(m => console.log(`  [msg] ${m.sender_username} -> ${m.receiver_username}: "${m.text?.slice(0, 30)}"`));
  }

  // Also check serverStore.json
  console.log('\n--- SERVER STORE CHECK ---');
  if (fs.existsSync('serverStore.json')) {
    const sStore = JSON.parse(fs.readFileSync('serverStore.json', 'utf8'));
    console.log('ServerStore posts count:', sStore.posts?.length || 0);
    console.log('ServerStore stories count:', sStore.stories?.length || 0);
    console.log('ServerStore chats count:', Object.keys(sStore.chats || {}).length);
    for (const [key, msgs] of Object.entries(sStore.chats || {})) {
      console.log(`  Chat key "${key}": ${(msgs || []).length} messages`);
    }
  } else {
    console.log('serverStore.json does not exist');
  }
}

run();
