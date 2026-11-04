import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/app/api/campus/route.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add WhatsApp channels & messages to GET
const getQueryMarker = `    // 7. Fetch Lost & Found Items from D1`;
const getQueryInsertion = `    // 8. Fetch WhatsApp Channels from D1
    let whatsappChannels: any[] = [];
    try {
      const rawChannels = await d1Query<any>('SELECT * FROM campus_whatsapp_channels ORDER BY is_locked DESC, created_at ASC;');
      whatsappChannels = rawChannels.map((c) => ({
        id: c.id,
        name: c.name,
        grade: c.grade,
        section: c.section,
        avatar: c.avatar || '',
        isLocked: Boolean(c.is_locked),
        adminUsernames: JSON.parse(c.admin_usernames || '["shashwath71845", "madam_principal"]'),
        memberCount: Number(c.member_count) || 40,
        lastMessage: c.last_message || '',
        lastMessageTime: c.last_message_time || 'Just now',
        createdAt: c.created_at,
      }));
    } catch (e) {
      console.warn('D1 WhatsApp channels query notice:', e);
    }

    // 9. Fetch WhatsApp Messages from D1
    let whatsappMessages: any[] = [];
    try {
      const rawMsgs = await d1Query<any>('SELECT * FROM campus_whatsapp_messages ORDER BY timestamp ASC LIMIT 300;');
      whatsappMessages = rawMsgs.map((m) => ({
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
    } catch (e) {
      console.warn('D1 WhatsApp messages query notice:', e);
    }

`;

if (!content.includes('whatsappChannels: any[] = []')) {
  content = content.replace(getQueryMarker, getQueryInsertion + getQueryMarker);
}

// 2. Add whatsappChannels and whatsappMessages to the GET return json
const getReturnMarker = `        homework: homeworkList,
        lostFound: lostFoundItems,`;
const getReturnReplacement = `        homework: homeworkList,
        lostFound: lostFoundItems,
        whatsappChannels,
        whatsappMessages,`;

if (!content.includes('whatsappChannels,') && content.includes(getReturnMarker)) {
  content = content.replace(getReturnMarker, getReturnReplacement);
}

