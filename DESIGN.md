# DESIGN.md — DPS Buzz

The single source of truth for how DPS Buzz looks, sounds and moves. Read this whole file before touching any UI. If something here conflicts with a default, a template or a habit, this file wins.

DPS Buzz is a private social website for students (classes 6–10, ages 11–16). It must feel like it belongs to our school and was made by people who know it. It should be calmer, clearer and more useful than Instagram, not a copy of it.

---

## 0. How to use this file (instructions for the builder)

1. Read the whole file first. Then build the token file (section 4–6) before any screen.
2. Every colour, font size, space, radius, shadow and duration in the UI must come from tokens. No hard-coded hex values or pixel values in components.
3. Do not invent school facts. No made-up crest, houses, motto, "official" colours or school history. Use the placeholders in section 2 and keep them in one config file.
4. This is a design pass. Do not change features, database or logic unless a section here explicitly says so.
5. Build a `/styleguide` page (admin-only) that shows every token and every component in light and dark mode. Use it to check your work.
6. After each screen, show screenshots at 375px width in light and dark mode, then check the screen against section 3 (the anti-template rules) and section 16 (acceptance checklist). Tell me honestly what still looks generic.
7. If a font, colour or pattern here doesn't work in testing, propose an alternative and explain why. Don't silently swap it.

---

## 1. Product feel and principles

**One-line feel:** a well-kept school notebook that happens to be alive — warm, a bit cheeky, very clear.

**Principles**

1. **It's our school's, not a startup's.** Wordmark, colours, copy and small details come from this school. Nothing should look like it could belong to any other app.
2. **Notices matter more than likes.** School notices are first-class and always visible on Home, with a clear unread/seen state. Instagram has nothing like this, and it's the reason students and the school will open the site every day.
3. **Calm by design.** No autoplay, no endless scroll, no streaks, no guilt, no fake urgency. The feed ends ("That's everything for now"). Red is only for things that are truly urgent.
4. **Different things look different.** People are circles. Groups are rounded squares. Notices look like paper. Achievements look like stamps and stickers. A screen should never be a stack of identical cards.
5. **Fair and transparent ranking.** The Star Board is public, clear about how it works, and never shames anyone for a drop in rank.
6. **Safety is part of the interface.** Reporting takes two taps, privacy is the default, and strangers can't reach students.
7. **Readable first.** 16px body text, strong contrast, big tap targets, tabular numbers. It must work on a cheap phone on slow data.
8. **Restraint.** Personality comes from writing, typography and a few chosen details, not from effects on everything.

**Where it deliberately goes beyond Instagram**

- Notice strip on Home with category colour, urgency and "seen" tracking.
- A bounded, finite feed with a clear end.
- A Star Board built for fairness: your own rank is always visible, rank changes are neutral, "how ranking works" is one tap away.
- Chat requests folder, block and mute built into every profile and message.
- Group avatars, notices and posts that each have their own visual shape.
- Plain-language privacy and safety screens written for 11–16-year-olds.
- No reels, no video, no ads, no tracking.

---

## 2. Identity inputs (placeholders until the real ones arrive)

Keep all of these in a single file, `src/config/school.ts`. Changing them must restyle the whole site.

| Item | Placeholder now | Real value |
|---|---|---|
| Site name | DPS Buzz | (confirm) |
| School name | DPS Buzz | — |
| Logo / crest | Text wordmark only, no invented crest | Owner will supply |
| School primary colour | `#1E3A8A` (ink blue) | Owner will supply |
| School accent colour | `#F0563A` (coral) | Owner will supply |
| Houses | **None.** Remove house features unless confirmed | Owner to confirm if houses exist |
| Motto | None. Don't write one | Owner will supply |
| Campus photos | None. Use plain placeholders, never stock photos | Owner will supply |

Rule: when the real primary and accent colours arrive, regenerate `--primary`, `--primary-hover`, `--primary-tint` and `--accent`, `--accent-tint`, then re-check contrast (section 13).

---

## 3. Anti-template rules (what makes it look AI-made)

**Never use**

