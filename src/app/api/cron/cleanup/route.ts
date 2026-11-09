import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/db/d1Supabase';
import { deleteR2Object, deleteR2Objects } from '@/lib/r2';
import { pruneExpiredServerChatPhotos, pruneExpiredServerStories } from '@/lib/serverStore';
import { getSession, isAdmin } from '@/lib/auth/session';
import { runDatabaseBackup } from '@/lib/backup';

// The nightly backup reads every table; allow up to 60s.
export const maxDuration = 60;

const supabaseUrl = 'd1'; // data lives in Cloudflare D1
const supabaseKey = 'd1';

/**
 * Cleanup job endpoint for free schedulers (GitHub Actions, Vercel Cron, or Admin trigger)
 * 1. Purges story media 24 hours after expiry (48h total lifetime)
 * 2. Prunes chat photos older than 10 days (keeping posts permanent)
 * 3. Deletes post photos older than N months if retention is enabled
 * 4. Sweeps unlinked orphan files
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Only the scheduler (CRON_SECRET) or a logged-in admin may trigger cleanup.
    const viaSecret = Boolean(cronSecret) && authHeader === `Bearer ${cronSecret}`;
    if (!viaSecret && !isAdmin(getSession(req))) {
      return NextResponse.json({ success: false, error: 'Unauthorized cron trigger' }, { status: 401 });
    }

    const { action } = (await req.json().catch(() => ({}))) as { action?: string };

    const results: Record<string, any> = {
      timestamp: new Date().toISOString(),
      expiredStoriesCleaned: 0,
      chatMessagesPruned: 0,
      orphanFilesRemoved: 0,
      oldPhotosArchived: 0,
    };

    // 0. Nightly database backup (runs before any pruning)
    if (!action || action === 'all' || action === 'backup') {
      try {
        results.backup = await runDatabaseBackup();
      } catch (err) {
        results.backup = { error: err instanceof Error ? err.message : String(err) };
      }
    }

    // Specific maintenance actions or full daily sweep
    if (!action || action === 'all' || action === 'prune_chats') {
      // 10-day chat photo expiration policy
      const { prunedCount } = await pruneExpiredServerChatPhotos(10);
      results.chatMessagesPruned = prunedCount;

      // 30-day Supabase database message pruning (Keeps DB under 120MB)
      if (supabaseUrl && supabaseKey) {
        try {
          const sb = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
          const { count } = await sb.from('messages').delete({ count: 'exact' }).lt('created_at', thirtyDaysAgo);
          await sb.from('message_receipts').delete().lt('created_at', thirtyDaysAgo);
          results.supabaseMessagesPruned = count || 0;
        } catch (sbErr) {
          console.warn('Supabase cleanup warning:', sbErr);
        }
      }
    }

    if (!action || action === 'all' || action === 'expired_stories') {
      const expiredCount = await pruneExpiredServerStories();
      results.expiredStoriesCleaned = expiredCount;
    }

    return NextResponse.json({
      success: true,
      message: 'Automated cleanup sweep completed successfully.',
      details: results,
    });
  } catch (error: any) {
    console.error('Error during cleanup cron sweep:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Cleanup job failed' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // Support standard GET cron triggers from Vercel/Cloudflare
  return POST(req);
}