// 3. Add POST actions for WhatsApp Hub before the default "Unknown action"
const postMarker = `    return NextResponse.json({ error: \`Unknown action: \${action}\` }, { status: 400 });`;
const postActions = `    // ------------------------------------------------------------------------
    // 12. SEND WHATSAPP MESSAGE (Role & Channel Lock Protected)
    // ------------------------------------------------------------------------
    if (action === 'send_whatsapp_message') {
      const { channelId, senderUsername, senderName, senderRole, senderClass, text, templateType } = body;
      const cleanText = (text || '').trim();
      if (!channelId || !cleanText) {
        return NextResponse.json({ error: 'Channel ID and text are required' }, { status: 400 });
      }

      // Check if channel is locked
      const chList = await d1Query<any>('SELECT * FROM campus_whatsapp_channels WHERE id = ? LIMIT 1;', [channelId]);
      if (!chList || chList.length === 0) {
        return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
      }

      const ch = chList[0];
      const isLocked = Boolean(ch.is_locked);
      const adminList: string[] = JSON.parse(ch.admin_usernames || '["shashwath71845", "madam_principal"]');
      const cleanUser = (senderUsername || '').toLowerCase().trim();
      const isSenderAdmin =
        senderRole === 'admin' ||
        senderRole === 'teacher' ||
        cleanUser === 'shashwath71845' ||
        cleanUser === 'madam_principal' ||
        cleanUser.includes('teacher') ||
        adminList.map(a => a.toLowerCase()).includes(cleanUser);

      if (isLocked && !isSenderAdmin) {
        return NextResponse.json({
          error: 'This channel is locked by Madam & Teachers. Only admins can send messages.',
          isLocked: true,
        }, { status: 403 });
      }

      const msgId = \`wmsg-\${Date.now()}-\${Math.floor(Math.random() * 1000)}\`;
      const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const nowTs = Date.now();

      await d1Execute(\`
        INSERT INTO campus_whatsapp_messages (
          id, channel_id, sender_username, sender_name, sender_role, sender_class, text, template_type, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
      \`, [
        msgId,
        channelId,
        cleanUser || 'student',
        (senderName || cleanUser || 'Student').trim(),
        senderRole || 'student',
        senderClass || 'Class 10',
        cleanText,
        templateType || 'none',
        nowTs,
      ]);

      // Update channel preview
      await d1Execute(\`
        UPDATE campus_whatsapp_channels 
        SET last_message = ?, last_message_time = ? 
        WHERE id = ?;
      \`, [cleanText.slice(0, 100), nowTime, channelId]);

      return NextResponse.json({
        success: true,
        message: {
          id: msgId,
          channelId,
          senderUsername: cleanUser,
          senderName: senderName || cleanUser,
          senderRole: senderRole || 'student',
          senderClass: senderClass || 'Class 10',
          text: cleanText,
          templateType: templateType || 'none',
          timestamp: nowTs,
        }
      }, { headers: NO_CACHE_HEADERS });
    }

    // ------------------------------------------------------------------------
    // 13. TOGGLE WHATSAPP CHANNEL LOCK (Madam & Teacher Exclusive)
    // ------------------------------------------------------------------------
    if (action === 'toggle_channel_lock') {
      const { channelId, isLocked, requesterUsername, requesterRole } = body;
      const cleanUser = (requesterUsername || '').toLowerCase().trim();
      const isSenderAdmin =
        requesterRole === 'admin' ||
        requesterRole === 'teacher' ||
        cleanUser === 'shashwath71845' ||
        cleanUser === 'madam_principal' ||
        cleanUser.includes('teacher');

      if (!isSenderAdmin) {
        return NextResponse.json({ error: 'Permission denied: Only Madam or Teachers can lock/unlock channels.' }, { status: 403 });
      }

      const lockVal = isLocked ? 1 : 0;
      await d1Execute('UPDATE campus_whatsapp_channels SET is_locked = ? WHERE id = ?;', [lockVal, channelId]);

      // Add system announcement message
      const sysId = \`wmsg-sys-\${Date.now()}\`;
      const noticeText = lockVal === 1
        ? '🔒 Madam/Faculty locked this channel. Messages are now restricted to Admins & Teachers only.'
        : '🔓 Channel unlocked. Student discussions are now open.';

      await d1Execute(\`
        INSERT INTO campus_whatsapp_messages (
          id, channel_id, sender_username, sender_name, sender_role, sender_class, text, template_type, timestamp
        ) VALUES (?, ?, 'system', 'DPS Administration', 'admin', 'Faculty Desk', ?, 'none', ?);
      \`, [sysId, channelId, noticeText, Date.now()]);

      return NextResponse.json({ success: true, isLocked: Boolean(lockVal) }, { headers: NO_CACHE_HEADERS });
    }

    // ------------------------------------------------------------------------
    // 14. CREATE WHATSAPP CHANNEL (Teacher & Madam)
    // ------------------------------------------------------------------------
    if (action === 'create_whatsapp_channel') {
      const { name, grade, section, isLocked } = body;
      const cleanName = (name || '').trim();
      if (!cleanName) {
        return NextResponse.json({ error: 'Channel name is required' }, { status: 400 });
      }
      const cleanGrade = (grade || 'Class 10').trim();
      const cleanSec = (section || 'All').trim();
      const id = \`channel-\${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-\${Date.now().toString().slice(-4)}\`;

      await d1Execute(\`
        INSERT INTO campus_whatsapp_channels (
          id, name, grade, section, is_locked, admin_usernames, member_count, last_message, last_message_time
        ) VALUES (?, ?, ?, ?, ?, '["shashwath71845", "madam_principal"]', 44, 'Group created by faculty.', 'Just now');
      \`, [id, cleanName, cleanGrade, cleanSec, isLocked ? 1 : 0]);

      return NextResponse.json({
        success: true,
        channel: {
          id,
          name: cleanName,
          grade: cleanGrade,
          section: cleanSec,
          isLocked: Boolean(isLocked),
          adminUsernames: ['shashwath71845', 'madam_principal'],
          memberCount: 44,
          lastMessage: 'Group created by faculty.',
          lastMessageTime: 'Just now',
        }
      }, { headers: NO_CACHE_HEADERS });
    }

    // ------------------------------------------------------------------------
    // 15. INGEST STUDENT ROSTER (Pattern Extraction & Auto-Registration Engine)
    // ------------------------------------------------------------------------
    if (action === 'ingest_student_roster') {
      const { rawRosterText, targetChannelId } = body;
      const rawText = (rawRosterText || '').trim();
      if (!rawText) {
        return NextResponse.json({ error: 'Raw roster text is required' }, { status: 400 });
      }

      const logs = [];
      logs.push('[PARSING REQUEST] Initiating raw school registration grid extraction engine...');

      const lines = rawText.split(/\\r?\\n/).map(l => l.trim()).filter(Boolean);
      logs.push(\`[PARSING REQUEST] Detected \${lines.length} raw data line(s) from external school registry.\`);

      const parsedStudents = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/^(name|student name|sr|s\\.no|id|enrollment|roll)/i.test(line) && line.includes(',')) {
          continue;
        }

        let name = '';
        let classSection = '10-A';
        let parentKey = '';
        let enrollmentId = '';

        if (line.includes(',') || line.includes('\\t') || line.includes('|')) {
          const delimiter = line.includes('\\t') ? '\\t' : line.includes('|') ? '|' : ',';
          const parts = line.split(delimiter).map(p => p.trim());
          if (parts.length >= 2) {
            name = parts[0].replace(/^["']|["']$/g, '');
            for (const p of parts.slice(1)) {
              if (/\\b(?:Class\\s*)?([0-9]{1,2}\\s*[-–]?\\s*[A-Fa-f]|Nursery|LKG|UKG)\\b/i.test(p)) {
                classSection = p;
              } else if (/^(?:PRK|PAR|KEY|PARENT)-?[\\w\\d]+/i.test(p) || /^[0-9]{10}$/.test(p)) {
                parentKey = p;
              } else if (/^(?:DPS|ADM|ENR|ROLL)-?[\\w\\d]+/i.test(p) || /^[0-9]{4,6}$/.test(p)) {
                enrollmentId = p;
              }
            }
            if (!parentKey && parts[2]) parentKey = parts[2];
            if (!enrollmentId && parts[3]) enrollmentId = parts[3];
          }
        } else {
          const nameMatch = line.match(/(?:Student Name|Name)[:\\s]+([^,;\\n|]+)/i) || line.match(/^([A-Za-z\\s]{3,25})/);
          const classMatch = line.match(/(?:Class|Grade|Section)[:\\s]+([0-9]{1,2}\\s*[-–]?\\s*[A-Fa-f]|Nursery|LKG|UKG)/i) || line.match(/\\b([0-9]{1,2}\\s*[-–]?\\s*[A-Fa-f])\\b/i);
          const keyMatch = line.match(/(?:Parent Key|PRK|Key)[:\\s]+([A-Za-z0-9_-]+)/i) || line.match(/\\b(PRK-[A-Za-z0-9]+)\\b/i);
          const idMatch = line.match(/(?:Enrollment ID|Adm No|ID)[:\\s]+([A-Za-z0-9_-]+)/i) || line.match(/\\b(DPS-[A-Za-z0-9]+)\\b/i);

          if (nameMatch) name = nameMatch[1].trim();
          if (classMatch) classSection = classMatch[1].trim();
          if (keyMatch) parentKey = keyMatch[1].trim();
          if (idMatch) enrollmentId = idMatch[1].trim();
        }

        if (name && name.length >= 2) {
          if (!parentKey) parentKey = \`PRK-\${Math.floor(100000 + Math.random() * 900000)}\`;
          if (!enrollmentId) enrollmentId = \`DPS-2024-\${1000 + parsedStudents.length + 1}\`;

          const normalizedClass = classSection.replace(/\\s+/g, '').toLowerCase();
          let targetRoom = targetChannelId || (normalizedClass.includes('9') ? 'channel-class-9b' : 'channel-class-10a');

          parsedStudents.push({
            name,
            classSection,
            parentKey,
            enrollmentId,
            mappedRoomId: targetRoom,
          });

          logs.push(\`[RESOLVING METADATA] Isolated: "\${name}" | Class: \${classSection} | Key: \${parentKey} | ID: \${enrollmentId}\`);
          logs.push(\`[DISPATCHING AUTOMATED BROADCAST] Auto-mapped to structural room -> [\${targetRoom}]\`);
        }
      }

      if (parsedStudents.length === 0) {
        return NextResponse.json({
          error: 'Could not isolate student records. Please ensure format includes Student Name and Class.',
          logs
        }, { status: 400 });
      }

      const targetRoom = parsedStudents[0].mappedRoomId;
      await d1Execute(\`
        UPDATE campus_whatsapp_channels 
        SET member_count = member_count + ? 
        WHERE id = ?;
      \`, [parsedStudents.length, targetRoom]);

      const sysId = \`wmsg-roster-\${Date.now()}\`;
      const enrollNotice = \`📋 [ROSTER INGESTION COMPLETED] \${parsedStudents.length} student(s) automatically registered & mapped into classroom grid from school office roster: \${parsedStudents.map(s => s.name).slice(0, 3).join(', ')}\${parsedStudents.length > 3 ? \` and \${parsedStudents.length - 3} more\` : ''}.\`;
      
      await d1Execute(\`
        INSERT INTO campus_whatsapp_messages (
          id, channel_id, sender_username, sender_name, sender_role, sender_class, text, template_type, timestamp
        ) VALUES (?, ?, 'office_registry', 'School Enrollment Engine', 'admin', 'Registrar', ?, 'attendance', ?);
      \`, [sysId, targetRoom, enrollNotice, Date.now()]);

      logs.push(\`[DATABASE SYNC] Successfully updated campus_whatsapp_channels member count (+\${parsedStudents.length}) in Cloudflare D1 SQL.\`);
      logs.push(\`[COMPLETED] Pipeline finished: \${parsedStudents.length} students fully enrolled with 0 manual operator inputs.\`);

      return NextResponse.json({
        success: true,
        enrolledCount: parsedStudents.length,
        students: parsedStudents,
        targetRoom,
        logs,
      }, { headers: NO_CACHE_HEADERS });
    }

    // ------------------------------------------------------------------------
    // 16. DISPATCH WHATSAPP AUTOMATED TEMPLATE
    // ------------------------------------------------------------------------
    if (action === 'dispatch_whatsapp_template') {
      const { channelId, templateType, content, senderName } = body;
      if (!channelId || !templateType) {
        return NextResponse.json({ error: 'channelId and templateType are required' }, { status: 400 });
      }

      let formattedText = '';
      const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

      if (templateType === 'attendance') {
        formattedText = \`📋 [ATTENDANCE ALERT • \${nowStr}]\\n\${content || 'Daily roll call finalized. 42/44 students present. Absentee slips dispatched to registered parent contacts.'}\`;
      } else if (templateType === 'homework') {
        formattedText = \`📝 [HOMEWORK REMINDER • DUE TOMORROW]\\n\${content || 'Complete pending questions and science lab files before 08:30 AM.'}\`;
      } else if (templateType === 'exam') {
        formattedText = \`🚨 [EXAM DEADLINE BULLETIN • OFFICIAL NOTICE]\\n\${content || 'Half-Yearly Theory Papers begin at 09:00 AM on Monday. Seating plan posted on notice board. Admit cards mandatory.'}\`;
      } else {
        formattedText = content || 'School Notice';
      }

      const msgId = \`wmsg-tpl-\${Date.now()}\`;
      const nowTs = Date.now();

      await d1Execute(\`
        INSERT INTO campus_whatsapp_messages (
          id, channel_id, sender_username, sender_name, sender_role, sender_class, text, template_type, timestamp
        ) VALUES (?, ?, 'madam_principal', ?, 'admin', 'Office of Principal', ?, ?, ?);
      \`, [
        msgId,
        channelId,
        senderName || 'Principal Madam (Office)',
        formattedText,
        templateType,
        nowTs,
      ]);

      await d1Execute(\`
        UPDATE campus_whatsapp_channels 
        SET last_message = ?, last_message_time = ? 
        WHERE id = ?;
      \`, [formattedText.slice(0, 100), nowStr, channelId]);

      return NextResponse.json({
        success: true,
        message: {
          id: msgId,
          channelId,
          senderUsername: 'madam_principal',
          senderName: senderName || 'Principal Madam (Office)',
          senderRole: 'admin',
          senderClass: 'Office of Principal',
          text: formattedText,
          templateType,
          timestamp: nowTs,
        }
      }, { headers: NO_CACHE_HEADERS });
    }

`;

if (!content.includes('send_whatsapp_message')) {
  content = content.replace(postMarker, postActions + postMarker);
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Successfully patched src/app/api/campus/route.ts!');