- Purple/pink/neon gradients on backgrounds, buttons or text. Exception to the "no orange" and gradient rule: warm orange is allowed ONLY inside story rings and text-story backgrounds. Nowhere else in the UI; the rest of the app stays cool and flat.
- Glassmorphism, blurred translucent cards, glowing shadows, neon accents. (Exception: dark mode only soft glow on unseen story rings, box-shadow 0 0 10px rgba(255,70,150,.45); no glow in light mode and no glow anywhere else in the app).
- The same rounded card with the same soft shadow on everything.
- Emoji as icons, bullets or decoration. Emoji in headings, buttons, labels or nav.
- Default or overused fonts: Inter, Roboto, Arial, system-ui as the main face.
- Everything centred and perfectly symmetric. Identical padding on every block.
- Stock illustrations, placeholder boxes that say "Photo", lorem ipsum, fake testimonials.
- Marketing language: "Seamlessly", "Unlock", "Elevate", "Supercharge", "Your journey", "Oops!", "Awesome!", "Welcome to the future of…".
- Animations on every tap. Confetti except where section 8 allows it.
- Pure black (`#000`) page backgrounds or pure white text on pure black.
- Thick outlines and hard shadows on every element (the "neo-brutalist" trend look). Hard shadows are allowed only on stickers and badges.

**The human test** — before shipping any screen, ask:
1. If I cover the logo, could this screen belong to any app? If yes, add something specific to this school.
2. Does every element on the screen look the same? If yes, change the shape or weight of at least one.
3. Would a 14-year-old at this school say this sentence out loud? If not, rewrite it.
4. Is there anything here that exists only to look "designed"? Remove it.

---

## 4. Colour

Flat solid colours. The page is warm off-white, not cold grey. Dark mode is designed separately (a deep warm slate), not an inversion of light mode.

### 4.1 Tokens

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#FAF7F2` | `#14161C` | Page background |
| `--surface` | `#FFFFFF` | `#1D2029` | Cards, sheets, inputs |
| `--surface-sunken` | `#F2EDE4` | `#11131A` | Chips, received chat bubbles, search field |
| `--line` | `#E4DED3` | `#2F3442` | Default borders and dividers |
| `--line-strong` | `#CFC7B8` | `#434A5C` | Seen story rings, focus-adjacent borders |
| `--text` | `#17181C` | `#F2EFE9` | Main text |
| `--text-muted` | `#5F6472` | `#9AA0B2` | Secondary text, timestamps |
| `--primary` | `#1E3A8A` | `#7C9BFF` | Buttons, links, active tab, hashtags |
| `--primary-hover` | `#172E6E` | `#9DB4FF` | Pressed/hover |
| `--primary-tint` | `#E8EDFB` | `#1F2747` | Selected rows, your own rank row |
| `--on-primary` | `#FFFFFF` | `#0E1530` | Text on primary |
| `--accent` | `#F0563A` | `#FF7A5C` | Likes, notification dot, small badges |
| `--accent-tint` | `#FDE9E4` | `#3A211C` | Soft accent backgrounds |
| `--gold` | `#E0A100` | `#F2B705` | Rewards, rank 1 |
| `--silver` | `#9AA3B2` | `#AEB6C6` | Rank 2 |
| `--bronze` | `#B8733A` | `#D08A4E` | Rank 3 |
| `--success` | `#1F8A4C` | `#4CC38A` | Confirmations |
| `--warning` | `#B7791F` | `#E3A94B` | Cautions |
| `--danger` | `#C62828` | `#FF6B6B` | Urgent notices, destructive actions, errors |

*(Note: Yellow highlight token has been removed. Use white `#FFFFFF` or `--primary-tint` for any highlighter effect.)*

**Notice category colours** (used as a 3px left edge and a small label colour, never as a full background)

| Category | Light | Dark |
|---|---|---|
| Exams | `#2D4FB3` | `#8CA6FF` |
| Holidays | `#1F8A4C` | `#4CC38A` |
| Events | `#D6336C` | `#FF7FAE` |
| Sports | `#E8590C` | `#FF9A5C` |
| Fees | `#0B7285` | `#4FC3D9` |
| Urgent | `#C62828` | `#FF6B6B` |

### 4.2 Rules

- One dominant colour (`--primary`), one sharp accent (`--accent`), calm neutrals. Everything else is restrained.
- Buttons are `--primary` with `--on-primary` text. Never put small white text on `--accent` or `--gold`. Use dark text on those.
- `--accent` is for likes, the notification dot, small badges and underlines. It is not a button colour.
- Gold, silver and bronze appear only for Star Board and reward badges. This keeps them special.
- Red appears only for urgent notices, destructive confirmations and errors.
- Colour is never the only signal. Pair it with text, an icon or a shape.
- Dark mode: lift primary and accent to the dark values above, reduce shadow reliance, use borders for separation.
- Default theme follows the device setting on first visit. Store the user's choice.

### 4.3 CSS variables and Tailwind

