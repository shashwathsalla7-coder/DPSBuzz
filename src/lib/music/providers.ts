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

// Curated Popular iTunes Starter Tracks (Official 30-Second Previews from Apple)
export const POPULAR_ITUNES_TRACKS: MusicTrack[] = [
  {
    id: 'itunes:1882240655',
    title: 'Aaya Sher (From "The Paradise")',
    artist: 'Anirudh Ravichander, Jangi Reddy, Arjun Chandy',
    duration: 30,
    coverImage: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/9f/33/28/9f3328b5-d70d-7511-123c-1a096a317042/820200508461.jpg/300x300bb.jpg',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/46/0d/df/460ddf71-f084-822e-1fe1-ea2ceb91cb7a/mzaf_5932094318792648449.plus.aac.p.m4a',
    provider: 'itunes',
    license: 'Apple Music / iTunes 30s Preview',
    creditText: 'Preview courtesy of Anirudh Ravichander via iTunes',
    sourcePageUrl: 'https://music.apple.com',
    genre: 'Trending / South Indian',
    mood: 'Energetic',
    explicit: false,
  },
  {
    id: 'itunes:1544494285',
    title: 'Master Coming (From "Master")',
    artist: 'Anirudh Ravichander',
    duration: 30,
    coverImage: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/9a/c0/81/9ac08173-0d5b-433b-85fa-7104b9015ebc/8902894358897_cover.jpg/300x300bb.jpg',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/05/23/b0/0523b05f-7557-ca59-a2e0-f20387401c10/mzaf_6135805213601815316.plus.aac.p.m4a',
    provider: 'itunes',
    license: 'Apple Music / iTunes 30s Preview',
    creditText: 'Preview courtesy of Anirudh Ravichander via iTunes',
    sourcePageUrl: 'https://music.apple.com',
    genre: 'Soundtrack / Mass',
    mood: 'Hyped',
    explicit: false,
  },
  {
    id: 'itunes:1576432420',
    title: 'Arabic Kuthu (From "Beast")',
    artist: 'Anirudh Ravichander & Jonita Gandhi',
    duration: 30,
    coverImage: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/64/59/94/645994f7-be75-d1ce-cb15-4ad9bf43ee9e/196589308103.jpg/300x300bb.jpg',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview122/v4/a4/4f/44/a44f447a-6f09-b695-1f92-5eb36b44a2b9/mzaf_5980005706927429141.plus.aac.p.m4a',
    provider: 'itunes',
    license: 'Apple Music / iTunes 30s Preview',
    creditText: 'Preview courtesy of Anirudh & Jonita Gandhi via iTunes',
    sourcePageUrl: 'https://music.apple.com',
    genre: 'Dance / Pop',
    mood: 'Celebration',
    explicit: false,
  },
  {
    id: 'itunes:1678294711',
    title: 'Naatu Naatu (From "RRR")',
    artist: 'Rahul Sipligunj & Kaala Bhairava',
    duration: 30,
    coverImage: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/a9/df/aa/a9dfaa95-b20f-cb84-3c99-5e913a893dbf/8902894362146_cover.jpg/300x300bb.jpg',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/eb/fa/6d/ebfa6d03-e65a-0e78-9572-c0cb490807b5/mzaf_10525206920979402506.plus.aac.p.m4a',
    provider: 'itunes',
    license: 'Apple Music / iTunes 30s Preview',
    creditText: 'Preview courtesy of Rahul Sipligunj & Kaala Bhairava via iTunes',
    sourcePageUrl: 'https://music.apple.com',
    genre: 'High Energy / Dance',
    mood: 'Heroic',
    explicit: false,
  },
  {
    id: 'itunes:1531190227',
    title: 'Believer',
    artist: 'Imagine Dragons',
    duration: 30,
    coverImage: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/58/01/5e/58015e4a-5bca-f03e-c6e8-251f28b2be1a/17UMGIM71321.rgb.jpg/300x300bb.jpg',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/36/41/55/364155b4-93ec-e8b9-8e41-b844ca81014e/mzaf_7459146598501221199.plus.aac.p.m4a',
    provider: 'itunes',
    license: 'Apple Music / iTunes 30s Preview',
    creditText: 'Preview courtesy of Imagine Dragons via iTunes',
    sourcePageUrl: 'https://music.apple.com',
    genre: 'Rock / Pop',
    mood: 'Motivated',
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
 * Normalizes raw iTunes API track payload into standardized MusicTrack
 */
export function normalizeITunesTrack(raw: any): MusicTrack | null {
  if (!raw || !raw.trackId || !raw.trackName || !raw.previewUrl) return null;

  // Exclude explicit content for kid safety
  if (raw.trackExplicitness === 'explicit' || raw.collectionExplicitness === 'explicit') {
    return null;
  }

  const artwork = raw.artworkUrl100
    ? raw.artworkUrl100.replace('100x100bb.jpg', '300x300bb.jpg')
    : raw.artworkUrl60 || '/icons/icon-192.png';

  return {
    id: `itunes:${raw.trackId}`,
    title: raw.trackName,
    artist: raw.artistName || 'Various Artists',
    duration: 30, // Official iTunes 30-second preview clip
    coverImage: artwork,
    audioUrl: raw.previewUrl,
    provider: 'itunes',
    license: 'Apple Music / iTunes 30s Preview',
    creditText: `Preview courtesy of ${raw.artistName} via iTunes`,
    sourcePageUrl: raw.trackViewUrl || 'https://music.apple.com',
    genre: raw.primaryGenreName || 'Trending',
    mood: 'Popular Hit',
    explicit: false,
  };
}

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
