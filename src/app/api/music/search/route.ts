// =====================================================
// DPS BUZZ - Music Search API Route
// Provider 1: Jamendo REST API (Legal Creative Commons full tracks)
// Provider 2: DPS Buzz Library (School admin royalty-free uploads)
// In-memory 10-minute cache to respect Jamendo's 35,000 requests/mo limit
// Audio streams directly from Jamendo/Storage to user phone (0 Vercel bandwidth)
// =====================================================

import { NextRequest, NextResponse, connection } from 'next/server';
import {
  MusicTrack,
  MusicBlockItem,
} from '@/lib/music/types';
import {
  CURATED_JAMENDO_TRACKS,
  DEFAULT_LIBRARY_TRACKS,
  normalizeJamendoTrack,
  isTrackBlocked,
} from '@/lib/music/providers';

// 10-minute cache for music searches to strictly respect Jamendo rate limits
interface CacheEntry {
  tracks: MusicTrack[];
  timestamp: number;
}
const SEARCH_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// In-memory blocklist & admin custom tracks storage (synced with Supabase when available)
let IN_MEMORY_BLOCKLIST: MusicBlockItem[] = [];
let IN_MEMORY_LIBRARY_TRACKS: MusicTrack[] = [...DEFAULT_LIBRARY_TRACKS];
let MUSIC_FEATURE_ENABLED = true;

export function getInternalBlocklist(): MusicBlockItem[] {
  return IN_MEMORY_BLOCKLIST;
}

export function addToInternalBlocklist(item: MusicBlockItem) {
  IN_MEMORY_BLOCKLIST = [item, ...IN_MEMORY_BLOCKLIST.filter((b) => b.identifier !== item.identifier)];
}

export function removeFromInternalBlocklist(identifier: string) {
  IN_MEMORY_BLOCKLIST = IN_MEMORY_BLOCKLIST.filter((b) => b.identifier !== identifier);
}

export function getInternalLibraryTracks(): MusicTrack[] {
  return IN_MEMORY_LIBRARY_TRACKS;
}

export function addInternalLibraryTrack(track: MusicTrack) {
  IN_MEMORY_LIBRARY_TRACKS = [track, ...IN_MEMORY_LIBRARY_TRACKS.filter((t) => t.id !== track.id)];
}

export function deleteInternalLibraryTrack(id: string) {
  IN_MEMORY_LIBRARY_TRACKS = IN_MEMORY_LIBRARY_TRACKS.filter((t) => t.id !== id);
}

export function isMusicFeatureEnabled(): boolean {
  return MUSIC_FEATURE_ENABLED;
}

export function setMusicFeatureEnabled(enabled: boolean) {
  MUSIC_FEATURE_ENABLED = enabled;
}

