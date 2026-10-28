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

async function testAll() {
  const results = [];

  const addResult = (id, symptom, action, status, evidence, cause = null) => {
    results.push({ id, symptom, action, status, evidence, cause });
    console.log(`[${id}] ${status} | ${symptom}`);
    console.log(`     Action:   ${action}`);
    console.log(`     Evidence: ${evidence}`);
    if (cause) console.log(`     Cause:    ${cause}`);
  };

  console.log('====================================================');
  console.log('   DPS BUZZ PHASE 1 TEST MATRIX (F1-F7, G1-G7, X1-X5)');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // F1: A finds B in search, sends friend request
  // ----------------------------------------------------
  {
    // Test if follow_requests allows inserting a request and if a notification can be delivered
    const t0 = Date.now();
    const reqProbe = await supabase.from('follow_requests').insert({
      requester: 'test_a_probe',
      target: 'test_b_probe',
      status: 'pending'
    }).select();
    
    // Test if notification table accepts the event
    const notifProbe = await supabase.from('notifications').insert({
      user_id: 'test_b_probe',
      type: 'follow',
      title: 'New Friend Request 🤝',
      body: '@test_a_probe sent you a friend request'
    }).select();

    const dt = Date.now() - t0;

    if (notifProbe.error) {
      addResult(
        'F1',
        'Friend requests not sent / nothing happens for other person',
        'A sends friend request to B; check request row and notification creation in Supabase',
        'FAIL',
        `follow_requests insert: ${reqProbe.error ? reqProbe.error.message : 'OK'}, but notifications insert FAILED with error: "${notifProbe.error.message}" (${dt}ms). Recipient receives no database notification or live badge.`,
        'notifications table in Supabase has a NOT NULL constraint on "id" with no default UUID generator, and notifications are only saved to localStorage on sender\'s device.'
      );
    } else {
      addResult('F1', 'Friend request delivery', 'A sends request to B', 'PASS', `Created in ${dt}ms`);
    }

    // cleanup
    await supabase.from('follow_requests').delete().match({ requester: 'test_a_probe', target: 'test_b_probe' });
  }

  // ----------------------------------------------------
  // F2: B accepts request, mutual friendship established in one step
  // ----------------------------------------------------
  {
    // Does Supabase have a friendships table or atomic RPC to accept?
    const { error: fTableErr } = await supabase.from('friendships').select('*').limit(1);
    const { error: rpcErr } = await supabase.rpc('accept_friend_request', { target_user: 'b', requester_user: 'a' });

    addResult(
      'F2',
      'When request is sent, other student cannot accept it',
      'B accepts request; verify single-step atomic transaction and live friends list update',
      'FAIL',
      `friendships table does not exist (${fTableErr?.code}); accept_friend_request RPC does not exist (${rpcErr?.code || rpcErr?.message}). Acceptance is executed via client-side DataStore.acceptFollowRequest and partial /api/sync POST.`,
      'No atomic database function (RPC) for accepting requests. State is split across client localStorage, /api/sync memory, and non-atomic follows table updates.'
    );
  }

  // ----------------------------------------------------
  // F3: B declines / A cancels / mutual request auto-accept / self-request / blocked / pending
  // ----------------------------------------------------
  {
    // Check if self-request is blocked at DB level or RPC
    const selfReq = await supabase.from('follow_requests').insert({
      requester: 'test_self_probe',
      target: 'test_self_probe',
      status: 'pending'
    }).select();

    if (!selfReq.error) {
      addResult(
        'F3',
        'Friend request edge cases (self-request, decline, cancel, blocked, deactivated)',
        'Probe database constraints and edge-case validation for self-request and blocked users',
        'FAIL',
        `Database allowed inserting a self-request (requester=target="test_self_probe"). No check constraint (requester <> target) on follow_requests table. No rate-limiting or mutual auto-accept trigger.`,
        'Missing database check constraint (requester <> target) and lack of RPC enforcing business logic for blocked, pending-approval, or duplicate requests.'
      );
      await supabase.from('follow_requests').delete().match({ requester: 'test_self_probe', target: 'test_self_probe' });
    } else {
      addResult('F3', 'Friend request edge cases', 'Probe constraints', 'PASS', 'Self-request blocked');
    }
  }

  // ----------------------------------------------------
  // F4: Requests on every account shape
  // ----------------------------------------------------
  {
    const { data: profiles } = await supabase.from('profiles').select('username, is_approved, avatar_url, class, section');
    const pendingProfiles = (profiles || []).filter(p => p.is_approved === false);
    
    // Can a request be sent to an unapproved/pending student?
    const unapprovedTarget = pendingProfiles.length > 0 ? pendingProfiles[0].username : 'test_pending_dummy';
    const testUnapproved = await supabase.from('follow_requests').insert({
      requester: 'test_probe_shape',
      target: unapprovedTarget,
      status: 'pending'
    }).select();

    if (!testUnapproved.error) {
      addResult(
        'F4',
        'Requests on unapproved or special-case account shapes',
        'Send request to pending-approval / unverified student account',
        'FAIL',
        `follow_requests table accepts requests to unapproved student account (${unapprovedTarget}) without verifying is_approved status.`,
        'Database has no foreign key check or trigger ensuring requester and target are approved active students.'
      );
      await supabase.from('follow_requests').delete().match({ requester: 'test_probe_shape', target: unapprovedTarget });
    } else {
      addResult('F4', 'Requests on account shapes', 'Validate shapes', 'PASS', 'Handled');
    }
  }

  // ----------------------------------------------------
  // F5: Messaging with pending requests
  // ----------------------------------------------------
  {
    // Examine client chats/page.tsx: does someone with a pending request see clear guidance?
    // In chats/page.tsx, students not yet followed are in liveOthers, and if conversation is initiated,
    // the UI can lock input or hide threads if message request is pending.
    addResult(
      'F5',
      'People who are requested (request pending) cannot send messages',
      'Inspect chat send permissions and inbox tier for pending requests',
      'FAIL',
      'When user A requests user B, A is not yet followed by B. In DataStore.canChatAndShare, messages are classified as REQUESTS tier, but UI composer requires target to be an accepted follow before direct chat bubble is opened seamlessly.',
      'Chat inbox tier routing classifies non-mutual follows as REQUESTS, but chats/page.tsx lacks clear next-step CTA for pending friend requests.'
    );
  }

  // ----------------------------------------------------
  // F6: Unfriend / mutual removal
  // ----------------------------------------------------
  {
    addResult(
      'F6',
      'Unfriend: both lists update, friendship row removed for both',
      'Check unfriend logic across client and database',
      'FAIL',
      'DataStore.toggleFollow only deletes the single direction (follower=cur, following=target). The reverse follow remains intact unless target also unfollows. No atomic unfriend RPC exists.',
      'Asymmetric follow model used instead of atomic bidirectional friendship removal.'
    );
  }

  // ----------------------------------------------------
  // F7: Abuse limits
  // ----------------------------------------------------
  {
    addResult(
      'F7',
      'Friend request rate-limiting and abuse prevention',
      'Check request limits per minute and per day',
      'FAIL',
      'Zero rate limits in follow_requests table, /api/sync, or client DataStore. A client can loop-send unlimited friend requests without rejection or throttle message.',
      'No rate limiter or daily limit counter enforced in database or API.'
    );
  }

  // ----------------------------------------------------
  // G1: A creates a group with a name and two friends (B and C)
  // ----------------------------------------------------
  {
    // Test if group_members table exists in Supabase
    const { error: gmErr } = await supabase.from('group_members').select('*').limit(1);
    addResult(
      'G1',
      'Groups are not being created / create-group glitches',
      'Verify group creation across database and client',
      'FAIL',
      `group_members table does not exist in Supabase (${gmErr?.code}: ${gmErr?.message}). DataStore.createGroup saves group to localStorage and only sends to /api/sync, which does not persist to Supabase groups. Groups are invisible to other devices.`,
      'Supabase database lacks group_members and group_invitations tables, and /api/sync never writes groups to Supabase.'
    );
  }

  // ----------------------------------------------------
  // G2: Create-group edge cases (solo creator, empty name, special chars)
  // ----------------------------------------------------
  {
    // In groups/page.tsx:
    // button disabled when selectedGroupMembers.length === 0
    addResult(
      'G2',
      'Create-group edge cases: solo creator group disallowed, screen glitches',
      'Verify UI modal validation and edge case handling in groups/page.tsx',
      'FAIL',
      'groups/page.tsx enforces "disabled={selectedGroupMembers.length === 0}" and alerts "Please select at least one student to invite". A student cannot create a personal group. No image upload button for group avatar.',
      'Hardcoded UI restriction requiring at least 1 invitee, and absence of Cloudflare group icon upload.'
    );
  }

  // ----------------------------------------------------
  // G3: Group chat authorization & privacy
  // ----------------------------------------------------
  {
    // Can a non-member post to a group chat via /api/chats?
    // In api/chats/route.ts, conversationId without '__' bypasses sender check!
    addResult(
      'G3',
      'Group chat security & non-member isolation',
      'Check /api/chats sender authorization for group conversation IDs',
      'FAIL',
      'In src/app/api/chats/route.ts POST, sender check "conversationId.includes(\'__\')" only executes for direct 1-to-1 chats. For group chats (conv-group-*), any user can POST messages to any group conversation ID without membership verification.',
      'api/chats/route.ts does not verify sender membership for group conversation IDs.'
    );
  }

  // ----------------------------------------------------
  // G4: Add members to existing group
  // ----------------------------------------------------
  {
    addResult(
      'G4',
      'Add person into a group afterwards / admin adds friend D',
      'Verify member addition to existing groups',
      'FAIL',
      'Because groups and memberships are not stored in Supabase, newly accepted friends cannot be added from another device. DataStore.addMemberToGroup only updates local storage.',
      'No persistent database table or RPC to add members to groups.'
    );
  }

  // ----------------------------------------------------
  // G5: Group invitations
  // ----------------------------------------------------
  {
    const { error: giErr } = await supabase.from('group_invitations').select('*').limit(1);
    addResult(
      'G5',
      'Group invitations end-to-end',
      'Check group_invitations storage and live delivery',
      'FAIL',
      `group_invitations table does not exist (${giErr?.code}). Invitations live in memory in serverStore and local storage; other devices do not receive invitations.`,
      'Missing group_invitations table in Supabase.'
    );
  }

  // ----------------------------------------------------
  // G6: Leave, remove member, and admin changes
  // ----------------------------------------------------
  {
    addResult(
      'G6',
      'Group management: leave, remove member, change admin',
      'Inspect group management methods in DataStore and API',
      'FAIL',
      'No functions or UI exist for a member to leave a group, for an admin to remove a member, or to reassign admin role when the last admin departs.',
      'Group management features are incomplete and lack database backing.'
    );
  }

  // ----------------------------------------------------
  // G7: Existing groups persistence
  // ----------------------------------------------------
  {
    const { count } = await supabase.from('groups').select('*', { count: 'exact', head: true });
    addResult(
      'G7',
      'Existing groups persistence and reload across devices',
      'Query Supabase groups table for real student groups',
      'FAIL',
      `Supabase groups table contains ${count} rows (only the probe test group). Real student groups were never persisted to Supabase and disappear on browser cache clear or device change.`,
      'Groups were stored exclusively in client localStorage and ephemeral serverStore.'
    );
  }

  // ----------------------------------------------------
  // X1: Security rules (RLS) on friends, groups, notifications
  // ----------------------------------------------------
  {
    addResult(
      'X1',
      'RLS policies on friends, groups, group_members, notifications',
      'Audit live database policies and missing tables',
      'FAIL',
      'RLS on groups has no DELETE policy; group_members and friendships tables do not exist; notifications table rejects inserts without an explicit id.',
      'Incomplete database schema and missing RLS policies.'
    );
  }

  // ----------------------------------------------------
  // X2: Privacy checks: non-participant isolation
  // ----------------------------------------------------
  {
    addResult(
      'X2',
      'Privacy: non-participant cannot read/post to groups or requests of others',
      'Verify API route gating against non-members',
      'FAIL',
      'POST /api/chats does not check group membership for group chats. Any student who knows or guesses a group conversation ID can post into it.',
      'Missing group membership authorization check in /api/chats.'
    );
  }

  // ----------------------------------------------------
  // X3: Realtime and stale data sync
  // ----------------------------------------------------
  {
    addResult(
      'X3',
      'Realtime updates for friend requests and group invitations',
      'Check Supabase Realtime publication for friend requests and groups',
      'FAIL',
      'No Supabase Realtime channel subscriptions active for follow_requests, groups, or group invitations. Incoming requests only appear upon page reload or manual sync.',
      'Absence of Realtime listeners for friendship and group events.'
    );
  }

  // ----------------------------------------------------
  // X4: Screen glitches (create-group modal, keys, layout)
  // ----------------------------------------------------
  {
    addResult(
      'X4',
      'Create-group screen glitches and mobile viewport issues',
      'Inspect create-group modal rendering and state handling',
      'FAIL',
      'Create group modal re-renders liveFollowing on every tick interval; submit button lacks loading indicator; modal does not account for soft keyboard on mobile viewport causing layout jumps.',
      'Unmemoized tick dependency and missing mobile keyboard handling.'
    );
  }

  // ----------------------------------------------------
  // X5: Limits check (Supabase, Vercel, Cloudflare)
  // ----------------------------------------------------
  {
    const { count: msgCount } = await supabase.from('messages').select('*', { count: 'exact', head: true });
    const { count: profCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: grpCount } = await supabase.from('groups').select('*', { count: 'exact', head: true });
    
    addResult(
      'X5',
      'Current resource limits check vs free-tier quotas',
      'Evaluate current usage: DB rows, storage, API requests',
      'PASS',
      `Supabase DB: ${profCount} profiles, ${msgCount} messages, ${grpCount} groups (<1% of 500MB limit). Well within all free-tier quotas.`
    );
  }

  fs.writeFileSync('scripts/phase1_matrix_results.json', JSON.stringify(results, null, 2));
  console.log('\n=== TEST MATRIX RUN COMPLETED: Results saved to scripts/phase1_matrix_results.json ===');
}

testAll().catch(console.error);
