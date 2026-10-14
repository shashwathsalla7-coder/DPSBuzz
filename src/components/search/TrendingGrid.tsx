'use client';

import React from 'react';
import Link from 'next/link';
import { Flame, Heart, Users } from 'lucide-react';
import { type Post, type Profile } from '@/lib/dataStore';
import { getAvatarColorPair } from '@/config/tokens';

export interface TrendingGridProps {
  trendingPosts: Post[];
  suggestedClassmates: Profile[];
  onFollowToggle: (username: string) => void;
  isFollowing: (username: string) => boolean;
  onPostClick?: (post: Post) => void;
  currentUsername?: string;
}

export const TrendingGrid: React.FC<TrendingGridProps> = ({
  trendingPosts,
  suggestedClassmates,
  onFollowToggle,
  isFollowing,
  onPostClick,
  currentUsername,
}) => {
  return (
    <div className="space-y-6 pt-2 pb-6">
      {/* 1. "Trending this week" Section with line flame icon (no emoji) */}
      <section className="px-4">
        <div className="flex items-center gap-2 mb-3 select-none">
          <Flame size={18} strokeWidth={2.2} className="text-[var(--primary)]" />
          <h2
            className="text-sm font-bold tracking-tight text-[var(--text)] uppercase tracking-wider"
            style={{ fontFamily: "var(--font-cabinet), 'Cabinet Grotesk', sans-serif" }}
          >
            Trending this week
          </h2>
        </div>

        {/* 2-column grid of 4:5 photo cards (16px radius) with username and like count overlaid on bottom scrim */}
        <div className="grid grid-cols-2 gap-2.5">
          {trendingPosts.map((post) => {
            const photo = post.imageUrl || (post.images && post.images[0]) || '';
            return (
              <div
                key={post.id}
                onClick={() => onPostClick?.(post)}
                className="w-full aspect-[4/5] rounded-[16px] overflow-hidden relative cursor-pointer group select-none shadow-xs"
                style={{ backgroundColor: 'var(--surface-sunken)' }}
              >
                {photo ? (
                  <img
                    src={photo}
                    alt={`Trending post by ${post.username}`}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-[var(--text-muted)] p-2 text-center">
                    {post.caption?.slice(0, 30) || 'Photo'}
                  </div>
                )}

                {/* Bottom Scrim */}
                <div
                  className="absolute inset-x-0 bottom-0 h-24 pointer-events-none z-10"
                  style={{
                    background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0) 65%)',
                  }}
                />

                {/* Overlaid Username & Like Count at the bottom */}
                <div className="absolute inset-x-0 bottom-2.5 px-3 z-20 flex items-center justify-between text-white text-xs">
                  <span className="font-semibold truncate max-w-[90px] drop-shadow-sm">
                    @{post.username}
                  </span>
                  <div className="flex items-center gap-1 font-bold shrink-0 drop-shadow-sm tabular-nums">
                    <Heart size={12} className="fill-white text-white" />
                    <span>{post.likes}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. "Suggested from your class" Section (horizontal row of student cards with Follow buttons) */}
      {suggestedClassmates.length > 0 && (
        <section className="px-4">
          <div className="flex items-center justify-between mb-3 select-none">
            <div className="flex items-center gap-2">
              <Users size={17} strokeWidth={2.2} className="text-[var(--primary)]" />
              <h2
                className="text-sm font-bold tracking-tight text-[var(--text)] uppercase tracking-wider"
                style={{ fontFamily: "var(--font-cabinet), 'Cabinet Grotesk', sans-serif" }}
              >
                {currentUsername?.toLowerCase() === 'shashwath71845' ? 'All Students in School' : 'Suggested for you'}
              </h2>
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">
              {currentUsername?.toLowerCase() === 'shashwath71845' ? 'Whole School Directory' : 'Classmates & School Admin'}
            </span>
          </div>

          <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 select-none">
            {suggestedClassmates.map((student) => {
              const following = isFollowing(student.username);
              const pair = getAvatarColorPair(student.username);
              const initials = (student.fullName || student.username || 'ST').slice(0, 2).toUpperCase();

              const isShashwathAdmin = student.username?.toLowerCase() === 'shashwath71845';

              return (
                <div
                  key={student.id || student.username}
                  className={`w-36 shrink-0 p-3.5 rounded-[16px] border flex flex-col items-center text-center justify-between transition-colors shadow-xs ${
                    isShashwathAdmin ? 'ring-1 ring-amber-400/50 bg-gradient-to-b from-amber-500/10 to-transparent' : ''
                  }`}
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: isShashwathAdmin ? '#F2B705' : 'var(--line)',
                  }}
                >
                  <Link
                    href={`/u/${student.username}`}
                    className="flex flex-col items-center w-full"
                  >
                    <div
                      className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center font-bold text-sm mb-2 shadow-xs ${
                        isShashwathAdmin ? 'border-2 border-amber-400' : ''
                      }`}
                      style={{
                        backgroundColor: isShashwathAdmin ? '#FFD700' : pair.bg,
                        color: isShashwathAdmin ? '#000000' : pair.text,
                      }}
                    >
                      {student.avatar ? (
                        <img
                          src={student.avatar}
                          alt={student.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{isShashwathAdmin ? '👑' : initials}</span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-[var(--text)] truncate w-full hover:underline flex items-center justify-center gap-1">
                      {isShashwathAdmin ? 'Shashwath' : student.fullName}
                      {isShashwathAdmin && <span className="text-[10px]" title="Super Admin">🛡️</span>}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] truncate w-full font-mono">
                      @{student.username}
                    </p>
                    <span
                      className={`text-[10px] mt-1 font-semibold tabular-nums px-1.5 py-0.5 rounded-full ${
                        isShashwathAdmin
                          ? 'bg-amber-400/15 text-amber-500 font-bold'
                          : 'text-[var(--primary)]'
                      }`}
                    >
                      {isShashwathAdmin ? '👑 School Admin' : `Class ${student.class}-${student.section || 'A'}`}
                    </span>
                  </Link>

                  {(!currentUsername || student.username.toLowerCase().trim() !== currentUsername.toLowerCase().trim()) && (
                    <button
                      type="button"
                      onClick={() => onFollowToggle(student.username)}
                      className="w-full mt-3 py-1.5 rounded-full text-xs font-bold transition-all btn-press cursor-pointer shadow-xs"
                      style={{
                        backgroundColor: following ? 'var(--surface-sunken)' : 'var(--primary)',
                        color: following ? 'var(--text)' : 'var(--on-primary)',
                        border: following ? '1px solid var(--line)' : 'none',
                      }}
                    >
                      {following ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default TrendingGrid;