export async function GET(request: NextRequest) {
  await connection();

  if (!MUSIC_FEATURE_ENABLED) {
    return NextResponse.json(
      { tracks: [], message: 'Music feature is temporarily disabled by school admin', disabled: true },
      { status: 200 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const rawQuery = searchParams.get('q')?.trim() || '';
  const category = searchParams.get('category')?.toLowerCase().trim() || 'popular';
  const providerFilter = searchParams.get('provider')?.toLowerCase().trim() || 'all'; // 'all' | 'jamendo' | 'library'
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

  // If requesting school library only
  if (category === 'library' || providerFilter === 'library') {
    const query = rawQuery.toLowerCase();
    const filteredLib = IN_MEMORY_LIBRARY_TRACKS.filter((t) => {
      if (isTrackBlocked(t, IN_MEMORY_BLOCKLIST)) return false;
      if (!query) return true;
      return t.title.toLowerCase().includes(query) || t.artist.toLowerCase().includes(query);
    });
    return NextResponse.json({ tracks: filteredLib, source: 'library' }, { status: 200 });
  }

  const cacheKey = `${category}:${rawQuery.toLowerCase()}:${limit}`;
  const cached = SEARCH_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    // Filter out any newly blocked tracks even from cached entries
    const safeCached = cached.tracks.filter((t) => !isTrackBlocked(t, IN_MEMORY_BLOCKLIST));
    return NextResponse.json({ tracks: safeCached, source: 'cache' }, { status: 200 });
  }

  const clientId = process.env.JAMENDO_CLIENT_ID;

  // If JAMENDO_CLIENT_ID is not configured yet, serve high-quality curated Creative Commons tracks
  if (!clientId) {
    let results = [...CURATED_JAMENDO_TRACKS, ...IN_MEMORY_LIBRARY_TRACKS];

    if (rawQuery) {
      const q = rawQuery.toLowerCase();
      results = results.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.artist.toLowerCase().includes(q) ||
          t.genre?.toLowerCase().includes(q) ||
          t.mood?.toLowerCase().includes(q)
      );
    } else if (category === 'study' || category === 'lofi') {
      results = results.filter((t) => t.genre?.toLowerCase().includes('lofi') || t.mood?.toLowerCase().includes('chill'));
    } else if (category === 'energetic' || category === 'sports') {
      results = results.filter((t) => t.genre?.toLowerCase().includes('rock') || t.mood?.toLowerCase().includes('hyped'));
    }

    const safeResults = results.filter((t) => !isTrackBlocked(t, IN_MEMORY_BLOCKLIST));
    return NextResponse.json(
      {
        tracks: safeResults,
        source: 'curated_cc',
        notice: 'Using curated Creative Commons tracks. Register free JAMENDO_CLIENT_ID on developer.jamendo.com for full search.',
      },
      { status: 200 }
    );
  }

  try {
    let jamendoUrl = `https://api.jamendo.com/v3.0/tracks/?client_id=${encodeURIComponent(
      clientId
    )}&format=json&include=licenses&audioformat=mp32&limit=${limit}`;

    if (rawQuery) {
      jamendoUrl += `&namesearch=${encodeURIComponent(rawQuery)}`;
    } else if (category === 'popular') {
      jamendoUrl += `&order=popularity_total&boost=popularity_month`;
    } else if (category === 'study' || category === 'lofi') {
      jamendoUrl += `&tags=chillout+lofi&order=popularity_total`;
    } else if (category === 'energetic') {
      jamendoUrl += `&speed=fast&tags=electronic+rock&order=popularity_total`;
    } else if (category === 'acoustic') {
      jamendoUrl += `&acousticelectric=acoustic&tags=acoustic+pop&order=popularity_total`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2800);

    const res = await fetch(jamendoUrl, {
      headers: {
        'User-Agent': 'DPSBuzz-SchoolApp/1.0',
        Accept: 'application/json',
      },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!res.ok) {
      throw new Error(`Jamendo API HTTP error ${res.status}`);
    }

    const data = await res.json();
    const rawTracks = data.results || [];

    const normalizedTracks: MusicTrack[] = [];
    for (const raw of rawTracks) {
      const track = normalizeJamendoTrack(raw);
      if (track && !isTrackBlocked(track, IN_MEMORY_BLOCKLIST)) {
        normalizedTracks.push(track);
      }
    }

    // Include any matching DPS Buzz library tracks
    const matchingLib = IN_MEMORY_LIBRARY_TRACKS.filter((t) => {
      if (isTrackBlocked(t, IN_MEMORY_BLOCKLIST)) return false;
      if (!rawQuery) return true;
      return (
        t.title.toLowerCase().includes(rawQuery.toLowerCase()) ||
        t.artist.toLowerCase().includes(rawQuery.toLowerCase())
      );
    });

    const finalTracks = [...matchingLib, ...normalizedTracks];

    // Cache the response
    SEARCH_CACHE.set(cacheKey, { tracks: finalTracks, timestamp: Date.now() });

    return NextResponse.json({ tracks: finalTracks, source: 'network' }, { status: 200 });
  } catch (err: any) {
    console.warn('Jamendo API fetch failed or timed out, returning curated tracks:', err.message);

    // Immediate resilient fallback: return curated CC tracks + library tracks matching query
    let fallback = [...CURATED_JAMENDO_TRACKS, ...IN_MEMORY_LIBRARY_TRACKS];
    if (rawQuery) {
      const q = rawQuery.toLowerCase();
      fallback = fallback.filter((t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q));
    }

    const safeFallback = fallback.filter((t) => !isTrackBlocked(t, IN_MEMORY_BLOCKLIST));
    return NextResponse.json({ tracks: safeFallback, source: 'fallback_curated' }, { status: 200 });
  }
}
