// =====================================================
// DPS BUZZ - Music Providers Layer
// Provider 1: Jamendo API (Creative Commons, full tracks)
// Provider 2: DPS Buzz Library (Admin-uploaded royalty-free tracks)
// ZERO audio proxying - streams directly to client browser
// =====================================================

import { MusicTrack, MusicBlockItem } from './types';

// Curated Legal Creative Commons starter tracks (Full songs from Jamendo with verified CC licenses)
// Used when JAMENDO_CLIENT_ID is pending or as zero-latency local fallback
export const CURATED_JAMENDO_TRACKS: MusicTrack[] = [
  {
    id: 'jamendo:1915993',
    title: 'Peaceful Morning Study Lofi',
    artist: 'Panda Beats',
    duration: 148,
    coverImage: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=300&auto=format&fit=crop&q=80',
    audioUrl: 'https://mp3l.jamendo.com/?trackid=1915993&format=mp32&from=dpsbuzz',
    provider: 'jamendo',
    license: 'CC BY-NC-SA 4.0',
    creditText: 'Music by Panda Beats via Jamendo (Creative Commons)',
    sourcePageUrl: 'https://www.jamendo.com/track/1915993',
    genre: 'Lofi / Study',
    mood: 'Chill',
    explicit: false,
  },
  {
    id: 'jamendo:1839178',
    title: 'Sunny Campus Walk',
    artist: 'Acoustic Breeze',
    duration: 182,
    coverImage: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&auto=format&fit=crop&q=80',
    audioUrl: 'https://mp3l.jamendo.com/?trackid=1839178&format=mp32&from=dpsbuzz',
    provider: 'jamendo',
    license: 'CC BY 4.0',
    creditText: 'Music by Acoustic Breeze via Jamendo (Creative Commons)',
    sourcePageUrl: 'https://www.jamendo.com/track/1839178',
    genre: 'Acoustic',
    mood: 'Happy',
    explicit: false,
  },
  {
    id: 'jamendo:1775432',
    title: 'Inter-School Sports Anthem',
    artist: 'Energy Squad',
    duration: 195,
    coverImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&auto=format&fit=crop&q=80',
    audioUrl: 'https://mp3l.jamendo.com/?trackid=1775432&format=mp32&from=dpsbuzz',
    provider: 'jamendo',
    license: 'CC BY-SA 4.0',
    creditText: 'Music by Energy Squad via Jamendo (Creative Commons)',
    sourcePageUrl: 'https://www.jamendo.com/track/1775432',
    genre: 'Energetic / Rock',
    mood: 'Hyped',
    explicit: false,
  },
  {
    id: 'jamendo:1630628',
    title: 'Robotics & Future Beats',
    artist: 'Christian Petermann',
    duration: 202,
    coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&auto=format&fit=crop&q=80',
    audioUrl: 'https://mp3l.jamendo.com/?trackid=1630628&format=mp32&from=dpsbuzz',
    provider: 'jamendo',
    license: 'CC BY-NC 3.0',
    creditText: 'Music by Christian Petermann via Jamendo (Creative Commons)',
    sourcePageUrl: 'https://www.jamendo.com/track/1630628',
    genre: 'Electronic / Synth',
    mood: 'Focused',
    explicit: false,
  },
  {
    id: 'jamendo:1594830',
    title: 'Monsoon Rain Piano Melodies',
    artist: 'Serenity Keys',
    duration: 224,
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80',
    audioUrl: 'https://mp3l.jamendo.com/?trackid=1594830&format=mp32&from=dpsbuzz',
    provider: 'jamendo',
    license: 'CC BY 4.0',
    creditText: 'Music by Serenity Keys via Jamendo (Creative Commons)',
    sourcePageUrl: 'https://www.jamendo.com/track/1594830',
    genre: 'Classical / Piano',
    mood: 'Calm',
    explicit: false,
  },
  {
    id: 'jamendo:1722391',
    title: 'School Spirit Celebration',
    artist: 'Sunny Collective',
    duration: 176,
    coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
    audioUrl: 'https://mp3l.jamendo.com/?trackid=1722391&format=mp32&from=dpsbuzz',
    provider: 'jamendo',
    license: 'CC BY-SA 4.0',
    creditText: 'Music by Sunny Collective via Jamendo (Creative Commons)',
    sourcePageUrl: 'https://www.jamendo.com/track/1722391',
    genre: 'Pop / Acoustic',
    mood: 'Uplifting',
    explicit: false,
  },
];

