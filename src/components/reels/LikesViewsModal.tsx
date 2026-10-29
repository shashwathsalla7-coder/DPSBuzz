'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  Heart,
  Eye,
  UserCheck,
  UserPlus,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';
import { DataStore, type Profile } from '@/lib/dataStore';
import { getAvatarColorPair } from '@/config/tokens';

interface LikesViewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  postAuthor?: string;
  currentUser?: Profile | null;
}

export const LikesViewsModal: React.FC<LikesViewsModalProps> = ({
  isOpen,
  onClose,
  postId,
  postAuthor,
  currentUser,
}) => {
  const [likers, setLikers] = useState<
    Array<{
      username: string;
      fullName: string;
      avatar: string | null;
      class?: string;
      isFollowing: boolean;
      isViewer: boolean;
    }>
  >([]);
  const [viewsCount, setViewsCount] = useState(0);
  const [likesCount, setLikesCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen && postId) {
      loadStats();
    }
  }, [isOpen, postId, currentUser?.username]);

  const loadStats = () => {
    try {
      const views = DataStore.getPostViews(postId);
      const likes = DataStore.getPostLikes(postId);
      const list = DataStore.getPostLikersWithStatus(postId, currentUser?.username);

      setViewsCount(views);
      setLikesCount(likes);
      setLikers(list);

      const fStates: Record<string, boolean> = {};
      list.forEach((item) => {
        fStates[item.username] = item.isFollowing;
      });
      setFollowingStates(fStates);
    } catch {
      setLikers([]);
      setViewsCount(0);
      setLikesCount(0);
    }
  };

  if (!isOpen) return null;

  const handleToggleFollow = (targetUsername: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser?.username || currentUser.username.toLowerCase() === targetUsername.toLowerCase()) {
      return;
    }
    const isNowFollowing = DataStore.toggleFollow(currentUser.username, targetUsername);
    setFollowingStates((prev) => ({
      ...prev,
      [targetUsername]: isNowFollowing,
    }));
  };

  const filteredLikers = likers.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return item.username.toLowerCase().includes(q) || item.fullName.toLowerCase().includes(q);
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-[var(--surface-overlay,#18181b)] border border-white/10 rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up sm:animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-500/15 text-rose-500 flex items-center justify-center">
              <Heart size={16} className="fill-current" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Likes & Views</h2>
              {postAuthor && (
                <p className="text-[11px] text-white/50">Post by @{postAuthor}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Real Stats Metrics Strip */}
        <div className="grid grid-cols-2 gap-3 px-5 py-3.5 bg-white/[0.02] border-b border-white/5">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
              <Eye size={18} />
            </div>
            <div>
              <div className="text-lg font-black text-white tabular-nums">{viewsCount}</div>
              <div className="text-[11px] text-white/60 font-medium">Real Views</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
            <div className="w-9 h-9 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
              <Heart size={18} className="fill-current" />
            </div>
            <div>
              <div className="text-lg font-black text-white tabular-nums">{likesCount}</div>
              <div className="text-[11px] text-white/60 font-medium">Genuine Likes</div>
            </div>
          </div>
        </div>

        {/* Search Likers Filter */}
        {likers.length > 3 && (
          <div className="px-5 pt-3 pb-1">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search who liked..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[var(--primary)]"
              />
            </div>
          </div>
        )}

        {/* Likers List Body */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2 no-scrollbar">
          {filteredLikers.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-white/5 text-white/30 flex items-center justify-center mx-auto">
                <Users size={22} />
              </div>
              <p className="text-sm font-semibold text-white/70">
                {likers.length === 0 ? 'No likes yet' : 'No matching classmates'}
              </p>
              <p className="text-xs text-white/40 max-w-xs mx-auto">
                {likers.length === 0
                  ? 'Double-tap or tap the heart icon on this reel to be the first to like!'
                  : 'Try searching with another name or username.'}
              </p>
            </div>
          ) : (
            filteredLikers.map((user) => {
              const color = getAvatarColorPair(user.username);
              const initials = user.fullName.slice(0, 2).toUpperCase();
              const isFollowing = followingStates[user.username] ?? user.isFollowing;

              return (
                <div
                  key={user.username}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <Link
                    href={`/u/${user.username}`}
                    onClick={onClose}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/20">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-xs font-bold"
                          style={{ backgroundColor: color.bg, color: color.text }}
                        >
                          {initials}
                        </div>
                      )}
                    </div>
                    <div className="truncate min-w-0">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-xs font-bold text-white hover:underline truncate">
                          {user.fullName}
                        </span>
                        <Heart size={11} className="fill-rose-500 text-rose-500 shrink-0" />
                      </div>
                      <div className="text-[11px] text-white/50 truncate">
                        @{user.username}
                        {user.class ? ` • ${user.class}` : ''}
                      </div>
                    </div>
                  </Link>

                  {/* Follow Button / Indicator */}
                  <div className="shrink-0 ml-2">
                    {user.isViewer ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/10 text-white/70 border border-white/15">
                        You
                      </span>
                    ) : currentUser?.username ? (
                      <button
                        type="button"
                        onClick={(e) => handleToggleFollow(user.username, e)}
                        className={`px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
                          isFollowing
                            ? 'bg-white/10 border-white/20 text-white/90 hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-300'
                            : 'bg-[var(--primary)] border-transparent text-white shadow-md shadow-pink-500/20 hover:opacity-90'
                        }`}
                      >
                        {isFollowing ? (
                          <>
                            <UserCheck size={12} />
                            <span>Following</span>
                          </>
                        ) : (
                          <>
                            <UserPlus size={12} />
                            <span>Follow</span>
                          </>
                        )}
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Safe-Area Footer note */}
        <div className="px-5 py-2.5 bg-black/40 border-t border-white/5 flex items-center justify-between text-[11px] text-white/40">
          <span>Genuine real-time school activity</span>
          <span>DPS Buzz Verification ✓</span>
        </div>
      </div>
    </div>
  );
};
