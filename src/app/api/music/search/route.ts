// =====================================================
// DPS BUZZ - Multi-Provider Music Search API Route
// Provider 1: iTunes Search API (Official 30s audio previews for popular hits)
// Provider 2: Jamendo REST API (Legal Creative Commons full tracks with timeline trimmer)
// Provider 3: DPS Buzz School Library (Admin-uploaded school anthems & tracks)
// In-memory 10-minute cache to maximize speed and minimize network calls
// Audio streams directly from Apple CDN / Jamendo CDN to user phone (0 Vercel bandwidth)
// =====================================================

import { NextRequest, NextResponse, connection } from 'next/server';
import {
  MusicTrack,
  MusicBlockItem,
} from '@/lib/music/types';
import {
  POPULAR_ITUNES_TRACKS,
  CURATED_JAMENDO_TRACKS,
  DEFAULT_LIBRARY_TRACKS,
  normalizeITunesTrack,
  normalizeJamendoTrack,
  isTrackBlocked,
} from '@/lib/music/providers';

// 10-minute cache for music searches to strictly respect rate limits
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

/**
 * Searches iTunes Search API with timeout and kid-safe filtering
 */
async function fetchITunesTracks(term: string, limit: number): Promise<MusicTrack[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=${limit}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'DPSBuzz/1.0', Accept: 'application/json' },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) return [];
    const data = await res.json();
    const results = data.results || [];
    return results
      .map((item: any) => normalizeITunesTrack(item))
      .filter((t: MusicTrack | null): t is MusicTrack => t !== null);
  } catch (err) {
    console.warn('iTunes search fallback:', err);
    return [];
  }
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
  const providerFilter = searchParams.get('provider')?.toLowerCase().trim() || 'all'; // 'all' | 'itunes' | 'jamendo' | 'library'
  const limit = Math.min(parseInt(searchParams.get('limit') || '25', 10), 50);

  // 1. If requesting school library only
  if (category === 'library' || providerFilter === 'library') {
    const query = rawQuery.toLowerCase();
    const filteredLib = IN_MEMORY_LIBRARY_TRACKS.filter((t) => {
      if (isTrackBlocked(t, IN_MEMORY_BLOCKLIST)) return false;
      if (!query) return true;
      return t.title.toLowerCase().includes(query) || t.artist.toLowerCase().includes(query);
    });
    return NextResponse.json({ tracks: filteredLib, source: 'library' }, { status: 200 });
  }

  // 2. Check in-memory cache
  const cacheKey = `${providerFilter}:${category}:${rawQuery.toLowerCase()}:${limit}`;
  const cached = SEARCH_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    const safeCached = cached.tracks.filter((t) => !isTrackBlocked(t, IN_MEMORY_BLOCKLIST));
    return NextResponse.json({ tracks: safeCached, source: 'cache' }, { status: 200 });
  }

  // 3. If requesting iTunes only
  if (providerFilter === 'itunes') {
    let itunesResults: MusicTrack[] = [];
    if (rawQuery) {
      itunesResults = await fetchITunesTracks(rawQuery, limit);
    } else {
      itunesResults = [...POPULAR_ITUNES_TRACKS];
    }
    const safeITunes = itunesResults.filter((t) => !isTrackBlocked(t, IN_MEMORY_BLOCKLIST));
    SEARCH_CACHE.set(cacheKey, { tracks: safeITunes, timestamp: Date.now() });
    return NextResponse.json({ tracks: safeITunes, source: 'itunes' }, { status: 200 });
  }

  // 4. Default / Mixed Search (iTunes Trending Hits + Jamendo Full Songs + School Library)
  try {
    let combinedTracks: MusicTrack[] = [];

    if (rawQuery) {
      // Search iTunes for popular/Bollywood/Tollywood/Pop hits
      const itunesMatches = await fetchITunesTracks(rawQuery, Math.min(limit, 20));

      // Also search Jamendo if client ID configured
      let jamendoMatches: MusicTrack[] = [];
      const clientId = process.env.JAMENDO_CLIENT_ID;
      if (clientId) {
        try {
          const jamendoUrl = `https://api.jamendo.com/v3.0/tracks/?client_id=${encodeURIComponent(
            clientId
          )}&format=json&include=licenses&audioformat=mp32&limit=${Math.min(limit, 15)}&namesearch=${encodeURIComponent(rawQuery)}`;
          const jRes = await fetch(jamendoUrl, { headers: { 'User-Agent': 'DPSBuzz/1.0', Accept: 'application/json' } });
          if (jRes.ok) {
            const jData = await jRes.json();
            jamendoMatches = (jData.results || [])
              .map((r: any) => normalizeJamendoTrack(r))
              .filter((t: MusicTrack | null): t is MusicTrack => t !== null);
          }
        } catch {}
      } else {
        // Fallback matching curated Jamendo
        const q = rawQuery.toLowerCase();
        jamendoMatches = CURATED_JAMENDO_TRACKS.filter((t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q));
      }

      // Matching school library tracks
      const q = rawQuery.toLowerCase();
      const libMatches = IN_MEMORY_LIBRARY_TRACKS.filter((t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q));

      // Combine: iTunes hits first, then Jamendo full songs, then library
      combinedTracks = [...itunesMatches, ...jamendoMatches, ...libMatches];
    } else if (category === 'popular') {
      // Popular home tab: Popular iTunes 30s hits + Curated Jamendo full tracks + School Library
      combinedTracks = [
        ...POPULAR_ITUNES_TRACKS,
        ...CURATED_JAMENDO_TRACKS,
        ...IN_MEMORY_LIBRARY_TRACKS,
      ];
    } else if (category === 'study' || category === 'lofi') {
      combinedTracks = [
        ...CURATED_JAMENDO_TRACKS.filter((t) => t.genre?.toLowerCase().includes('lofi') || t.mood?.toLowerCase().includes('chill')),
        ...POPULAR_ITUNES_TRACKS.filter((t) => t.genre?.toLowerCase().includes('pop')),
      ];
    } else if (category === 'energetic' || category === 'sports') {
      combinedTracks = [
        ...POPULAR_ITUNES_TRACKS.filter((t) => t.mood === 'Energetic' || t.mood === 'Hyped' || t.mood === 'Heroic'),
        ...CURATED_JAMENDO_TRACKS.filter((t) => t.genre?.toLowerCase().includes('rock') || t.mood?.toLowerCase().includes('hyped')),
      ];
    } else {
      combinedTracks = [...POPULAR_ITUNES_TRACKS, ...CURATED_JAMENDO_TRACKS, ...IN_MEMORY_LIBRARY_TRACKS];
    }

    // Safety filter: exclude blocked tracks/artists
    const safeResults = combinedTracks.filter((t) => !isTrackBlocked(t, IN_MEMORY_BLOCKLIST));

    SEARCH_CACHE.set(cacheKey, { tracks: safeResults, timestamp: Date.now() });
    return NextResponse.json({ tracks: safeResults, source: 'network' }, { status: 200 });
  } catch (err: any) {
    console.warn('Music search error fallback:', err.message);
    const fallback = [...POPULAR_ITUNES_TRACKS, ...CURATED_JAMENDO_TRACKS, ...IN_MEMORY_LIBRARY_TRACKS];
    const safeFallback = fallback.filter((t) => !isTrackBlocked(t, IN_MEMORY_BLOCKLIST));
    return NextResponse.json({ tracks: safeFallback, source: 'fallback' }, { status: 200 });
  }
}
