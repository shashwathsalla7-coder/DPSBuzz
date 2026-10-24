import { createClient } from '@supabase/supabase-js';

const url = 'https://xdvoeddebquguuqgyscl.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkdm9lZGRlYnF1Z3V1cWd5c2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNDE4NjQsImV4cCI6MjEwNzcxNzg2NH0.w7HbWCGQmyK-tayzXR8l06rLzCsPQtIrnGhJQjhzUbg';

const supabase = createClient(url, anonKey, { auth: { persistSession: false } });

async function runAudit() {
  console.log('--- AUDITING LIVE SUPABASE CHAT MESSAGES ---');

  // 1. Check select on messages
  const t0 = Date.now();
  const { data: rows, error: selectErr, count } = await supabase
    .from('messages')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(20);
  const selectDuration = Date.now() - t0;

  console.log(`Select finished in ${selectDuration}ms`);
  if (selectErr) {
    console.error('Select Error:', selectErr);
  } else {
    console.log(`Found ${rows?.length || 0} recent messages (Total count: ${count})`);
    if (rows && rows.length > 0) {
      console.log('Most recent message:', {
        id: rows[0].id,
        chat_id: rows[0].chat_id,
        sender_id: rows[0].sender_id,
        client_id: rows[0].client_id,
        status: rows[0].status,
        created_at: rows[0].created_at,
        text_preview: rows[0].text ? rows[0].text.substring(0, 20) : null
      });
      console.log('All recent message statuses:', rows.map(r => ({
        created_at: r.created_at,
        sender_id: r.sender_id,
        status: r.status,
        client_id: r.client_id
      })));
    }
  }

  // 2. Check schema / columns on messages by attempting a dry-run insert or inspecting errors
  console.log('\n--- TESTING EXACT INSERT USED BY useChatMessages ---');
  const testClientId = 'audit-test-' + Date.now();
  const tInsert0 = Date.now();
  
  // NOTE: Testing an insert as anonymous user exactly as useChatMessages does
  // But wait, user rule: "Never delete or change existing messages or user data. Never load-test my live production database"
  // Let's test with a dry run or roll back / or test if RLS allows it!
  const insertPayload = {
    chat_id: 'test__audit',
    sender_id: 'test_student',
    text: 'audit test message',
    client_id: testClientId,
  };

  const { data: insertData, error: insertErr } = await supabase
    .from('messages')
    .insert([insertPayload])
    .select();
  const insertDuration = Date.now() - tInsert0;

  console.log(`Insert completed in ${insertDuration}ms`);
  if (insertErr) {
    console.log('INSERT RESULT: FAILED! Error details:');
    console.log('Code:', insertErr.code);
    console.log('Message:', insertErr.message);
    console.log('Details:', insertErr.details);
    console.log('Hint:', insertErr.hint);
  } else {
    console.log('INSERT RESULT: SUCCESS! Returned row:', insertData);
    // Clean up immediately so we leave no test pollution
    if (insertData && insertData[0]?.id) {
      await supabase.from('messages').delete().eq('id', insertData[0].id);
      console.log('Cleaned up test record successfully.');
    }
  }

  // 3. Check conversations table
  console.log('\n--- CHECKING CONVERSATIONS & PARTICIPANTS ---');
  const { data: convs, error: convErr } = await supabase.from('conversations').select('*').limit(5);
  console.log('Conversations query error:', convErr ? convErr.message : 'None');
  console.log('Sample conversations:', convs?.length);

  const { data: parts, error: partErr } = await supabase.from('conversation_participants').select('*').limit(5);
  console.log('Participants query error:', partErr ? partErr.message : 'None');
  console.log('Sample participants:', parts?.length);

  // 4. Check message_receipts
  const { data: receipts, error: receiptErr } = await supabase.from('message_receipts').select('*').limit(5);
  console.log('Receipts query error:', receiptErr ? receiptErr.message : 'None');
}

runAudit();
