'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  X,
  Search,
  Send,
  Check,
  Copy,
  Share2,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Play,
} from 'lucide-react';
import { DataStore, type Post, type Profile } from '@/lib/dataStore';
import { getAvatarColorPair } from '@/config/tokens';

interface SharePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post | null;
  onPostShared?: (recipients: string[]) => void;
}

export const SharePostModal: React.FC<SharePostModalProps> = ({
  isOpen,
  onClose,
  post,
  onPostShared,
}) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [optionalMessage, setOptionalMessage] = useState('');
  const [sentUsernames, setSentUsernames] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastActionUser, setToastActionUser] = useState<string | null>(null);

  const currentUser = useMemo(() => DataStore.getCurrentUser(), []);

  // Reset state when opening/closing
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedRecipients([]);
      setOptionalMessage('');
      setSentUsernames(new Set());
      setToastMessage(null);
      setToastActionUser(null);
    }
  }, [isOpen]);

  const friendsList = useMemo(() => {
    if (!currentUser || !currentUser.username || currentUser.username.toLowerCase() === 'guest') {
      return [];
    }
    const myUser = currentUser.username.toLowerCase().trim();
    const isShashwath = myUser === 'shashwath71845';

    // Get following list
    const following = DataStore.getFollowing(myUser).map((u) => u.username.toLowerCase());
    const followedSet = new Set(following);

    // Get all profiles
    const profiles = DataStore.getProfiles().filter((p) => {
      if (!p || !p.username) return false;
      const u = p.username.toLowerCase().trim();
      if (u === myUser || u === 'admin') return false;
      if (p.role === 'admin' && !isShashwath && u !== 'shashwath71845') return false;
      return true;
    });

    // Following first, then others
    const followedProfiles = profiles.filter((p) => followedSet.has(p.username.toLowerCase()));
    const otherProfiles = profiles.filter((p) => !followedSet.has(p.username.toLowerCase()));
    const combined = [...followedProfiles, ...otherProfiles];

    if (!searchQuery.trim()) return combined;
    const q = searchQuery.toLowerCase().trim();
    return combined.filter(
      (p) =>
        p.username.toLowerCase().includes(q) ||
        p.fullName.toLowerCase().includes(q) ||
        (p.class && p.class.toLowerCase().includes(q))
    );
  }, [currentUser, searchQuery]);

  if (!isOpen || !post) return null;

  const showToast = (msg: string, actionUser?: string) => {
    setToastMessage(msg);
    setToastActionUser(actionUser || null);
    setTimeout(() => {
      setToastMessage(null);
      setToastActionUser(null);
    }, 4500);
  };

  const isVideo = Boolean(
    post?.isVideo ||
    post?.videoUrl ||
    (post?.imageUrl && (post.imageUrl.endsWith('.mp4') || post.imageUrl.includes('/video/upload/')))
  );

  const postImage =
    post?.imageUrl ||
    post?.videoUrl ||
    (post?.images && post.images.length > 0 ? post.images[0] : null) ||
    (post?.postImages && post.postImages.length > 0 ? post.postImages[0].url : null);

  const handleSendToUser = (targetUsername: string) => {
    const cleanTarget = targetUsername.toLowerCase().trim();
    DataStore.sharePostToChat(post, [cleanTarget], currentUser.username, optionalMessage.trim() || undefined);
    setSentUsernames((prev) => new Set([...prev, cleanTarget]));
    onPostShared?.([cleanTarget]);

    showToast(`Post sent to @${cleanTarget}! 💬`, cleanTarget);
  };

  const handleBulkSend = () => {
    if (selectedRecipients.length === 0) return;
    DataStore.sharePostToChat(
      post,
      selectedRecipients,
      currentUser.username,
      optionalMessage.trim() || undefined
    );

    const firstUser = selectedRecipients[0];
    const count = selectedRecipients.length;
    setSentUsernames((prev) => new Set([...prev, ...selectedRecipients]));
    onPostShared?.(selectedRecipients);

    showToast(
      count === 1
        ? `Post sent to @${firstUser}! 💬`
        : `Post sent to ${count} friends in chat! 🚀`,
      firstUser
    );

    setTimeout(() => {
      onClose();
    }, 900);
  };

  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}/home#post-${post.id}`;
      await navigator.clipboard.writeText(url);
      showToast('Post link copied to clipboard! 📋');
    } catch {
      showToast('Could not copy link');
    }
  };

  const handleShareExternal = async () => {
    const url = `${window.location.origin}/home#post-${post.id}`;
    const shareData = {
      title: `DPS Buzz • @${post.username}'s Post`,
      text: post.caption ? `"${post.caption}"` : `Check out @${post.username}'s post on DPS Buzz!`,
      url,
    };
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        showToast('Shared successfully! 🚀');
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          await navigator.clipboard.writeText(url);
          showToast('Post link copied to clipboard! 📋');
        }
      }
    } else {
      await navigator.clipboard.writeText(url);
      showToast('Post link copied to clipboard! 📋');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center select-none animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-60 px-4 py-2.5 rounded-full bg-zinc-900/95 text-white border border-zinc-700/60 shadow-2xl flex items-center gap-3 animate-bounce-in max-w-sm">
          <span className="text-xs font-semibold">{toastMessage}</span>
          {toastActionUser && (
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push(`/chats?user=${toastActionUser}`);
              }}
              className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white gradient-bg hover:opacity-90 transition-opacity flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>View Chat</span>
              <ArrowRight size={10} />
            </button>
          )}
        </div>
      )}

      {/* Share Sheet Content */}
      <div
        className="relative w-full max-w-md rounded-t-[28px] sm:rounded-[28px] border p-4 shadow-2xl z-10 space-y-3.5 animate-slide-up"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--line)',
          maxHeight: '90vh',
        }}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 rounded-full bg-[var(--line-strong)] mx-auto" />

        {/* Header */}
        <div className="flex items-center justify-between pb-1.5 border-b border-[var(--line)]">
          <div>
            <h3 className="font-bold text-sm text-[var(--text)] flex items-center gap-1.5">
              <span>Share Post to Chat</span>
              <Sparkles size={14} className="text-pink-500" />
            </h3>
            <p className="text-[11px] text-[var(--text-muted)]">
              Send directly to classmates with real-time post preview
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer"
            aria-label="Close share sheet"
          >
            <X size={18} />
          </button>
        </div>

        {/* Post Preview Thumbnail Card */}
        <div className="p-2 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--line)] flex items-center gap-3">
          {isVideo ? (
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-cyan-500/30 flex items-center justify-center shrink-0 relative overflow-hidden">
              {postImage ? (
                <video
                  src={postImage}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                />
              ) : null}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Play size={14} className="text-white fill-white" />
              </div>
            </div>
          ) : postImage ? (
            <img
              src={postImage}
              alt={post.caption || 'Post image'}
              className="w-12 h-12 rounded-xl object-cover border border-black/10 shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl gradient-bg text-white flex items-center justify-center font-bold text-base shrink-0">
              📸
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[var(--text)] truncate">
              @{post.username}&apos;s {isVideo ? 'Video' : 'Post'}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
              {post.caption ? post.caption : (isVideo ? 'Video post on DPS Buzz' : 'Photo post on DPS Buzz')}
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search friends, classmates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-8 rounded-xl text-xs border outline-none bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text)] transition-colors focus:border-pink-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] p-0.5"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Friends List with Instant 1-Tap "Send" & Multi-Select */}
        <div className="space-y-1 max-h-52 overflow-y-auto pr-1 no-scrollbar divide-y divide-[var(--line)]/50">
          {friendsList.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--text-muted)]">
              No classmates found matching &ldquo;{searchQuery}&rdquo;
            </div>
          ) : (
            friendsList.map((friend) => {
              const isSelected = selectedRecipients.includes(friend.username);
              const isAlreadySent = sentUsernames.has(friend.username.toLowerCase());
              const pair = getAvatarColorPair(friend.username);

              return (
                <div
                  key={friend.username}
                  className="py-2 px-1.5 flex items-center justify-between gap-2.5 rounded-xl hover:bg-[var(--surface-sunken)] transition-colors"
                >
                  {/* Left: Checkbox + Avatar + Info */}
                  <div
                    onClick={() => {
                      setSelectedRecipients((prev) =>
                        prev.includes(friend.username)
                          ? prev.filter((u) => u !== friend.username)
                          : [...prev, friend.username]
                      );
                    }}
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                  >
                    {/* Multi-select check bubble */}
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'bg-pink-500 border-pink-500 text-white'
                          : 'border-[var(--line)] bg-[var(--surface)]'
                      }`}
                    >
                      {isSelected && <Check size={10} strokeWidth={3} />}
                    </div>

                    {/* Avatar */}
                    {friend.avatar ? (
                      <img
                        src={friend.avatar}
                        alt={friend.fullName}
                        className="w-9 h-9 rounded-full object-cover border border-[var(--line)] shrink-0"
                      />
                    ) : (
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                        style={{ backgroundColor: pair.bg, color: pair.text }}
                      >
                        {friend.fullName.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    {/* Name & Username */}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[var(--text)] truncate">
                        {friend.fullName}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)] truncate">
                        @{friend.username} {friend.class && `• Class ${friend.class}-${friend.section || 'A'}`}
                      </p>
                    </div>
                  </div>

                  {/* Right: Instant Send Button */}
                  <button
                    type="button"
                    disabled={isAlreadySent}
                    onClick={() => handleSendToUser(friend.username)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                      isAlreadySent
                        ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                        : 'text-white gradient-bg shadow-xs hover:opacity-90 active:scale-95'
                    }`}
                  >
                    {isAlreadySent ? (
                      <>
                        <Check size={12} strokeWidth={2.5} />
                        <span>Sent</span>
                      </>
                    ) : (
                      <>
                        <Send size={11} className="-rotate-12" />
                        <span>Send</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Optional Message input */}
        <div className="pt-1">
          <input
            type="text"
            placeholder="Write a message... (optional)"
            value={optionalMessage}
            onChange={(e) => setOptionalMessage(e.target.value)}
            className="w-full h-9 px-3 rounded-xl text-xs border outline-none bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text)] transition-colors focus:border-pink-500"
          />
        </div>

        {/* Quick External Actions & Bulk Send Button */}
        <div className="pt-2 border-t border-[var(--line)] space-y-2">
          {/* External Share Row */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer hover:bg-[var(--surface-sunken)] active:scale-95 transition-all text-[var(--text)]"
              style={{ borderColor: 'var(--line)' }}
            >
              <Copy size={13} className="text-pink-500" />
              <span>Copy Link</span>
            </button>

            <button
              type="button"
              onClick={handleShareExternal}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer hover:bg-[var(--surface-sunken)] active:scale-95 transition-all text-[var(--text)]"
              style={{ borderColor: 'var(--line)' }}
            >
              <Share2 size={13} className="text-pink-500" />
              <span>Share via Apps</span>
            </button>
          </div>

          {/* Primary Action Button */}
          {selectedRecipients.length > 0 && (
            <button
              type="button"
              onClick={handleBulkSend}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white gradient-bg shadow-sm hover:opacity-90 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer animate-fade-in"
            >
              <Send size={14} className="-rotate-12" />
              <span>
                {selectedRecipients.length === 1
                  ? `Send to @${selectedRecipients[0]}`
                  : `Send to ${selectedRecipients.length} Friends in Chat`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SharePostModal;
