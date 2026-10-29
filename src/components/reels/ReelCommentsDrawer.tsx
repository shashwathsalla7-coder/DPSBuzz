'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Heart } from 'lucide-react';
import { DataStore, type Profile } from '@/lib/dataStore';
import { getAvatarColorPair } from '@/config/tokens';

interface CommentItem {
  id: string;
  username: string;
  text: string;
  timeAgo: string;
  avatar?: string | null;
}

interface ReelCommentsDrawerProps {
  isOpen: boolean;
  reelId: string;
  onClose: () => void;
  onCommentAdded?: () => void;
}

export const ReelCommentsDrawer: React.FC<ReelCommentsDrawerProps> = ({
  isOpen,
  reelId,
  onClose,
  onCommentAdded,
}) => {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentText, setCommentText] = useState('');
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && reelId) {
      setCurrentUser(DataStore.getCurrentUser());
      loadComments();
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen, reelId]);

  const loadComments = () => {
    if (!reelId) return;
    try {
      const allComments = DataStore.getAllCommentsMap();
      const reelComments = allComments[reelId] || [];
      setComments(reelComments);
    } catch {
      setComments([]);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed || !currentUser) return;

    DataStore.addComment(reelId, currentUser.username, trimmed);
    setCommentText('');
    loadComments();
    onCommentAdded?.();

    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md h-[68vh] sm:h-[620px] bg-[var(--surface)] border border-[var(--line)] rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar on mobile */}
        <div className="w-full flex items-center justify-center pt-2.5 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-[var(--line)]" />
        </div>

        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--line)]">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[var(--text)]">Comments</h3>
            <span className="text-xs text-[var(--text-muted)] font-mono font-semibold">
              ({comments.length})
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Comments List */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {comments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[var(--text-muted)]">
              <span className="text-3xl mb-2">💬</span>
              <p className="text-sm font-bold text-[var(--text)]">No comments yet</p>
              <p className="text-xs mt-0.5">Be the first to drop a comment on this reel!</p>
            </div>
          ) : (
            comments.map((c) => {
              const authorProf = DataStore.getProfileByUsername(c.username);
              const avatar = c.avatar || authorProf?.avatar || null;
              const color = getAvatarColorPair(c.username);
              const initials = (authorProf?.fullName || c.username || 'ST').slice(0, 2).toUpperCase();

              return (
                <div key={c.id} className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 mt-0.5 border border-[var(--line)]">
                    {avatar ? (
                      <img src={avatar} alt={c.username} className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-[10px] font-bold"
                        style={{ backgroundColor: color.bg, color: color.text }}
                      >
                        {initials}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-bold text-[var(--text)] hover:underline cursor-pointer">
                        @{c.username}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] font-medium">
                        {c.timeAgo || 'Recently'}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text)] mt-0.5 leading-relaxed break-words">
                      {c.text}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Comment Input */}
        <form
          onSubmit={handleSubmit}
          className="p-3 border-t border-[var(--line)] bg-[var(--surface)] flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment on this reel..."
            className="flex-1 h-10 px-4 rounded-full bg-[var(--surface-sunken)] border border-[var(--line)] text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--primary)]"
          />
          <button
            type="submit"
            disabled={!commentText.trim()}
            className="w-10 h-10 rounded-full bg-[var(--primary)] text-white flex items-center justify-center disabled:opacity-40 hover:opacity-95 transition-opacity cursor-pointer shrink-0"
            aria-label="Send comment"
          >
            <Send size={15} className="translate-x-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReelCommentsDrawer;
