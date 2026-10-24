'use client';

import React, { useState, useEffect } from 'react';
import {
  Music,
  Upload,
  ShieldAlert,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Plus,
  Ban,
  RefreshCw,
  Power,
  FileAudio,
  Eye,
  Check,
  X,
} from 'lucide-react';
import { MusicTrack, MusicBlockItem, MusicReport } from '@/lib/music/types';
import { globalAudio } from '@/lib/audioManager';

export const AdminMusicManager: React.FC = () => {
  const [featureEnabled, setFeatureEnabled] = useState(true);
  const [libraryTracks, setLibraryTracks] = useState<MusicTrack[]>([]);
  const [blocklist, setBlocklist] = useState<MusicBlockItem[]>([]);
  const [reports, setReports] = useState<MusicReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Upload Form State
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadArtist, setUploadArtist] = useState('');
  const [uploadGenre, setUploadGenre] = useState('School Royalty-Free');
  const [uploadMood, setUploadMood] = useState('Happy / Uplifting');
  const [uploadAudioUrl, setUploadAudioUrl] = useState('');
  const [uploadDuration, setUploadDuration] = useState('180');
  const [uploadLicense, setUploadLicense] = useState('DPS Buzz Internal School License (Royalty-Free)');
  const [confirmedRights, setConfirmedRights] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Blocklist Form State
  const [blockType, setBlockType] = useState<'track' | 'artist'>('track');
  const [blockIdentifier, setBlockIdentifier] = useState('');
  const [blockReason, setBlockReason] = useState('');

  // Audio preview state
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/music/admin?isAdmin=true');
      if (res.ok) {
        const data = await res.json();
        setFeatureEnabled(Boolean(data.featureEnabled));
        setLibraryTracks(data.libraryTracks || []);
        setBlocklist(data.blocklist || []);
        setReports(data.reports || []);
      }
    } catch (e) {
      console.warn('Failed to fetch admin music data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
    return () => globalAudio.stop();
  }, []);

  const handleToggleFeature = async () => {
    const nextState = !featureEnabled;
    try {
      const res = await fetch('/api/music/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_feature', isAdmin: true, enabled: nextState }),
      });
      if (res.ok) {
        setFeatureEnabled(nextState);
        showToast(nextState ? 'Music feature ENABLED school-wide' : 'Music feature DISABLED school-wide');
      }
    } catch {
      showToast('Error toggling feature state');
    }
  };

  const handleUploadTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmedRights) {
      alert('You must confirm you have the rights to use and distribute this audio.');
      return;
    }
    if (!uploadTitle.trim() || !uploadArtist.trim() || !uploadAudioUrl.trim()) {
      alert('Please fill in Title, Artist, and Audio URL.');
      return;
    }

    setIsUploading(true);
    try {
      const res = await fetch('/api/music/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upload_track',
          isAdmin: true,
          title: uploadTitle.trim(),
          artist: uploadArtist.trim(),
          genre: uploadGenre,
          mood: uploadMood,
          audioUrl: uploadAudioUrl.trim(),
          duration: parseInt(uploadDuration, 10) || 180,
          licenseText: uploadLicense,
          confirmedRights: true,
        }),
      });

      if (res.ok) {
        showToast('Track uploaded to DPS Buzz Library! ✨');
        setUploadTitle('');
        setUploadArtist('');
        setUploadAudioUrl('');
        setConfirmedRights(false);
        loadAdminData();
      } else {
        const d = await res.json();
        alert(d.error || 'Upload failed');
      }
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteTrack = async (id: string) => {
    if (!confirm('Are you sure you want to remove this track from the school library?')) return;
    try {
      const res = await fetch('/api/music/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_track', isAdmin: true, id }),
      });
      if (res.ok) {
        showToast('Track deleted from library');
        loadAdminData();
      }
    } catch {
      showToast('Failed to delete track');
    }
  };

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockIdentifier.trim()) return;

    try {
      const res = await fetch('/api/music/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'block_item',
          isAdmin: true,
          type: blockType,
          identifier: blockIdentifier.trim(),
          reason: blockReason.trim(),
        }),
      });
      if (res.ok) {
        showToast(`Blocked ${blockType}: ${blockIdentifier}`);
        setBlockIdentifier('');
        setBlockReason('');
        loadAdminData();
      }
    } catch {
      showToast('Failed to block item');
    }
  };

  const handleRemoveBlock = async (identifier: string) => {
    try {
      const res = await fetch('/api/music/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unblock_item', isAdmin: true, identifier }),
      });
      if (res.ok) {
        showToast('Unblocked item');
        loadAdminData();
      }
    } catch {
      showToast('Failed to unblock');
    }
  };

  const handleResolveReport = async (reportId: string, blockNow: boolean) => {
    try {
      const res = await fetch('/api/music/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve_report',
          isAdmin: true,
          reportId,
          status: 'resolved',
          blockNow,
        }),
      });
      if (res.ok) {
        showToast(blockNow ? 'Report resolved & track blocked' : 'Report dismissed');
        loadAdminData();
      }
    } catch {
      showToast('Action failed');
    }
  };

  const togglePreview = (track: MusicTrack) => {
    if (playingTrackId === track.id) {
      globalAudio.stop();
      setPlayingTrackId(null);
    } else {
      globalAudio.previewSegment(
        {
          id: track.id,
          title: track.title,
          artist: track.artist,
          artworkUrl: track.coverImage,
          previewUrl: track.audioUrl,
          durationSeconds: track.duration,
          startTime: 0,
          clipDuration: 15,
        },
        0,
        15
      );
      setPlayingTrackId(track.id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-white pb-12">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs shadow-2xl animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* Header & Kill-Switch */}
      <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Music className="text-pink-400" /> Music & Audio Management
          </h2>
          <p className="text-xs text-white/60 mt-0.5">
            Manage school royalty-free library, Creative Commons blocklist, and student reports
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadAdminData}
            className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white/70 hover:text-white transition"
            title="Refresh data"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/10">
            <span className="text-xs font-semibold">Music Feature:</span>
            <button
              type="button"
              onClick={handleToggleFeature}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer ${
                featureEnabled
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                  : 'bg-red-600 text-white hover:bg-red-500'
              }`}
            >
              <Power size={13} />
              <span>{featureEnabled ? 'Active (ON)' : 'Disabled (OFF)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-[#141414] border border-[#262626]">
          <span className="text-xs text-white/50">School Library Tracks</span>
          <p className="text-2xl font-bold mt-1 text-purple-300">{libraryTracks.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-[#141414] border border-[#262626]">
          <span className="text-xs text-white/50">Blocked Tracks / Artists</span>
          <p className="text-2xl font-bold mt-1 text-red-300">{blocklist.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-[#141414] border border-[#262626]">
          <span className="text-xs text-white/50">Pending Student Reports</span>
          <p className="text-2xl font-bold mt-1 text-amber-300">
            {reports.filter((r) => r.status === 'pending').length}
          </p>
        </div>
      </div>

      {/* Upload Royalty-Free Track Form */}
      <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] space-y-4">
        <h3 className="text-sm font-bold flex items-center gap-2 text-pink-400">
          <Upload size={16} /> Upload Royalty-Free School Track
        </h3>
        <p className="text-xs text-white/60">
          Add audio files (MP3/AAC) that the school owns or has explicit permission/license to use.
        </p>

        <form onSubmit={handleUploadTrack} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-white/60 mb-1">Track Title *</label>
              <input
                type="text"
                required
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="e.g. Annual Day Instrumental Theme"
                className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white focus:outline-none focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-white/60 mb-1">Artist / Performer *</label>
              <input
                type="text"
                required
                value={uploadArtist}
                onChange={(e) => setUploadArtist(e.target.value)}
                placeholder="e.g. DPS Music Club / Artist Name"
                className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-white/60 mb-1">Genre</label>
              <input
                type="text"
                value={uploadGenre}
                onChange={(e) => setUploadGenre(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white focus:outline-none focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-white/60 mb-1">Mood</label>
              <input
                type="text"
                value={uploadMood}
                onChange={(e) => setUploadMood(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white focus:outline-none focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-white/60 mb-1">Duration (Seconds)</label>
              <input
                type="number"
                value={uploadDuration}
                onChange={(e) => setUploadDuration(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-white/60 mb-1">
              Audio Streaming URL * (Direct Cloudflare R2 / Storage / MP3 link)
            </label>
            <input
              type="url"
              required
              value={uploadAudioUrl}
              onChange={(e) => setUploadAudioUrl(e.target.value)}
              placeholder="https://.../school-anthem.mp3"
              className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white focus:outline-none focus:border-pink-500"
            />
          </div>

          <div>
            <label className="block text-[11px] text-white/60 mb-1">License & Rights Text</label>
            <input
              type="text"
              value={uploadLicense}
              onChange={(e) => setUploadLicense(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white focus:outline-none focus:border-pink-500"
            />
          </div>

          {/* Mandatory Rights Confirmation Tickbox */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/10 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={confirmedRights}
              onChange={(e) => setConfirmedRights(e.target.checked)}
              className="mt-0.5 rounded accent-pink-500 cursor-pointer"
            />
            <span className="text-xs text-white/80 leading-relaxed">
              <strong className="text-white">Required:</strong> I confirm that I hold the legal rights, permissions, or license to use and make this audio track available for student stories and posts on DPS Buzz.
            </span>
          </label>

          <button
            type="submit"
            disabled={!confirmedRights || isUploading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            {isUploading ? 'Uploading...' : 'Add to School Library'}
          </button>
        </form>
      </div>

      {/* School Library Tracks List */}
      <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] space-y-3">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <FileAudio size={16} className="text-purple-400" /> Current Library Tracks ({libraryTracks.length})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] text-white/50 border-b border-[#262626]">
              <tr>
                <th className="py-2.5 px-3">Title & Artist</th>
                <th className="py-2.5 px-3">Genre / Mood</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3">License</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e1e]">
              {libraryTracks.map((track) => (
                <tr key={track.id} className="hover:bg-white/[0.02]">
                  <td className="py-2.5 px-3 font-semibold">
                    <div>{track.title}</div>
                    <span className="text-[11px] text-white/50">{track.artist}</span>
                  </td>
                  <td className="py-2.5 px-3 text-white/70">
                    {track.genre} • {track.mood}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-white/70">
                    {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                  </td>
                  <td className="py-2.5 px-3 text-white/60 truncate max-w-[150px]">{track.license}</td>
                  <td className="py-2.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => togglePreview(track)}
                      className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-white/80 hover:text-white"
                      title={playingTrackId === track.id ? 'Pause' : 'Play preview'}
                    >
                      {playingTrackId === track.id ? <Pause size={13} /> : <Play size={13} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTrack(track.id)}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
                      title="Delete track"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Blocklist Management */}
      <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] space-y-4">
        <h3 className="text-sm font-bold flex items-center gap-2 text-red-400">
          <Ban size={16} /> Blocked Tracks & Artists ({blocklist.length})
        </h3>
        <p className="text-xs text-white/60">
          Blocked tracks or artists will immediately disappear from student searches and cannot be added to stories.
        </p>

        <form onSubmit={handleAddBlock} className="flex flex-wrap items-center gap-2.5">
          <select
            value={blockType}
            onChange={(e) => setBlockType(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white focus:outline-none"
          >
            <option value="track">Block Track ID</option>
            <option value="artist">Block Artist Name</option>
          </select>

          <input
            type="text"
            required
            value={blockIdentifier}
            onChange={(e) => setBlockIdentifier(e.target.value)}
            placeholder={blockType === 'track' ? 'e.g. jamendo:1630628' : 'e.g. Inappropriate Band'}
            className="flex-1 min-w-[200px] px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white focus:outline-none focus:border-red-400"
          />

          <input
            type="text"
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            placeholder="Reason (optional)"
            className="flex-1 min-w-[150px] px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white focus:outline-none focus:border-red-400"
          />

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow"
          >
            Block Now
          </button>
        </form>

        {blocklist.length > 0 && (
          <div className="space-y-1.5 pt-2">
            {blocklist.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs"
              >
                <div>
                  <span className="font-semibold text-red-300">[{item.type.toUpperCase()}]</span>{' '}
                  <span className="text-white font-mono">{item.identifier}</span>
                  {item.reason && <span className="text-white/40 ml-2">({item.reason})</span>}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveBlock(item.identifier)}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-semibold text-white/80"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Student Reports */}
      <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] space-y-3">
        <h3 className="text-sm font-bold flex items-center gap-2 text-amber-400">
          <ShieldAlert size={16} /> Student Song Reports ({reports.length})
        </h3>

        {reports.length === 0 ? (
          <p className="text-xs text-white/50">No reports submitted by students.</p>
        ) : (
          <div className="space-y-2">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-bold text-white">
                    {rep.trackTitle} <span className="text-white/50 font-normal">by {rep.trackArtist}</span>
                  </p>
                  <p className="text-amber-300 text-[11px] mt-0.5">Reason: {rep.reason}</p>
                  <p className="text-white/40 text-[10px] mt-0.5">
                    Reported by @{rep.reporterUsername} • {new Date(rep.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {rep.status === 'pending' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleResolveReport(rep.id, true)}
                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow"
                      >
                        Block Track & Resolve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResolveReport(rep.id, false)}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 text-xs font-semibold"
                      >
                        Dismiss
                      </button>
                    </>
                  ) : (
                    <span className="text-emerald-400 font-semibold text-xs flex items-center gap-1">
                      <CheckCircle2 size={13} /> {rep.status.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
