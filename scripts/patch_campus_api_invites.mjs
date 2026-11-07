import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/app/api/campus/route.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add groupInvites query in GET
const getMarker = `    // 8. Fetch Campus Wire Channels from D1`;
const invitesQuery = `    // 7.5 Fetch Group Invites from D1
    let groupInvites: any[] = [];
    try {
      const rawInv = await d1Query<any>('SELECT * FROM campus_group_invites ORDER BY created_at DESC LIMIT 100;');
      groupInvites = rawInv.map((inv) => ({
        id: inv.id,
        groupId: inv.group_id,
        groupName: inv.group_name,
        inviteeUsername: inv.invitee_username,
        inviteeRole: inv.invitee_role || 'student',
        subject: inv.subject || '',
        invitedBy: inv.invited_by || 'madam_principal',
        status: inv.status || 'pending',
        createdAt: inv.created_at,
      }));
    } catch (e) {
      console.warn('D1 group invites query notice:', e);
    }

`;

if (!content.includes('let groupInvites: any[] = [];')) {
  content = content.replace(getMarker, invitesQuery + getMarker);
}

// 2. Add groupInvites to return JSON
const returnMarker = `        wireChannels,
        wireMessages,`;
const returnAddition = `        wireChannels,
        wireMessages,
        groupInvites,`;

if (!content.includes('groupInvites,') && content.includes(returnMarker)) {
  content = content.replace(returnMarker, returnAddition);
}

// 3. Add POST actions for group invites
const postMarker = `    // ------------------------------------------------------------------------
    // 12. SEND CAMPUS_WIRE MESSAGE (Role & Channel Lock Protected)
    // ------------------------------------------------------------------------`;

const inviteActions = `    // ------------------------------------------------------------------------
    // 11.5 CREATE GROUP INVITATION (Madam / Admin Assignment)
    // ------------------------------------------------------------------------
    if (action === 'create_group_invite') {
      const { groupId, groupName, inviteeUsername, inviteeRole, subject, invitedBy } = body;
      const cleanUser = (inviteeUsername || '').toLowerCase().trim();
      if (!groupId || !cleanUser) {
        return NextResponse.json({ error: 'groupId and inviteeUsername are required' }, { status: 400 });
      }

      const id = \`invite-\${Date.now()}-\${Math.floor(Math.random() * 1000)}\`;
      await d1Execute(\`
        INSERT INTO campus_group_invites (
          id, group_id, group_name, invitee_username, invitee_role, subject, invited_by, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending');
      \`, [
        id,
        groupId,
        groupName || 'Classroom',
        cleanUser,
        inviteeRole || 'student',
        subject || '',
        invitedBy || 'madam_principal',
      ]);

      return NextResponse.json({
        success: true,
        invite: {
          id,
          groupId,
          groupName,
          inviteeUsername: cleanUser,
          inviteeRole: inviteeRole || 'student',
          subject: subject || '',
          invitedBy: invitedBy || 'madam_principal',
          status: 'pending',
        }
      }, { headers: NO_CACHE_HEADERS });
    }

    // ------------------------------------------------------------------------
    // 11.6 RESPOND TO GROUP INVITATION (Accept / Decline by Teacher or Student)
    // ------------------------------------------------------------------------
    if (action === 'respond_group_invite') {
      const { inviteId, response, username } = body;
      const cleanUser = (username || '').toLowerCase().trim();
      const status = response === 'accepted' ? 'accepted' : 'declined';

      const rows = await d1Query<any>('SELECT * FROM campus_group_invites WHERE id = ? LIMIT 1;', [inviteId]);
      if (!rows.length) {
        return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
      }
      const inv = rows[0];

      await d1Execute('UPDATE campus_group_invites SET status = ? WHERE id = ?;', [status, inviteId]);

      if (status === 'accepted') {
        // Enroll user into channel in campus_wire_channels
        const chList = await d1Query<any>('SELECT enrolled_usernames, member_count FROM campus_wire_channels WHERE id = ? LIMIT 1;', [inv.group_id]);
        if (chList.length > 0) {
          const enrolled: string[] = JSON.parse(chList[0].enrolled_usernames || '[]');
          if (!enrolled.includes(cleanUser)) {
            enrolled.push(cleanUser);
            await d1Execute('UPDATE campus_wire_channels SET enrolled_usernames = ?, member_count = member_count + 1 WHERE id = ?;', [JSON.stringify(enrolled), inv.group_id]);
          }

          // Post welcome system message in channel
          const sysId = \`wmsg-joined-\${Date.now()}\`;
          const roleLabel = inv.invitee_role === 'teacher' ? (inv.subject || 'Faculty') : 'Student';
          const welcomeNote = \`👋 @\${cleanUser} accepted Madam's assignment as \${roleLabel} and joined \${inv.group_name}.\`;
          await d1Execute(\`
            INSERT INTO campus_wire_messages (
              id, channel_id, sender_username, sender_name, sender_role, sender_class, text, template_type, timestamp
            ) VALUES (?, ?, 'system', 'Office of Principal Madam', 'admin', 'Official Assignment', ?, 'none', ?);
          \`, [sysId, inv.group_id, welcomeNote, Date.now()]);
        }
      }

      return NextResponse.json({ success: true, status, groupId: inv.group_id }, { headers: NO_CACHE_HEADERS });
    }

`;

if (!content.includes('action === \'create_group_invite\'')) {
  content = content.replace(postMarker, inviteActions + postMarker);
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Successfully patched campus route with formal group invitations & approvals!');
