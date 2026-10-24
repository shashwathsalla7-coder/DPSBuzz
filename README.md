# DPS Buzz — Dilsukhnagar Public School Student Network

DPS Buzz is a private social and notice board website built exclusively for the students of Dilsukhnagar Public School (classes 6–10, ages 11–16). It is designed to feel like a well-kept school notebook that happens to be alive — clear, calm, and school-specific.

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

## 2. Database & Deployment Checklist

Before deploying any new chat features or code changes that touch database models, ALWAYS follow this 3-step checklist:

1. **Apply Database Migrations FIRST**:
   - Go to your Supabase Project Dashboard -> **SQL Editor**.
   - Run the additive migration script (`supabase/migrations/007_...` or latest).
   - Verify table columns exist (`SELECT * FROM messages LIMIT 1;`) BEFORE code deployment.
2. **Run Local Verification**:
   - Run `node tests/test-ticks-and-typing.mjs` to confirm all 11 test flows pass.
   - Run `npm run build` to verify 0 TypeScript and build errors across all routes.
3. **Verify Deployment & Logs**:
   - Push to `main` to trigger hosting deployment.
   - Check real-time browser console & network tab for zero `403` or `PGRST204` errors.


---

## 2. School Invite Code & Verification

- **Default School Invite Code:** `DPS71845`
- Can be viewed and modified anytime in the Admin Console under `/admin` → **System & Wipe**.
- Student sign-up strictly validates the student's admission number and full name against page 1 of their physical school diary.

---

## 3. How to Wipe Test Data

To reset the application to a clean live launch state:
1. Log in to the Admin Console at `/admin/login` using the admin password (`admin123` or `admin`).
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

## 5. Deployment Guide (Vercel)

1. Push this repository to GitHub or GitLab.
2. In the Vercel dashboard, click **Add New Project** and select the repository.
3. Configure the environment variables (see `.env.example`).
4. Click **Deploy**. Next.js will build automatically with Turbopack support.
