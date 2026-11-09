# DPS Buzz — Private Student Network

DPS Buzz is a private social and notice board website built exclusively for students (classes 6–10, ages 11–16). It is designed to feel like a well-kept school notebook that happens to be alive — clear, calm, and school-specific.

---

## 1. Quick Start

### Prerequisites
- Node.js 18+ (tested on Node v20 and v24)
- npm or pnpm

### Running Locally
```bash
# 1. Install dependencies
npm install

# 2. Start the local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) on your computer, or open `http://<your-local-ip>:3000` on your mobile phone connected to the same Wi-Fi.

### Running Unit Tests
```bash
npm test
# or
node tests/unit.test.mjs
```

---

## 2. Database

- **Cloudflare D1** is the only database. Tables the app creates itself: `auth_credentials` (hashed passwords, bans), `server_kv` (notices, notes, groups…), and `sb_*` (messages, likes, comments, follows, notifications, posts, profiles, stories, app settings; moved from Supabase).
- **Cloudinary** stores photos, videos and the nightly private database backups.
- Before pushing: `npx tsc --noEmit` and `npm run build` must pass.

---

## 2. School Invite Code & Verification

- The sign-up code is set by the `SCHOOL_INVITE_CODE` environment variable and checked on the server. Don't publish it; give it to class teachers.
- Passwords are stored hashed (scrypt) in the D1 `auth_credentials` table. Admins can set or reset a password in Admin → Users.

---

## 3. How to Wipe Test Data

To reset the application to a clean live launch state:
1. Log in to the Admin Console at `/admin/login` with the password set in the `ADMIN_PASSWORD` environment variable.
2. Go to the **System & Wipe** tab.
3. Scroll to **Danger Zone** and tap **Wipe All Test Data**.
4. Confirm the wipe modal.
5. All test posts, stories, messages, and student registrations are erased while preserving the school settings and official school accounts (`DPS Buzz Official` and `Admin`).

---

## 4. Key Links & Routes

- `/home` — Student Home feed with top bar notice strip and story row
- `/leaderboard` — Star Board honours podium with gold/silver/bronze rings
- `/notices` — School circulars and exam schedules with folded-corner paper design
- `/chats` & `/groups` — Private class hubs and direct messaging with requests folder
- `/search` — Classmate search and plain ranked hashtag list
- `/settings` — Theme switcher (System/Light/Dark), quiet hours, and CHILDLINE 1098 help
- `/admin` & `/admin/login` — Administrative review console for reports and CSV roster upload
- `/styleguide` — Interactive design tokens and shared component test ground

---

## 5. Deployment (Netlify)

See **[DEPLOY.md](DEPLOY.md)**: environment variables, first-start behavior, nightly backups (GitHub Actions) and the one-time Supabase → D1 copy.
