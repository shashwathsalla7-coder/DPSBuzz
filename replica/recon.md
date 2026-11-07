# Recon map: WhatsApp (School Operating System for DPS Buzz)

Scope: Production WhatsApp School Messaging Architecture — 91 Class Channels (Nursery to 12-I), Student Study Circles, Ephemeral Status/Stories, Calling Simulation, 1-Click Faculty Broadcast Lock, Real Audio Voice Recorder & Player, Photo & Circular Attachments, Pinned Notices, and Parent Broadcast Feed  
Platform: Mobile-First Responsive Web (Apple iOS Human Interface Design & Translucent Dark Mode)  
For: Delhi Public School (DPS Buzz) — Students, Teachers, Parents & School Administration  
Date: 2026-11-07  

---

## 1. School Operational Roles & Persona Analysis

### A. Students
- **Daily Needs**: Clarify daily homework with classmates, discuss group projects, share fair-copy notebook photos, ask doubts with quick voice notes, participate in student interest groups (Robotics, Science Club, Sports), share 24-hr campus moments (Status).
- **Control Rules**: When teachers lock a class channel, students are placed in Read-Only mode with a clean Apple lock banner: *"Only teachers and school administration can send messages"*. Students cannot spam during exam hours.

### B. Teachers & Faculty
- **Daily Needs**: Post homework reminders, roll call attendance alerts, examination syllabus circulars, datesheets, and student performance notices.
- **Critical Powers**:
  1. **1-Click Broadcast Lock**: Toggle channel lock instantly with 1 tap in the chat header or group info drawer.
  2. **Faculty Notice Dispatcher**: Pre-configured modal templates (Homework, Attendance, Exam Circular, Bus Notice).
  3. **Multi-Class Broadcast**: 1-click option to distribute circulars simultaneously across all 91 class channels!
  4. **Pin Critical Notices**: Anchor urgent datesheets to the top pinned banner of the chatroom.
  5. **Moderation**: Delete inappropriate student messages for everyone.

### C. Parents
- **Daily Needs**: Zero spam or noisy chat chatter. Parents need clean, verified dispatches directly from the Principal and Class Teachers (fee notices, holiday alerts, bus route changes, daily homework summaries).
- **Dedicated Flow**: Special "Parents Feed" tab in the chatroom list and a 1-tap "Contact Faculty" button to message the Class Teacher directly during working hours.

### D. School Management & Madam Principal
- **Daily Needs**: Emergency school-wide broadcast dispatches, monitoring official class channels, assigning verified faculty badges.
- **Community Architecture**: Delhi Public School Verified Community organizing all 91 official classroom sections under one umbrella.

---

## 2. Sources

| # | source | URL / Path | notes |
| --- | --- | --- | --- |
| 1 | Reference Specs | `replica/screens/` | WhatsApp iOS Dark Theme, bubble tail styling, wallpaper doodle, audio waveforms |
| 2 | Apple HIG Specs | `https://developer.apple.com/design/human-interface-guidelines/` | Translucent frosted headers, SF Pro typography, segmented controls, haptic spring actions |
| 3 | Cloudflare D1 SQL | `campus_whatsapp_channels`, `campus_whatsapp_messages` | Real-time persistence for all 91 classes and messages |
| 4 | WhatsApp Help Center | `https://faq.whatsapp.com` | Channel administration, voice messaging, read receipts, disappearing timers |

---

## 3. Core Loop

Frictionless, instant mobile-first classroom communication, audio voice queries, verified faculty dispatches, and emergency broadcast alerts with zero spam.

---

## 4. Screen Inventory

