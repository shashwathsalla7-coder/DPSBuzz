import { createClient } from '@supabase/supabase-js';

const url = 'https://xdvoeddebquguuqgyscl.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkdm9lZGRlYnF1Z3V1cWd5c2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNDE4NjQsImV4cCI6MjEwNzcxNzg2NH0.w7HbWCGQmyK-tayzXR8l06rLzCsPQtIrnGhJQjhzUbg';
const sb = createClient(url, anonKey);

async function inspect() {
  console.log('=== 1. CHECKING MESSAGES TABLE (COLUMNS & SAMPLES) ===');
  const { data: msgs, error: msgsErr } = await sb.from('messages').select('*').order('created_at', { ascending: false }).limit(5);
  if (msgsErr) {
    console.error('Error fetching messages:', msgsErr);
  } else {
    console.log(`Found ${msgs?.length || 0} recent messages:`);
    if (msgs && msgs.length > 0) {
      console.log('Columns in first row:', Object.keys(msgs[0]));
      console.log('First 2 rows:', JSON.stringify(msgs.slice(0, 2), null, 2));
    }
  }

  console.log('\n=== 2. CHECKING IF message_receipts TABLE EXISTS ===');
  const { data: recs, error: recsErr } = await sb.from('message_receipts').select('*').limit(1);
  if (recsErr) {
    console.log('message_receipts table query error:', recsErr.message, 'Code:', recsErr.code);
  } else {
    console.log('message_receipts table exists! Row:', recs);
  }

  console.log('\n=== 3. CHECKING IF conversations TABLE EXISTS ===');
  const { data: convs, error: convsErr } = await sb.from('conversations').select('*').limit(1);
  if (convsErr) {
    console.log('conversations table query error:', convsErr.message, 'Code:', convsErr.code);
  } else {
    console.log('conversations table exists! Row:', convs);
  }

  console.log('\n=== 4. TEST DIRECT INSERT (MEASURE TIMING & ERROR) ===');
  const testClientId = 'audit-test-' + Date.now();
  const startTime = Date.now();
  const { data: insertData, error: insertErr } = await sb.from('messages').insert([
    {
      chat_id: 'arjun_8a__priya_7b',
      sender_id: 'arjun_8a',
      text: 'Test message for timing audit',
      client_id: testClientId,
      status: 'sent',
    }
  ]).select();
  const endTime = Date.now();
  console.log(`Insert round-trip took: ${endTime - startTime}ms`);
  if (insertErr) {
    console.error('Insert ERROR:', insertErr.message, 'Details:', insertErr.details, 'Hint:', insertErr.hint, 'Code:', insertErr.code);
  } else {
    console.log('Insert SUCCESS! Returned:', insertData);
  }

  console.log('\n=== 5. TEST UPDATE ON DELIVERED_AT & READ_AT ===');
  const updateStart = Date.now();
  const { data: updateData, error: updateErr } = await sb
    .from('messages')
    .update({ delivered_at: new Date().toISOString(), status: 'delivered' })
    .eq('client_id', testClientId)
    .select();
  const updateEnd = Date.now();
  console.log(`Update round-trip took: ${updateEnd - updateStart}ms`);
  if (updateErr) {
    console.error('Update ERROR:', updateErr.message, 'Code:', updateErr.code);
  } else {
    console.log('Update SUCCESS! Returned:', updateData);
  }

  console.log('\n=== 6. CHECK FOR MESSAGES WITH NULL STATUS OR STUCK SENDING ===');
  const { count: stuckCount, error: countErr } = await sb
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .or('status.eq.sending,status.is.null');
  console.log('Messages with status=sending or status is null:', stuckCount);

  const { count: nullClientCount } = await sb
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .is('client_id', null);
  console.log('Messages with null client_id:', nullClientCount);

  const { count: totalMsgCount } = await sb
    .from('messages')
    .select('*', { count: 'exact', head: true });
  console.log('Total messages in messages table:', totalMsgCount);
}

inspect();