```css
:root {
  --bg:#FAF7F2; --surface:#FFFFFF; --surface-sunken:#F2EDE4;
  --line:#E4DED3; --line-strong:#CFC7B8;
  --text:#17181C; --text-muted:#5F6472;
  --primary:#1E3A8A; --primary-hover:#172E6E; --primary-tint:#E8EDFB; --on-primary:#FFFFFF;
  --accent:#F0563A; --accent-tint:#FDE9E4;
  --gold:#E0A100; --silver:#9AA3B2; --bronze:#B8733A;
  --success:#1F8A4C; --warning:#B7791F; --danger:#C62828;
}
:root[data-theme="dark"] {
  --bg:#14161C; --surface:#1D2029; --surface-sunken:#11131A;
  --line:#2F3442; --line-strong:#434A5C;
  --text:#F2EFE9; --text-muted:#9AA0B2;
  --primary:#7C9BFF; --primary-hover:#9DB4FF; --primary-tint:#1F2747; --on-primary:#0E1530;
  --accent:#FF7A5C; --accent-tint:#3A211C;
  --gold:#F2B705; --silver:#AEB6C6; --bronze:#D08A4E;
  --success:#4CC38A; --warning:#E3A94B; --danger:#FF6B6B;
}
```

```ts
// tailwind.config.ts -> theme.extend.colors (every colour reads from a CSS variable)
colors: {
  bg:'var(--bg)', surface:'var(--surface)', sunken:'var(--surface-sunken)',
  line:'var(--line)', 'line-strong':'var(--line-strong)',
  text:'var(--text)', muted:'var(--text-muted)',
  primary:{ DEFAULT:'var(--primary)', hover:'var(--primary-hover)', tint:'var(--primary-tint)', on:'var(--on-primary)' },
  accent:{ DEFAULT:'var(--accent)', tint:'var(--accent-tint)' },
  gold:'var(--gold)', silver:'var(--silver)', bronze:'var(--bronze)',
  success:'var(--success)', warning:'var(--warning)', danger:'var(--danger)',
}
```

---

## 5. Typography

English only. Loaded via `next/font/local` from `/public/fonts` (no third-party CDN), with `font-display: swap` and subsetting to Latin only.

| Role | Font | Weights | Use |
|---|---|---|---|
| Display | **Cabinet Grotesk** | 700, 800 | Wordmark, screen titles, notice titles, Star Board rank numerals |
| Body & UI | **Satoshi** | 400, 500, 700 (variable) | Buttons, tabs, chips, captions, comments, chat, forms, all UI |
| Hand | **Kalam** | 400 | Tiny handwritten notes only: empty-state margin notes, "Star of the Week" annotation. Maximum one per screen, no emoji |
| Mono & Counters | **IBM Plex Mono** | 400, 500 | Admission numbers and leaderboard counters |
| Optional Notice | **Gambetta** | 700 | Optional: notice titles only (upon approval) |

**Tabular Numerals (`tabular-nums`):**
- Satoshi natively supports OpenType tabular figures (`tnum` / `font-variant-numeric: tabular-nums`), ensuring counts, ranks and timestamps stack with uniform width.
- Cabinet Grotesk does not support tabular figures (remains proportional).
- For admission numbers and leaderboard counters, IBM Plex Mono (400, 500) is used to ensure rock-solid tabular alignment.

**Type scale (mobile, px / line-height)**

| Token | Size / LH | Weight | Font | Styling | Use |
|---|---|---|---|---|---|
| `display-xl` | 40 / 44 | 800 | Cabinet Grotesk | tracking -0.02em, lh 1.1 | Login headline, rank numerals |
| `display-l` | 28 / 32 | 700 | Cabinet Grotesk | tracking -0.02em, lh 1.15 | Profile name, Star Board title |
| `title` | 22 / 26 | 700 | Cabinet Grotesk | tracking -0.02em, lh 1.15 | Screen titles, notice titles |
| `heading` | 18 / 22 | 600 | Cabinet Grotesk | tracking -0.02em, lh 1.2 | Section headings, notice card titles |
| `body-l` | 16 / 24 | 400 | Satoshi | lh 1.5 | Captions, chat messages, notice body |
| `body` | 16 / 24 | 400 | Satoshi | lh 1.5 | Secondary text, comments, feed posts |
| `label` | 14 / 16 | 600 | Satoshi | lh 1.15 | Buttons, tabs, chips (chips use 6px radius, not pills) |
| `meta` | 12 / 16 | 500 | Satoshi | lh 1.33 | Timestamps, counts, helper text. Nothing under 12px |
| `hand` | 18 / 24 | 400 | Kalam | lh 1.33 | Margin notes (max 1 per screen, no emoji) |

