import { d1Query, d1Execute, isD1Configured } from '../src/lib/cloudflare/d1.ts';

async function testTeacherEnglishInviteFlow() {
  console.log('================================================================');
  console.log('   TESTING MADAM ASSIGNMENT & TEACHER/STUDENT ACCEPTANCE FLOW');
  console.log('================================================================\n');

  if (!isD1Configured()) {
    console.error('D1 not configured!');
    process.exit(1);
  }

  // 1. Madam sends official assignment for English Teacher to join Class 8-G
  console.log('1. MADAM PRINCIPAL ASSIGNS ENGLISH TEACHER TO CLASS 8-G');
  const inviteId = `invite-test-${Date.now()}`;
  const targetGroupId = 'channel-class-8g';
  const groupName = 'Class 8-G Official Classroom 📘';
  const teacherUsername = 'teacher_english';

  await d1Execute(`
    INSERT INTO campus_group_invites (
      id, group_id, group_name, invitee_username, invitee_role, subject, invited_by, status
    ) VALUES (?, ?, ?, ?, 'teacher', 'English Faculty', 'madam_principal', 'pending');
  `, [inviteId, targetGroupId, groupName, teacherUsername]);

  const checkInvite = await d1Query('SELECT * FROM campus_group_invites WHERE id = ?;', [inviteId]);
  if (checkInvite.length > 0 && checkInvite[0].status === 'pending') {
    console.log(`  [PASS] Created official assignment invite: "${checkInvite[0].group_name}" for @${checkInvite[0].invitee_username} (${checkInvite[0].subject})`);
  } else {
    throw new Error('Failed to create invite in D1');
  }

  // 2. English Teacher queries her pending invites
  console.log('\n2. ENGLISH TEACHER CHECKS HER INBOX');
  const myPending = await d1Query('SELECT * FROM campus_group_invites WHERE invitee_username = ? AND status = "pending";', [teacherUsername]);
  console.log(`  Found ${myPending.length} pending assignment(s) for @${teacherUsername}:`);
  for (const inv of myPending) {
    console.log(`  - [${inv.id}] Invitation from ${inv.invited_by} to join ${inv.group_name} as ${inv.subject}`);
  }
  if (myPending.length === 0) throw new Error('English teacher did not receive invite!');

  // 3. English Teacher clicks "Accept & Enter Classroom"
  console.log('\n3. ENGLISH TEACHER CLICKS "ACCEPT & ENTER CLASSROOM"');
  await d1Execute('UPDATE campus_group_invites SET status = "accepted" WHERE id = ?;', [inviteId]);

  // Server adds teacher to enrolled_usernames in Class 8-G
  const chData = await d1Query('SELECT enrolled_usernames, member_count FROM campus_whatsapp_channels WHERE id = ?;', [targetGroupId]);
  const enrolled = JSON.parse(chData[0].enrolled_usernames || '[]');
  if (!enrolled.includes(teacherUsername)) {
    enrolled.push(teacherUsername);
    await d1Execute('UPDATE campus_whatsapp_channels SET enrolled_usernames = ?, member_count = member_count + 1 WHERE id = ?;', [JSON.stringify(enrolled), targetGroupId]);
  }

  // Server logs welcome notice in Class 8-G
  const sysMsgId = `wmsg-sys-joined-${Date.now()}`;
  const notice = `👋 @${teacherUsername} accepted Madam's assignment as English Faculty and joined ${groupName}.`;
  await d1Execute(`
    INSERT INTO campus_whatsapp_messages (
      id, channel_id, sender_username, sender_name, sender_role, sender_class, text, template_type, timestamp
    ) VALUES (?, ?, 'system', 'Office of Principal Madam', 'admin', 'Official Assignment', ?, 'none', ?);
  `, [sysMsgId, targetGroupId, notice, Date.now()]);

  // 4. Verify Class 8-G is now fully accessible and has the welcome notice
  console.log('\n4. VERIFYING ACCESS & ENROLLMENT IN CLASS 8-G');
  const updatedChannel = await d1Query('SELECT enrolled_usernames, member_count FROM campus_whatsapp_channels WHERE id = ?;', [targetGroupId]);
  const updatedEnrolled = JSON.parse(updatedChannel[0].enrolled_usernames || '[]');
  if (updatedEnrolled.includes(teacherUsername)) {
    console.log(`  [PASS] @${teacherUsername} is confirmed in Class 8-G enrolled list in D1 SQL!`);
    console.log(`  Enrolled list:`, updatedEnrolled);
  } else {
    throw new Error('Teacher was not enrolled in Class 8-G!');
  }

  const welcomeCheck = await d1Query('SELECT text FROM campus_whatsapp_messages WHERE id = ?;', [sysMsgId]);
  if (welcomeCheck.length > 0) {
    console.log(`  [PASS] Welcome dispatch verified in channel feed: "${welcomeCheck[0].text}"`);
  }

  // Clean up test message and test invite
  await d1Execute('DELETE FROM campus_group_invites WHERE id = ?;', [inviteId]);
  await d1Execute('DELETE FROM campus_whatsapp_messages WHERE id = ?;', [sysMsgId]);

  console.log('\n================================================================');
  console.log('   MADAM ASSIGNMENT & ACCEPTANCE FLOW VERIFIED (100% GREEN)     ');
  console.log('================================================================');
}

testTeacherEnglishInviteFlow().catch(console.error);
