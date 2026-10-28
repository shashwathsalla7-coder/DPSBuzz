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

async function runAudit() {
  console.log('=== PHASE 0 DEEP SCHEMA & POLICY AUDIT ===');

  const checkTable = async (t) => {
    const sel = await supabase.from(t).select('*', { count: 'exact' }).limit(1);
    if (sel.error) {
      return { exists: false, error: `${sel.error.code} - ${sel.error.message}` };
    }
    return { exists: true, count: sel.count, sample: sel.data[0] || null };
  };

  const tablesToCheck = [
    'friends', 'friendships', 'friend_requests',
    'follows', 'follow_requests',
    'groups', 'group_members', 'group_invitations', 'group_join_requests',
    'notifications', 'messages', 'profiles', 'blocks', 'user_blocks'
  ];

  const results = {};
  for (const t of tablesToCheck) {
    results[t] = await checkTable(t);
    console.log(`Table ${t}: ${results[t].exists ? `EXISTS (${results[t].count} rows)` : `MISSING (${results[t].error})`}`);
  }

  console.log('\n--- TESTING PERMISSIONS ON LIVE TABLES ---');

  // Test groups insert/select/update
  const testGroupId = `test_grp_${Date.now()}`;
  const grpInsert = await supabase.from('groups').insert({
    id: testGroupId,
    name: `Test Group Probe ${Date.now()}`,
    creator_username: 'probe_test',
    member_count: 1
  }).select();
  console.log('groups INSERT result:', grpInsert.error ? `FAILED: ${grpInsert.error.message}` : 'SUCCESS');
  if (!grpInsert.error) {
    const grpUpdate = await supabase.from('groups').update({ description: 'updated probe' }).eq('id', testGroupId).select();
    console.log('groups UPDATE result:', grpUpdate.error ? `FAILED: ${grpUpdate.error.message}` : 'SUCCESS');
    const grpDelete = await supabase.from('groups').delete().eq('id', testGroupId);
    console.log('groups DELETE result:', grpDelete.error ? `FAILED: ${grpDelete.error.message}` : 'SUCCESS');
  }

  // Test follows insert/select/update/delete
  const folInsert = await supabase.from('follows').insert({
    follower: 'test_probe_user_1',
    following: 'test_probe_user_2'
  }).select();
  console.log('follows INSERT result:', folInsert.error ? `FAILED: ${folInsert.error.message}` : 'SUCCESS');
  if (!folInsert.error) {
    const folDel = await supabase.from('follows').delete().match({ follower: 'test_probe_user_1', following: 'test_probe_user_2' });
    console.log('follows DELETE result:', folDel.error ? `FAILED: ${folDel.error.message}` : 'SUCCESS');
  }

  // Test follow_requests insert/update/delete
  const frInsert = await supabase.from('follow_requests').insert({
    requester: 'test_probe_user_1',
    target: 'test_probe_user_2',
    status: 'pending'
  }).select();
  console.log('follow_requests INSERT result:', frInsert.error ? `FAILED: ${frInsert.error.message}` : 'SUCCESS');
  if (!frInsert.error) {
    const frUpdate = await supabase.from('follow_requests').update({ status: 'accepted' }).match({ requester: 'test_probe_user_1', target: 'test_probe_user_2' });
    console.log('follow_requests UPDATE result:', frUpdate.error ? `FAILED: ${frUpdate.error.message}` : 'SUCCESS');
    const frDel = await supabase.from('follow_requests').delete().match({ requester: 'test_probe_user_1', target: 'test_probe_user_2' });
    console.log('follow_requests DELETE result:', frDel.error ? `FAILED: ${frDel.error.message}` : 'SUCCESS');
  }

  // Test notifications
  const notifInsert = await supabase.from('notifications').insert({
    user_id: 'test_probe_user_1',
    type: 'follow',
    title: 'Test Notification',
    body: 'Testing notification table'
  }).select();
  console.log('notifications INSERT result:', notifInsert.error ? `FAILED: ${notifInsert.error.message}` : 'SUCCESS');
  if (!notifInsert.error) {
    await supabase.from('notifications').delete().eq('user_id', 'test_probe_user_1');
  }
}

runAudit().catch(console.error);
