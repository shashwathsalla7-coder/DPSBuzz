'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  CheckCircle2,
  Repeat2,
  Music,
  Tag,
} from 'lucide-react';
import { type Post, DataStore } from '@/lib/dataStore';
import { PostImage } from './PostImage';
import { getAvatarColorPair } from '@/config/tokens';
import { MusicTrackPill } from '@/components/music/MusicTrackPill';
import { SongPickerModal } from '@/components/music/SongPickerModal';
import { LikesViewsModal } from '@/components/reels/LikesViewsModal';
import { UniqueLikeOverlay } from '@/components/reels/UniqueLikeOverlay';

export interface PostCardProps {
  post: Post;
  isLiked: boolean;
  isSaved: boolean;
  onLikeToggle: (id: string) => void;
  onSaveToggle: (id: string) => void;
  onCommentClick: (post: Post) => void;
  onShareClick: (post: Post) => void;
  onOptionsClick: (post: Post) => void;
}

const PostCardComponent: React.FC<PostCardProps> = ({
  post,
  isLiked,
  isSaved,
  onLikeToggle,
  onSaveToggle,
  onCommentClick,
  onShareClick,
  onOptionsClick,
}) => {
  const [showHeartPop, setShowHeartPop] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const [showRepostSheet, setShowRepostSheet] = useState(false);
  const [repostToast, setRepostToast] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [showSongPicker, setShowSongPicker] = useState(false);

  const currentUser = DataStore.getCurrentUser();
  const isAuthor = Boolean(
    currentUser &&
      (currentUser.username.toLowerCase() === post.username.toLowerCase() ||
        currentUser.role === 'admin' ||
        currentUser.username.toLowerCase() === 'shashwath71845')
  );
  const currentCaption = (post.slideCaptions && post.slideCaptions[activeSlide]?.trim()) || post.caption;
  const totalImages = (post.images && post.images.length > 0 ? post.images : (post.imageUrl ? [post.imageUrl] : [])).length;
  const hasPerSlideCaptions = Boolean(post.slideCaptions && post.slideCaptions.some((c) => c && c.trim()));
  const hasReposted = DataStore.hasUserReposted(post.id, currentUser.username) || (Boolean(post.isRepost) && post.username.toLowerCase() === currentUser.username.toLowerCase());

  const handleUnrepost = () => {
    const cur = DataStore.getCurrentUser();
    if (!cur) return;
    const res = DataStore.unrepostPost(post.id, cur.username);
    setShowRepostSheet(false);
    if (res) {
      setRepostToast('Repost removed! 🔄');
      setTimeout(() => setRepostToast(null), 2500);
    }
  };

  const handleRepostToFeed = () => {
    const cur = DataStore.getCurrentUser();
    if (!cur) return;
    const res = DataStore.repostPost(post.id, cur.username);
    setShowRepostSheet(false);
    if (res) {
      setRepostToast('Reposted to feed! 🔄');
      setTimeout(() => setRepostToast(null), 2500);
    }
  };

  const handleRepostToStory = () => {
    const cur = DataStore.getCurrentUser();
    if (!cur) return;
    const res = DataStore.repostToStory(post.id, cur.username);
    setShowRepostSheet(false);
    if (res) {
      setRepostToast('Added to your 24h story! ⚡');
      setTimeout(() => setRepostToast(null), 2500);
    }
  };

  const isOfficial =
    post.username.toLowerCase() === 'dpsbuzz' ||
    post.username.toLowerCase() === 'dps_official' ||
    post.fullName?.toLowerCase().includes('official');

  // Optimistic instantaneous like feedback (<16ms)
  const [localLiked, setLocalLiked] = React.useState(isLiked);
  const [localLikesCount, setLocalLikesCount] = React.useState(post.likes ?? 0);
  const isLikingRef = React.useRef(false);

  React.useEffect(() => {
    setLocalLiked(isLiked);
  }, [isLiked]);

  React.useEffect(() => {
    setLocalLikesCount(post.likes ?? 0);
  }, [post.likes]);

  const handleLikeClick = () => {
    if (isLikingRef.current) return;
    isLikingRef.current = true;
    const nextLiked = !localLiked;
    setLocalLiked(nextLiked);
    setLocalLikesCount((prev) => Math.max(0, prev + (nextLiked ? 1 : -1)));
    if (nextLiked) {
      setShowHeartPop(true);
      setTimeout(() => setShowHeartPop(false), 700);
    }
    try {
      onLikeToggle(post.id);
    } finally {
      setTimeout(() => {
        isLikingRef.current = false;
      }, 200);
    }
  };

  const handleDoubleTap = () => {
    if (!localLiked) {
      handleLikeClick();
    } else {
      setShowHeartPop(true);
      setTimeout(() => setShowHeartPop(false), 700);
    }
  };

  // Optimistic instantaneous bookmark save feedback
  const [localSaved, setLocalSaved] = React.useState(isSaved);
  React.useEffect(() => {
    setLocalSaved(isSaved);
  }, [isSaved]);

  const handleSaveClick = () => {
    setLocalSaved(!localSaved);
    onSaveToggle(post.id);
  };

  const likesCount = localLikesCount;

  const renderCaption = (text: string) => {
    const parts = text.split(/(#[a-zA-Z0-9_]+|@[a-zA-Z0-9_]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const username = part.slice(1);
        return (
          <Link
            key={index}
            href={`/u/${username}`}
            className="font-bold hover:underline cursor-pointer"
            style={{ color: 'var(--primary)' }}
          >
            {part}
          </Link>
        );
      }
      if (part.startsWith('#')) {
        return (
          <span
            key={index}
            className="font-semibold hover:underline cursor-pointer"
            style={{ color: 'var(--primary)' }}
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <article className="pb-4 mb-2">
      {/* Repost Attribution Banner */}
      {post.isRepost && post.repostedFrom && (
        <div className="px-3 py-1.5 mb-2 mx-1 flex items-center justify-between bg-[var(--surface-sunken)] border border-[var(--line)] rounded-xl text-xs shadow-2xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Repeat2 size={13} className="text-pink-500 shrink-0" />
            <span className="font-semibold text-[var(--text)]">
              @{post.username} reposted
            </span>
            <span className="text-[var(--text-muted)]">•</span>
            <Link
              href={`/u/${post.repostedFrom.username}`}
              className="font-semibold text-[var(--primary)] hover:underline inline-flex items-center gap-1"
            >
              <span>Original by @{post.repostedFrom.username}</span>
            </Link>
          </div>
        </div>
      )}

      {/* 1. Photo-First Card Container with Overlays */}
      <PostImage
        post={post}
        onDoubleTapLike={handleDoubleTap}
        onOptionsClick={() => onOptionsClick(post)}
        showHeartPop={showHeartPop}
        onSlideChange={setActiveSlide}
      />

      {/* 1.5 Attached Song Preview Pill with Post-Upload Change Option */}
      <div className="px-3 pt-2 flex items-center justify-between gap-2">
        {post.song ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex-1 min-w-0">
              <MusicTrackPill
                song={post.song}
                compact
                onEditPart={isAuthor ? () => setShowSongPicker(true) : undefined}
              />
            </div>
            {isAuthor && (
              <button
                type="button"
                onClick={() => setShowSongPicker(true)}
                className="text-[10px] font-bold px-2 py-1 rounded-full bg-[var(--surface-sunken)] border border-[var(--line)] text-[var(--text-muted)] hover:text-pink-400 hover:border-pink-500/30 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                title="Change background music for this post 🎵"
              >
                <Music size={11} />
                <span>Change 🎵</span>
              </button>
            )}
          </div>
        ) : (
          isAuthor && (
            <button
              type="button"
              onClick={() => setShowSongPicker(true)}
              className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[var(--surface-sunken)] border border-dashed border-[var(--line)] text-[var(--text-muted)] hover:text-pink-400 hover:border-pink-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Music size={12} className="text-pink-400" />
              <span>+ Add Background Music 🎵</span>
            </button>
          )
        )}
      </div>

      {/* 2. Action Row (44px tap areas) */}
      <div className="px-3 pt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1 -ml-1">
          {/* Like Heart Button */}
          <button
            type="button"
            onClick={handleLikeClick}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-85 cursor-pointer touch-manipulation"
            style={{
              color: localLiked ? 'var(--like)' : 'var(--text)',
              touchAction: 'manipulation',
            }}
            aria-label={localLiked ? 'Unlike' : 'Like'}
          >
            <Heart
              size={24}
              strokeWidth={1.8}
              className={`transition-colors ${localLiked ? 'fill-[var(--like)] text-[var(--like)] animate-heart-pop' : ''}`}
            />
          </button>

          {/* Comment Button */}
          <button
            type="button"
            onClick={() => onCommentClick(post)}
            className="w-11 h-11 rounded-full flex items-center justify-center text-[var(--text)] transition-transform active:scale-85 cursor-pointer touch-manipulation"
            style={{ touchAction: 'manipulation' }}
            aria-label="Comments"
          >
            <MessageCircle size={24} strokeWidth={1.8} />
          </button>

          {/* Send / Share in Chat Button */}
          <button
            type="button"
            onClick={() => onShareClick(post)}
            className="w-11 h-11 rounded-full flex items-center justify-center text-[var(--text)] transition-transform active:scale-85 cursor-pointer touch-manipulation"
            style={{ touchAction: 'manipulation' }}
            aria-label="Share in chat"
          >
            <Send size={22} strokeWidth={1.8} className="-rotate-12" />
          </button>

          {/* Repost Button */}
          <button
            type="button"
            onClick={() => setShowRepostSheet(true)}
            className="h-11 px-2.5 rounded-full flex items-center gap-1 text-[var(--text)] transition-transform active:scale-85 cursor-pointer hover:text-pink-500 touch-manipulation"
            style={{ touchAction: 'manipulation' }}
            aria-label="Repost post to feed or story"
            title="Repost to feed or add to your story"
          >
            <Repeat2 size={21} strokeWidth={1.8} />
            {(post.repostCount || 0) > 0 && (
              <span className="text-[11px] font-bold tabular-nums">
                {post.repostCount}
              </span>
            )}
          </button>
        </div>

        {/* Save Bookmark Button */}
        <button
          type="button"
          onClick={handleSaveClick}
          className="w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-85 cursor-pointer -mr-1 touch-manipulation"
          style={{
            color: localSaved ? 'var(--primary)' : 'var(--text)',
            touchAction: 'manipulation',
          }}
          aria-label={localSaved ? 'Remove from saved' : 'Save post'}
        >
          <Bookmark
            size={23}
            strokeWidth={1.8}
            className={localSaved ? 'fill-[var(--primary)] text-[var(--primary)]' : ''}
          />
        </button>
      </div>

      {/* 3. Likes Row */}
      <div className="px-4 pt-0.5 space-y-1">
        {likesCount > 0 ? (
          <button
            type="button"
            onClick={() => setShowLikesModal(true)}
            className="text-xs font-semibold text-[var(--text)] leading-tight hover:underline text-left cursor-pointer"
            title="View who liked this post"
          >
            <span className="tabular-nums font-bold">{likesCount}</span>{' '}
            {likesCount === 1 ? 'like' : 'likes'}
          </button>
        ) : (
          <p className="text-xs text-[var(--text-muted)] leading-tight">
            Be the first to like this
          </p>
        )}

        {/* Timestamp */}
        <p className="text-xs text-[var(--text-muted)] font-medium">
          {post.timeAgo}
        </p>

        {/* Caption (username + text, 2-line clamp, "more") with Per-Slide Captions */}
        {currentCaption && (
          <div className="text-sm leading-relaxed text-[var(--text)] pt-0.5 space-y-1">
            {hasPerSlideCaptions && totalImages > 1 && (
              <div className="flex items-center gap-1.5 pb-0.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-500 border border-pink-500/20">
                  📸 Slide {activeSlide + 1} of {totalImages}
                </span>
              </div>
            )}
            <div>
              <Link
                href={`/u/${post.username}`}
                className="font-bold mr-1.5 inline-flex items-center gap-0.5 hover:underline"
              >
                <span>{post.username}</span>
                {isOfficial && (
                  <CheckCircle2 size={13} className="text-blue-500 fill-white" />
                )}
              </Link>
              <span className={isCaptionExpanded ? '' : 'line-clamp-2 inline'}>
                {renderCaption(currentCaption)}
              </span>
              {currentCaption.length > 80 && !isCaptionExpanded && (
                <button
                  type="button"
                  onClick={() => setIsCaptionExpanded(true)}
                  className="text-xs text-[var(--text-muted)] font-semibold ml-1 hover:underline cursor-pointer"
                >
                  more
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tagged Classmates with Avatars */}
        {post.taggedUsers && post.taggedUsers.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1 select-none">
            <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 font-medium">
              <Tag size={12} className="text-pink-500" />
              <span>With</span>
            </span>
            {post.taggedUsers.map((u) => {
              const prof = DataStore.getProfileByUsername(u);
              const pair = getAvatarColorPair(u);
              const initials = (prof?.fullName || u).slice(0, 2).toUpperCase();

              return (
                <Link
                  key={u}
                  href={`/u/${u}`}
                  className="inline-flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-full bg-[var(--surface-sunken)] hover:bg-[var(--line)] border border-[var(--line)] text-[11px] font-bold text-[var(--text)] transition-colors"
                >
                  <div
                    className="w-4 h-4 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-[8px] font-bold text-white shadow-2xs"
                    style={{ backgroundColor: pair.bg, color: pair.text }}
                  >
                    {prof?.avatar ? (
                      <img src={prof.avatar} alt={u} className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <span>@{u}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* View all comments link */}
        <button
          type="button"
          onClick={() => onCommentClick(post)}
          className="text-xs text-[var(--text-muted)] font-medium pt-0.5 hover:underline cursor-pointer block"
        >
          {post.comments && post.comments > 0
            ? post.comments === 1
              ? 'View 1 comment'
              : `View all ${post.comments} comments`
            : 'Add a comment...'}
        </button>
      </div>

      {/* Repost Bottom Sheet Modal */}
      {showRepostSheet && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setShowRepostSheet(false)}
        >
          <div
            className="w-full max-w-[380px] rounded-t-[28px] sm:rounded-[28px] border overflow-hidden p-4 space-y-2.5"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--line)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center pb-1">
              <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                Repost Post 🔄
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Share @{post.username}&apos;s post with full creator attribution
              </p>
            </div>
            {hasReposted && (
              <button
                type="button"
                onClick={handleUnrepost}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 bg-pink-500/10 hover:bg-pink-500/20 text-pink-500 border border-pink-500/25 transition-colors cursor-pointer"
              >
                <Repeat2 size={18} className="text-pink-500" />
                <div className="text-left">
                  <span className="block font-bold">Undo Repost (Unrepost) 🔄</span>
                  <span className="text-[10px] text-pink-400 font-normal">Remove this repost from your feed and profile</span>
                </div>
              </button>
            )}

            <button
              type="button"
              onClick={handleRepostToFeed}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 bg-[var(--surface-sunken)] hover:bg-[var(--line)] transition-colors cursor-pointer"
              style={{ color: 'var(--text)' }}
            >
              <Repeat2 size={18} className="text-pink-500" />
              <div className="text-left">
                <span className="block">Repost to Feed 🔄</span>
                <span className="text-[10px] text-[var(--text-muted)] font-normal">Shows on the feed and your profile</span>
              </div>
            </button>

            <button
              type="button"
              onClick={handleRepostToStory}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 bg-[var(--surface-sunken)] hover:bg-[var(--line)] transition-colors cursor-pointer"
              style={{ color: 'var(--text)' }}
            >
              <span className="text-base">⚡</span>
              <div className="text-left">
                <span className="block">Add to Your Story ⚡</span>
                <span className="text-[10px] text-[var(--text-muted)] font-normal">Active for 24h with original author banner</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setShowRepostSheet(false)}
              className="w-full py-2.5 px-4 text-xs font-semibold rounded-xl text-center hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Repost Toast */}
      {repostToast && (
        <div className="fixed bottom-20 inset-x-0 z-50 flex justify-center pointer-events-none px-4 animate-fade-in">
          <div
            className="px-4 py-2 text-xs font-bold text-white shadow-xl flex items-center gap-2 rounded-full"
            style={{ backgroundColor: '#17181C', border: '1px solid #333' }}
          >
            <span>{repostToast}</span>
          </div>
        </div>
      )}

      {/* Song Picker Modal for Post-Upload Music Changes */}
      <SongPickerModal
        isOpen={showSongPicker}
        onClose={() => setShowSongPicker(false)}
        initialTrack={post.song || undefined}
        onSelectSong={(song) => {
          DataStore.updatePostSong(post.id, song);
          post.song = song;
          setShowSongPicker(false);
          setRepostToast('Post background music updated! 🎵✨');
          setTimeout(() => setRepostToast(null), 2500);
        }}
        title="Change Post Music 🎵"
      />

      {/* Likes & Views Modal */}
      {showLikesModal && (
        <LikesViewsModal
          isOpen={showLikesModal}
          onClose={() => setShowLikesModal(false)}
          postId={post.id}
          postAuthor={post.username}
          currentUser={currentUser}
        />
      )}
    </article>
  );
};

export const PostCard = React.memo(PostCardComponent);
export default PostCard;
