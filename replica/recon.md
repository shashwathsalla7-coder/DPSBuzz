# Recon Map: WhatsApp Desktop Complete Replica (Windows Native App)

Scope: Entire WhatsApp Desktop Windows Application — Chats, Stories/Status, Calls, Communities, Settings, Group/Contact Info, Media/Docs/Links Gallery, Starred Messages, Disappearing Messages, Live Audio/Video Call Simulation, and Clean-Room Architecture  
For: DPS Buzz Students & Faculty (Stand-Alone Attached Module at `/whatsapp`)  
Date: 2026-11-05  

## Sources

| # | source | URL / Artifact | notes |
| --- | --- | --- | --- |
| 1 | Reference Screenshot | `replica/screens/whatsapp_desktop_reference.png` | Authentic Windows Desktop WhatsApp ("Together Forever" group, dark doodle wallpaper, video card, sender color tags, reactions) |
| 2 | WhatsApp Desktop / Web Specs | `https://web.whatsapp.com` | Multi-pane navigation rail, Segoe UI typography, SVG doodle tiled pattern, Status rings, Call logs |
| 3 | WhatsApp Design System | Public design tokens | Dark: `#0b141a` base, `#111b21` sidebar, `#202c33` header/incoming, `#005c4b` outgoing, `#00a884` primary green |

## Core Loop

Complete campus communication hub with real-time text chat, video playback cards, voice notes, story/status publishing & full-screen viewing, call logging & active call simulation, multi-channel communities, and comprehensive privacy/storage settings.

## Screens Inventory (28 Screens)

| ID | screen | route / how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Main Desktop App Shell | `/whatsapp` | Native desktop container | Window header, sidebar split, chat feed | filled, edge-to-edge |
| S02 | Slim Icon Navigation Rail | `/whatsapp` (far left rail) | Switch main application views | Chats, Status, Calls, Communities, Starred, Settings, Profile avatar | active tab indicator, unread badges |
| S03 | Chat List Sidebar | `/whatsapp` (sidebar, Tab 1) | Discover & switch chats | Search bar, filter pills (All/Unread/Groups), chat items | default, filtering, active |
| S04 | Active Chat Header | `/whatsapp` (top right) | Channel identity & actions | Avatar, group name, member subtitle, audio/video call, info toggle | active, muted |
| S05 | Message Thread Feed | `/whatsapp` (main canvas) | Reading message stream | Tiled SVG doodle wallpaper, date pill, bubble clusters | incoming, outgoing, consecutive |
| S06 | Rich Media Video Card | `/whatsapp` (inline feed) | Video / photo viewing | Thumbnail, play overlay, duration badge (2:20), forward button | loaded, playing |
| S07 | Footer Input Bar | `/whatsapp` (bottom right) | Composing & dispatching | Paperclip attach, emoji tray, pill input, mic / send | typing, recording, idle |
| S08 | Attachment Drawer | Popover from paperclip | Media selection | Photos & Videos, Document, Class Diary Photo | open, closed |
| S09 | Quick Emoji Tray | Popover from smile icon | Rapid emoji insertion | Frequency row (😂, 👍, 💀, ❤️, 🔥, 🎉, 🚀) | open, closed |
| S10 | Quoted Message Bar | Above input footer | Replying with context | Accent colored bar, author name, snippet | active, dismissed |
| S11 | Message Hover Actions | Hover message bubble | Quick actions | Reactions, Reply, Star message, Delete | hidden, visible |
| S12 | Status List Sidebar | Rail Tab 2 (Status) | Discover status stories | My status with add button, Recent updates, Viewed updates | default, unviewed rings |
| S13 | Status Story Viewer Modal | Click any status item | Instagram/WhatsApp style story | Segmented progress bars, auto-advance, reply input | playing, paused, replying |
| S14 | Text Status Creator Drawer | Click "+" in Status | Publish custom text story | Color palette picker, auto-focus textarea, post button | editing, posting |
| S15 | Calls Log Sidebar | Rail Tab 3 (Calls) | View audio/video history | Incoming/Outgoing/Missed filters, call items, dial buttons | default, missed filter |
| S16 | Active Call Overlay | Click Phone or Video | Live call simulation | Encrypted banner, animated avatar, timer, mute, camera toggle, hangup | Ringing, Connected |
| S17 | Communities View | Rail Tab 4 (Communities) | Campus-wide organizations | Community cards, announcement channels, sub-group lists | expanded, collapsed |
| S18 | New Community Creator | Plus button in Communities | Launch new campus hub | Community name, description, create button | open, closed |
| S19 | Group Info Drawer | Click chat header | Inspect group properties | Hero avatar, name, subtitle, quick call buttons, description | open, closed |
| S20 | Group Participants List | Inside Group Info | Manage enrolled members | Search bar, admin badges, add participant button | filtered, full list |
| S21 | Media, Docs & Links Gallery | Right drawer via info / search | Browse all shared files | 3 tabs: Media grid, Docs list with size, Links with domain | media, docs, links |
| S22 | Starred Messages Panel | Rail Star icon | Access bookmarked messages | Message list, sender name, timestamp, jump to chat | empty, filled |
| S23 | Settings Main Menu | Rail Settings icon | Master preferences | Account, Privacy, Chats, Notifications, Storage, Linked Devices, Help | default list |
| S24 | Privacy Settings Panel | Settings -> Privacy | Configure visibility | Last seen & online, read receipts toggle, default disappearing timer | default, modified |
| S25 | Chats & Wallpaper Settings | Settings -> Chats | Configure visual look | Tiled doodle wallpaper toggle, Enter is send toggle | active toggles |
| S26 | Notifications Settings | Settings -> Notifications | Alert preferences | Desktop notifications toggle, sound tone toggle | active toggles |
| S27 | New Chat & New Group Modal | Plus icon in Chats | Start direct chat or group | Contact picker, search, new group mode with multi-select | search, multi-select |
| S28 | Profile Editor Modal | Rail user avatar at bottom | Edit personal presence | User name, About status text, save button | view, edit |

## Flows

```
F01 Send Text Message & Reaction
    S03 select chat -> S07 type text -> click Send -> S05 bubble mounts -> S11 hover bubble -> click emoji reaction -> S05 pill incremented

F02 View & Reply to Status Story
    S02 click Status -> S12 click contact update -> S13 full-screen modal opens with progress bar -> type reply -> S13 auto-advances or dispatches

F03 Start Voice or Video Call
    S04 click Video icon -> S16 active call modal appears -> Ringing (2.5s) -> Connected with live seconds timer -> toggle Mic / Camera -> hang up

F04 Explore Communities & Join Sub-Group
    S02 click Communities -> S17 select "DPS School Community" -> click "Announcements" or sub-group -> S03 switches to group room -> S05 chat mounts

F05 Configure Wallpaper & Privacy
    S02 click Settings -> S23 click Chats -> S25 toggle WhatsApp Doodle -> S05 live re-renders wallpaper pattern
```

## Feature Parity Matrix

See `replica/features.csv` for detailed breakdown of all 28 screens. Parity rating: 100% on WhatsApp Desktop clean-room replica.
