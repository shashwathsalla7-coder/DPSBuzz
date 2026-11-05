# Recon map: WhatsApp (Mobile Web & Responsive Native)

Scope: Complete WhatsApp Mobile Application — Chats, Stories/Status, Calls, Communities, Settings, Group & Contact Info sheets, Full-Screen Media & Document Viewers, Voice Calling simulation, and Mobile Touch Navigation  
Platform: Mobile-First Responsive Web (Android & iOS UX patterns)  
For: DPS Buzz Students & Faculty (Stand-Alone Attached Module at `/whatsapp`)  
Date: 2026-11-05  

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | Reference Screenshot | `replica/screens/whatsapp_desktop_reference.png` | Group chat ("Together Forever"), message bubbles, doodle wallpaper, video card, sender color tags, reactions |
| 2 | WhatsApp Android UI Specs | `https://whatsapp.com` / Material 3 Design | Top app bar with search & camera, 4-tab bottom navigation rail (Chats, Updates/Status, Communities, Calls), floating action buttons (FAB), full-screen chat activity |
| 3 | WhatsApp iOS Human Interface | `https://whatsapp.com` | iOS bottom tab bar with badge counts, swipe-to-reply, action sheets, modal navigation |
| 4 | WhatsApp Help Center & Settings | `https://faq.whatsapp.com` | Account, Privacy, Chats, Notifications, Storage, Help, End-to-end encryption specs |

## Core loop

Lightning-fast, friction-free mobile messaging, story sharing, encrypted calls, and classroom community hub optimized for handheld touchscreens and desktop screens alike.

## Screens

| ID | screen | route / how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Mobile App Shell & Top Bar | `/whatsapp` | Top navigation & brand identity | Back to DPS Buzz button, title, camera quick action, search, overflow menu | default, search active, mobile (<768px), desktop |
| S02 | Mobile Bottom Navigation Bar | Fixed bottom on `<md` | 1-touch navigation between tabs | 4 tabs with active indicator & badge pills (Chats, Updates, Communities, Calls) | default, badge counts (unread msgs, missed calls) |
| S03 | Mobile Chats List Screen | Tab 1 (Chats) | Browse & open conversations | Search bar, filter chips (All, Unread, Groups), chat items with avatar, name, last msg, time, unread badge, pin icon | empty, filtered, active |
| S04 | Mobile Floating Action Button (FAB) | Bottom right over S03/S07/S09 | Primary action per tab | Green circular FAB: New Chat icon in Chats, Camera/Pencil in Status, Dialpad in Calls | idle, pressed |
| S05 | Mobile Full-Screen Chat View | Tap any chat in S03 | 100vw conversation screen | Header with back arrow, contact avatar, name, subtitle, voice & video call icons, menu | active, typing, offline |
| S06 | Mobile Message Thread Feed | S05 body | Visual chat stream | Tiled SVG doodle wallpaper, date separator pill, incoming/outgoing bubbles, reactions badge, video media card | idle, scrolling, replying |
| S07 | Mobile Updates & Status Screen | Tab 2 (Updates) | Ephemeral story updates | My Status with "+" avatar, Recent updates list with green rings, Viewed updates list, mute options | idle, has unread |
| S08 | Mobile Full-Screen Status Viewer | Tap any story in S07 | Immersive story carousel | Segmented progress bars (5s auto-advance), touch-and-hold pause, contact info, reply input pill | playing, paused, replying |
| S09 | Mobile Calls History Screen | Tab 3 (Calls) | Recent audio/video call logs | Filter chips (All / Missed), call item with direction icon (incoming green, outgoing green, missed red), timestamp, call button | empty, filtered |
| S10 | Mobile Active Call Overlay | Tap Call icon in S05/S09 | Simulated VoIP calling | Full-screen encrypted badge, animated glowing avatar, duration timer, mute mic toggle, camera flip/toggle, end call button | Ringing (2.5s), Connected |
| S11 | Mobile Communities Hub | Tab 4 (Communities) | School-wide clubs & classes | New Community banner, DPS School Community, Class 8 Batch, Science Club, sub-groups & announcement dispatches | expanded, collapsed |
| S12 | Mobile Contact & Group Info Sheet | Tap header in S05 | Group details & participants | Full-screen/sheet view: big avatar, description, audio/video buttons, media shortcut, disappearing timer, participants with admin badges, exit button | viewing, search participants |
| S13 | Mobile Media, Docs & Links Gallery | Tap Media in S12 | Shared file repository | 3 segmented tabs: Media grid with video duration, Documents with file size, Links with domain preview | media, docs, links |
| S14 | Mobile Starred Messages Drawer | Menu -> Starred | Saved messages across chats | List of starred cards with chat name, sender, snippet, time, unstar action, jump to chat | empty, populated |
| S15 | Mobile Settings Sheet | Menu -> Settings | Complete app configuration | Account, Privacy, Chats (doodle toggle, enter is send), Notifications, Storage, Help, Linked Devices | main menu, sub-panels |
| S16 | Mobile New Chat & Group Creator | Tap FAB in S03 | Start direct or group chat | Search contacts, New Group mode with multi-select checkboxes, group subject creator | search, multi-select |
| S17 | Mobile Input Bar & Drawers | Bottom of S05 | Composing messages on touch | Plus/Paperclip attach menu (Photos, Docs, Diary), Emoji drawer, expanding input, Mic / Send button switch | idle, typing, recording voice note |
| S18 | Mobile User Profile Modal | Tap Profile in Settings/Menu | Personal identity editor | Big avatar with edit ring, display name input, About status input, Save button | view, edit |

