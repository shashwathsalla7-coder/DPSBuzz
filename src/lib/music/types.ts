// =====================================================
// DPS BUZZ - Music System Core Types
// Standardized types for Jamendo & School Library providers
// Compliant with Creative Commons and Child Safety Rules
// =====================================================

export type MusicProviderType = 'jamendo' | 'library' | 'legacy';

export interface MusicTrack {
  id: string; // e.g. 'jamendo:1630628' or 'lib:track-1'
  title: string;
  artist: string;
  duration: number; // Full length in seconds (e.g. 210)
  coverImage: string; // Album artwork URL
  audioUrl: string; // Direct CDN audio streaming link (no proxying)
  provider: MusicProviderType;
  license: string; // e.g. 'CC BY-NC 4.0' or 'DPS School License'
  creditText: string; // Attribution text required by CC and school policy
  sourcePageUrl: string; // Direct link to track page on Jamendo or school library
  genre?: string;
  mood?: string;
  explicit?: boolean;
}

export interface MusicClipSelection {
  track: MusicTrack;
  startSeconds: number; // Start offset on the full timeline (e.g. 45s)
  lengthSeconds: number; // 15s or 30s
}

export interface MusicReport {
  id: string;
  trackId: string;
  trackTitle: string;
  trackArtist: string;
  reporterUsername: string;
  reason: string;
  createdAt: string;
  status: 'pending' | 'resolved' | 'dismissed';
}

export interface MusicBlockItem {
  id: string;
  type: 'track' | 'artist';
  identifier: string; // trackId or artistName
  blockedBy: string;
  createdAt: string;
  reason?: string;
}

export interface MusicAppSettings {
  enabled: boolean;
  allowJamendo: boolean;
  allowLibraryUploads: boolean;
}
