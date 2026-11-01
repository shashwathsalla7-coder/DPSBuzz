import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testRealtimeConnection() {
  console.log('Testing Supabase Realtime connection...');
  const channel = supabase.channel('test-channel-probe');
  
  channel.on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
    console.log('Realtime message event received:', payload);
  });

  channel.subscribe((status, err) => {
    console.log('Channel subscription status:', status, err || '');
    if (status === 'SUBSCRIBED') {
      console.log('✅ Realtime websocket subscribed successfully!');
      setTimeout(() => {
        channel.unsubscribe();
        process.exit(0);
      }, 3000);
    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      console.error('❌ Channel subscription error:', status, err);
      process.exit(1);
    }
  });
}

testRealtimeConnection();
