# Deploying DPS Buzz to production

Follow these steps in order. Steps 1–3 happen before the new code goes live;
step 5 must happen after.

## 1. Set environment variables on Vercel

Project → Settings → Environment Variables (Production).

| Variable | What it is |
|---|---|
| `SESSION_SECRET` | Random string, 32+ characters. Signs login cookies. Changing it logs everyone out. |
| `ADMIN_USERNAME` | `shashwath71845` |
| `ADMIN_PASSWORD` | The admin login password (8+ characters). |
| `SCHOOL_INVITE_CODE` | The code students type to sign up. Pick a new one; `DPS71845` is public. |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` key. **Required.** |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Unchanged. |
| `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_D1_DATABASE_ID`, `CLOUDFLARE_API_TOKEN` | Unchanged. D1 now also stores passwords and the app's shared data. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Unchanged. |
| `GEMINI_API_KEY` | Server-only Gemini key for AI Diary. |
| `ZEGO_SERVER_SECRET`, `NEXT_PUBLIC_ZEGO_APP_ID` | Voice/video calls (optional while calls are switched off). |
| `CRON_SECRET` | Random string. Vercel sends it to the daily cleanup job. |

**Delete** these if they exist: `NEXT_PUBLIC_ZEGO_SERVER_SECRET`, `NEXT_PUBLIC_GEMINI_API_KEY`.
Anything starting with `NEXT_PUBLIC_` is sent to every browser.

Check your values before deploying:

```bash
vercel env pull .env.production.local
node scripts/check-production-env.mjs .env.production.local
```

## 2. Merge and deploy

Merge the `security/real-auth` pull request into `main`. Vercel builds and
deploys `main` automatically.

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

## 5. After the deploy works

1. **Lock down Supabase:** run `supabase/migrations/013_lock_down_public_key.sql`
   in the Supabase SQL editor. Only do this once the deployed site works with
   the `service_role` key, otherwise chats stop loading.
2. **Delete the old public backup** on Cloudinary: Media Library → raw files →
   `dpsbuzz_store.json` (the new one is `dpsbuzz_store_private.json`).

## Running locally

```bash
npm install
npm run dev
```

Local development reads and writes the same live databases, but the shared
data store uses separate `dev:` rows in D1 and never uploads the Cloudinary
backup, so it can't overwrite production data.