## Flows

```
F01 Mobile Message Conversation (Happy Path)
    S02 tap Chats -> S03 tap "Together Forever" -> S05 full-screen chat slides in -> S17 tap input -> type message -> tap Green Send button -> S06 message renders with double check -> tap Back arrow -> S03 returns to list
    happy path clicks: 4
    edge: virtual keyboard viewport resize, network offline queuing, shift+enter vs enter-to-send

F02 Mobile Story / Status Consumption
    S02 tap Updates -> S07 tap contact with green ring -> S08 full-screen story opens -> progress bar runs 5s -> tap screen to pause -> type reply in bottom pill -> tap send -> S08 auto-advances to next update or closes to S07
    happy path clicks: 3
    edge: user holds finger down to pause story, multiple story updates from same user

F03 Mobile Voice / Video Call
    S05 tap Voice/Video icon in header -> S10 full-screen calling overlay appears -> Ringing (2.5s) -> Connected (seconds timer increments) -> tap Mute or Video toggle -> tap Red Hang Up button -> returns to S05
    happy path clicks: 2
    edge: call rejected, call timed out, audio permission toggle

F04 Mobile Group Member Management & Inspection
    S05 tap group header -> S12 group sheet opens -> scroll participants -> tap "Add participant" -> S16 modal opens -> select contact -> member added -> tap Back arrow -> S05
    happy path clicks: 4
    edge: non-admin trying to add members, searching non-existent participant

F05 Mobile Customization & Doodle Toggle
    S01 tap three-dot menu -> tap Settings -> S15 tap Chats -> toggle "Add WhatsApp Doodle to wallpaper" -> tap Back -> S05 background updates immediately
    happy path clicks: 4
    edge: low-contrast wallpaper mode, dark/light theme toggle
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| `MobileTopBar` | default, with back arrow, search active | default, scrolled | S01, S05 |
| `MobileBottomNav` | 4 tabs (Chats, Updates, Communities, Calls) | active tab, unread badge, missed calls badge | S02 |
| `FloatingActionButton` | new chat, camera, dialpad | default, active, hover | S04 |
| `MessageBubble` | incoming (`#202c33`), outgoing (`#005c4b`), media card | default, quoted, reacted, starred | S06 |
| `TouchInputBar` | idle (shows mic), typing (shows send) | default, focused, recording | S17 |
| `StatusCircleRing` | unviewed (`#00a884`), viewed (`#8696a0`) | default, pressed | S07 |
| `SegmentedProgressBar` | multi-segment stories | unfilled (0%), filling (0-100%), filled (100%) | S08 |
| `CallActionButtons` | mute, camera, speaker, end call | active, inactive, pressed | S10 |
| `ModalSheet` | full-screen mobile sheet, desktop drawer | open, closing, closed | S12, S13, S14, S15, S16 |

## Inferred data model

```
ChatRoom        id, name, type (group | direct), avatar_color, initials, subtitle, last_message, last_time,
                unread_count, is_pinned, is_muted, is_archived, description, created_by, created_at,
                media_count, members (ContactItem[])
                evidence: S03 chat list, S05 header, S12 group sheet
                confidence: high

ChatMessage     id, channel_id, sender_name, sender_color, subtitle, text, time, is_me, is_video,
                video_duration, video_caption, quoted_author, quoted_text, is_starred, reactions (array)
                evidence: S06 message thread, reference screenshot
                confidence: high

StatusStory     id, contact_name, contact_color, contact_initials, time, viewed, updates (StatusUpdate[])
                evidence: S07 updates tab, S08 story viewer
                confidence: high

CallLog         id, contact_name, contact_color, contact_initials, time, type (voice | video),
                direction (incoming | outgoing | missed), duration
                evidence: S09 calls tab, S10 active call modal
                confidence: high

Community       id, name, description, avatar_color, initials, member_count, groups (array)
                evidence: S11 communities tab
                confidence: high
```

Relationships:
- ChatRoom (1-n) ChatMessage
- StatusStory (1-n) StatusUpdate
- Community (1-n) ChatRoom (sub-groups)
- ChatRoom (n-n) ContactItem (members)

## Feature matrix

See `replica/features.csv`. Must: 22, should: 6, could: 2, skip: 0. All 30 features documented for both Mobile & Desktop parity.

## Out of scope (cannot or should not be cloned)

- WhatsApp closed cellular GSM telephony / SS7 network infrastructure.
- Multi-gigabyte end-to-end signal binary keys (managed seamlessly via Next.js & Cloudflare D1 HTTPS architecture).

## Size

Screens: 18 mobile screens/sheets, Flows: 5 core mobile flows, Entities: 5. Hard parts: 100vw mobile responsive layout transitions, touch gesture handling on story progress, touch-friendly 44px hit-targets, synchronized active audio/video call simulation.  
Size: **M** (Complete responsive mobile & desktop application).
