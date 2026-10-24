'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  X,
  Play,
  Pause,
  Music,
  Scissors,
  Clock,
  Flame,
  Radio,
  BookOpen,
  History,
  Flag,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { SongTrack } from '@/lib/dataStore';
import { MusicTrack, MusicProviderType } from '@/lib/music/types';
import { CURATED_JAMENDO_TRACKS, DEFAULT_LIBRARY_TRACKS } from '@/lib/music/providers';
import { globalAudio, AudioPlayerState } from '@/lib/audioManager';
import { ClipTrimSelector } from './ClipTrimSelector';

interface SongPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSong: (song: SongTrack) => void;
  title?: string;
  initialTrack?: SongTrack | null;
}

type TabType = 'popular' | 'genres' | 'library' | 'recent';

const GENRE_CATEGORIES = [
  { id: 'study', label: '🎧 Study & Lofi', query: 'lofi study beats chill' },
  { id: 'energetic', label: '⚡ Energetic & Sports', query: 'energetic rock upbeat' },
  { id: 'acoustic', label: '🎸 Acoustic Vibes', query: 'acoustic guitar harmony' },
  { id: 'classical', label: '🎹 Classical Piano', query: 'classical piano calm' },
];

export const SongPickerModal: React.FC<SongPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectSong,
  title = 'Pick a Soundtrack 🎵',
  initialTrack = null,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('popular');
  const [activeGenre, setActiveGenre] = useState<string>('study');
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentTracks, setRecentTracks] = useState<MusicTrack[]>([]);

  // Clip Trimmer sub-screen
  const [trimmingTrack, setTrimmingTrack] = useState<MusicTrack | null>(null);

  // Report Modal state
  const [reportingTrack, setReportingTrack] = useState<MusicTrack | null>(null);
  const [reportReason, setReportReason] = useState('Inappropriate for school');
  const [reportSuccess, setReportSuccess] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Audio player state
  const [playerState, setPlayerState] = useState<AudioPlayerState>({
    currentTrack: null,
    isPlaying: false,
    progress: 0,
    currentTime: 0,
  });

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Format seconds to M:SS
  const formatTime = (secs: number) => {
    const s = Math.max(0, Math.floor(secs));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem.toString().padStart(2, '0')}`;
  };

  // Load recently used tracks from localStorage
  const loadRecentTracks = useCallback(() => {
    try {
      const stored = localStorage.getItem('dpsbuzz_recent_music');
      if (stored) {
        setRecentTracks(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const saveToRecentTracks = (track: MusicTrack) => {
    try {
      const updated = [track, ...recentTracks.filter((t) => t.id !== track.id)].slice(0, 10);
      setRecentTracks(updated);
      localStorage.setItem('dpsbuzz_recent_music', JSON.stringify(updated));
    } catch {}
  };

  // Subscribe to audio state
  useEffect(() => {
    const unsub = globalAudio.subscribe((state) => {
      setPlayerState(state);
    });
    return unsub;
  }, []);

  // Fetch tracks from API
  const fetchTracks = useCallback(
    async (query: string, tab: TabType, genreId: string) => {
      setLoading(true);
      try {
        let endpoint = `/api/music/search?`;
        if (query.trim()) {
          endpoint += `q=${encodeURIComponent(query.trim())}&`;
        } else if (tab === 'popular') {
          endpoint += `category=popular&`;
        } else if (tab === 'genres') {
          endpoint += `category=${encodeURIComponent(genreId)}&`;
        } else if (tab === 'library') {
          endpoint += `category=library&provider=library&`;
        }

        const res = await fetch(endpoint);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.tracks) && data.tracks.length > 0) {
            setTracks(data.tracks);
          } else {
            // Safe fallback to curated CC tracks
            setTracks(tab === 'library' ? DEFAULT_LIBRARY_TRACKS : CURATED_JAMENDO_TRACKS);
          }
        } else {
          setTracks(CURATED_JAMENDO_TRACKS);
        }
      } catch (e) {
        console.warn('Track fetch fallback:', e);
        setTracks(CURATED_JAMENDO_TRACKS);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Handle tab and category changes
  useEffect(() => {
    if (!isOpen) return;
    loadRecentTracks();

    if (initialTrack && !trimmingTrack) {
      // If modal opened with an existing track to trim
      const converted: MusicTrack = {
        id: initialTrack.id,
        title: initialTrack.title,
        artist: initialTrack.artist,
        duration: initialTrack.durationSeconds || 180,
        coverImage: initialTrack.artworkUrl,
        audioUrl: initialTrack.previewUrl,
        provider: (initialTrack.provider as MusicProviderType) || 'jamendo',
        license: initialTrack.license || 'Creative Commons',
        creditText: initialTrack.creditText || `Music by ${initialTrack.artist}`,
        sourcePageUrl: initialTrack.sourcePageUrl || 'https://www.jamendo.com',
      };
      setTrimmingTrack(converted);
      return;
    }

    if (activeTab === 'recent') {
      return;
    }

    if (searchQuery.trim()) {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(() => {
        fetchTracks(searchQuery, activeTab, activeGenre);
      }, 300);
    } else {
      fetchTracks('', activeTab, activeGenre);
    }

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [isOpen, activeTab, activeGenre, searchQuery, fetchTracks, loadRecentTracks]);

  // Clean up playback on modal close
  useEffect(() => {
    if (!isOpen) {
      globalAudio.stop();
      setTrimmingTrack(null);
      setReportingTrack(null);
      setReportSuccess(false);
    }
  }, [isOpen]);

  // Play preview of track in picker list
  const handleTogglePreview = (track: MusicTrack) => {
    const isThisTrackPlaying =
      playerState.isPlaying && playerState.currentTrack?.id === track.id;

    if (isThisTrackPlaying) {
      globalAudio.pauseTrack();
    } else {
      globalAudio.previewSegment(
        {
          id: track.id,
          title: track.title,
          artist: track.artist,
          artworkUrl: track.coverImage,
          previewUrl: track.audioUrl,
          durationSeconds: track.duration,
          startTime: 15,
          clipDuration: 15,
        },
        15,
        15
      );
    }
  };

  // Open the timeline trimmer screen for the chosen track
  const handleSelectTrackForTrimming = (track: MusicTrack) => {
    globalAudio.stop();
    setTrimmingTrack(track);
  };

  // Final confirmation from the trimmer screen
  const handleConfirmClip = (selection: { startSeconds: number; lengthSeconds: number }) => {
    if (!trimmingTrack) return;

    const formattedTrack: SongTrack = {
      id: trimmingTrack.id,
      title: trimmingTrack.title,
      artist: trimmingTrack.artist,
      artworkUrl: trimmingTrack.coverImage,
      previewUrl: trimmingTrack.audioUrl,
      durationSeconds: trimmingTrack.duration,
      startTime: selection.startSeconds,
      clipDuration: selection.lengthSeconds,
      provider: trimmingTrack.provider,
      license: trimmingTrack.license,
      creditText: trimmingTrack.creditText,
      sourcePageUrl: trimmingTrack.sourcePageUrl,
    };

    saveToRecentTracks(trimmingTrack);
    globalAudio.stop();
    onSelectSong(formattedTrack);
    onClose();
  };

  // Submit student report for a song
  const handleSubmitReport = async () => {
    if (!reportingTrack) return;
    setIsSubmittingReport(true);
    try {
      let username = 'student';
      try {
        const stored = localStorage.getItem('dpsbuzz_user');
        if (stored) username = JSON.parse(stored).username || 'student';
      } catch {}

      await fetch('/api/music/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId: reportingTrack.id,
          trackTitle: reportingTrack.title,
          trackArtist: reportingTrack.artist,
          reporterUsername: username,
          reason: reportReason,
        }),
      });

      setReportSuccess(true);
      setTimeout(() => {
        setReportingTrack(null);
        setReportSuccess(false);
      }, 1500);
    } catch (err) {
      console.warn('Report submit failed:', err);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  if (!isOpen) return null;

  // If Trimmer view is active, render the full-song clip trimmer screen
  if (trimmingTrack) {
    return (
      <ClipTrimSelector
        track={trimmingTrack}
        initialStart={initialTrack?.startTime ?? 15}
        initialDuration={initialTrack?.clipDuration ?? 15}
        onConfirm={handleConfirmClip}
        onCancel={() => setTrimmingTrack(null)}
      />
    );
  }

  const displayedList = activeTab === 'recent' ? recentTracks : tracks;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 animate-fade-in">
      <div className="w-full sm:max-w-md bg-[#121212] border border-[#262626] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#262626]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md">
              <Music size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold">{title}</h2>
              <p className="text-[11px] text-white/50">Full songs • Pick your 15s/30s clip</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            aria-label="Close music picker"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-5 pt-3 pb-2">
          <div className="relative flex items-center">
            <Search size={16} className="absolute left-3.5 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search songs, artists, or genres..."
              className="w-full bg-white/[0.06] border border-white/10 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-pink-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-white/40 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        {!searchQuery && (
          <div className="flex items-center gap-1.5 px-5 py-2 border-b border-[#262626] overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('popular')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'popular'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow'
                  : 'bg-white/[0.04] text-white/60 hover:text-white'
              }`}
            >
              <Flame size={13} /> Popular
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('genres')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'genres'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow'
                  : 'bg-white/[0.04] text-white/60 hover:text-white'
              }`}
            >
              <Radio size={13} /> Moods
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('library')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'library'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow'
                  : 'bg-white/[0.04] text-white/60 hover:text-white'
              }`}
            >
              <BookOpen size={13} /> School Library
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('recent')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'recent'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow'
                  : 'bg-white/[0.04] text-white/60 hover:text-white'
              }`}
            >
              <History size={13} /> Recent
            </button>
          </div>
        )}

        {/* Sub-genres pills if Moods tab is active */}
        {!searchQuery && activeTab === 'genres' && (
          <div className="flex items-center gap-2 px-5 py-2 overflow-x-auto no-scrollbar bg-white/[0.02] border-b border-[#262626]">
            {GENRE_CATEGORIES.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setActiveGenre(g.id)}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  activeGenre === g.id
                    ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30 font-bold'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        )}

        {/* Track List */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2.5 divide-y divide-[#1e1e1e]">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-white/50">
              <Loader2 size={24} className="animate-spin text-pink-400" />
              <span className="text-xs">Loading tracks...</span>
            </div>
          ) : displayedList.length === 0 ? (
            <div className="py-12 text-center text-white/50 space-y-1">
              <p className="text-sm font-semibold">No songs found</p>
              <p className="text-xs">Try searching for other words or check the Popular tab</p>
            </div>
          ) : (
            displayedList.map((track) => {
              const isThisPlaying =
                playerState.isPlaying && playerState.currentTrack?.id === track.id;

              return (
                <div
                  key={track.id}
                  className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 group"
                >
                  {/* Cover & Play preview button */}
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-sm">
                    <img
                      src={track.coverImage}
                      alt={track.title}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleTogglePreview(track)}
                      className={`absolute inset-0 flex items-center justify-center transition-opacity cursor-pointer ${
                        isThisPlaying ? 'bg-black/60 opacity-100' : 'bg-black/40 opacity-0 group-hover:opacity-100'
                      }`}
                      aria-label={isThisPlaying ? 'Pause preview' : 'Play preview'}
                    >
                      {isThisPlaying ? (
                        <Pause size={16} className="text-pink-400" />
                      ) : (
                        <Play size={16} className="text-white ml-0.5" />
                      )}
                    </button>
                  </div>

                  {/* Title & Artist */}
                  <div
                    onClick={() => handleSelectTrackForTrimming(track)}
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-white truncate hover:text-pink-300 transition-colors">
                        {track.title}
                      </p>
                      {track.provider === 'library' && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 shrink-0 font-medium">
                          School
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-white/60 truncate">{track.artist}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-white/40 font-mono">
                        {formatTime(track.duration)}
                      </span>
                      <span className="text-[9px] text-pink-400/80 font-medium">
                        {track.license}
                      </span>
                    </div>
                  </div>

                  {/* Actions: Report & Select */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setReportingTrack(track)}
                      className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
                      title="Report track for safety review"
                      aria-label="Report track"
                    >
                      <Flag size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectTrackForTrimming(track)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold shadow-md transition-transform active:scale-95 cursor-pointer"
                    >
                      <Scissors size={12} /> Trim
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Attribution Disclaimer */}
        <div className="px-5 py-2.5 bg-white/[0.02] border-t border-[#262626] text-[10px] text-white/40 text-center">
          Licensed under Creative Commons & School Library • Commercial film tracks require enterprise licensing
        </div>
      </div>

      {/* Child-Safety Report Modal */}
      {reportingTrack && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4 animate-fade-in">
          <div className="w-full max-w-xs bg-[#1a1a1a] border border-[#2e2e2e] rounded-2xl p-4 text-white shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-1.5 text-red-400">
                <AlertTriangle size={16} /> Report Song
              </h3>
              <button
                type="button"
                onClick={() => setReportingTrack(null)}
                className="text-white/60 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-white/70">
              Help keep DPS Buzz safe for students. Why are you reporting{' '}
              <span className="font-semibold text-white">&quot;{reportingTrack.title}&quot;</span>?
            </p>

            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-400"
            >
              <option value="Inappropriate for school">Inappropriate lyrics or language</option>
              <option value="Offensive or harmful theme">Offensive or harmful theme</option>
              <option value="Copyright or wrong artist">Incorrect credits or copyright</option>
              <option value="Other concern">Other concern</option>
            </select>

            {reportSuccess ? (
              <div className="flex items-center gap-1.5 text-xs text-green-400 font-medium py-1">
                <CheckCircle2 size={16} /> Report sent to school admin!
              </div>
            ) : (
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setReportingTrack(null)}
                  className="flex-1 py-1.5 rounded-xl bg-white/10 text-xs font-semibold text-white/80 hover:bg-white/15"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmittingReport}
                  onClick={handleSubmitReport}
                  className="flex-1 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white shadow"
                >
                  {isSubmittingReport ? 'Sending...' : 'Submit Report'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