Rules: sentence case everywhere (no ALL CAPS except the tiny category label, 12px, +0.06em tracking). Left-aligned body text. Max line length 65 characters on desktop. Headings get letter-spacing -0.02em and a line-height of 1.1 to 1.2. Body text 16/24; nothing under 12px. No emoji anywhere in typography spec or headings. Chips use a 6px radius, not pills. Respect user text scaling up to 200% without layout breaking.

---

## 6. Space, layout, shape

- **Spacing scale (4px base):** 4, 8, 12, 16, 20, 24, 32, 40, 56, 72. Nothing outside the scale.
- **Mobile layout:** 16px side gutters, content max-width 480px centred on large phones. Vertical rhythm of 12 between related items and 24 between sections. Vary the rhythm on purpose; don't use one padding value everywhere.
- **Tablet (≥768px):** single centred column, 560px wide, with wider notice and Star Board layouts.
- **Desktop (≥1024px):** left sidebar (72px collapsed / 240px expanded), centre feed 560px, right rail 320px (notice strip, Top 3, upcoming events).

**Radii (Master Prompt Quality Pass Override)**

### 6. Corner radius (Redesign Override)
Kept strictly in tokens so they can be changed in one place:

| Token | px | Use |
|---|---|---|
| `--r-pill` | 9999px | Chips and search fields (full pill) |
| `--r-input` / `--r-btn` | 14px | Buttons and form inputs |
| `--r-photo` / `--r-hero` | 20px | Post photo cards and hero card |
| `--r-grid` | 16px | 2-column grid photo cards |
| `--r-tabbar` | 24px | Floating bottom tab bar |
| `--r-sheet` | 24px | Bottom sheets (top corners only) |
| `--r-group-avatar` | 14px | Group avatars |
| `--r-chat-bubble` | 18px | Chat bubbles |
| `--r-notice` | 6px | Notice cards (paper-like) |
| `--r-circle` | 9999px | People avatars and story rings (full circle) |

Rule: Radii follow this clear hierarchy. All radius values must come strictly from tokens.


**Borders and elevation**

- Default separation is a 1px `--line` border, not a shadow.
- `--elev-1` for floating things only (menus, bottom sheets, toasts): light `0 6px 20px rgba(23,24,28,.10)`, dark `0 6px 20px rgba(0,0,0,.45)`.
- `--elev-sticker` (stickers and badges only): `2px 2px 0 var(--text)` in light, `2px 2px 0 #000` in dark.
- No other shadows. No blur backgrounds.

---

## 7. Icons, illustration, imagery, avatars

**Icons**
- One consistent set, 24px grid, 1.75px stroke, rounded joins. Start from Phosphor (Regular) or Lucide, then redraw or adjust the five bottom-tab icons so they feel custom: Home, Search, Post (pencil-plus), Chats, Profile.
- Active tab uses the filled version of the icon plus `--primary`. Inactive is outlined and `--text-muted`.
- Every icon-only button has an accessible label and a 44×44px tap area.

**Illustration**
- A small set of 8 hand-drawn SVG doodles in a single 2px line style with a slight wobble: pencil, ruler, school bag, bell, notebook, trophy, bus, canteen cup. Use them only in empty states and the 404 page, in `--text-muted` with one accent stroke.
- No stock illustration packs. No illustrated people.

**Imagery**
- Only real student photos and real campus photos supplied by the school. No stock photos. No faces of real people in demo or marketing material.
- Photos are shown 4:5 with a blur-up placeholder from the image's dominant colour (never a grey "Photo" box).
- Post images: max 4 per post, compressed to 1080px wide and about 200KB.

**Avatars**
- People: circles. Groups: rounded squares (radius 12). This difference is always kept.
- Default avatar: the student's initials on one of 8 curated flat colour pairs, chosen from the username so it never changes.

| # | Background | Letters |
|---|---|---|
| 1 | `#FFD9CC` | `#7A2E1B` |
| 2 | `#FDEBA8` | `#6B5200` |
| 3 | `#CFEBD8` | `#14532D` |
| 4 | `#CDE6F7` | `#0C4A6E` |
| 5 | `#E2D9FB` | `#3B2A87` |
| 6 | `#FBD3E3` | `#8A1C4B` |
| 7 | `#D6E4C8` | `#3F5B1E` |
| 8 | `#F3D9C4` | `#6B3A12` |

  Dark mode: background = the letter colour at 22% over `--surface`, letters = the light background colour.
- No grey silhouette icons anywhere.

---

## 8. Motion

| Token | Value |
|---|---|
| `--dur-fast` | 120ms (press feedback, colour changes) |
| `--dur-base` | 180ms (most transitions) |
| `--dur-slow` | 280ms (sheets, page transitions) |
| `--ease-out` | `cubic-bezier(.2,.8,.2,1)` |
| `--ease-spring` | `cubic-bezier(.34,1.56,.64,1)` |

