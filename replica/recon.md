# Recon Map: WhatsApp Desktop (Windows Native App)

Scope: Desktop Group & Direct Messaging, Tiled Doodle Wallpaper, Rich Media Cards, Quoted Replies, Reactions & Voice Notes  
For: DPS Buzz Students & Faculty (Stand-Alone Attached Module)  
Date: 2026-11-05  

## Sources

| # | source | URL / Artifact | notes |
| --- | --- | --- | --- |
| 1 | Reference Screenshot | `replica/screens/whatsapp_desktop_reference.png` | Authentic Windows Desktop WhatsApp ("Together Forever" group, dark doodle wallpaper, video card, sender color tags, reactions) |
| 2 | WhatsApp Web / Desktop Specs | `https://web.whatsapp.com` | Two-column split layout, Segoe UI typography, SVG doodle tiled pattern |
| 3 | WhatsApp Design System | Public design tokens | Dark: `#0b141a` base, `#111b21` sidebar, `#202c33` header & incoming, `#005c4b` outgoing, `#00a884` primary green |

## Core Loop

Seamless, low-latency group and direct conversation with rich media sharing, quoted context, and expressive reactions in an authentic desktop interface.

## Screens

| ID | screen | route / how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Main Desktop App Shell | `/whatsapp` | Native desktop container | Window header, sidebar split, chat feed | filled, desktop edge-to-edge |
| S02 | Chat List Sidebar | `/whatsapp` (left panel) | Discover & switch chats | Search bar, chat items, unread badges, timestamps | default, search filtering, empty |
| S03 | Active Chat Header | `/whatsapp` (top right) | Channel identity & actions | Avatar, group name, member subtitle, video call, search | active, muted, read-only |
| S04 | Message Thread Feed | `/whatsapp` (main canvas) | Reading message stream | Tiled SVG doodle wallpaper, date pill, bubble clusters | incoming, outgoing, consecutive |
| S05 | Rich Media Card | `/whatsapp` (inline feed) | Video / photo viewing | Thumbnail, play overlay, duration badge, forward button, caption | loaded, playing, reacted |
| S06 | Footer Input Bar | `/whatsapp` (bottom right) | Composing & dispatching | Paperclip attach, emoji tray, pill input, mic / send | typing, recording, idle |
| S07 | Attachment Drawer | Popover from paperclip | Media selection | Photo/video, documents, diary snap | open, closed |
| S08 | Quick Emoji Tray | Popover from smile icon | Rapid emoji insertion | Frequency row (😂, 👍, 💀, ❤️, 🔥, 🎉) | open, closed |

## Flows

```
F01 Send Text Message
    S02 select chat -> S06 type text -> click send (or Enter) -> S04 optimistic bubble with single/double check
    happy path clicks: 2
    edge: offline queuing, multiline shift+enter, empty text

F02 Quoted Reply to Message
    S04 hover message -> click "Reply" -> S06 quote bar mounts -> type response -> S04 rendered with colored accent quote
    happy path clicks: 3
    edge: replying to deleted message, replying to media

F03 React to Message
    S04 hover message -> click emoji (e.g. 😂 or 👍) -> S04 reaction pill renders with incremented count
    happy path clicks: 2
    edge: toggling reaction off, multiple users reacting

F04 Media Card Playback
    S04 view video card -> click play button overlay -> inline playback / modal viewer with duration counter
    happy path clicks: 1
    edge: failed media load, missing duration
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| `ChatListItem` | active, default, unread | default, hover, selected | S02 |
| `MessageBubble` | incoming (`#202c33`), outgoing (`#005c4b`) | single, clustered, quoted | S04 |
| `MediaCard` | video, image, document | default, hover, playing | S05 |
| `ReactionPill` | active (user reacted), default | default, hover, incremented | S04, S05 |
| `DoodleWallpaper` | dark (`#0b141a`), light (`#efeae2`) | tiled repeating | S04 |
| `InputPill` | default, focused | typing, disabled | S06 |

## Inferred Data Model

```
ChatRoom    id, name, type (group | direct), avatar_url, is_locked, member_count, last_message, last_message_time
            evidence: S02 chat list, S03 header
            confidence: high

ChatMessage id, channel_id, sender_username, sender_name, sender_role, text, media_url, media_type, media_duration, quoted_msg_id, timestamp
            evidence: S04 bubble feed, S05 media card
            confidence: high

Reaction    message_id, emoji, count, user_ids (array)
            evidence: Reference screenshot (😂 5 pill on video)
            confidence: high
```

## Feature Matrix

See `replica/features.csv`. Must: 12, should: 4, could: 2, skip: 1.

## Out of Scope (Cannot or should not be cloned)

- WhatsApp proprietary VoIP calling servers (simulated with status/call indicator).
- End-to-end encrypted protocol binary handshakes (managed via HTTPS & Cloudflare D1 / Next.js API).

## Size

Screens: 8, Flows: 5, Entities: 3. Hard parts: Realtime message synchronization, SVG doodle wallpaper rendering, rich media cards with reaction badges.  
Size: **S** (Thin clean vertical slice).