| ID | screen | route / how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Mobile App Shell & Top Bar | `/whatsapp` | Top navigation & identity | Return to DPS Buzz link, title, camera trigger, search, overflow menu | default, search active, desktop macOS bar |
| S02 | Mobile Bottom Navigation Bar | Fixed bottom on `<md` | 1-touch tab navigation | 4 tabs with active indicator & badge pills (Chats, Updates, Communities, Calls) | default, badge counts (3 unread) |
| S03 | Mobile Chats List Screen | Tab 1 (Chats) | Browse & filter conversations | Search bar, 5 segmented chips (All, Unread, Classes, Groups, Parents), chat cards | default, filtered, active |
| S04 | Mobile Floating Action Button | Bottom right on S03 | Quick new chat compose | Green circular FAB triggering new chat / group creator | idle, pressed |
| S05 | Mobile Full-Screen Chat View | Tap any chat in S03 | Conversation screen | Translucent header, contact avatar, role badges, voice & video icons, 1-click lock button | open, typing, broadcast-locked |
| S06 | Mobile Message Thread Feed | S05 body | Visual chat stream | Tiled WhatsApp doodle SVG, date pills, emerald outgoing & slate incoming bubbles, blue double-checks | idle, scrolling, replying |
| S07 | Mobile Updates & Status Screen | Tab 2 (Updates) | Ephemeral story updates | My Status with "+" avatar, Recent updates list with green rings, Viewed updates list | idle, has unread |
| S08 | Mobile Full-Screen Status Viewer | Tap any story in S07 | Immersive story carousel | Segmented progress bars (5s auto-advance), touch-and-hold pause, contact info, reply pill | playing, paused, replying |
| S09 | Mobile Calls History Screen | Tab 3 (Calls) | Recent audio/video call logs | Filter chips (All / Missed), call items with direction icon, timestamp, call button | empty, filtered |
| S10 | Mobile Active Call Overlay | Tap Call icon in S05/S09 | Simulated VoIP calling | Full-screen encrypted badge, animated glowing avatar, duration timer, mute mic toggle, camera flip/toggle, end call | Ringing (2.5s), Connected timer |
| S11 | Mobile Communities Hub | Tab 4 (Communities) | DPS 91-class hierarchy | DPS School Community, Kindergarten, Primary, Middle, Secondary Wings, clubs | expanded, collapsed |
| S12 | Mobile Contact & Group Info Sheet | Tap header in S05 | Classroom administration | Avatar, description, faculty broadcast lock switch, quick notice shortcuts, participant list with role badges | viewing, admin mode |
| S13 | Mobile Media, Docs & Links Gallery | Tap Media in S12 | Shared file repository | 3 segmented tabs: Media grid, Documents with file size, Links with domain preview | media, docs, links |
| S14 | Mobile Starred Messages Drawer | Menu -> Starred | Saved circulars across chats | List of starred cards with chat name, sender, snippet, time, unstar action, jump to chat | empty, populated |
| S15 | Mobile Settings Sheet | Menu -> Settings | App configuration | Account, Privacy, Chats (doodle toggle), Notifications, Storage, Help | main menu, sub-panels |
| S16 | Mobile New Chat & Group Creator | Tap FAB in S03 | Start direct or group chat | Search contacts, New Group mode with multi-select checkboxes, subject creator | search, multi-select |
| S17 | Mobile Input Bar & Drawers | Bottom of S05 | Composing messages | Attachment popover (Camera, Document, Diary), Emoji tray, input box, Mic / Send button switch | idle, typing, locked |
| S18 | Mobile User Profile Modal | Tap Profile in Menu | Personal identity editor | Avatar with camera edit icon, display name input, About status input, Save button | view, edit |
| S19 | Pinned Announcement Banner | Top of S06 | Anchored official notices | Pin icon, sender name, notice snippet, jump-to-message, unpin button | active, closed |
| S20 | Teacher Notice Modal | Tap Notice in S05/S12 | Faculty circular dispatches | 4 template tabs (Homework, Roll Call, Exam, Bus), headline, details, broadcast to all classes toggle | composing, sent |
| S21 | Photo Attachment Modal | Camera / Attachment in S17 | Image preview before send | Full image canvas, caption input field, send button, cancel button | previewing, sending |
| S22 | Voice Recorder Bar | Tap Mic in S17 | Real voice audio capture | Blinking red dot, live timer, animated pulsing sound waves, cancel trash, send button | recording, cancelled |
| S23 | Voice Audio Player | Rendered in S06 | Interactive voice playback | Play/pause button, 16-bar waveform visualizer, scrubber, duration counter | idle, playing |

---

## 5. Flows

