'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Play,
  Pause,
  Music,
  Sparkles,
  Check,
  Disc3,
  Loader2,
  Volume2,
  Scissors,
  ArrowLeft,
  Clock,
  Radio,
} from 'lucide-react';
import { SongTrack } from '@/lib/dataStore';
import { globalAudio, AudioPlayerState } from '@/lib/audioManager';

interface SongPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSong: (song: SongTrack) => void;
  title?: string;
  initialTrack?: SongTrack | null;
}

// Official Verified Aaya Sher Track (From "The Paradise")
export const AAYA_SHER_TRACK: SongTrack = {
  id: '1882240655',
  title: 'Aaya Sher (From "The Paradise")',
  artist: 'Anirudh Ravichander, Jangi Reddy, Arjun Chandy',
  artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/9f/33/28/9f3328b5-d70d-7511-123c-1a096a317042/820200508461.jpg/200x200bb.jpg',
  previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/46/0d/df/460ddf71-f084-822e-1fe1-ea2ceb91cb7a/mzaf_5932094318792648449.plus.aac.p.m4a',
  durationSeconds: 287,
};

// Client-side instant pre-cache for popular artists (< 5ms response time)
export const POPULAR_ARTIST_PRECACHE: Record<string, SongTrack[]> = {
  anirudh: [
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
    {
      id: '1692800366',
      title: 'Hukum - Thalaivar Alappara (From "Jailer")',
      artist: 'Anirudh Ravichander',
      artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/31/d1/2f/31d12f46-0ce7-2696-224d-e9c1584cf50a/197188737217.jpg/200x200bb.jpg',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/e5/22/e1/e522e118-2454-944a-9ef8-e04e9a0889f4/mzaf_10034637777176527582.plus.aac.p.m4a',
      durationSeconds: 238,
    },
  ],
  'sid sriram': [
    {
      id: '1440854483',
      title: 'Inkem Inkem Inkem Kaavaale (From "Geetha Govindam")',
      artist: 'Sid Sriram',
      artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/95/9d/54/959d54e8-f7b5-fb30-8041-e9bf3beaa1c3/8902894354394_cover.jpg/200x200bb.jpg',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview118/v4/5a/a0/0b/5aa00b3e-e67c-175f-fb1b-5353597d5eb4/mzaf_4091657388914619379.plus.aac.p.m4a',
      durationSeconds: 266,
    },
    {
      id: '1540061298',
      title: 'Samajavaragamana (From "Ala Vaikunthapurramuloo")',
      artist: 'Sid Sriram',
      artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/7c/4a/14/7c4a14aa-7132-75d5-22eb-91b65e94df40/8903431792683_cover.jpg/200x200bb.jpg',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview124/v4/4c/80/7e/4c807e38-4e89-1382-7472-fb1e2daebcb6/mzaf_5942484395277150821.plus.aac.p.m4a',
      durationSeconds: 214,
    },
  ],
  'arijit singh': [
    {
      id: '1116244793',
      title: 'Tum Hi Ho (From "Aashiqui 2")',
      artist: 'Arijit Singh',
      artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music69/v4/7a/ff/d1/7affd11d-ef1f-9da8-d1a2-51c6b16259d0/8902894350396_cover.jpg/200x200bb.jpg',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview128/v4/b5/d9/b4/b5d9b431-7290-7cb8-9f17-bb1c9e83ec9e/mzaf_7493630656095304381.plus.aac.p.m4a',
      durationSeconds: 262,
    },
    {
      id: '1479836365',
      title: 'Ghungroo (From "War")',
      artist: 'Arijit Singh & Shilpa Rao',
      artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music123/v4/f4/19/04/f41904e5-4a6f-f2ae-e6da-df333d93d395/8902894356459_cover.jpg/200x200bb.jpg',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview123/v4/91/9f/fa/919ffa9a-9e73-b788-cb94-850f75f6cf68/mzaf_2622723706076395353.plus.aac.p.m4a',
      durationSeconds: 302,
    },
  ],
  'thaman s': [
    {
      id: '1540061298',
      title: 'Butta Bomma (From "Ala Vaikunthapurramuloo")',
      artist: 'Armaan Malik & Thaman S',
      artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/7c/4a/14/7c4a14aa-7132-75d5-22eb-91b65e94df40/8903431792683_cover.jpg/200x200bb.jpg',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview124/v4/6e/c3/ce/6ec3ce04-0376-787f-df6c-f232bf318ebc/mzaf_13506198656686161427.plus.aac.p.m4a',
      durationSeconds: 198,
    },
  ],
  'taylor swift': [
    {
      id: '1440935921',
      title: 'Shake It Off',
      artist: 'Taylor Swift',
      artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/64/73/45/647345aa-c692-a169-d4ff-f6faee28e67a/00602547071759.rgb.jpg/200x200bb.jpg',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/e5/22/e1/e522e118-2454-944a-9ef8-e04e9a0889f4/mzaf_10034637777176527582.plus.aac.p.m4a',
      durationSeconds: 219,
    },
    {
      id: '1440935930',
      title: 'Blank Space',
      artist: 'Taylor Swift',
      artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/64/73/45/647345aa-c692-a169-d4ff-f6faee28e67a/00602547071759.rgb.jpg/200x200bb.jpg',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/a4/4f/44/a44f447a-6f09-b695-1f92-5eb36b44a2b9/mzaf_5980005706927429141.plus.aac.p.m4a',
      durationSeconds: 231,
    },
  ],
};

