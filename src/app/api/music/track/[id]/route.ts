// =====================================================
// DPS BUZZ - Single Track Lookup API Route
// Refreshes audio streaming URL when a story or post is shown
// Handles removed or blocked tracks gracefully
// =====================================================

import { NextRequest, NextResponse, connection } from 'next/server';
import {
  CURATED_JAMENDO_TRACKS,
  normalizeJamendoTrack,
  isTrackBlocked,
} from '@/lib/music/providers';
import {
  getInternalBlocklist,
  getInternalLibraryTracks,
  isMusicFeatureEnabled,
} from '@/app/api/music/search/route';
import { MusicTrack } from '@/lib/music/types';

// Short in-memory cache (5 minutes) for single track lookups
const TRACK_CACHE = new Map<string, { track: MusicTrack; timestamp: number }>();
const TRACK_CACHE_TTL_MS = 5 * 60 * 1000;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection();

  if (!isMusicFeatureEnabled()) {
    return NextResponse.json(
      { error: 'Music feature disabled by school admin', unavailable: true },
      { status: 200 }
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Missing track id' }, { status: 400 });
  }

  const blocklist = getInternalBlocklist();

  // Check in-memory library first
  const libraryTracks = getInternalLibraryTracks();
  const libTrack = libraryTracks.find((t) => t.id === id);
  if (libTrack) {
    if (isTrackBlocked(libTrack, blocklist)) {
      return NextResponse.json(
        { error: 'Track has been blocked by school admin', unavailable: true },
        { status: 200 }
      );
    }
    return NextResponse.json({ track: libTrack, source: 'library' }, { status: 200 });
  }

  // Check cache
  const cached = TRACK_CACHE.get(id);
  if (cached && Date.now() - cached.timestamp < TRACK_CACHE_TTL_MS) {
    if (isTrackBlocked(cached.track, blocklist)) {
      return NextResponse.json(
        { error: 'Track has been blocked by school admin', unavailable: true },
        { status: 200 }
      );
    }
    return NextResponse.json({ track: cached.track, source: 'cache' }, { status: 200 });
  }

  // Check curated tracks
  const curated = CURATED_JAMENDO_TRACKS.find((t) => t.id === id);
  if (curated) {
    if (isTrackBlocked(curated, blocklist)) {
      return NextResponse.json(
        { error: 'Track has been blocked by school admin', unavailable: true },
        { status: 200 }
      );
    }
    return NextResponse.json({ track: curated, source: 'curated' }, { status: 200 });
  }

  // If it's a Jamendo track, fetch from Jamendo API
  if (id.startsWith('jamendo:')) {
    const rawJamendoId = id.replace('jamendo:', '');
    const clientId = process.env.JAMENDO_CLIENT_ID;

    if (!clientId) {
      // Fallback: construct default Jamendo streaming track
      const constructedTrack: MusicTrack = {
        id,
        title: 'Jamendo Music Track',
        artist: 'Creative Commons Artist',
        duration: 180,
        coverImage: '/icons/icon-192.png',
        audioUrl: `https://mp3l.jamendo.com/?trackid=${rawJamendoId}&format=mp32&from=dpsbuzz`,
        provider: 'jamendo',
        license: 'CC BY 4.0',
        creditText: 'Music via Jamendo (Creative Commons)',
        sourcePageUrl: `https://www.jamendo.com/track/${rawJamendoId}`,
      };
      return NextResponse.json({ track: constructedTrack, source: 'fallback_constructed' }, { status: 200 });
    }

    try {
      const jamendoUrl = `https://api.jamendo.com/v3.0/tracks/?client_id=${encodeURIComponent(
        clientId
      )}&id=${encodeURIComponent(rawJamendoId)}&format=json&include=licenses&audioformat=mp32`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(jamendoUrl, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      if (res.ok) {
        const data = await res.json();
        const raw = data.results?.[0];
        if (raw) {
          const track = normalizeJamendoTrack(raw);
          if (track) {
            if (isTrackBlocked(track, blocklist)) {
              return NextResponse.json(
                { error: 'Track blocked by school', unavailable: true },
                { status: 200 }
              );
            }
            TRACK_CACHE.set(id, { track, timestamp: Date.now() });
            return NextResponse.json({ track, source: 'network' }, { status: 200 });
          }
        }
      }
    } catch (e) {
      console.warn('Failed to fetch track from Jamendo:', e);
    }
  }

  // If track not found or was removed from Jamendo
  return NextResponse.json(
    { error: 'Song no longer available', unavailable: true },
    { status: 200 }
  );
}