```
F01 Student Homework Discussion & Audio Note (Happy Path)
    S02 tap Chats -> S03 tap "Class 8-G" -> S05 chat opens -> S17 tap Mic -> S22 live recording runs 5s -> tap Send -> S06 voice note renders with S23 audio player -> classmate taps Play to listen
    happy path clicks: 4

F02 Teacher 1-Click Broadcast Lock
    S05 tap Lock button in header (or S12 drawer) -> channel state updates to locked -> S06 displays system notice "🔒 Channel locked by faculty" -> students now see S17 disabled lock banner
    happy path clicks: 1

F03 Teacher Notice Dispatch & 91-Class Broadcast
    S05 tap Notice icon -> S20 modal opens -> select "Homework" -> type guidelines -> toggle "Broadcast to All 91 Classes" -> tap "Publish Notice" -> S19 pinned banner anchors at top -> dispatches to all classes
    happy path clicks: 4

F04 Parent View & Direct Faculty Inquiry
    S03 tap "Parents Feed" filter -> only official circulars and bus alerts display -> tap "Contact Faculty" -> 1-on-1 direct chat with Anita Sharma opens -> send inquiry
    happy path clicks: 3

F05 Photo Attachment Submission
    S17 tap Paperclip -> tap "Photos & Camera" -> pick photo -> S21 preview modal displays photo -> type caption "Math Homework Exercise 4.2" -> tap Send -> renders in S06 -> tap photo to view S21 lightbox
    happy path clicks: 4

F06 Voice / Video Calling Simulation
    S05 tap Voice/Video icon in header -> S10 full-screen calling overlay appears -> Ringing (2.5s) -> Connected (seconds timer increments) -> tap Mute or Video toggle -> tap Red Hang Up button -> returns to S05
    happy path clicks: 2
```

---

## 6. Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| `MobileTopBar` | desktop glass, mobile native | default, search focused | S01, S05 |
| `MobileBottomNav` | 4 tabs (Chats, Updates, Communities, Calls) | active tab, unread badge, missed calls badge | S02 |
| `FloatingActionButton` | new chat, camera, dialpad | default, active, hover | S04 |
| `MessageBubble` | incoming (`#202c33`), outgoing (`#005c4b`), photo card, voice note | default, quoted, reacted, starred | S06 |
| `VoiceAudioPlayer` | interactive audio waveform, play/pause | idle, playing, scrubbed | S06, S23 |
| `VoiceRecorderBar` | browser MediaRecorder capture | recording, timer, waves | S17, S22 |
| `PhotoAttachmentModal` | image preview, caption input | idle, typing | S21 |
| `TeacherNoticeModal` | homework, attendance, exam, transport templates | idle, broadcasting | S20 |
| `PinnedNoticeBanner` | pinned circular bar with 1-tap jump | active, unpin | S19 |
| `TouchInputBar` | idle (mic), typing (send), locked (banner) | default, focused, locked | S17 |
| `StatusCircleRing` | unviewed (`#00a884`), viewed (`#8696a0`) | default, pressed | S07 |
| `ActiveCallOverlay` | audio / video calling | ringing, connected | S10 |
| `ModalSheet` | full-screen mobile sheet, desktop drawer | open, closing, closed | S12, S13, S14, S15, S16 |

---

## 7. Data Model

```
ChatRoom        id, name, grade, section, avatarColor, initials, lastMessage, lastMessageTime,
                unreadCount, isPinned, isMuted, isArchived, isGroup, isLocked, isSchoolBroadcast,
                targetAudience ('all' | 'students' | 'parents' | 'teachers'), pinnedMessage,
                description, createdBy, createdAt, mediaCount, members (ContactItem[])
                storage: Cloudflare D1 (campus_whatsapp_channels) + localStorage

MessageItem     id, channelId, senderUsername, senderName, senderRole ('admin' | 'teacher' | 'student' | 'parent'),
                senderColor, text, time, timestamp, isMe, isVideo, isImage, imageUrl,
                isVoiceNote, voiceDuration, audioUrl, quotedAuthor, quotedText, isStarred,
                isPinned, reactions (array), templateType ('none' | 'homework' | 'attendance' | 'exam' | 'system')
                storage: Cloudflare D1 (campus_whatsapp_messages) + localStorage

StatusItem      id, contactName, contactColor, contactInitials, time, viewed, updates (StatusUpdate[])
CallLogItem     id, contactName, contactColor, contactInitials, time, type, direction, duration
CommunityItem   id, name, description, avatarColor, initials, memberCount, groups (array)
```

---

## 8. Out of Scope

- Cellular GSM / PSTN telco trunks (seamlessly handled via in-app WebRTC and simulated VoIP).
- External unmoderated spam (DPS Buzz is a verified, closed-campus environment).
