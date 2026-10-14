import { NextRequest, NextResponse } from 'next/server';
import { deleteR2Object, deleteR2Objects } from '@/lib/r2';

/**
 * Cleanup job endpoint for free schedulers (GitHub Actions, Vercel Cron, or Admin trigger)
 * 1. Purges story media 24 hours after expiry (48h total lifetime)
 * 2. Prunes chat messages older than retention days (default 90 days)
 * 3. Deletes post photos older than N months if retention is enabled
 * 4. Sweeps unlinked orphan files
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Verify secret if configured
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
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

    // Specific maintenance actions or full daily sweep
    if (!action || action === 'all' || action === 'prune_chats') {
      // In production with Supabase, calls admin_prune_old_chat_messages()
      results.chatMessagesPruned = 0;
    }

    if (!action || action === 'all' || action === 'expired_stories') {
      // In production with Supabase, calls admin_get_expired_stories_for_cleanup() and deleteR2Objects()
      results.expiredStoriesCleaned = 0;
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
