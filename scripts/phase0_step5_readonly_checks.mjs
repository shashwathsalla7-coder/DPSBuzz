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

async function runReadOnlyChecks() {
  console.log('=== PHASE 0 STEP 5: READ-ONLY DATA CHECKS ===');

  // Fetch profiles from Supabase
  const { data: dbProfiles } = await supabase.from('profiles').select('id, username, is_approved');
  const profileUsernames = new Set((dbProfiles || []).map(p => (p.username || '').toLowerCase().trim()));
  const approvedUsernames = new Set((dbProfiles || []).filter(p => p.is_approved !== false).map(p => (p.username || '').toLowerCase().trim()));
  const pendingOrDeactivated = new Set((dbProfiles || []).filter(p => p.is_approved === false).map(p => (p.username || '').toLowerCase().trim()));

  // Fetch follows & follow_requests from Supabase
  const { data: dbFollows } = await supabase.from('follows').select('*');
  const { data: dbFollowRequests } = await supabase.from('follow_requests').select('*');
  const { data: dbGroups } = await supabase.from('groups').select('*');

  // 1. Groups checks in Supabase
  console.log(`[Supabase] Total groups in database: ${dbGroups ? dbGroups.length : 0}`);
  const groupsWithoutAdmin = (dbGroups || []).filter(g => !g.creator_username || !profileUsernames.has(g.creator_username.toLowerCase().trim()));
  console.log(`[Supabase] Groups with no creator/admin: ${groupsWithoutAdmin.length}`);

  // 2. Groups checks in server_store.json
  const storeRaw = fs.readFileSync('data/server_store.json', 'utf8');
  const store = JSON.parse(storeRaw);
  const storeGroups = store.groups || [];
  const storeGroupMembers = store.groupMembers || {};
  const storeGroupInvites = store.groupJoinRequests || [];

  console.log(`[ServerStore] Total groups: ${storeGroups.length}`);
  const storeGroupsNoAdmin = storeGroups.filter(g => !g.creatorUsername && !g.creator);
  console.log(`[ServerStore] Groups with no admin/creator: ${storeGroupsNoAdmin.length}`);

  let missingGroupOrUserMembersCount = 0;
  for (const [gid, members] of Object.entries(storeGroupMembers)) {
    const grpExists = storeGroups.some(g => g.id === gid);
    if (!grpExists) {
      missingGroupOrUserMembersCount += members.length;
    }
  }
  console.log(`[ServerStore] Group members pointing to missing groups: ${missingGroupOrUserMembersCount}`);

  // 3. Duplicate pending requests between the same two students
  const pendingRequests = (dbFollowRequests || []).filter(r => r.status === 'pending');
  const pendingPairs = new Map();
  let duplicatePendingCount = 0;
  for (const r of pendingRequests) {
    const key = `${r.requester.toLowerCase().trim()}__${r.target.toLowerCase().trim()}`;
    if (pendingPairs.has(key)) {
      duplicatePendingCount++;
    } else {
      pendingPairs.set(key, (pendingPairs.get(key) || 0) + 1);
    }
  }
  console.log(`[Supabase] Duplicate pending requests between same pair: ${duplicatePendingCount}`);

  // 4. Accepted requests that have no friendship (mutual follows) row
  const acceptedRequests = (dbFollowRequests || []).filter(r => r.status === 'accepted');
  const followPairs = new Set((dbFollows || []).map(f => `${f.follower.toLowerCase().trim()}__${f.following.toLowerCase().trim()}`));
  let acceptedWithNoFollowCount = 0;
  for (const r of acceptedRequests) {
    const hasFollow = followPairs.has(`${r.requester.toLowerCase().trim()}__${r.target.toLowerCase().trim()}`);
    if (!hasFollow) acceptedWithNoFollowCount++;
  }
  console.log(`[Supabase] Accepted requests with no follow row: ${acceptedWithNoFollowCount}`);

  // 5. Friendships (mutual follows) with no accepted request
  let mutualFollowPairsCount = 0;
  let mutualWithNoRequestCount = 0;
  const processedPairs = new Set();
  for (const f of (dbFollows || [])) {
    const u1 = f.follower.toLowerCase().trim();
    const u2 = f.following.toLowerCase().trim();
    const sortedKey = [u1, u2].sort().join(':::');
    if (processedPairs.has(sortedKey)) continue;
    processedPairs.add(sortedKey);

    const isMutual = followPairs.has(`${u1}__${u2}`) && followPairs.has(`${u2}__${u1}`);
    if (isMutual) {
      mutualFollowPairsCount++;
      const hasReq = (dbFollowRequests || []).some(r =>
        (r.requester.toLowerCase().trim() === u1 && r.target.toLowerCase().trim() === u2) ||
        (r.requester.toLowerCase().trim() === u2 && r.target.toLowerCase().trim() === u1)
      );
      if (!hasReq) mutualWithNoRequestCount++;
    }
  }
  console.log(`[Supabase] Mutual follow friendships: ${mutualFollowPairsCount}`);
  console.log(`[Supabase] Mutual friendships with no request row: ${mutualWithNoRequestCount}`);

  // 6. Requests stuck as pending for a long time (> 7 days)
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const stuckRequests = (dbFollowRequests || []).filter(r => r.status === 'pending' && new Date(r.created_at).getTime() < oneWeekAgo);
  console.log(`[Supabase] Requests stuck as pending > 7 days: ${stuckRequests.length}`);

  // 7. Requests to or from deactivated or pending-approval users
  const invalidUserRequests = (dbFollowRequests || []).filter(r => {
    const req = r.requester.toLowerCase().trim();
    const tar = r.target.toLowerCase().trim();
    return pendingOrDeactivated.has(req) || pendingOrDeactivated.has(tar) || !profileUsernames.has(req) || !profileUsernames.has(tar);
  });
  console.log(`[Supabase] Requests involving deactivated/pending/missing users: ${invalidUserRequests.length}`);

  // 8. Duplicate friendships (duplicate follow rows in same direction)
  const seenFollows = new Set();
  let duplicateFollowRows = 0;
  for (const f of (dbFollows || [])) {
    const key = `${f.follower.toLowerCase().trim()}__${f.following.toLowerCase().trim()}`;
    if (seenFollows.has(key)) duplicateFollowRows++;
    else seenFollows.add(key);
  }
  console.log(`[Supabase] Duplicate follow rows: ${duplicateFollowRows}`);
}

runReadOnlyChecks().catch(console.error);