Allowed motion:
- Like: heart scales 1 → 1.25 → 1 over 220ms with `--ease-spring`. Double-tap on a photo shows one heart pop at the tap point.
- Buttons: 96% scale on press, back on release.
- Bottom sheets slide up in 280ms.
- Page changes: 180ms fade and 8px slide.
- Story ring: a single soft pulse when a new story appears.
- Loading: skeleton blocks that match the final layout. Slow shimmer (1.6s), low contrast.
- **Confetti:** only for a follower milestone (25/50/100/250/500), a new Star Board #1, or a reward drop. Maximum 1.5 seconds, once per event. Nowhere else.

Everything respects `prefers-reduced-motion`: replace movement with a 100ms fade and turn confetti off completely.

---

## 9. Components

### 9.1 Top bar and notice strip (mobile)
- Top bar: 56px. Wordmark on the left (Display 800). On the right: notification bell with a small `--accent` dot (count up to "9+") and the menu icon (opens Notices, Groups, Star Board, Settings).
- Notice strip under the top bar, 40px: category label (coloured text, 12px caps), truncated title, "Read" on the right. Tapping opens the notice.
- Urgent notice: full-width `--danger` banner with white text (contrast checked), stays until dismissed, and reappears only for a new urgent notice.

### 9.2 Floating bottom tab bar (Redesign Override)
- Floats 12px above bottom and 12px in from sides (plus safe-area). Height 64px, radius 24px (`rounded-[24px]`).
- Surface color at 94% opacity, 1px `--line` border, soft shadow (light: `0 8px 24px rgba(18,22,32,.12)`, dark: `0 8px 24px rgba(0,0,0,.5)`).
- **NO backdrop-filter or blur anywhere** (it janks on cheap phones).
- Tabs: Home, Search, Post, Chats, Profile.
- The Profile tab shows student's own avatar (24px, ringed in `--primary` when active).
- Labels 12px. Active tab: filled icon + `--primary` color.
- Center Post is a 52px circular `--primary` button, raised 10px above the bar with a 4px ring in the page background color, white plus-in-square icon.
- Chats shows a like-rose dot (`--like`) when anything is unread.
- Content screens have bottom padding (`pb-[100px]`) so nothing is hidden behind the bar.

### 9.3 Story ring, stories and story viewer (Quality Pass Specification)
- **Exception to the "no orange" colour rule:** warm orange is allowed inside story rings and text-story backgrounds only. Nowhere else in the UI; the rest of the app stays cool and flat.
- **Unseen ring:** 64px outer, 3px ring with `linear-gradient(135deg, #FF8A1F 0%, #FF2E93 35%, #A855F7 68%, #3B82F6 100%)` (orange, pink, purple, blue), then a 2px WHITE (`#FFFFFF`) inner ring between the gradient and the avatar in both light and dark mode. No yellow in the gradient.
- **Dark mode only:** a soft glow on unseen rings, `box-shadow: 0 0 10px rgba(255,70,150,.45)`. No glow in light mode and no glow anywhere else in the app.
- **Seen ring:** flat `#C4CCD8` in light, `#3A4357` in dark. In dark mode the inner ring is the page colour (`var(--bg)`), not white.
- **Your story:** dashed ring in the line-strong colour (`var(--line-strong)`), with a primary plus badge and a 2px white border (`#FFFFFF`).
- **New story:** one 1s pulse of the ring (`scale 1 > 1.04 > 1`), then still. Respect reduced-motion.
- **Story viewer:** white progress segments (2px) on a translucent dark track, white text and icons over the media.
- Row scrolls horizontally with snap. Names below at 12px, one line, truncated.

### 9.4 Post card (Photo-first, Redesign Override)
- **Card is the photo itself:** 20px radius, 12px side margins, 4:5 ratio (one fixed ratio everywhere), blur-up placeholder, no border or shadow.
- **Overlaid at top-left:** 36px avatar, username (white, 600 weight), class and time on a second line (white at 85%, 12px).
- **Overlaid at top-right:** 36px circular "more" button with dark translucent background (`rgba(0,0,0,.4)`, no blur).
- **Top scrim:** `linear-gradient(to bottom, rgba(0,0,0,.5), rgba(0,0,0,0) 38%)`, ensuring white text always passes contrast regardless of photo brightness. This scrim is the only gradient allowed on photos.
- **Multi-photo posts:** horizontal scroll-snap, "1/3" chip, dots under the photo.
- **Action row below photo:** heart (liked = filled like-rose `--like`), comment, send, save at the right (44px tap areas).
- **Social proof line:** "Liked by priya and 12 others" with up to 3 overlapping 20px avatars (hide completely at 0 likes and show "Be the first to like this" in muted 12px).
- **Details:** time in muted 12px, caption (username + text, 2-line clamp, "more" toggle), "View all 8 comments".
- Verified tick next to username only for official "DPS Buzz Official" account, never for students.
- Double-tap on photo likes it with one heart pop.
- Image failure tile: sunken background, image-off icon, "Photo didn't load. Tap to retry." Never raw alt text.
- Upload-in-progress card at the top of the feed with thumbnail, progress bar and "Posting...".
- Compact Star Board teaser after the third post (top 3, "See all"). Feed ends with left-aligned "That's everything for now." block with a small doodle.

