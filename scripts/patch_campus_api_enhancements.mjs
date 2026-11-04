import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/app/api/campus/route.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add lightweight incremental action at top of GET
const getTopMarker = `export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username')?.toLowerCase() || null;`;

const incrementalCode = `export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username')?.toLowerCase() || null;

    // Fast lightweight incremental sync for simultaneous chatting
    const actionParam = searchParams.get('action');
    if (actionParam === 'whatsapp_messages') {
      const channelId = searchParams.get('channelId');
      const afterTs = Number(searchParams.get('after') || '0');
      let query = 'SELECT * FROM campus_whatsapp_messages WHERE timestamp > ? ORDER BY timestamp ASC LIMIT 200;';
      let params = [afterTs];
      if (channelId) {
        query = 'SELECT * FROM campus_whatsapp_messages WHERE channel_id = ? AND timestamp > ? ORDER BY timestamp ASC LIMIT 200;';
        params = [channelId, afterTs];
      }
      const rawMsgs = await d1Query(query, params);
      const messages = rawMsgs.map((m) => ({
        id: m.id,
        channelId: m.channel_id,
        senderUsername: m.sender_username,
        senderName: m.sender_name,
        senderRole: m.sender_role || 'student',
        senderClass: m.sender_class || 'Class 10',
        text: m.text,
        templateType: m.template_type || 'none',
        timestamp: Number(m.timestamp),
        createdAt: m.created_at,
      }));
      return NextResponse.json({ success: true, messages }, { headers: NO_CACHE_HEADERS });
    }`;

if (!content.includes(`actionParam === 'whatsapp_messages'`)) {
  content = content.replace(getTopMarker, incrementalCode);
}

// 2. Add enrolledUsernames to channel map
const channelMapMarker = `        adminUsernames: JSON.parse(c.admin_usernames || '["shashwath71845", "madam_principal"]'),`;
const channelMapAddition = `        adminUsernames: JSON.parse(c.admin_usernames || '["shashwath71845", "madam_principal"]'),
        enrolledUsernames: JSON.parse(c.enrolled_usernames || '[]'),`;

if (!content.includes('enrolledUsernames: JSON.parse(c.enrolled_usernames')) {
  content = content.replace(channelMapMarker, channelMapAddition);
}

// 3. Multi-channel broadcast copy in send_whatsapp_message
const msgSendMarker = `      // Update channel preview
      await d1Execute(\`
        UPDATE campus_whatsapp_channels 
        SET last_message = ?, last_message_time = ? 
        WHERE id = ?;
      \`, [cleanText.slice(0, 100), nowTime, channelId]);`;

const msgSendMultiBroadcast = `      // Update channel preview
      await d1Execute(\`
        UPDATE campus_whatsapp_channels 
        SET last_message = ?, last_message_time = ? 
        WHERE id = ?;
      \`, [cleanText.slice(0, 100), nowTime, channelId]);

      // If sent by Principal Madam OR targeting school-wide broadcast, copy into ALL classroom channels!
      if (channelId === 'channel-school-broadcast' || body.broadcastToAll || isSenderAdmin) {
        if (channelId === 'channel-school-broadcast' || body.broadcastToAll) {
          try {
            const otherChannels = await d1Query('SELECT id FROM campus_whatsapp_channels WHERE id != ?;', [channelId]);
            for (const chItem of otherChannels) {
              const subId = \`wmsg-bcast-\${chItem.id}-\${Date.now()}-\${Math.floor(Math.random() * 1000)}\`;
              await d1Execute(\`
                INSERT INTO campus_whatsapp_messages (
                  id, channel_id, sender_username, sender_name, sender_role, sender_class, text, template_type, timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
              \`, [
                subId,
                chItem.id,
                cleanUser,
                (senderName || 'Principal Madam (Office)').trim(),
                'admin',
                'Office of Principal',
                cleanText,
                templateType || 'none',
                nowTs,
              ]);
              await d1Execute(\`
                UPDATE campus_whatsapp_channels 
                SET last_message = ?, last_message_time = ? 
                WHERE id = ?;
              \`, [cleanText.slice(0, 100), nowTime, chItem.id]);
            }
          } catch (e) {
            console.warn('Multi-channel broadcast notice:', e);
          }
        }
      }`;

if (!content.includes('If sent by Principal Madam OR targeting school-wide broadcast')) {
  content = content.replace(msgSendMarker, msgSendMultiBroadcast);
}

// 4. Add action add_student_to_channel
const newActionMarker = `    // ------------------------------------------------------------------------
    // 14. CREATE WHATSAPP CHANNEL (Teacher & Madam)
    // ------------------------------------------------------------------------`;

const addStudentAction = `    // ------------------------------------------------------------------------
    // 13.5 ADD STUDENT DIRECTLY TO CHANNEL (Faculty Enrolling)
    // ------------------------------------------------------------------------
    if (action === 'add_student_to_channel') {
      const { channelId, usernameToAdd, studentName } = body;
      const cleanTarget = (usernameToAdd || '').toLowerCase().trim();
      if (!channelId || !cleanTarget) {
        return NextResponse.json({ error: 'channelId and usernameToAdd are required' }, { status: 400 });
      }

      const chList = await d1Query('SELECT * FROM campus_whatsapp_channels WHERE id = ? LIMIT 1;', [channelId]);
      if (!chList.length) return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
      const ch = chList[0];
      const enrolled = JSON.parse(ch.enrolled_usernames || '[]');
      if (!enrolled.includes(cleanTarget)) {
        enrolled.push(cleanTarget);
        await d1Execute('UPDATE campus_whatsapp_channels SET enrolled_usernames = ?, member_count = member_count + 1 WHERE id = ?;', [JSON.stringify(enrolled), channelId]);
      }

      const sysId = \`wmsg-enroll-\${Date.now()}\`;
      const notice = \`👋 @\${cleanTarget}\${studentName ? \` (\${studentName})\` : ''} was directly enrolled into this classroom group by faculty.\`;
      await d1Execute(\`
        INSERT INTO campus_whatsapp_messages (
          id, channel_id, sender_username, sender_name, sender_role, sender_class, text, template_type, timestamp
        ) VALUES (?, ?, 'system', 'DPS Faculty Desk', 'admin', 'Administration', ?, 'none', ?);
      \`, [sysId, channelId, notice, Date.now()]);

      return NextResponse.json({ success: true, enrolledUsernames: enrolled }, { headers: NO_CACHE_HEADERS });
    }

`;

if (!content.includes('add_student_to_channel')) {
  content = content.replace(newActionMarker, addStudentAction + newActionMarker);
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Successfully patched campus route with live simultaneous sync and Madam broadcasts!');
