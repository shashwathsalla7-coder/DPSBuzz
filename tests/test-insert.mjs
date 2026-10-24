import { createClient } from '@supabase/supabase-js';

const url = 'https://xdvoeddebquguuqgyscl.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkdm9lZGRlYnF1Z3V1cWd5c2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNDE4NjQsImV4cCI6MjEwNzcxNzg2NH0.w7HbWCGQmyK-tayzXR8l06rLzCsPQtIrnGhJQjhzUbg';
const sb = createClient(url, anonKey);

async function run() {
  const start = Date.now();
  const testCid = 'test-speed-' + Date.now();
  const { data, error } = await sb
    .from('messages')
    .insert([{
      chat_id: 'arjun_8a__priya_7b',
      sender_id: 'arjun_8a',
      text: 'Speed test message',
      client_id: testCid,
    }])
    .select();

  const elapsed = Date.now() - start;
  console.log(`INSERT COMPLETED IN: ${elapsed}ms`);
  if (error) {
    console.error('ERROR:', error);
  } else {
    console.log('SUCCESS: Insert returned row:', data);
  }
}

run();
