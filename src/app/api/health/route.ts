import { NextResponse } from 'next/server';
import { d1QueryStrict, isD1Configured } from '@/lib/cloudflare/d1';

// Public status check for the hosting setup. Shows only whether each required
// setting is present (true/false), never any values.
export async function GET() {
  const has = (k: string) => Boolean(process.env[k] && process.env[k]!.trim().length > 0);
  const settings = {
    SESSION_SECRET: (process.env.SESSION_SECRET || '').length >= 32,
    ADMIN_PASSWORD: (process.env.ADMIN_PASSWORD || '').length >= 8,
    SCHOOL_INVITE_CODE: has('SCHOOL_INVITE_CODE'),
    CLOUDFLARE_ACCOUNT_ID: has('CLOUDFLARE_ACCOUNT_ID'),
    CLOUDFLARE_D1_DATABASE_ID: has('CLOUDFLARE_D1_DATABASE_ID'),
    CLOUDFLARE_API_TOKEN: has('CLOUDFLARE_API_TOKEN'),
    CLOUDINARY_CLOUD_NAME: has('CLOUDINARY_CLOUD_NAME'),
    CLOUDINARY_API_KEY: has('CLOUDINARY_API_KEY'),
    CLOUDINARY_API_SECRET: has('CLOUDINARY_API_SECRET'),
    GEMINI_API_KEY: has('GEMINI_API_KEY'),
    CRON_SECRET: has('CRON_SECRET'),
  };

  let database = 'not configured';
  if (isD1Configured()) {
    try {
      await d1QueryStrict('SELECT 1 AS ok;');
      database = 'ok';
    } catch {
      database = 'unreachable (check the Cloudflare settings)';
    }
  }

  const missing = Object.entries(settings).filter(([, ok]) => !ok).map(([k]) => k);
  return NextResponse.json(
    { ok: missing.length === 0 && database === 'ok', version: 'auth-v2', database, missing, settings },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
