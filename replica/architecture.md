# Architecture: WhatsApp Desktop Replica for DPS Buzz

## Stack

| layer | choice | why |
| --- | --- | --- |
| web | Next.js 16 (App Router) + TypeScript | React 19 server components, client-side low-latency rendering, full type safety |
| styling | Tailwind CSS + CSS Variables | Zero runtime CSS overhead, pixel-accurate WhatsApp Desktop color system |
| database | Cloudflare D1 (Distributed SQLite) | Globally replicated at 280+ edge cities, ₹0 cost tier, high read concurrency |
| state | React Memoized Hooks + Optimistic Feed | 120 FPS typing latency with zero re-rendering of existing message bubbles |
| isolation | Dedicated Standalone Route (`/whatsapp`) | 100% sandboxed from main application pages; preserves all existing app features |

## Schema

Tables: 2 core tables in Cloudflare D1. Access rules: Header verified sessions & role checks in `/api/campus`.

```sql
-- 1. WhatsApp Channels / Groups
CREATE TABLE IF NOT EXISTS campus_whatsapp_channels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  section TEXT NOT NULL,
  is_locked INTEGER DEFAULT 0,
  admin_usernames TEXT DEFAULT '[]',
  enrolled_usernames TEXT DEFAULT '[]',
  member_count INTEGER DEFAULT 40,
  last_message TEXT DEFAULT '',
  last_message_time TEXT DEFAULT 'Just now',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. WhatsApp Messages
CREATE TABLE IF NOT EXISTS campus_whatsapp_messages (
  id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL,
  sender_username TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL DEFAULT 'student',
  sender_class TEXT,
  text TEXT NOT NULL,
  template_type TEXT DEFAULT 'none',
  timestamp INTEGER NOT NULL,
  media_url TEXT,
  media_type TEXT,
  media_duration TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (channel_id) REFERENCES campus_whatsapp_channels(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_wmsgs_channel_ts ON campus_whatsapp_messages(channel_id, timestamp);
```

## API

| method path | does | who | input | output | flow |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /api/campus?action=whatsapp_messages&after=ts` | Incremental message sync | Enrolled users | `after` timestamp | `{ messages: [...] }` | F01 |
| `POST /api/campus` (`send_whatsapp_message`) | Dispatches text/media message | Enrolled users | `channelId, text, senderUsername...` | `{ success: true, messageId }` | F01 |
| `POST /api/campus` (`toggle_channel_lock`) | Mutes/unmutes student posting | Faculty / Admins | `channelId, isLocked` | `{ success: true }` | F05 |

## The parts that bite

- **Background Wallpaper Rendering**: Standard CSS gradients look flat. Solved by inlining an authentic SVG WhatsApp Doodle tile pattern.
- **Typing Performance**: Re-rendering long message feeds on every keystroke causes perceptible lag. Solved by memoizing message items with `React.memo` and isolating input state.
- **Message Send Lockouts**: Defaulting to a locked school announcement channel blocks user input. Solved by auto-selecting active classroom (`channel-class-8g`).

## Build order

1. **Vertical Slice**: Dedicated route `src/app/whatsapp/page.tsx` rendering the authentic desktop shell, Windows title bar, tiled doodle canvas, and reference video message.
2. **Must-Haves**: Interactive text sending, quoted replies, emoji reactions (😂 5), and search filtering.
3. **Should-Haves**: Attachment drawer (Photos, Documents, Camera), quick emoji tray, and dynamic voice note/send toggle.