### 9.5 Notice card (a different object on purpose)
- Radius 4. Left edge 3px in the category colour. A small folded corner at the top right (CSS clip, drawn with the `--line` colour).
- Category label (caps, 12px, +0.06em), title in Display 18/22 700, 2-line preview, footer with date, "Seen by 214" and an attachment icon if there is one.
- Pinned: a pin icon at the top left. No tilting or rotation.
- Unread: title in 700 plus a small `--accent` dot. Read: title in 600.
- Notice detail page: title in `title` size, a metadata line, body in body-l with 24px line height, attachments listed as file rows (icon, name, size, open), and a "Mark as seen" state recorded automatically.
- Calendar view: month grid, each day with notice dots in category colours.

### 9.6 Chat
- Chat list rows: 64px, avatar (circle for people, rounded square for groups), name, last message preview, time, unread count in `--primary`.
- A "Message requests" row sits at the top of the list with its count.
- Bubbles: radius 18, max width 78%. Sent = `--primary` with `--on-primary` text. Received = `--surface-sunken` with `--text`. Consecutive messages from the same person are grouped with 2px gaps. In group chats the sender's name shows above the first bubble in muted 12px.
- Typing indicator: three dots, slow and calm. Read receipts: the text "Seen" in muted 12px. Students can turn read receipts off in Settings.
- Composer: 48px minimum height, radius 12, image button, send button that becomes `--primary` once there's text.
- Long-press a message for reactions, reply, report and delete (own messages).

### 9.7 Buttons, inputs, chips, controls
- **Primary button:** `--primary`, `--on-primary`, radius 12, 48px tall, `label` text. **Secondary:** transparent with a 1px `--line-strong` border. **Quiet:** text only in `--primary`. **Destructive:** `--danger` background, always behind a confirmation.
- **Inputs:** 48px, radius 12, `--surface` background, 1px `--line` border; focus is a 2px `--primary` ring offset by 2px. Label above the field (never placeholder-only labels). Error text below in `--danger` with an icon.
- **Chips:** `--surface-sunken`, radius 8, 32px tall. Selected chips use `--primary-tint` with `--primary` text.
- **Segmented control** (Star Board periods, feed tabs): sunken track, selected segment in `--surface` with a 1px border.
- **Toasts:** bottom, above the tab bar, 3 seconds, `--elev-1`, one line of plain text.
- **Bottom sheets:** top radius 16, grabber 4×36px, 280ms slide.
- **Modals:** only for confirmations. Prefer sheets.

### 9.8 Stickers and badges
- Badges look like stamps: a 2px outline, slightly irregular (1° tilt maximum, static), `--elev-sticker`. Content is a simple line glyph plus a short name. Locked badges are shown outlined and muted with how to earn them.
- Milestone sheet: a one-time sheet with the badge enlarged, one line of copy, and the allowed confetti.

### 9.9 Empty, error and loading states
- Empty states are not all centred. Left-align the text, put one doodle (section 7) off to a corner, write one line of copy and offer one action when there is one. Vary the arrangement between screens.
- Error pages (404, offline, server error) use a doodle, a plain line of copy and one button. The 404 has a bit of personality.
- Loading: skeletons that match the final layout. Full-screen loading shows the wordmark only.

---

## 10. Screens

**Login and sign-up** (`/login`, `/signup`)
- Not a SaaS hero. Wordmark at the top, one short line of copy, then the form.
- Sign-up is three clear steps: 1) find you in the school list (admission number, full name, invite code), 2) pick a username and password, 3) rules and privacy (short, in plain words) and done.
- Specific error copy, for example: "We couldn't find that admission number. Check your school diary."
- Admin login is a separate, plainer page at `/admin/login`.

**Home** (`/home`)
- Order: top bar, notice strip, story row, Following / Whole School tabs, feed.
- After the third post, show a compact Star Board teaser (top 3, "See all"). Feed ends with a finite "That's everything for now" block, not a footer link maze.
- Pull-to-refresh with a small custom indicator.

