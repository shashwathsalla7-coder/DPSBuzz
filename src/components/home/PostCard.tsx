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
} from 'lucide-react';
import { type Post, DataStore } from '@/lib/dataStore';
import { PostImage } from './PostImage';
import { getAvatarColorPair } from '@/config/tokens';
import { MusicTrackPill } from '@/components/music/MusicTrackPill';

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

export const PostCard: React.FC<PostCardProps> = ({
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
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const [showRepostSheet, setShowRepostSheet] = useState(false);
  const [repostToast, setRepostToast] = useState<string | null>(null);

  const currentUser = DataStore.getCurrentUser();
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

  const handleDoubleTap = () => {
    if (!isLiked) {
      onLikeToggle(post.id);
    }
    setShowHeartPop(true);
    setTimeout(() => setShowHeartPop(false), 700);
  };

  const likesCount = (post.likes || 0) + (isLiked ? 1 : 0);

  const renderCaption = (text: string) => {
    const parts = text.split(/(#[a-zA-Z0-9_]+|@[a-zA-Z0-9_]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('#') || part.startsWith('@')) {
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
      />

      {/* 1.5 Attached Song Preview Pill */}
      {post.song && (
        <div className="px-3 pt-2">
          <MusicTrackPill song={post.song} compact />
        </div>
      )}

      {/* 2. Action Row (44px tap areas) */}
      <div className="px-3 pt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1 -ml-1">
          {/* Like Heart Button */}
          <button
            type="button"
            onClick={() => onLikeToggle(post.id)}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-85 cursor-pointer"
            style={{
              color: isLiked ? 'var(--like)' : 'var(--text)',
            }}
            aria-label={isLiked ? 'Unlike' : 'Like'}
          >
            <Heart
              size={24}
              strokeWidth={1.8}
              className={`transition-colors ${isLiked ? 'fill-[var(--like)] text-[var(--like)] animate-heart-pop' : ''}`}
            />
          </button>

          {/* Comment Button */}
          <button
            type="button"
            onClick={() => onCommentClick(post)}
            className="w-11 h-11 rounded-full flex items-center justify-center text-[var(--text)] transition-transform active:scale-85 cursor-pointer"
            aria-label="Comments"
          >
            <MessageCircle size={24} strokeWidth={1.8} />
          </button>

          {/* Send / Share in Chat Button */}
          <button
            type="button"
            onClick={() => onShareClick(post)}
            className="w-11 h-11 rounded-full flex items-center justify-center text-[var(--text)] transition-transform active:scale-85 cursor-pointer"
            aria-label="Share in chat"
          >
            <Send size={22} strokeWidth={1.8} className="-rotate-12" />
          </button>

          {/* Repost Button */}
          <button
            type="button"
            onClick={() => setShowRepostSheet(true)}
            className="h-11 px-2.5 rounded-full flex items-center gap-1 text-[var(--text)] transition-transform active:scale-85 cursor-pointer hover:text-pink-500"
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
          onClick={() => onSaveToggle(post.id)}
          className="w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-85 cursor-pointer -mr-1"
          style={{
            color: isSaved ? 'var(--primary)' : 'var(--text)',
          }}
          aria-label={isSaved ? 'Remove from saved' : 'Save post'}
        >
          <Bookmark
            size={23}
            strokeWidth={1.8}
            className={isSaved ? 'fill-[var(--primary)] text-[var(--primary)]' : ''}
          />
        </button>
      </div>

      {/* 3. Likes Row */}
      <div className="px-4 pt-0.5 space-y-1">
        {likesCount > 0 ? (
          <p className="text-xs font-semibold text-[var(--text)] leading-tight">
            <span className="tabular-nums font-bold">{likesCount}</span>{' '}
            {likesCount === 1 ? 'like' : 'likes'}
          </p>
        ) : (
          <p className="text-xs text-[var(--text-muted)] leading-tight">
            Be the first to like this
          </p>
        )}

        {/* Timestamp */}
        <p className="text-xs text-[var(--text-muted)] font-medium">
          {post.timeAgo}
        </p>

        {/* Caption (username + text, 2-line clamp, "more") */}
        {post.caption && (
          <div className="text-sm leading-relaxed text-[var(--text)] pt-0.5">
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
              {renderCaption(post.caption)}
            </span>
            {post.caption.length > 80 && !isCaptionExpanded && (
              <button
                type="button"
                onClick={() => setIsCaptionExpanded(true)}
                className="text-xs text-[var(--text-muted)] font-semibold ml-1 hover:underline cursor-pointer"
              >
                more
              </button>
            )}
          </div>
        )}

        {/* View all comments link */}
        <button
          type="button"
          onClick={() => onCommentClick(post)}
          className="text-xs text-[var(--text-muted)] font-medium pt-0.5 hover:underline cursor-pointer block"
        >
          View all {Math.max(post.comments || 0, 8)} comments
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
    </article>
  );
};

export default PostCard;
