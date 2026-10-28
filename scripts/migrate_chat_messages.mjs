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

async function migrateChatMessages() {
  console.log('--- STARTING CHAT MESSAGE MIGRATION TO SUPABASE ---');

  // 1. Fetch all existing client_ids in Supabase messages
  const { data: existingRows, error: fetchErr } = await supabase
    .from('messages')
    .select('client_id');

  if (fetchErr) {
    console.error('Failed to fetch existing messages:', fetchErr);
    return;
  }

  const existingClientIds = new Set(existingRows.map((r) => r.client_id).filter(Boolean));
  console.log(`Found ${existingClientIds.size} existing messages in Supabase.`);

  // 2. Load server_store.json
  const store = JSON.parse(fs.readFileSync('data/server_store.json', 'utf8'));
  const chatMessages = store.chatMessages || {};

  const toInsert = [];

  for (const [convId, msgs] of Object.entries(chatMessages)) {
    if (!Array.isArray(msgs)) continue;

    for (const m of msgs) {
      const clientId = m.client_id || m.id;
      if (!clientId || existingClientIds.has(clientId)) {
        continue;
      }

      // Format ISO created_at
      let createdAt = m.createdAt;
      if (!createdAt && m.timestamp) {
        createdAt = new Date(m.timestamp).toISOString();
      } else if (!createdAt) {
        createdAt = new Date().toISOString();
      }

      const row = {
        client_id: clientId,
        chat_id: convId,
        sender_id: (m.senderUsername || 'unknown').toLowerCase().trim(),
        text: m.text || (m.sharedPost ? 'Shared a post 📸' : (m.image ? '📷 Photo' : 'Message')),
        created_at: createdAt,
        status: m.status || (m.isSeen || m.is_read ? 'read' : m.isDelivered ? 'delivered' : 'sent'),
      };

      if (m.sharedPost || m.post_preview || m.post_id) {
        row.message_type = 'post_share';
        row.post_id = m.post_id || m.sharedPost?.id || null;
        row.post_preview = m.post_preview || m.sharedPost || null;
      } else if (m.image || m.mediaUrl || m.isChatPhoto) {
        row.message_type = 'photo';
      } else {
        row.message_type = 'text';
      }

      toInsert.push(row);
      existingClientIds.add(clientId); // Guard against duplicates inside server_store
    }
  }

  console.log(`Prepared ${toInsert.length} new messages to insert into Supabase.`);

  if (toInsert.length === 0) {
    console.log('All messages already migrated!');
    return;
  }

  // Insert in batches of 25 to ensure reliable network transfer
  const BATCH_SIZE = 25;
  let insertedCount = 0;

  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase.from('messages').insert(batch).select('id, client_id');

    if (error) {
      console.error(`Error inserting batch ${i / BATCH_SIZE + 1}:`, error);
      // Fallback: try individual inserts in this batch to maximize recovery
      for (const singleRow of batch) {
        const { error: sErr } = await supabase.from('messages').insert([singleRow]);
        if (!sErr) insertedCount++;
        else console.warn(`Individual insert failed for ${singleRow.client_id}:`, sErr.message);
      }
    } else {
      insertedCount += data.length;
      console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1} (${data.length} msgs) inserted successfully.`);
    }
  }

  console.log(`--- MIGRATION COMPLETE: ${insertedCount} messages inserted into Supabase ---`);
}

migrateChatMessages();
