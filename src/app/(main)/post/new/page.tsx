/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useRef, useEffect, useMemo, type ChangeEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  X,
  Upload,
  Image as ImageIcon,
  AlertTriangle,
  Music,
  Tag,
  Flame,
  ChevronDown,
  ChevronUp,
  Plus,
  Info,
} from 'lucide-react';
import { DataStore, type Profile, type Post, type SongTrack } from '@/lib/dataStore';
import { getAvatarColorPair } from '@/config/tokens';
import { SongPickerModal } from '@/components/music/SongPickerModal';
import { MusicTrackPill } from '@/components/music/MusicTrackPill';

const PRESET_TAGS = ['#homework', '#revision', '#sports', '#science', '#reading', '#art', '#club'];

const HABIT_CATEGORIES = [
  { id: 'studies', label: 'Studies & Revision' },
  { id: 'sports', label: 'Sports & Playing' },
  { id: 'reading', label: 'Book Reading' },
  { id: 'stem', label: 'Science & STEM' },
  { id: 'arts', label: 'Arts & Creative' },
  { id: 'routine', label: 'Good Habit / Routine' },
  { id: 'casual', label: 'General / Thoughts' },
];

export default function NewPostPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [caption, setCaption] = useState('');
  const [altText, setAltText] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [habitCategory, setHabitCategory] = useState<string>('studies');
  const [selectedSong, setSelectedSong] = useState<SongTrack | null>(null);
  const [showSongPicker, setShowSongPicker] = useState(false);
  const [taggedUsers, setTaggedUsers] = useState<string[]>([]);
  const [tagUserInput, setTagUserInput] = useState('');
  const [audience, setAudience] = useState<'whole-school' | 'class-group'>('whole-school');
  const [customTags, setCustomTags] = useState<string[]>(PRESET_TAGS);
  const [submitting, setSubmitting] = useState(false);
  const [moderationWarning, setModerationWarning] = useState<string | null>(null);
  const [showStreakModal, setShowStreakModal] = useState(false);

  // Collapsible "Add more" accordion states
  const [isAddMoreOpen, setIsAddMoreOpen] = useState(false);
  const [openSection, setOpenSection] = useState<'category' | 'music' | 'tags' | 'classmates' | 'alt' | null>(null);

  useEffect(() => {
    const u = DataStore.getCurrentUser();
    if (!u || !u.username || u.username.toLowerCase() === 'guest') {
      router.replace('/login');
      return;
    }
    setCurrentUser(u);
  }, [router]);

  const allClassmates = useMemo(() => {
    return DataStore.getProfiles().filter(
      (p) =>
        p &&
        p.username &&
        p.username.toLowerCase() !== currentUser?.username.toLowerCase() &&
        p.username.toLowerCase() !== 'admin'
    );
  }, [currentUser]);

  // Mention autocomplete in caption
  const mentionMatch = caption.match(/@([a-z0-9_.]*)$/i);
  const mentionQuery = mentionMatch ? mentionMatch[1].toLowerCase() : null;
  const mentionMatches = useMemo(() => {
    if (mentionQuery === null) return [];
    return allClassmates
      .filter(
        (p) =>
          p.username.toLowerCase().includes(mentionQuery) ||
          p.fullName.toLowerCase().includes(mentionQuery)
      )
      .slice(0, 4);
  }, [mentionQuery, allClassmates]);

  const handleSelectMention = (person: Profile) => {
    const updated = caption.replace(/@([a-z0-9_.]*)$/i, `@${person.username} `);
    setCaption(updated);
    if (!taggedUsers.includes(person.username)) {
      setTaggedUsers((prev) => [...prev, person.username]);
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (selectedPhotos.length >= 4) return;

    setIsUploadingPhoto(true);
    try {
      const file = files[0];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'posts');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data && data.secure_url) {
        setSelectedPhotos((prev) => [...prev, data.secure_url].slice(0, 4));
      } else {
        // Fallback local reader for test environment
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setSelectedPhotos((prev) => [...prev, event.target!.result as string].slice(0, 4));
          }
        };
        reader.readAsDataURL(file);
      }
    } catch {
      // Fallback
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleTagToggle = (tag: string) => {
    if (caption.includes(tag)) {
      setCaption((prev) => prev.replace(tag, '').trim());
    } else {
      setCaption((prev) => (prev ? `${prev} ${tag}` : tag));
    }
  };

  const handleTagClassmate = (username: string) => {
    if (taggedUsers.includes(username)) {
      setTaggedUsers((prev) => prev.filter((u) => u !== username));
    } else {
      setTaggedUsers((prev) => [...prev, username]);
    }
  };

  const isPostValid = caption.trim().length > 0 || selectedPhotos.length > 0;

  const handlePost = async () => {
    if (!isPostValid || submitting || !currentUser) return;
    setSubmitting(true);

    try {
      const newPost: Post = {
        id: `post-${Date.now()}`,
        userId: currentUser.id || `user-${currentUser.username}`,
        username: currentUser.username,
        fullName: currentUser.fullName,
        class: `Class ${currentUser.class}-${currentUser.section || 'A'}`,
        avatar: currentUser.avatar,
        caption: caption.trim(),
        imageUrl: selectedPhotos[0] || undefined,
        images: selectedPhotos,
        createdAt: new Date().toISOString(),
        timeAgo: 'Just now',
        likes: 0,
        comments: 0,
        views: 1,
        habitCategory,
        song: selectedSong || undefined,
        taggedUsers: taggedUsers.length > 0 ? taggedUsers : undefined,
        altText: altText.trim() || undefined,
      };

      DataStore.addPost(newPost);

      // Async sync to server
      fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post: newPost }),
      }).catch(() => {});

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dpsbuzz:content_updated'));
      }

      router.replace('/home');
    } catch {
      setSubmitting(false);
    }
  };

  // Summaries for accordion
  const categorySummary = HABIT_CATEGORIES.find((c) => c.id === habitCategory)?.label || 'Studies & Revision';
  const musicSummary = selectedSong ? `${selectedSong.title} - ${selectedSong.artist}` : 'None';
  const tagsSummary = customTags.filter((t) => caption.includes(t)).join(' ') || 'None';
  const classmatesSummary = taggedUsers.length > 0 ? taggedUsers.map((u) => `@${u}`).join(', ') : 'None';
  const altSummary = altText.trim() ? altText.slice(0, 30) + '...' : 'None';

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-28 text-[var(--text)] select-none">
      {/* 1. Header: Close (X) on left, clean title in center */}
      <header className="sticky top-0 z-30 bg-[var(--surface)] border-b border-[var(--line)] px-4 h-14 flex items-center justify-between">
        <Link
          href="/home"
          className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--text)] hover:bg-[var(--surface-sunken)] transition-colors min-h-[44px]"
          aria-label="Close"
        >
          <X size={20} />
        </Link>
        <h1 className="text-sm font-semibold tracking-tight text-[var(--text)]">New Post</h1>
        <div className="w-10" />
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* 2. Streak message (one short line with link) */}
        <div className="px-3.5 py-2.5 rounded-[12px] bg-[var(--surface-sunken)] border border-[var(--line)] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-medium text-[var(--text)] truncate">
            <Flame size={15} className="text-orange-500 shrink-0" />
            <span className="truncate">Post today to earn +25 points and keep your streak</span>
          </div>
          <button
            type="button"
            onClick={() => setShowStreakModal(true)}
            className="text-[var(--primary)] font-semibold shrink-0 ml-2 hover:underline cursor-pointer flex items-center gap-0.5"
          >
            <Info size={12} />
            <span>How it works</span>
          </button>
        </div>

        {/* 3. Audience Selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[var(--text-muted)] font-medium">Share to:</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setAudience('whole-school')}
              className={`px-3 py-1 rounded-full font-semibold transition-colors cursor-pointer min-h-[36px] ${
                audience === 'whole-school'
                  ? 'bg-[var(--primary)] text-white shadow-xs'
                  : 'bg-[var(--surface-sunken)] text-[var(--text-muted)] border border-[var(--line)] hover:text-[var(--text)]'
              }`}
            >
              Whole School
            </button>
            <button
              type="button"
              onClick={() => setAudience('class-group')}
              className={`px-3 py-1 rounded-full font-semibold transition-colors cursor-pointer min-h-[36px] ${
                audience === 'class-group'
                  ? 'bg-[var(--primary)] text-white shadow-xs'
                  : 'bg-[var(--surface-sunken)] text-[var(--text-muted)] border border-[var(--line)] hover:text-[var(--text)]'
              }`}
            >
              Class {currentUser?.class || '8'}-{currentUser?.section || 'A'} Only
            </button>
          </div>
        </div>

        {/* 4. Photo upload area (clean, simple 0/4 indicator) */}
        <div className="p-4 rounded-[14px] bg-[var(--surface)] border border-[var(--line)] space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--text)]">
            <span>Photos</span>
            <span className="text-[var(--text-muted)] tabular-nums">{selectedPhotos.length}/4</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {selectedPhotos.map((photo, i) => (
              <div
                key={i}
                className="relative aspect-square rounded-[12px] overflow-hidden border border-[var(--line)] bg-[var(--surface-sunken)]"
              >
                <img src={photo} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setSelectedPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors cursor-pointer"
                  aria-label="Remove photo"
                >
                  <X size={12} />
                </button>
              </div>
            ))}

            {selectedPhotos.length < 4 && (
              <label className="aspect-square rounded-[12px] border border-dashed border-[var(--line)] hover:border-[var(--primary)] bg-[var(--surface-sunken)] flex flex-col items-center justify-center gap-1.5 cursor-pointer text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors p-2 text-center">
                <Upload size={18} />
                <span className="text-xs font-semibold">
                  {isUploadingPhoto ? 'Uploading...' : '+ Add Photo'}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  disabled={isUploadingPhoto}
                  className="sr-only"
                  onChange={handleFileUpload}
                />
              </label>
            )}
          </div>
        </div>

        {/* 5. Caption textarea */}
        <div className="p-4 rounded-[14px] bg-[var(--surface)] border border-[var(--line)] space-y-2">
          <label htmlFor="post-caption" className="block text-xs font-semibold text-[var(--text-muted)]">
            Caption
          </label>
          <textarea
            id="post-caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Share what you are studying or doing today..."
            rows={3}
            className="w-full text-sm text-[var(--text)] bg-transparent resize-none placeholder:text-[var(--text-muted)] focus:outline-none"
          />

          {/* Non-overlapping mention autocomplete strip */}
          {mentionQuery !== null && mentionMatches.length > 0 && (
            <div className="pt-2 border-t border-[var(--line)] flex flex-wrap gap-1.5">
              <span className="text-xs text-[var(--text-muted)] font-medium self-center pr-1">Mention:</span>
              {mentionMatches.map((m) => (
                <button
                  key={m.username}
                  type="button"
                  onClick={() => handleSelectMention(m)}
                  className="px-2.5 py-1 rounded-full bg-[var(--surface-sunken)] border border-[var(--line)] text-xs font-semibold text-[var(--primary)] hover:bg-[var(--primary-tint)] transition-colors cursor-pointer"
                >
                  @{m.username}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 6. Collapsible "Add more" section (Category, Music, Tags, Tag classmates, Describe photo) */}
        <div className="rounded-[14px] bg-[var(--surface)] border border-[var(--line)] overflow-hidden">
          <button
            type="button"
            onClick={() => setIsAddMoreOpen(!isAddMoreOpen)}
            className="w-full p-4 flex items-center justify-between text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-sunken)]/50 transition-colors cursor-pointer min-h-[44px]"
          >
            <span>Add more (Category, Music, Tags, Classmates)</span>
            {isAddMoreOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {isAddMoreOpen && (
            <div className="border-t border-[var(--line)] divide-y divide-[var(--line)] text-xs">
              {/* Option 1: Category */}
              <div className="p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[var(--text)]">Category</span>
                  <span className="text-[var(--text-muted)]">{categorySummary}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {HABIT_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setHabitCategory(cat.id)}
                      className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer min-h-[32px] ${
                        habitCategory === cat.id
                          ? 'bg-[var(--primary)] text-white shadow-xs'
                          : 'bg-[var(--surface-sunken)] text-[var(--text-muted)] border border-[var(--line)] hover:text-[var(--text)]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Option 2: Music */}
              <div className="p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[var(--text)]">Music</span>
                  <span className="text-[var(--text-muted)] truncate max-w-[160px]">{musicSummary}</span>
                </div>
                {selectedSong ? (
                  <MusicTrackPill
                    song={selectedSong}
                    onRemove={() => setSelectedSong(null)}
                    onEditPart={() => setShowSongPicker(true)}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSongPicker(true)}
                    className="w-full py-2 px-3 rounded-[12px] border border-dashed border-[var(--line)] bg-[var(--surface-sunken)] hover:bg-[var(--primary-tint)]/30 text-[var(--text)] hover:text-[var(--primary)] font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px]"
                  >
                    <Music size={14} />
                    <span>Attach Music Clip (30s preview)</span>
                  </button>
                )}
              </div>

              {/* Option 3: Tags */}
              <div className="p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[var(--text)]">Tags</span>
                  <span className="text-[var(--text-muted)]">{tagsSummary}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {customTags.map((tag) => {
                    const isAdded = caption.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTagToggle(tag)}
                        className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer min-h-[32px] ${
                          isAdded
                            ? 'bg-[var(--primary)] text-white'
                            : 'bg-[var(--surface-sunken)] text-[var(--text-muted)] border border-[var(--line)] hover:text-[var(--text)]'
                        }`}
                      >
                        {tag} {isAdded ? '✓' : '+'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Option 4: Tag Classmates */}
              <div className="p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[var(--text)]">Tag Classmates</span>
                  <span className="text-[var(--text-muted)] truncate max-w-[160px]">{classmatesSummary}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {allClassmates.slice(0, 8).map((person) => {
                    const isTagged = taggedUsers.includes(person.username);
                    return (
                      <button
                        key={person.username}
                        type="button"
                        onClick={() => handleTagClassmate(person.username)}
                        className={`px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer flex items-center gap-1 min-h-[32px] ${
                          isTagged
                            ? 'bg-[var(--primary)] text-white'
                            : 'bg-[var(--surface-sunken)] text-[var(--text-muted)] border border-[var(--line)] hover:text-[var(--text)]'
                        }`}
                      >
                        <span>@{person.username}</span>
                        <span>{isTagged ? '✓' : '+'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Option 5: Describe the photo (Alt Text) - ONLY HERE ONCE */}
              <div className="p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[var(--text)]">Describe photo (optional)</span>
                  <span className="text-[var(--text-muted)]">{altSummary}</span>
                </div>
                <input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Short description for accessibility (e.g. Maths notebook page 45)..."
                  className="w-full h-10 px-3 rounded-[12px] bg-[var(--surface-sunken)] border border-[var(--line)] text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
                />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 7. Fixed Share button at bottom */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 bg-[var(--surface)] border-t border-[var(--line)] p-3"
        style={{ paddingBottom: 'max(14px, env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="max-w-lg mx-auto">
          <button
            type="button"
            onClick={handlePost}
            disabled={!isPostValid || submitting || isUploadingPhoto}
            className="w-full h-12 rounded-[12px] bg-[var(--primary)] text-white font-semibold text-sm hover:bg-[var(--primary-hover)] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs flex items-center justify-center gap-2"
          >
            {submitting ? 'Sharing post...' : 'Share'}
          </button>
        </div>
      </div>

      {/* Streak Rule Modal / Bottom Sheet */}
      {showStreakModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-[16px] bg-[var(--surface)] border border-[var(--line)] p-5 space-y-3 text-[var(--text)] shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <Flame size={18} className="text-orange-500" />
                <span>Daily Streak & Points Rule</span>
              </div>
              <button
                type="button"
                onClick={() => setShowStreakModal(false)}
                className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Post once every day to keep your streak alive! You earn <strong>+25 Star Points</strong> on your first post each day. Additional posts on the same day are welcome, but only the first post advances your streak and adds points to the Star Board.
            </p>
            <button
              type="button"
              onClick={() => setShowStreakModal(false)}
              className="w-full h-10 rounded-[12px] bg-[var(--primary)] text-white font-semibold text-xs cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Song Picker Modal */}
      <SongPickerModal
        isOpen={showSongPicker}
        onClose={() => setShowSongPicker(false)}
        initialTrack={selectedSong}
        onSelectSong={(song) => setSelectedSong(song)}
        title="Attach Music Track"
      />
    </div>
  );
}