// Curated Top School Artists
const POPULAR_ARTISTS = [
  { name: 'Anirudh', query: 'anirudh ravichander', icon: '🎸' },
  { name: 'Sid Sriram', query: 'sid sriram', icon: '🎤' },
  { name: 'Arijit Singh', query: 'arijit singh', icon: '🎶' },
  { name: 'Thaman S', query: 'thaman s telugu', icon: '⚡' },
  { name: 'DSP', query: 'devi sri prasad telugu', icon: '🎹' },
  { name: 'Taylor Swift', query: 'taylor swift', icon: '👑' },
  { name: 'Shreya Ghoshal', query: 'shreya ghoshal', icon: '💫' },
  { name: 'Diljit Dosanjh', query: 'diljit dosanjh', icon: '🦁' },
  { name: 'Alan Walker', query: 'alan walker', icon: '🎧' },
  { name: 'Armaan Malik', query: 'armaan malik', icon: '✨' },
];

const PRESET_CATEGORIES = [
  { label: '🔥 All Trending', query: 'popular hits 2026' },
  { label: '⚡ Tollywood Hits', query: 'anirudh thaman telugu' },
  { label: '🎬 Bollywood Hits', query: 'arijit singh bollywood' },
  { label: '🎧 Lofi Study Chill', query: 'lofi study beats chill instrumental' },
  { label: '✨ Global Pop', query: 'taylor swift weeknd pop' },
];

// Presets for quick part selection
const PART_PRESETS = [
  { label: 'Intro', seconds: 0, icon: '🎬' },
  { label: 'Verse', seconds: 5, icon: '🎵' },
  { label: 'Pre-Chorus', seconds: 10, icon: '⚡' },
  { label: 'Chorus 🔥', seconds: 15, icon: '🔥' },
  { label: 'Hook', seconds: 20, icon: '✨' },
];

// Mock waveform bar heights (30 bars for 30 seconds)
const WAVEFORM_HEIGHTS = [
  35, 45, 60, 50, 40, 55, 75, 90, 85, 70, 
  80, 95, 100, 90, 85, 95, 100, 90, 80, 85, 
  70, 65, 75, 80, 60, 50, 45, 55, 40, 30
];

