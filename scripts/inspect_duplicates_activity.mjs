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

const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY && !env.SUPABASE_SERVICE_ROLE_KEY.includes('your-service')
  ? env.SUPABASE_SERVICE_ROLE_KEY
  : env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, supabaseKey);

async function inspectDuplicates() {
  const duplicateUsernames = [
    'vignesh', 'vignesh_7___49__', '7___49__', 'vig_7___49__',
    'varshithjella', 'jellavarshith',
    'shashwath', 'shashwath71845'
  ];

  console.log('=== INSPECTING DUPLICATE ACCOUNTS ACTIVITY ===');

  for (const u of duplicateUsernames) {
    console.log(`\nAccount: @${u}`);
    // Check posts
    const { data: posts } = await supabase.from('posts').select('id, caption, created_at').eq('author_username', u);
    console.log(`  Posts: ${posts?.length || 0}`);

    // Check messages
    const { data: sentMsgs } = await supabase.from('messages').select('id').eq('sender_id', u);
    const { data: chatMsgs } = await supabase.from('messages').select('id').ilike('chat_id', `%${u}%`);
    console.log(`  Messages: sent=${sentMsgs?.length || 0}, in_chat=${chatMsgs?.length || 0}`);

    // Check follows
    const { data: following } = await supabase.from('follows').select('following').eq('follower', u);
    const { data: followers } = await supabase.from('follows').select('follower').eq('following', u);
    console.log(`  Following: ${following?.length || 0}, Followers: ${followers?.length || 0}`);
  }
}

inspectDuplicates();
