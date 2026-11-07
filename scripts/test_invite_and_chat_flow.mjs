import { execSync } from 'child_process';

const BASE_URL = 'http://localhost:3000';
const AUTH_HEADER = {
  'Content-Type': 'application/json',
  'x-dpsbuzz-user': JSON.stringify({
    username: 'shashwath71845',
    fullName: 'Shashwath S',
    role: 'admin',
    class: 'Class 8',
    section: 'G'
  })
};

async function main() {
  console.log('🚀 [TEST SUITE] Comprehensive Verification of Invite Links, Admin Roles, Password Gate & Chat Database Persistence');

  // ==========================================
  // TEST 1: Chat message persistence in D1
  // ==========================================
  console.log('\n--- TEST 1: Chat Persistence & isMe Verification in Cloudflare D1 ---');
  const testMsgPayload = {
    action: 'send_campus_wire_message',
    channelId: 'channel-class-8g',
    text: `Test persistence check from @shashwath71845 at ${Date.now()}`,
    senderUsername: 'shashwath71845',
    senderName: 'Shashwath S (Class Rep)',
    senderRole: 'student',
    type: 'text'
  };

  const sendRes = await fetch(`${BASE_URL}/api/campus`, {
    method: 'POST',
    headers: AUTH_HEADER,
    body: JSON.stringify(testMsgPayload)
  });
  const sendJson = await sendRes.json();
  console.log('Send response:', sendJson);
  if (!sendJson.success || !sendJson.message?.id) {
    throw new Error(`Failed to send message: ${JSON.stringify(sendJson)}`);
  }
  const messageId = sendJson.message.id;
  console.log(`✅ Message saved to D1 with ID: ${messageId}`);

  // Fetch messages from channel
  const fetchRes = await fetch(`${BASE_URL}/api/campus?action=campus_wire_messages&channelId=channel-class-8g`);
  const fetchJson = await fetchRes.json();
  const foundMsg = fetchJson.messages?.find((m) => m.id === messageId);
  if (!foundMsg) {
    throw new Error(`Message ${messageId} was not found in fetched messages!`);
  }
  console.log(`✅ Fetched message successfully from D1: "${foundMsg.text}"`);
  console.log(`Sender: ${foundMsg.sender_username || foundMsg.senderUsername}`);

  // Test isMe calculation formula used in src/app/campus-wire/page.tsx:
  const activeUser = { username: 'shashwath71845', name: 'Shashwath S' };
  const msgUser = foundMsg.sender_username || foundMsg.senderUsername;
  const isMe = (msgUser === activeUser.username);
  console.log(`✅ isMe evaluated for Shashwath: ${isMe} (Must be true so sent message appears on right side in bubble)`);
  if (!isMe) {
    throw new Error('isMe evaluation failed for active sender!');
  }

  // ==========================================
  // TEST 2: Generate Admin Invite Link with Password Protection
  // ==========================================
  console.log('\n--- TEST 2: Generate Admin Invite Link with Password Protection ---');
  const createAdminInviteRes = await fetch(`${BASE_URL}/api/campus`, {
    method: 'POST',
    headers: AUTH_HEADER,
    body: JSON.stringify({
      action: 'create_invite_link',
      channelId: 'channel-class-8g',
      roleGranted: 'admin',
      password: 'DPSAdminPass2026!',
      requireApproval: false,
      createdBy: 'shashwath71845'
    })
  });
  const adminInviteJson = await createAdminInviteRes.json();
  console.log('Admin invite link created:', adminInviteJson);
  if (!adminInviteJson.success || !adminInviteJson.invite?.inviteCode) {
    throw new Error(`Failed to create admin invite link: ${JSON.stringify(adminInviteJson)}`);
  }
  const adminCode = adminInviteJson.invite.inviteCode;
  console.log(`✅ Admin invite code generated: ${adminCode}`);

  // Verify get_invite_link_details (public view)
  const detailsRes = await fetch(`${BASE_URL}/api/campus?action=get_invite_link_details&code=${adminCode}`);
  const detailsJson = await detailsRes.json();
  console.log('Invite details public check:', detailsJson);
  if (!detailsJson.success || detailsJson.invite.hasPassword !== true || detailsJson.invite.roleGranted !== 'admin') {
    throw new Error(`Invite details check failed: ${JSON.stringify(detailsJson)}`);
  }
  if (detailsJson.invite.password) {
    throw new Error('SECURITY VIOLATION: Plaintext password leaked in public invite details!');
  }
  console.log('✅ Public details check passed: password requirement indicated without leaking secret, role is admin.');

  // ==========================================
  // TEST 3: Password Gate Validation & Admin Grant
  // ==========================================
  console.log('\n--- TEST 3: Password Gate Validation & Admin Enrolment ---');
  // Attempt with wrong password
  const failJoinRes = await fetch(`${BASE_URL}/api/campus`, {
    method: 'POST',
    headers: AUTH_HEADER,
    body: JSON.stringify({
      action: 'join_via_invite_link',
      inviteCode: adminCode,
      username: 'rishi_one9',
      fullName: 'Rishi V',
      userRole: 'student',
      password: 'WRONG_PASSWORD'
    })
  });
  const failJoinJson = await failJoinRes.json();
  console.log('Wrong password attempt response:', failJoinJson);
  if (failJoinRes.status !== 401 && !failJoinJson.error?.includes('passcode')) {
    throw new Error('Incorrect password was not rejected!');
  }
  console.log('✅ Correctly rejected invalid password attempt.');

  // Attempt with correct password
  const successJoinRes = await fetch(`${BASE_URL}/api/campus`, {
    method: 'POST',
    headers: AUTH_HEADER,
    body: JSON.stringify({
      action: 'join_via_invite_link',
      inviteCode: adminCode,
      username: 'rishi_one9',
      fullName: 'Rishi V',
      userRole: 'student',
      password: 'DPSAdminPass2026!'
    })
  });
  const successJoinJson = await successJoinRes.json();
  console.log('Success join response:', successJoinJson);
  if (!successJoinJson.success || successJoinJson.status !== 'enrolled') {
    throw new Error(`Failed to join with correct password: ${JSON.stringify(successJoinJson)}`);
  }

  // Verify Rishi is now an admin of channel-class-8g in D1
  const channelsRes = await fetch(`${BASE_URL}/api/campus?action=campus_wire_channels`);
  const channelsJson = await channelsRes.json();
  const c8g = channelsJson.channels?.find((c) => c.id === 'channel-class-8g');
  const enrolledList = Array.isArray(c8g.enrolledUsernames) ? c8g.enrolledUsernames : JSON.parse(c8g.enrolled_usernames || '[]');
  const adminList = Array.isArray(c8g.adminUsernames) ? c8g.adminUsernames : JSON.parse(c8g.admin_usernames || '[]');
  console.log('Channel enrolled usernames:', enrolledList);
  console.log('Channel admin usernames:', adminList);

  if (!enrolledList.includes('rishi_one9')) {
    throw new Error('Rishi was not added to enrolled_usernames in D1 SQL!');
  }
  if (!adminList.includes('rishi_one9')) {
    throw new Error('Rishi was not granted admin rights in admin_usernames in D1 SQL!');
  }
  console.log('✅ Rishi successfully enrolled and granted ADMIN status via password invite link!');

  // ==========================================
  // TEST 4: Invite Link with Admin Approval Workflow
  // ==========================================
  console.log('\n--- TEST 4: Approval-Gated Invite Link Workflow ---');
  const createApprovalInviteRes = await fetch(`${BASE_URL}/api/campus`, {
    method: 'POST',
    headers: AUTH_HEADER,
    body: JSON.stringify({
      action: 'create_invite_link',
      channelId: 'channel-class-8g',
      roleGranted: 'member',
      requireApproval: true,
      createdBy: 'madam_principal'
    })
  });
  const approvalInviteJson = await createApprovalInviteRes.json();
  const approvalCode = approvalInviteJson.invite.inviteCode;
  console.log(`✅ Approval-required invite code generated: ${approvalCode}`);

  // Aarav requests to join
  const requestJoinRes = await fetch(`${BASE_URL}/api/campus`, {
    method: 'POST',
    headers: AUTH_HEADER,
    body: JSON.stringify({
      action: 'join_via_invite_link',
      inviteCode: approvalCode,
      username: 'aarav_patel',
      fullName: 'Aarav Patel',
      userRole: 'student'
    })
  });
  const requestJoinJson = await requestJoinRes.json();
  console.log('Join request response:', requestJoinJson);
  if (!requestJoinJson.success || requestJoinJson.status !== 'pending') {
    throw new Error(`Expected pending status for approval link, got: ${JSON.stringify(requestJoinJson)}`);
  }
  console.log('✅ Join request successfully staged in pending queue.');

  // Admin checks pending requests
  const pendingReqRes = await fetch(`${BASE_URL}/api/campus?action=get_join_requests&channelId=channel-class-8g`);
  const pendingReqJson = await pendingReqRes.json();
  console.log('Pending requests list:', pendingReqJson);
  const targetReq = pendingReqJson.requests?.find((r) => r.requester_username === 'aarav_patel');
  if (!targetReq) {
    throw new Error('Aarav request not found in pending requests list!');
  }
  console.log(`✅ Admin retrieved pending request ID ${targetReq.id} for Aarav.`);

  // Admin approves the request
  const approveRes = await fetch(`${BASE_URL}/api/campus`, {
    method: 'POST',
    headers: AUTH_HEADER,
    body: JSON.stringify({
      action: 'respond_to_join_request',
      requestId: targetReq.id,
      decision: 'approved',
      reviewerUsername: 'madam_principal'
    })
  });
  const approveJson = await approveRes.json();
  console.log('Approve response:', approveJson);
  if (!approveJson.success || approveJson.status !== 'approved') {
    throw new Error(`Failed to approve request: ${JSON.stringify(approveJson)}`);
  }

  // Verify Aarav is now enrolled in channel-class-8g in D1
  const channelsRes2 = await fetch(`${BASE_URL}/api/campus?action=campus_wire_channels`);
  const channelsJson2 = await channelsRes2.json();
  const c8gUpdated = channelsJson2.channels?.find((c) => c.id === 'channel-class-8g');
  const enrolledList2 = Array.isArray(c8gUpdated.enrolledUsernames) ? c8gUpdated.enrolledUsernames : JSON.parse(c8gUpdated.enrolled_usernames || '[]');
  console.log('Updated channel enrolled list:', enrolledList2);
  if (!enrolledList2.includes('aarav_patel')) {
    throw new Error('Aarav was not enrolled into channel after approval!');
  }
  console.log('✅ Aarav successfully approved and enrolled in channel-class-8g!');

  // ==========================================
  // ALL TESTS PASSED
  // ==========================================
  console.log('\n🎉 ==============================================================');
  console.log('🎉 ALL TESTS PASSED: CHAT PERSISTENCE, ADMIN INVITES & PASSWORD GATES VERIFIED');
  console.log('🎉 ==============================================================\n');
}

main().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
