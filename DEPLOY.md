# Deploying DPS Buzz (Netlify)

Data lives in **Cloudflare D1** (the only database). Photos, videos and the
nightly backups live in **Cloudinary**. Supabase is no longer used.

## 1. Environment variables on Netlify

Site configuration → Environment variables → Add a variable → **Import from a .env file**,
then paste the contents of `.env.vercel` (same list works for Netlify).

| Variable | What it is |
|---|---|
| `SESSION_SECRET` | Random string, 32+ characters. Signs login cookies. Changing it logs everyone out. |
| `ADMIN_USERNAME` | `shashwath71845` |
| `ADMIN_PASSWORD` | The admin login password (8+ characters). |
| `SCHOOL_INVITE_CODE` | The code students type to sign up. Pick a new one; `DPS71845` is public. |
| `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_D1_DATABASE_ID`, `CLOUDFLARE_API_TOKEN` | The database. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Photos, videos, backups. |
| `GEMINI_API_KEY` | Server-only Gemini key for AI Diary. |
| `ZEGO_SERVER_SECRET`, `NEXT_PUBLIC_ZEGO_APP_ID` | Voice/video calls (optional while calls are switched off). |
| `CRON_SECRET` | Random string used by the nightly cleanup job. |
| `MEDIA_STORAGE_LOCK_GB` | Upload limit for Cloudinary storage (default 20). |

**Don't add**: `NEXT_PUBLIC_ZEGO_SERVER_SECRET`, `NEXT_PUBLIC_GEMINI_API_KEY`, or any
`SUPABASE` variables. Anything starting with `NEXT_PUBLIC_` is sent to every browser.

Check a copy of your settings before deploying:

```bash
node scripts/check-production-env.mjs .env.vercel
```

## 2. Deploy

Netlify builds the branch you connected (usually `main`) on every push.
`netlify.toml` already sets the build command and the Next.js plugin.

## 3. What happens on first start

- Everyone is logged out once (the old cookie is no longer trusted).
- Students log in with their username. **The first password they type becomes
  their password.** Teachers and staff can't do this; set their passwords in
  Admin → Users → Account passwords.
- The app copies its shared data (notices, notes, groups, comments…) from the
  old backup into D1 on the first request. Nothing to do.

## 4. Smoke test (5 minutes)

1. Open the site logged out: the landing page loads.
2. Log in as admin at `/admin/login`.
3. Post a notice from Admin, refresh twice: it is still there.
4. Log in as a student on another browser, open Home, Chats and Notices.
5. Try a wrong password: you see "Incorrect username or password."

## 5. Nightly backup and cleanup (GitHub Actions, free)

`.github/workflows/nightly.yml` runs every night at 02:30 IST. It:

1. Saves the whole D1 database as a private, compressed file in Cloudinary
   (`dpsbuzz/backups/d1-YYYY-MM-DD.json.gz`), keeping the last 14 days.
2. Calls the site's cleanup job (expired stories, old chat photos).

Add these in GitHub → repository → Settings → Secrets and variables → Actions →
New repository secret:

`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_D1_DATABASE_ID`, `CLOUDFLARE_API_TOKEN`,
`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`,
`CRON_SECRET` (same value as on Netlify), and `SITE_URL` (your site address,
for example `https://dpsbuzz.netlify.app`, no trailing slash).

To run it right away: GitHub → Actions → "Nightly backup and cleanup" → Run workflow.
To back up from your computer instead: `node scripts/backup-d1.mjs`.

## 6. After the first deploy

1. **Copy the last Supabase rows into D1** (anything posted on the old site
   before it went down). Run once from the project folder; safe to repeat:
   ```bash
   node scripts/migrate_supabase_to_d1.mjs
   ```
   Then you can pause or delete the Supabase project.
2. **Delete the old public backup** on Cloudinary: Media Library → raw files →
   `dpsbuzz_store.json` (the new one is `dpsbuzz_store_private.json`).

## Running locally

```bash
npm install
npm run dev
```

Local development uses the same live D1 database, but the shared data store
uses separate `dev:` rows and never uploads the Cloudinary backup, so it can't
overwrite production data.