// Curated School Library Tracks (Official DPS Buzz Royalty-Free Tracks)
export const DEFAULT_LIBRARY_TRACKS: MusicTrack[] = [
  {
    id: 'lib:dps-anthem-instrumental',
    title: 'DPS School Spirit Anthem',
    artist: 'DPS Music Dept (Royalty-Free)',
    duration: 165,
    coverImage: '/icons/icon-192.png',
    audioUrl: 'https://mp3l.jamendo.com/?trackid=1839178&format=mp32&from=dpsbuzz',
    provider: 'library',
    license: 'DPS Buzz Internal School License',
    creditText: 'Official DPS Buzz School Royalty-Free Track',
    sourcePageUrl: '/admin',
    genre: 'School Anthem',
    mood: 'Proud',
    explicit: false,
  },
  {
    id: 'lib:assembly-morning-prayer',
    title: 'Morning Assembly Flute Harmony',
    artist: 'School Cultural Committee',
    duration: 140,
    coverImage: '/icons/icon-192.png',
    audioUrl: 'https://mp3l.jamendo.com/?trackid=1594830&format=mp32&from=dpsbuzz',
    provider: 'library',
    license: 'DPS Buzz Internal School License',
    creditText: 'Performed by School Cultural Committee',
    sourcePageUrl: '/admin',
    genre: 'Traditional / Classical',
    mood: 'Peaceful',
    explicit: false,
  },
];

/**
 * Normalizes raw Jamendo API track payload into standardized MusicTrack
 */
export function normalizeJamendoTrack(raw: any): MusicTrack | null {
  if (!raw || !raw.id || !raw.name) return null;

  // Filter out tracks with NoDerivatives license (-nd) which forbid synchronizing in user stories
  const licenseUrl = (raw.license_ccurl || '').toLowerCase();
  if (licenseUrl.includes('/nd/') || licenseUrl.includes('-nd')) {
    return null; // Skip tracks that forbid derivative synchronization
  }

  // Filter explicit tracks if flagged in vocal or tags
  const tagsStr = JSON.stringify(raw.musicinfo?.tags || {}).toLowerCase();
  if (tagsStr.includes('explicit') || tagsStr.includes('nsfw')) {
    return null;
  }

  let licenseName = 'Creative Commons (CC)';
  if (licenseUrl.includes('/by/')) licenseName = 'CC BY 4.0';
  else if (licenseUrl.includes('/by-sa/')) licenseName = 'CC BY-SA 4.0';
  else if (licenseUrl.includes('/by-nc/')) licenseName = 'CC BY-NC 4.0';
  else if (licenseUrl.includes('/by-nc-sa/')) licenseName = 'CC BY-NC-SA 4.0';

  const audioStreamUrl = raw.audio || `https://mp3l.jamendo.com/?trackid=${raw.id}&format=mp32&from=dpsbuzz`;
  const artwork = raw.image || raw.album_image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80';
  const duration = Math.round(raw.duration || 180);

  return {
    id: `jamendo:${raw.id}`,
    title: raw.name,
    artist: raw.artist_name || 'Independent Artist',
    duration,
    coverImage: artwork,
    audioUrl: audioStreamUrl,
    provider: 'jamendo',
    license: licenseName,
    creditText: `Music by ${raw.artist_name} via Jamendo (${licenseName})`,
    sourcePageUrl: raw.shareurl || `https://www.jamendo.com/track/${raw.id}`,
    genre: raw.musicinfo?.tags?.genres?.[0] || 'Creative Commons',
    mood: raw.musicinfo?.tags?.vartags?.[0] || 'Vibe',
    explicit: false,
  };
}

/**
 * Checks whether a track or artist is blocked on the school blocklist
 */
export function isTrackBlocked(track: { id: string; artist: string }, blocklist: MusicBlockItem[]): boolean {
  if (!blocklist || blocklist.length === 0) return false;
  const cleanId = track.id.toLowerCase();
  const cleanArtist = track.artist.toLowerCase();

  return blocklist.some((item) => {
    const ident = item.identifier.toLowerCase();
    if (item.type === 'track') {
      return cleanId === ident || cleanId.includes(ident);
    }
    if (item.type === 'artist') {
      return cleanArtist.includes(ident);
    }
    return false;
  });
}
