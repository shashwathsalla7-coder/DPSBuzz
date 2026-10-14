import { NextRequest, NextResponse, connection } from 'next/server';

export interface ITunesTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100?: string;
  artworkUrl60?: string;
  previewUrl?: string;
  trackTimeMillis?: number;
}

export const AAYA_SHER_TRACK = {
  id: '1882240655',
  title: 'Aaya Sher (From "The Paradise")',
  artist: 'Anirudh Ravichander, Jangi Reddy, Arjun Chandy',
  artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/9f/33/28/9f3328b5-d70d-7511-123c-1a096a317042/820200508461.jpg/200x200bb.jpg',
  previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/46/0d/df/460ddf71-f084-822e-1fe1-ea2ceb91cb7a/mzaf_5932094318792648449.plus.aac.p.m4a',
  durationSeconds: 287,
};

// In-memory cache with timestamp to guarantee sub-3 second responses (typically < 10ms)
const SEARCH_CACHE = new Map<string, { tracks: any[]; timestamp: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function GET(request: NextRequest) {
  await connection();
  const searchParams = request.nextUrl.searchParams;
  const rawQuery = searchParams.get('q')?.trim() || 'trending hits';
  const query = rawQuery.toLowerCase();
  const limit = Math.min(parseInt(searchParams.get('limit') || '25', 10), 50);

  // Check in-memory cache first
  const cacheKey = `${query}:${limit}`;
  const cached = SEARCH_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({ tracks: cached.tracks, source: 'cache' }, { status: 200 });
  }

  try {
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(
      rawQuery
    )}&media=music&entity=song&limit=${limit}`;

    // Abort controller with 2.4s timeout to guarantee under 3s response
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2400);

    const res = await fetch(itunesUrl, {
      headers: {
        'User-Agent': 'DPSBuzz/1.0',
        Accept: 'application/json',
      },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!res.ok) {
      throw new Error(`iTunes API returned ${res.status}`);
    }

    const data = await res.json();
    const results: ITunesTrack[] = data.results || [];

    let tracks = results
      .filter((item) => item.trackName && item.artistName && item.previewUrl)
      .map((item) => ({
        id: item.trackId.toString(),
        title: item.trackName,
        artist: item.artistName,
        artworkUrl:
          item.artworkUrl100?.replace('100x100bb.jpg', '200x200bb.jpg') ||
          item.artworkUrl60 ||
          '/icons/icon-192.png',
        previewUrl: item.previewUrl,
        durationSeconds: Math.round((item.trackTimeMillis || 30000) / 1000),
      }));

    // If query matches Aaya Sher or Anirudh or Trending, pin Aaya Sher at the top
    const isAayaSherRelated =
      query.includes('aaya') ||
      query.includes('sher') ||
      query.includes('paradise') ||
      query.includes('anirudh') ||
      query.includes('trending') ||
      query.includes('popular hits');

    if (isAayaSherRelated) {
      tracks = [AAYA_SHER_TRACK, ...tracks.filter((t) => t.id !== AAYA_SHER_TRACK.id)];
    }

    // Cache the result
    SEARCH_CACHE.set(cacheKey, { tracks, timestamp: Date.now() });

    return NextResponse.json({ tracks, source: 'network' }, { status: 200 });
  } catch (error) {
    console.error('Music search timed out or failed, falling back:', error);

    // Immediate fallback with Aaya Sher and standard hits
    const fallbackTracks = [
      AAYA_SHER_TRACK,
      {
        id: '1544494285',
        title: 'Master Coming (From "Master")',
        artist: 'Anirudh Ravichander',
        artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/9a/c0/81/9ac08173-0d5b-433b-85fa-7104b9015ebc/8902894358897_cover.jpg/200x200bb.jpg',
        previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/05/23/b0/0523b05f-7557-ca59-a2e0-f20387401c10/mzaf_6135805213601815316.plus.aac.p.m4a',
        durationSeconds: 230,
      },
      {
        id: '1576432420',
        title: 'Arabic Kuthu (From "Beast")',
        artist: 'Anirudh Ravichander & Jonita Gandhi',
        artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/64/59/94/645994f7-be75-d1ce-cb15-4ad9bf43ee9e/196589308103.jpg/200x200bb.jpg',
        previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview122/v4/a4/4f/44/a44f447a-6f09-b695-1f92-5eb36b44a2b9/mzaf_5980005706927429141.plus.aac.p.m4a',
        durationSeconds: 279,
      },
    ];

    return NextResponse.json({ tracks: fallbackTracks, source: 'fallback' }, { status: 200 });
  }
}