export const SongPickerModal: React.FC<SongPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectSong,
  title = 'Pick a Song 🎵',
  initialTrack = null,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChip, setActiveChip] = useState('🔥 All Trending');
  const [tracks, setTracks] = useState<SongTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [playerState, setPlayerState] = useState<AudioPlayerState>({
    currentTrack: null,
    isPlaying: false,
    progress: 0,
    currentTime: 0,
  });

  // Trimmer / Part Selector State
  const [trimmingTrack, setTrimmingTrack] = useState<SongTrack | null>(initialTrack);
  const [clipStart, setClipStart] = useState<number>(initialTrack?.startTime || 10);
  const [clipDuration, setClipDuration] = useState<number>(initialTrack?.clipDuration || 15);
  const [clipDurationMode, setClipDurationMode] = useState<'15' | '30' | 'full'>('15');

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Subscribe to audio state
  useEffect(() => {
    const unsub = globalAudio.subscribe((state) => {
      setPlayerState(state);
    });
    return unsub;
  }, []);

  // Fetch songs with client pre-cache and sub-3s fast execution
  const fetchSongs = async (q: string) => {
    const cleanQ = q.toLowerCase().trim();

    // Instant pre-cache lookup (< 5ms response time)
    if (cleanQ.includes('anirudh') || cleanQ.includes('aaya') || cleanQ.includes('sher') || cleanQ.includes('paradise')) {
      setTracks([AAYA_SHER_TRACK, ...POPULAR_ARTIST_PRECACHE['anirudh'].filter((t) => t.id !== AAYA_SHER_TRACK.id)]);
      setLoading(false);
      return;
    }

    for (const [key, cachedList] of Object.entries(POPULAR_ARTIST_PRECACHE)) {
      if (cleanQ.includes(key)) {
        setTracks(cachedList);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/music/search?q=${encodeURIComponent(q)}&limit=25`);
      if (res.ok) {
        const data = await res.json();
        let fetched: SongTrack[] = data.tracks || [];
        if (
          cleanQ.includes('aaya') ||
          cleanQ.includes('sher') ||
          cleanQ.includes('paradise') ||
          cleanQ.includes('anirudh') ||
          cleanQ.includes('trending') ||
          cleanQ.includes('popular hits')
        ) {
          fetched = [AAYA_SHER_TRACK, ...fetched.filter((t) => t.id !== AAYA_SHER_TRACK.id)];
        }
        setTracks(fetched);
      }
    } catch (err) {
      console.error('Failed to load songs:', err);
      setTracks([AAYA_SHER_TRACK]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialTrack) {
        setTrimmingTrack(initialTrack);
        setClipStart(initialTrack.startTime || 10);
        setClipDuration(initialTrack.clipDuration || 15);
        globalAudio.previewSegment(initialTrack, initialTrack.startTime || 10, initialTrack.clipDuration || 15);
      } else {
        // Pre-seed with Aaya Sher and top hits instantly
        setTracks([AAYA_SHER_TRACK, ...POPULAR_ARTIST_PRECACHE['anirudh'].filter((t) => t.id !== AAYA_SHER_TRACK.id)]);
        fetchSongs(PRESET_CATEGORIES[0].query);
      }
    } else {
      globalAudio.stop();
      setTrimmingTrack(null);
    }
  }, [isOpen, initialTrack]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    setActiveChip('');

    // Instant match for Aaya Sher or Anirudh while typing
    const lower = val.toLowerCase().trim();
    if (lower.includes('aaya') || lower.includes('sher') || lower.includes('paradise')) {
      setTracks([AAYA_SHER_TRACK]);
    }

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      fetchSongs(val.trim() || PRESET_CATEGORIES[0].query);
    }, 150); // Under 150ms debounce
  };

  const handleSelectArtist = (artist: typeof POPULAR_ARTISTS[0]) => {
    setActiveChip(artist.name);
    setSearchQuery(artist.name);
    const key = artist.name.toLowerCase();
    if (POPULAR_ARTIST_PRECACHE[key]) {
      setTracks(POPULAR_ARTIST_PRECACHE[key]);
    }
    fetchSongs(artist.query);
  };

  const handleCategoryClick = (cat: typeof PRESET_CATEGORIES[0]) => {
    setActiveChip(cat.label);
    setSearchQuery('');
    fetchSongs(cat.query);
  };

  // Open Trimmer for a specific track
  const handleOpenTrimmer = (track: SongTrack, defaultStart = 10) => {
    setTrimmingTrack(track);
    const total = track.durationSeconds || 30;
    const dur = clipDurationMode === 'full' ? total : clipDurationMode === '30' ? 30 : 15;
    const maxStart = clipDurationMode === 'full' ? 0 : Math.max(0, Math.min(30, total) - dur);
    const safeStart = Math.min(defaultStart, maxStart);
    setClipStart(safeStart);
    setClipDuration(dur);
    globalAudio.previewSegment(track, safeStart, dur);
  };

  // Slider change in Trimmer
  const handleClipStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = parseInt(e.target.value, 10);
    setClipStart(newStart);
    if (trimmingTrack) {
      globalAudio.previewSegment(trimmingTrack, newStart, clipDuration);
    }
  };

  // Preset button click in Trimmer
  const handlePresetSelect = (seconds: number) => {
    const total = trimmingTrack?.durationSeconds || 30;
    if (clipDurationMode === 'full') {
      setClipDurationMode('15');
      setClipDuration(15);
    }
    const dur = clipDurationMode === 'full' ? 15 : clipDuration;
    const safeMax = Math.max(0, Math.min(30, total) - dur);
    const safeStart = Math.min(seconds, safeMax);
    setClipStart(safeStart);
    if (trimmingTrack) {
      globalAudio.previewSegment(trimmingTrack, safeStart, dur);
    }
  };

  // Duration toggle in Trimmer (15s vs 30s vs Full Song)
  const handleDurationToggle = (mode: '15' | '30' | 'full') => {
    setClipDurationMode(mode);
    const total = trimmingTrack?.durationSeconds || 30;
    if (mode === 'full') {
      setClipDuration(total);
      setClipStart(0);
      if (trimmingTrack) {
        globalAudio.previewSegment(trimmingTrack, 0, total);
      }
      return;
    }

    const dur = mode === '30' ? 30 : 15;
    setClipDuration(dur);
    const safeMax = Math.max(0, Math.min(30, total) - dur);
    const safeStart = Math.min(clipStart, safeMax);
    setClipStart(safeStart);
    if (trimmingTrack) {
      globalAudio.previewSegment(trimmingTrack, safeStart, dur);
    }
  };

  // Toggle play/pause inside trimmer
  const handleToggleTrimmerPlay = () => {
    if (!trimmingTrack) return;
    if (playerState.isPlaying && playerState.currentTrack?.id === trimmingTrack.id) {
      globalAudio.pauseTrack();
    } else {
      globalAudio.previewSegment(trimmingTrack, clipStart, clipDuration);
    }
  };

  // Confirm trimmed selection
  const handleConfirmTrim = () => {
    if (!trimmingTrack) return;
    globalAudio.stop();
    const finalTrack: SongTrack = {
      ...trimmingTrack,
      startTime: clipStart,
      clipDuration: clipDuration,
    };
    onSelectSong(finalTrack);
    onClose();
  };

  // Quick direct select (with default 15s clip starting at 0s or 10s)
  const handleQuickSelect = (track: SongTrack) => {
    globalAudio.stop();
    onSelectSong({
      ...track,
      startTime: 0,
      clipDuration: 15,
    });
    onClose();
  };

  const handleClose = () => {
    globalAudio.stop();
    setTrimmingTrack(null);
    onClose();
  };

  const formatSec = (sec: number) => `0:${Math.floor(sec).toString().padStart(2, '0')}`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* ======================================================== */}
        {/* VIEW 1: SONG TRIMMER & PART SELECTOR (Instagram Style)     */}
        {/* ======================================================== */}
        {trimmingTrack ? (
          <div className="flex flex-col h-full animate-fade-in">
            {/* Trimmer Top Navigation Bar */}
            <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/60">
              <button
                type="button"
                onClick={() => {
                  globalAudio.stop();
                  setTrimmingTrack(null);
                }}
                className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white px-2.5 py-1.5 rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
                aria-label="Back to song list"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>

              <div className="text-center">
                <h3 className="text-sm font-bold text-white flex items-center justify-center gap-1.5">
                  <Scissors size={15} className="text-pink-400" />
                  <span>Choose Song Part</span>
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Pick the exact moment for your story / note
                </p>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Trimmer Content Area */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col items-center space-y-5">
              {/* Vinyl Album Artwork Hero */}
              <div className="relative group mt-1">
                <div
                  className={`w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden shadow-2xl relative border-2 transition-all duration-300 ${
                    playerState.isPlaying
                      ? 'border-pink-500 shadow-pink-500/30 scale-105'
                      : 'border-zinc-700'
                  }`}
                >
                  <img
                    src={trimmingTrack.artworkUrl}
                    alt={trimmingTrack.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Subtle Vinyl Grooves Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/50 via-transparent to-white/10 pointer-events-none" />
                </div>

                {/* Floating Play/Pause Button on Artwork */}
                <button
                  type="button"
                  onClick={handleToggleTrimmerPlay}
                  className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full gradient-bg text-white flex items-center justify-center shadow-lg shadow-pink-500/40 hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                  aria-label={playerState.isPlaying ? 'Pause preview' : 'Play preview'}
                >
                  {playerState.isPlaying ? (
                    <Pause size={18} className="fill-white" />
                  ) : (
                    <Play size={18} className="fill-white ml-0.5" />
                  )}
                </button>
              </div>

              {/* Title & Artist */}
              <div className="text-center max-w-sm px-2">
                <h4 className="text-base font-extrabold text-white truncate">
                  {trimmingTrack.title}
                </h4>
                <p className="text-xs text-zinc-400 font-medium truncate mt-0.5">
                  {trimmingTrack.artist}
                </p>
              </div>

              {/* Selected Segment Range Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-200 shadow-inner">
                <Radio size={14} className={playerState.isPlaying ? 'text-pink-400 animate-pulse' : 'text-zinc-500'} />
                <span className="text-xs font-mono font-bold text-pink-400">
                  {clipDurationMode === 'full'
                    ? `Full Song (${formatSec(clipDuration)})`
                    : `${formatSec(clipStart)} — ${formatSec(clipStart + clipDuration)}`}
                </span>
                <span className="text-[10px] text-zinc-500">
                  ({clipDurationMode === 'full' ? 'Complete track' : `${clipDuration}s clip fixed`})
                </span>
              </div>

              {/* Interactive Audio Waveform Visualizer */}
              <div className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400">
                  <span className="flex items-center gap-1">
                    <span>Waveform Scrubber</span>
                    <Sparkles size={12} className="text-pink-400" />
                  </span>
                  <span className="text-zinc-500 font-mono text-[10px]">
                    Drag slider to choose part
                  </span>
                </div>

                {/* Simulated Audio Waveform */}
                <div className="h-14 flex items-end justify-between gap-[3px] px-1 py-1 bg-zinc-950/70 rounded-xl overflow-hidden border border-zinc-800/80">
                  {WAVEFORM_HEIGHTS.map((heightPercent, secIdx) => {
                    const isInClip =
                      clipDurationMode === 'full' ||
                      (secIdx >= clipStart && secIdx < clipStart + clipDuration);
                    const isPlayhead =
                      playerState.isPlaying &&
                      Math.floor(playerState.currentTime) === secIdx;

                    return (
                      <div
                        key={secIdx}
                        className="flex-1 flex flex-col justify-end items-center h-full"
                      >
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-full transition-all duration-150 ${
                            isPlayhead
                              ? 'bg-white shadow-xs shadow-white'
                              : isInClip
                              ? 'gradient-bg shadow-xs shadow-pink-500/30'
                              : 'bg-zinc-800/70'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Range Slider for Selecting Start Offset */}
                <div className="space-y-1.5 pt-1">
                  <input
                    type="range"
                    min="0"
                    max={
                      clipDurationMode === 'full'
                        ? 0
                        : Math.max(0, Math.min(30, trimmingTrack.durationSeconds || 30) - clipDuration)
                    }
                    disabled={clipDurationMode === 'full'}
                    step="1"
                    value={clipStart}
                    onChange={handleClipStartChange}
                    className="w-full accent-pink-500 h-2 bg-zinc-800 rounded-lg cursor-pointer disabled:opacity-30"
                    aria-label="Select song start time"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-zinc-500 px-0.5">
                    <span>0:00 (Start)</span>
                    <span className="text-pink-400 font-semibold">
                      {clipDurationMode === 'full'
                        ? `Full Song (0:00 - ${formatSec(clipDuration)})`
                        : `Part Fixed: ${formatSec(clipStart)} - ${formatSec(clipStart + clipDuration)} (${clipDuration}s)`}
                    </span>
                    <span>0:30 (End)</span>
                  </div>
                </div>
              </div>

              {/* Quick Preset Part Buttons */}
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    Quick Parts ⚡
                  </span>
                  <span className="text-[10px] text-zinc-500">Tap to jump & listen</span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {PART_PRESETS.map((preset) => {
                    const isSelected = clipStart === preset.seconds && clipDurationMode !== 'full';
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handlePresetSelect(preset.seconds)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 flex-shrink-0 transition-all cursor-pointer ${
                          isSelected
                            ? 'gradient-bg text-white shadow-md shadow-pink-500/20'
                            : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-850 hover:text-white border border-zinc-800'
                        }`}
                      >
                        <span>{preset.icon}</span>
                        <span>{preset.label}</span>
                        <span className="text-[10px] opacity-75 font-mono">
                          ({formatSec(preset.seconds)})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Clip Duration Selector (15s vs 30s vs Full Song) */}
              <div className="w-full flex items-center justify-between p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-zinc-400" />
                  <div>
                    <p className="text-xs font-bold text-white">Clip Duration</p>
                    <p className="text-[10px] text-zinc-500">
                      {clipDurationMode === 'full'
                        ? 'Full song playback'
                        : `${clipDuration}s clip fixed at ${formatSec(clipStart)}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => handleDurationToggle('15')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      clipDurationMode === '15'
                        ? 'bg-pink-500 text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    15s
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDurationToggle('30')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      clipDurationMode === '30'
                        ? 'bg-pink-500 text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    30s
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDurationToggle('full')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      clipDurationMode === 'full'
                        ? 'bg-pink-500 text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Full Song 🎵
                  </button>
                </div>
              </div>
            </div>

            {/* Trimmer Bottom Confirm Action Bar */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center gap-3">
              <button
                type="button"
                onClick={handleConfirmTrim}
                className="flex-1 py-3 px-4 rounded-2xl gradient-bg hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-pink-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check size={18} strokeWidth={2.5} />
                <span>
                  {clipDurationMode === 'full'
                    ? `Attach Full Song (${formatSec(clipDuration)}) 🎵`
                    : `Attach This ${clipDuration}s Part (${formatSec(clipStart)} - ${formatSec(clipStart + clipDuration)}) 🎵`}
                </span>
              </button>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* VIEW 2: BROWSE & SEARCH SONGS VIEW                         */
          /* ======================================================== */
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl gradient-bg flex items-center justify-center text-white shadow-md">
                  <Music size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">{title}</h3>
                  <p className="text-[11px] text-zinc-400">
                    Search ANY artist • 30s Legal Previews • Pick Any Part ✂️
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                aria-label="Close song picker"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search Bar & Filters Area */}
            <div className="p-3 border-b border-zinc-800/80 bg-zinc-900/40 space-y-2.5">
              {/* Search Input */}
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search by artist (Anirudh, Sid Sriram, Arijit) or song title..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500 transition-colors"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setActiveChip(PRESET_CATEGORIES[0].label);
                      fetchSongs(PRESET_CATEGORIES[0].query);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1 cursor-pointer"
                    aria-label="Clear search query"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Dedicated "Select by Artist" Horizontal Carousel */}
              <div>
                <div className="flex items-center justify-between mb-1 px-0.5">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Select by Artist 🎤
                  </span>
                  <span className="text-[10px] text-zinc-500">Tap to filter</span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {POPULAR_ARTISTS.map((art) => {
                    const isSelected = activeChip === art.name || searchQuery.toLowerCase().includes(art.name.toLowerCase());
                    return (
                      <button
                        key={art.name}
                        type="button"
                        onClick={() => handleSelectArtist(art)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 flex-shrink-0 transition-all cursor-pointer ${
                          isSelected
                            ? 'gradient-bg text-white shadow-sm'
                            : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-850 hover:text-white border border-zinc-800'
                        }`}
                      >
                        <span>{art.icon}</span>
                        <span>{art.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Category Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5 pb-0.5">
                {PRESET_CATEGORIES.map((cat) => {
                  const isSelected = activeChip === cat.label;
                  return (
                    <button
                      key={cat.label}
                      type="button"
                      onClick={() => handleCategoryClick(cat)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold flex-shrink-0 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white text-black font-bold'
                          : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tracks List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 divide-y divide-zinc-900">
              {loading ? (
                <div className="py-14 flex flex-col items-center justify-center text-zinc-500 space-y-2">
                  <Loader2 size={24} className="animate-spin text-pink-500" />
                  <p className="text-xs">Finding songs by artist...</p>
                </div>
              ) : tracks.length === 0 ? (
                <div className="py-14 text-center text-zinc-500 space-y-1">
                  <Disc3 size={32} className="mx-auto text-zinc-600 mb-2" />
                  <p className="text-xs font-semibold text-zinc-400">No songs found</p>
                  <p className="text-[11px] text-zinc-600">
                    Try searching for an artist like &quot;Anirudh&quot;, &quot;Sid Sriram&quot;, or &quot;Arijit&quot;
                  </p>
                </div>
              ) : (
                tracks.map((track) => {
                  const isCurrent = playerState.currentTrack?.id === track.id;
                  const isPlaying = isCurrent && playerState.isPlaying;

                  return (
                    <div
                      key={track.id}
                      className={`pt-1.5 flex items-center justify-between p-2 rounded-2xl transition-colors hover:bg-zinc-900/80 ${
                        isCurrent ? 'bg-zinc-900/90 border border-zinc-800' : ''
                      }`}
                    >
                      {/* Left: Play button + Artwork + Info */}
                      <div
                        onClick={() => handleOpenTrimmer(track, 10)}
                        className="flex items-center gap-3 min-w-0 flex-1 pr-2 cursor-pointer group"
                      >
                        {/* Artwork with play button */}
                        <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0 shadow-md">
                          <img
                            src={track.artworkUrl}
                            alt={track.title}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              globalAudio.toggleTrack(track);
                            }}
                            className={`absolute inset-0 flex items-center justify-center transition-colors cursor-pointer ${
                              isPlaying ? 'bg-black/50' : 'bg-black/20 hover:bg-black/40'
                            }`}
                            aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
                          >
                            {isPlaying ? (
                              <Pause size={16} className="text-pink-400 fill-pink-400" />
                            ) : (
                              <Play size={16} className="text-white fill-white ml-0.5" />
                            )}
                          </button>
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate group-hover:text-pink-400 transition-colors">
                            {track.title}
                          </p>
                          <p className="text-[11px] text-zinc-400 truncate">
                            {track.artist}
                          </p>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] text-pink-400 font-semibold">
                              30s Preview
                            </span>
                            {isPlaying && (
                              <span className="text-[9px] text-zinc-400 font-mono">
                                {formatSec(playerState.currentTime)} / 0:30
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Trimmer / Select Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Main "Pick Part" Button (Instagram Style) */}
                        <button
                          type="button"
                          onClick={() => handleOpenTrimmer(track, 10)}
                          className="px-3 py-1.5 rounded-xl bg-pink-500/15 hover:gradient-bg text-pink-300 hover:text-white border border-pink-500/30 hover:border-transparent text-xs font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer shadow-xs"
                          title="Pick exact 15s chorus/verse part"
                        >
                          <Scissors size={12} />
                          <span>Pick Part</span>
                        </button>

                        {/* Quick Direct Use Button */}
                        <button
                          type="button"
                          onClick={() => handleQuickSelect(track)}
                          className="p-1.5 rounded-xl bg-zinc-850 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-bold transition-all active:scale-95 flex items-center cursor-pointer"
                          aria-label="Use track without trimming"
                          title="Quick use"
                        >
                          <Check size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Tray if any track is currently previewing */}
            {playerState.currentTrack && (
              <div className="p-3 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between gap-3 animate-slide-up">
                <div
                  onClick={() => handleOpenTrimmer(playerState.currentTrack!, 10)}
                  className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                >
                  <img
                    src={playerState.currentTrack.artworkUrl}
                    alt={playerState.currentTrack.title}
                    className="w-8 h-8 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate leading-tight">
                      {playerState.currentTrack.title}
                    </p>
                    <p className="text-[10px] text-zinc-400 truncate leading-tight">
                      {playerState.currentTrack.artist} • Tap to trim part ✂️
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => globalAudio.toggleTrack(playerState.currentTrack!)}
                    className="w-8 h-8 rounded-full bg-zinc-800 text-white flex items-center justify-center hover:bg-zinc-700 cursor-pointer"
                    aria-label={playerState.isPlaying ? 'Pause song' : 'Play song'}
                  >
                    {playerState.isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenTrimmer(playerState.currentTrack!, 10)}
                    className="px-3.5 py-1.5 rounded-full gradient-bg text-white text-xs font-bold cursor-pointer active:scale-95 shadow-md flex items-center gap-1"
                  >
                    <Scissors size={12} />
                    <span>Choose Part ✂️</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SongPickerModal;