**Compose** (`/post/new`)
- Full-screen sheet. Multi-photo picker (max 4) with drag-to-reorder, compression progress, caption, hashtags, audience (Whole school, or one of your groups), and an optional "Describe the photo" field for accessibility.

**Story viewer**
- Full-screen, dark. 2px progress segments at the top, tap right/left to move, hold to pause, swipe down to close.
- Reply field and emoji reactions at the bottom. Poll stickers use flat bars with percentages shown after the viewer votes. The creator sees totals only, never who voted what.

**Profile** (`/u/[username]`)
- Laid out like an ID card: a square-ish photo (radius 16, 88px), name in `display-l`, username, a class-section chip, bio, then three stat columns (Posts, Followers, Following) with tabular numerals.
- A horizontal badge shelf. A "Star Board #12 this week" chip when the student is ranked.
- Tabs: Posts (3-column grid, 2px gaps) and Saved (own profile only). Follow, message and more actions sit beside the name. Own profile has "Edit profile".
- No house tags unless the school confirms houses.

**Star Board** (`/leaderboard`)
- Header: title, a segmented control (This week · This month · All time) and a class filter.
- Podium: three flat columns (heights roughly 3 : 2 : 1 from the centre), rank numerals in `display-xl` 800, avatar with a gold/silver/bronze ring, name and follower count. No gradients, no glow.
- List: rows 56px high with a tabular rank number, avatar, name, class and follower count at the right. Rows below 3 are plain; divider lines are `--line`.
- Your own row is highlighted with `--primary-tint` and also pinned at the bottom of the screen as "You · #47".
- Rank changes: a small neutral "+3" in muted text. A drop is shown as plain muted text with no red and no arrow.
- A "This week's prize" strip describes the canteen coupon in one line, with the Kalam note "Star of the Week" beside the winner.
- A "How ranking works" link opens a short sheet: only verified students count, follows are rate-limited, and the admin approves rewards.
- Spirit Points, if enabled, is a second tab with the same layout.
- Empty state: "No ranks yet. Get followers to take #1."

**Notices** (`/notices`, `/notices/[id]`)
- Category filter chips, pinned notices first, then by date. List/Calendar toggle. Unread notices are visually stronger.

**Chats and groups** (`/chats`, `/groups`)
- As described in 9.6. Group page: a flat colour band header, rounded-square avatar, member count, and tabs Feed · Chat · Members. Class groups are created automatically from the roster.

**Notifications**
- Grouped as Today / Earlier. Each row: avatar, one sentence with the name in bold, time, and an unread dot in `--primary`. Urgent notices also appear as the banner.

**Search**
- Search field at the top, recent searches, trending hashtags as a plain ranked list with counts, and suggested students from the same class and section only.

**Settings**
- Theme (System / Light / Dark), notification options, read receipts on/off, blocked list, privacy and safety, delete account (confirmation sheet, explained in plain words).

**Admin** (`/admin`)
- Plainer and denser than the student site, but uses the same tokens. Works on a phone: tables become stacked cards, with a sticky bottom action bar.
- Report review: the reported item, context, reporter reason, and four one-tap actions (Hide, Delete, Warn, Ban) each with a confirmation sheet. Pending reports are sorted by urgency and number of reports.
- Roster upload shows a preview, errors per row, and a count of matched and unmatched students before confirming. A "recently claimed accounts" list with a one-tap reset sits in Students.

---

## 11. Voice and copy

**Voice:** how an Indian school student talks in English. Short, dry, specific, a little funny, never trying hard. Sentence case. At most one emoji in any message, and none in buttons, labels, headings or navigation. Use real school words: assembly, free period, tiffin break, unit test, school diary, canteen, notice board.

**Never write:** seamlessly, unlock, elevate, supercharge, journey, "Oops!", "Awesome!", "Let's go!", "You're all set!!", walls of exclamation marks.

| Place | Copy |
|---|---|
| Empty Whole School feed | Nothing here yet. Be the first to post. |
| Empty Following feed | You're not following anyone yet. Start with your own class. |
| End of feed | That's everything for now. |
| Empty stories | No stories today. Post one before free period ends. |
| Empty Star Board | No ranks yet. Get followers to take #1. |
| Empty chats | No chats yet. Message a classmate. |
| Empty notifications | Nothing new. |
| Empty notices | No notices right now. Check again after assembly. |
| Generic error | That didn't work. Check your internet and try again. |
| Offline | You're offline. You can still read what's already loaded. |
| Profanity blocked | That word isn't allowed here. Try saying it differently. |
| Report sent | Thanks. We'll look at it. |
| Hidden after reports | This post is hidden while it's being checked. |
| Sign-up, roster miss | We couldn't find that admission number. Check your school diary. |
| Sign-up, wrong name | That name doesn't match our list. Type it as it's written in your diary. |
| Wrong invite code | That code isn't right. Ask for the latest one. |
| Delete account | This removes your posts, stories and messages. It can't be undone. |
| Milestone, 50 followers | 50 followers. People are paying attention. |
| Star of the Week | Star of the week |

