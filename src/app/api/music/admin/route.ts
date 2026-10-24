// =====================================================
// DPS BUZZ - Music Admin API Route
// Only authorized school admins can manage library, blocklist, and kill-switch
// Requires confirmed rights for all uploaded audio
// =====================================================

import { NextRequest, NextResponse, connection } from 'next/server';
import {
  getInternalBlocklist,
  addToInternalBlocklist,
  removeFromInternalBlocklist,
  getInternalLibraryTracks,
  addInternalLibraryTrack,
  deleteInternalLibraryTrack,
  isMusicFeatureEnabled,
  setMusicFeatureEnabled,
} from '@/app/api/music/search/route';
import { getInternalReports, updateInternalReportStatus } from '@/app/api/music/report/route';
import { MusicTrack, MusicBlockItem } from '@/lib/music/types';

export async function GET(request: NextRequest) {
  await connection();
  const searchParams = request.nextUrl.searchParams;
  const authHeader = request.headers.get('authorization') || '';
  const isAdminParam = searchParams.get('isAdmin') === 'true';

  // Basic authorization check for admin access
  if (!isAdminParam && !authHeader.includes('admin')) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
  }

  return NextResponse.json(
    {
      featureEnabled: isMusicFeatureEnabled(),
      libraryTracks: getInternalLibraryTracks(),
      blocklist: getInternalBlocklist(),
      reports: getInternalReports(),
      stats: {
        totalLibraryTracks: getInternalLibraryTracks().length,
        totalBlocked: getInternalBlocklist().length,
        pendingReports: getInternalReports().filter((r) => r.status === 'pending').length,
      },
    },
    { status: 200 }
  );
}

export async function POST(request: NextRequest) {
  await connection();
  try {
    const body = await request.json();
    const { action, isAdmin } = body;

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    switch (action) {
      case 'toggle_feature': {
        const { enabled } = body;
        setMusicFeatureEnabled(Boolean(enabled));
        return NextResponse.json({ success: true, enabled: isMusicFeatureEnabled() });
      }

      case 'upload_track': {
        const { title, artist, audioUrl, coverImage, duration, genre, mood, licenseText, confirmedRights } = body;

        // Mandatory legal requirement
        if (!confirmedRights) {
          return NextResponse.json(
            { error: 'You must confirm that you hold the legal rights to distribute this track on DPS Buzz.' },
            { status: 400 }
          );
        }

        if (!title || !artist || !audioUrl) {
          return NextResponse.json({ error: 'Missing required title, artist, or audioUrl' }, { status: 400 });
        }

        const newTrack: MusicTrack = {
          id: `lib:track-${Date.now()}`,
          title: title.trim(),
          artist: artist.trim(),
          duration: Math.round(duration || 180),
          coverImage: coverImage || '/icons/icon-192.png',
          audioUrl: audioUrl.trim(),
          provider: 'library',
          license: licenseText?.trim() || 'DPS Buzz Internal School License (Royalty-Free)',
          creditText: `Music by ${artist.trim()} (School Royalty-Free)`,
          sourcePageUrl: '/admin',
          genre: genre || 'School Upload',
          mood: mood || 'Vibe',
          explicit: false,
        };

        addInternalLibraryTrack(newTrack);
        return NextResponse.json({ success: true, track: newTrack }, { status: 201 });
      }

      case 'delete_track': {
        const { id } = body;
        if (!id) return NextResponse.json({ error: 'Missing track id' }, { status: 400 });
        deleteInternalLibraryTrack(id);
        return NextResponse.json({ success: true, id });
      }

      case 'block_item': {
        const { type, identifier, reason } = body;
        if (!type || !identifier) {
          return NextResponse.json({ error: 'Missing type or identifier' }, { status: 400 });
        }

        const blockItem: MusicBlockItem = {
          id: `block-${Date.now()}`,
          type: type === 'artist' ? 'artist' : 'track',
          identifier: identifier.trim(),
          blockedBy: 'school_admin',
          createdAt: new Date().toISOString(),
          reason: reason || 'Blocked by school administrator',
        };

        addToInternalBlocklist(blockItem);
        return NextResponse.json({ success: true, item: blockItem });
      }

      case 'unblock_item': {
        const { identifier } = body;
        if (!identifier) return NextResponse.json({ error: 'Missing identifier' }, { status: 400 });
        removeFromInternalBlocklist(identifier);
        return NextResponse.json({ success: true, identifier });
      }

      case 'resolve_report': {
        const { reportId, status, blockNow } = body;
        if (!reportId) return NextResponse.json({ error: 'Missing reportId' }, { status: 400 });
        updateInternalReportStatus(reportId, status || 'resolved');

        if (blockNow) {
          const report = getInternalReports().find((r) => r.id === reportId);
          if (report) {
            addToInternalBlocklist({
              id: `block-${Date.now()}`,
              type: 'track',
              identifier: report.trackId,
              blockedBy: 'school_admin',
              createdAt: new Date().toISOString(),
              reason: `Blocked following report: ${report.reason}`,
            });
          }
        }
        return NextResponse.json({ success: true, reportId });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Admin action failed' }, { status: 500 });
  }
}
