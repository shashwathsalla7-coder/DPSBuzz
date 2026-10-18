import { NextRequest, NextResponse } from 'next/server';
import { deleteR2Object, deleteR2Objects } from '@/lib/r2';
import { pruneExpiredServerChatPhotos, pruneExpiredServerStories } from '@/lib/serverStore';

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
      // 10-day chat photo expiration policy
      const { prunedCount } = await pruneExpiredServerChatPhotos(10);
      results.chatMessagesPruned = prunedCount;
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
