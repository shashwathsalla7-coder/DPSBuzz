'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Video,
  Music,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Clock,
  Film,
  Play,
  Pause,
} from 'lucide-react';
import { DataStore, type SongTrack, type Profile, type Post } from '@/lib/dataStore';
import { SongPickerModal } from '@/components/music/SongPickerModal';

interface CreateReelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReelCreated?: (reel: Post) => void;
}

const MAX_DURATION_SECONDS = 60;
const MAX_FILE_SIZE_BYTES = 35 * 1024 * 1024; // 35 MB

const QUICK_TAGS = ['#dpsbuzz', '#schoollife', '#sports', '#talentshow', '#fun', '#studyvibe'];

export const CreateReelModal: React.FC<CreateReelModalProps> = ({
  isOpen,
  onClose,
  onReelCreated,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [quota, setQuota] = useState<{ allowed: boolean; remaining: number; count: number; max: number }>({
    allowed: true,
    remaining: 3,
    count: 0,
    max: 3,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<'file' | 'link'>('file');
  const [externalVideoUrl, setExternalVideoUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [habitCategory, setHabitCategory] = useState<string>('entertainment');
  const [selectedSong, setSelectedSong] = useState<SongTrack | null>(null);
  const [isSongPickerOpen, setIsSongPickerOpen] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const user = DataStore.getCurrentUser();
      setCurrentUser(user);
      if (user?.username) {
        setQuota(DataStore.canUserPostReel(user.username));
      }
      setError(null);
    } else {
      // Cleanup preview URL
      if (previewUrl && uploadMode === 'file') {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      setSelectedFile(null);
      setExternalVideoUrl('');
      setCaption('');
      setSelectedSong(null);
      setVideoDuration(0);
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setError('Please select a valid video file (MP4, WebM, or MOV).');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed is 35MB.`);
      return;
    }

    // Load video to inspect duration
    const tempUrl = URL.createObjectURL(file);
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = tempUrl;

    tempVideo.onloadedmetadata = () => {
      const dur = tempVideo.duration;
      if (dur > MAX_DURATION_SECONDS) {
        setError(`Reels must be 60 seconds or shorter. This video is ${Math.round(dur)}s long. Please trim your video.`);
        URL.revokeObjectURL(tempUrl);
        return;
      }
      setVideoDuration(dur);
      setSelectedFile(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(tempUrl);

      // Seek slightly to capture poster thumbnail
      try {
        tempVideo.currentTime = Math.min(0.5, dur > 1 ? dur / 2 : 0.1);
      } catch {}
    };

    tempVideo.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 480;
        canvas.height = (tempVideo.videoHeight / (tempVideo.videoWidth || 1)) * 480 || 640;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
          const thumb = canvas.toDataURL('image/jpeg', 0.8);
          setVideoThumbnail(thumb);
        }
      } catch {}
    };

    tempVideo.onerror = () => {
      setError('Could not read video metadata. Please select another video format.');
      URL.revokeObjectURL(tempUrl);
    };
  };

  const handleTogglePlayPreview = () => {
    if (!videoPreviewRef.current) return;
    if (videoPreviewRef.current.paused) {
      videoPreviewRef.current.play();
      setIsPlayingPreview(true);
    } else {
      videoPreviewRef.current.pause();
      setIsPlayingPreview(false);
    }
  };

  const handleAddTag = (tag: string) => {
    if (caption.includes(tag)) return;
    setCaption((prev) => (prev ? `${prev} ${tag}` : tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser || !currentUser.username || currentUser.username === 'guest') {
      setError('You must be logged in to post reels.');
      return;
    }

    const check = DataStore.canUserPostReel(currentUser.username);
    if (!check.allowed) {
      setError(`Daily reel limit reached (${check.max} reels/day). This keeps the school platform fast and free! Try again tomorrow.`);
      return;
    }

    // 1. Link Mode: Free external video provider (Catbox, Streamable, direct MP4)
    if (uploadMode === 'link') {
      const link = externalVideoUrl.trim();
      if (!link) {
        setError('Please paste a valid video URL from Catbox, Streamable, or a direct .mp4 link.');
        return;
      }

      const newPost = DataStore.addPost({
        userId: currentUser.id || `user-${currentUser.username}`,
        username: currentUser.username,
        fullName: currentUser.fullName || currentUser.username,
        class: `Class ${currentUser.class || '8'}-${currentUser.section || 'A'}`,
        avatar: currentUser.avatar || null,
        caption: caption.trim() || 'Check out my new reel! 🎬✨',
        images: [link],
        imageUrl: link,
        videoUrl: link,
        isVideo: true,
        isReel: true,
        habitCategory: habitCategory,
        song: selectedSong || undefined,
      });

      onReelCreated?.(newPost);
      onClose();
      return;
    }

    // 2. File Upload Mode: Hosted on Cloudinary 25GB Free Media CDN
    if (!selectedFile) {
      setError('Please select a video file for your reel.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(5);
    setError(null);

    try {
      let videoUrl = '';

      // Direct Cloudinary Signed Upload (bypasses serverless body limits)
      try {
        const signRes = await fetch('/api/upload/sign?folder=reels');
        if (signRes.ok) {
          const signData = await signRes.json();
          if (signData.success && signData.signature) {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('api_key', signData.apiKey);
            formData.append('timestamp', signData.timestamp.toString());
            formData.append('signature', signData.signature);
            formData.append('folder', signData.folder);

            videoUrl = await new Promise<string>((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              const endpoint = signData.videoUploadUrl || `https://api.cloudinary.com/v1_1/${signData.cloudName}/video/upload`;
              xhr.open('POST', endpoint);
              xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                  const pct = Math.round((e.loaded / e.total) * 90);
                  setUploadProgress(Math.max(5, pct));
                }
              };
              xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                  try {
                    const resp = JSON.parse(xhr.responseText);
                    resolve(resp.secure_url || resp.url);
                  } catch (e) {
                    reject(e);
                  }
                } else {
                  reject(new Error(`Cloudinary upload returned status ${xhr.status}`));
                }
              };
              xhr.onerror = () => reject(new Error('Network error during video upload'));
              xhr.send(formData);
            });
          }
        }
      } catch (directErr) {
        console.warn('Direct upload notice, falling back:', directErr);
      }

      // Fallback to /api/upload if direct upload was not completed
      if (!videoUrl) {
        if (selectedFile.size > 4.5 * 1024 * 1024) {
          throw new Error('Video is larger than 4.5MB. Please choose a video under 4.5MB or check your connection.');
        }
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('folder', 'reels');

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to upload video');
        }

        const data = await res.json();
        videoUrl = data.url;
      }

      if (!videoUrl) {
        throw new Error('Upload server did not return a valid video URL');
      }

      setUploadProgress(95);

      // Add to DataStore
      const newPost = DataStore.addPost({
        userId: currentUser.id || `user-${currentUser.username}`,
        username: currentUser.username,
        fullName: currentUser.fullName || currentUser.username,
        class: `Class ${currentUser.class || '8'}-${currentUser.section || 'A'}`,
        avatar: currentUser.avatar || null,
        caption: caption.trim() || 'Check out my new reel! 🎬✨',
        images: [videoUrl],
        imageUrl: videoThumbnail || videoUrl,
        videoUrl: videoUrl,
        isVideo: true,
        isReel: true,
        habitCategory: habitCategory,
        song: selectedSong || undefined,
      });

      setUploadProgress(100);
      onReelCreated?.(newPost);
      onClose();
    } catch (err: any) {
      console.error('Reel upload error:', err);
      setError(err.message || 'Failed to post reel. Please check your internet connection.');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[var(--surface)] border border-[var(--line)] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--line)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 flex items-center justify-center text-white shadow-sm">
              <Film size={18} strokeWidth={2.4} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text)] leading-tight">Create Reel 🎬</h2>
              <p className="text-[11px] text-[var(--text-muted)] font-medium">
                Full-screen vertical video • Auto-looping
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quota Banner */}
        <div className="px-5 py-2.5 bg-[var(--surface-sunken)] border-b border-[var(--line)] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Clock size={13} className="text-[var(--primary)]" />
            <span className="font-semibold text-[var(--text)]">Limits: Max 60s • Max 35MB</span>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              quota.remaining > 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
            }`}
          >
            {currentUser?.username?.toLowerCase() === 'shashwath71845'
              ? 'Admin: Unlimited'
              : `${quota.remaining}/${quota.max} left today`}
          </span>
        </div>

        {/* Source Provider Tabs: Cloudinary File vs Free External Link */}
        <div className="grid grid-cols-2 gap-2 px-5 pt-3">
          <button
            type="button"
            onClick={() => {
              setUploadMode('file');
              setError(null);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
              uploadMode === 'file'
                ? 'bg-[var(--primary)] text-white border-transparent shadow-xs'
                : 'bg-[var(--surface-sunken)] text-[var(--text-muted)] border-[var(--line)] hover:text-[var(--text)]'
            }`}
          >
            <Upload size={13} />
            <span>Upload File (Cloudinary)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setUploadMode('link');
              setError(null);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
              uploadMode === 'link'
                ? 'bg-[var(--primary)] text-white border-transparent shadow-xs'
                : 'bg-[var(--surface-sunken)] text-[var(--text-muted)] border-[var(--line)] hover:text-[var(--text)]'
            }`}
          >
            <Film size={13} />
            <span>Free Video Link (Catbox)</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2 animate-shake">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Link Mode Input */}
          {uploadMode === 'link' && !previewUrl && (
            <div className="space-y-2 p-4 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--line)]">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--text)]">
                <span>Paste Video Link (Free Providers)</span>
                <span className="text-[10px] text-emerald-400 font-semibold">0MB Server Cost</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={externalVideoUrl}
                  onChange={(e) => setExternalVideoUrl(e.target.value)}
                  placeholder="https://files.catbox.moe/abc.mp4 or streamable..."
                  className="flex-1 bg-[var(--surface)] border border-[var(--line)] rounded-xl px-3 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
                />
                <button
                  type="button"
                  onClick={() => {
                    const clean = externalVideoUrl.trim();
                    if (!clean) {
                      setError('Please paste a video URL first.');
                      return;
                    }
                    setError(null);
                    setPreviewUrl(clean);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  Load Preview
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 items-center pt-1 text-[10px] text-[var(--text-muted)]">
                <span className="font-semibold">Free Hosts:</span>
                <button
                  type="button"
                  onClick={() => window.open('https://catbox.moe', '_blank')}
                  className="px-2 py-0.5 rounded bg-white/5 border border-white/10 hover:border-pink-400 hover:text-pink-300 transition-colors"
                >
                  Catbox.moe (200MB) ↗
                </button>
                <button
                  type="button"
                  onClick={() => window.open('https://streamable.com', '_blank')}
                  className="px-2 py-0.5 rounded bg-white/5 border border-white/10 hover:border-pink-400 hover:text-pink-300 transition-colors"
                >
                  Streamable ↗
                </button>
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">Direct MP4 URL</span>
              </div>
            </div>
          )}

          {/* Video Picker or Video Preview */}
          {!previewUrl && uploadMode === 'file' ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-[9/10] max-h-64 sm:max-h-72 rounded-2xl border-2 border-dashed border-[var(--line)] hover:border-[var(--primary)] bg-[var(--surface-sunken)] flex flex-col items-center justify-center gap-3 p-6 text-center cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] group"
            >
              <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                <Upload size={28} />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--text)]">Select Reel Video</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  MP4, WebM, or MOV up to 60 seconds (35MB)
                </p>
              </div>
              <span className="px-3.5 py-1.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold shadow-xs">
                Browse Video
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : previewUrl ? (
            <div className="relative w-full aspect-[9/12] max-h-72 rounded-2xl overflow-hidden bg-black border border-[var(--line)] flex items-center justify-center group">
              <video
                ref={videoPreviewRef}
                src={previewUrl}
                className="w-full h-full object-cover"
                loop
                autoPlay
                muted
                playsInline
                onClick={handleTogglePlayPreview}
              />
              <button
                type="button"
                onClick={handleTogglePlayPreview}
                className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {isPlayingPreview ? <Pause size={20} /> : <Play size={20} className="translate-x-0.5" />}
              </button>
              <div className="absolute top-2.5 right-2.5 flex items-center gap-2">
                {videoDuration > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[11px] font-mono font-bold text-white">
                    ⏱️ {Math.round(videoDuration)}s
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    if (previewUrl && uploadMode === 'file') URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(null);
                    setExternalVideoUrl('');
                  }}
                  className="w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-rose-600 transition-colors cursor-pointer"
                  title="Remove video"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : null}

          {/* Caption Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--text)]">
              <label htmlFor="reelCaption">Reel Caption</label>
              <span className="text-[10px] text-[var(--text-muted)]">{caption.length}/300</span>
            </div>
            <textarea
              id="reelCaption"
              rows={2}
              maxLength={300}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a catchy caption, shoutout or question..."
              className="w-full p-3 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--line)] text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--primary)] resize-none"
            />
            {/* Quick Hashtags */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {QUICK_TAGS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleAddTag(t)}
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--surface-sunken)] border border-[var(--line)] hover:border-[var(--primary)] text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors cursor-pointer"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Music Track Selector */}
          <div className="p-3 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--line)] flex items-center justify-between">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-xl bg-pink-500/15 text-pink-500 flex items-center justify-center shrink-0">
                <Music size={16} />
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-[var(--text)] truncate">
                  {selectedSong ? selectedSong.title : 'Original Video Audio'}
                </p>
                <p className="text-[10px] text-[var(--text-muted)] truncate">
                  {selectedSong ? selectedSong.artist : 'Plays original sound of the clip'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsSongPickerOpen(true)}
              className="px-3 py-1.5 rounded-xl border border-[var(--line)] hover:border-[var(--primary)] text-xs font-semibold text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors cursor-pointer shrink-0"
            >
              {selectedSong ? 'Change Music' : 'Add Music'}
            </button>
          </div>

          {/* Category Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text)]">Category</label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { id: 'entertainment', label: 'Fun & Comedy', icon: '🎭' },
                { id: 'sports', label: 'Sports & Games', icon: '⚽' },
                { id: 'studies', label: 'Study & Tips', icon: '📚' },
                { id: 'stem', label: 'Science & Tech', icon: '🚀' },
                { id: 'arts', label: 'Dance & Music', icon: '🎨' },
                { id: 'schoollife', label: 'DPS Moments', icon: '🏫' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setHabitCategory(cat.id)}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                    habitCategory === cat.id
                      ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] font-bold'
                      : 'border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--surface-sunken)]'
                  }`}
                >
                  <span className="text-sm">{cat.icon}</span>
                  <span className="text-[10px] font-medium leading-tight">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-1.5 py-1">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--primary)]">
                <span>Publishing Reel to DPS Buzz...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[var(--line)] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-blue-600 transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Storage Provider Transparency Notice */}
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-[11px] text-[var(--text-muted)] space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[var(--text)]">
              <Sparkles size={13} className="text-pink-400" />
              <span>Free Hosting Infrastructure</span>
            </div>
            <p className="leading-relaxed">
              Uploaded files are hosted on <strong>Cloudinary Free 25GB Media CDN</strong> (zero Cloudflare video storage used). Free external video links from <strong>Catbox.moe</strong> or <strong>Streamable</strong> use 0MB of server storage!
            </p>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={(!selectedFile && !externalVideoUrl.trim()) || isUploading || (!quota.allowed && currentUser?.username?.toLowerCase() !== 'shashwath71845')}
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-blue-600 hover:opacity-95 active:scale-[0.99] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Publishing Reel...</span>
              </>
            ) : (
              <>
                <Film size={18} />
                <span>Share Reel Now ✨</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Song Picker Modal */}
      {isSongPickerOpen && (
        <SongPickerModal
          isOpen={isSongPickerOpen}
          initialTrack={selectedSong}
          onSelectSong={(song) => {
            setSelectedSong(song);
            setIsSongPickerOpen(false);
          }}
          onClose={() => setIsSongPickerOpen(false)}
        />
      )}
    </div>
  );
};

export default CreateReelModal;