---

## 12. Safety patterns in the interface (this is for children, treat it as mandatory)

- **Report in two taps:** the "…" menu → Report → pick a reason → done. Reasons in student language: "Mean or bullying", "Not appropriate", "Spam", "Fake account", "Shows private info", "Something else". Same flow for posts, comments, stories, messages and profiles.
- **Block and mute** appear in every profile menu and every chat. Blocked people disappear everywhere.
- **Message requests:** messages from someone you don't follow go to a Requests folder first. Accept, ignore or block, with no read receipt sent until accepted.
- **Auto-hide:** content with 3 or more reports is hidden with the placeholder copy above until the admin reviews it.
- **Private by default.** No location, no phone numbers, no outside contacts, no ads, no third-party trackers. The privacy page is written in plain words, one screen long.
- **Help page:** a "Need help?" screen explains how to tell the admin and shows a children's helpline. CHILDLINE is 1098 in India. Verify the number is still correct before launch and confirm with the school what to show.
- **No shaming:** no streaks, no "you haven't posted", no red for lower rank, no public dislike counts.

---

## 13. Accessibility and performance

**Accessibility**
- Contrast at least 4.5:1 for text and 3:1 for icons and borders, in both modes. Re-check after any colour change. White text is allowed only on `--primary`, `--danger` and `--success`; never on `--accent`, `--gold`, `--highlight`.
- Tap targets at least 44×44px. Visible focus ring (2px `--primary`, 2px offset) on every interactive element.
- Full keyboard navigation on desktop. Screen-reader labels on all icon buttons. Optional alt-text field on photo upload.
- Colour is never the only signal. Respect reduced motion and text scaling up to 200%.

**Performance (slow school Wi-Fi and cheap phones)**
- Target: first view under 2.5 seconds on throttled 4G, and a JavaScript budget as small as practical for the first load.
- Lazy-load images below the fold, blur-up placeholders, variable fonts only, skeletons that match the final layout.
- Cache recent feed data, drafts and the theme choice on the device. Show cached content first when offline.

---

## 14. Responsive behaviour

| Width | Layout |
|---|---|
| 360–430px (primary) | Single column, bottom tab bar, notice strip under top bar |
| 768px | Centred 560px column, wider Star Board podium and notice cards |
| 1024px+ | Left sidebar, 560px centre feed, 320px right rail |

Design and review at 375px first, then widen. Chats on desktop show the list and the conversation side by side.

---

## 15. Proposals that need approval (do not build without asking)

1. Quiet hours: no browser notifications from 9 pm to 7 am by default.
2. A feed cap of about 30 posts per session, followed by the "That's everything for now" end block.
3. Setting to hide like counts on your own posts.
4. A custom wordmark and small logo mark, once the school identity is decided.
5. A short "Community rules" screen shown at sign-up and linked from Settings.

---

## 16. Build process and acceptance checklist

**Process**
1. Create `src/config/school.ts` and the token files (colours, type, space, radii, elevation, motion).
2. Build `/styleguide` with every token and component in light and dark.
3. Restyle in this order: Login/Sign-up → Home and stories → Profile → Star Board → Notices → Chats and groups → Notifications and Search → Settings → Admin.
4. After each screen: 375px screenshots in both modes, then run the checklist below.
5. At the end: audit every screen against section 3 and report honestly what still looks generic.

**A screen is done only when**
- [ ] Every value comes from a token. No stray hex codes or pixel values.
- [ ] It passes the human test in section 3.
- [ ] Different object types look different (people circles, groups squares, notices paper, achievements stamps).
- [ ] No gradient other than the unseen-story ring. No glass, glow or neon.
- [ ] At most one emoji per message and none in buttons, labels or headings. All copy matches section 11.
- [ ] Empty, loading and error states exist, are not all centred, and use real copy.
- [ ] Text contrast and tap targets pass in light and dark.
- [ ] Reduced motion is respected. Confetti only appears where section 8 allows.
- [ ] It looks good with a long name, a very long caption, zero followers, and 9,999 followers.
- [ ] Nothing in the screen is invented about the school.
