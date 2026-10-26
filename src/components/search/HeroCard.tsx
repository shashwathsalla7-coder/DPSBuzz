'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { type Profile, DataStore } from '@/lib/dataStore';
import { getAvatarColorPair } from '@/config/tokens';

export interface HeroCardProps {
  winners?: Array<{
    profile: Profile;
    badgeTitle?: string;
    photoUrl?: string;
  }>;
  onFollowToggle?: (username: string) => void;
  isFollowing?: (username: string) => boolean;
  isRequested?: (username: string) => boolean;
  currentUsername?: string;
}

export const HeroCard: React.FC<HeroCardProps> = ({
  winners = [],
  onFollowToggle,
  isFollowing,
  isRequested,
  currentUsername,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartXRef = useRef<number | null>(null);

  if (!winners || winners.length === 0) {
    return null; // Hidden when there are no ranks yet
  }

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : winners.length - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < winners.length - 1 ? prev + 1 : 0));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diff = touchStartXRef.current - e.changedTouches[0].clientX;
    touchStartXRef.current = null;
    if (diff > 40) {
      // Swiped left -> Next rank
      handleNext();
    } else if (diff < -40) {
      // Swiped right -> Previous rank
      handlePrev();
    }
  };

  const currentWinner = winners[activeIndex] || winners[0];
  const profile = currentWinner.profile;
  const followingState = isFollowing ? isFollowing(profile.username) : false;
  const requestedState = !followingState && (isRequested ? isRequested(profile.username) : false);
  const avatarColor = getAvatarColorPair(profile.username);
  const initials = (profile.fullName || profile.username || 'ST').slice(0, 2).toUpperCase();

  const rankBadgeText =
    activeIndex === 0
      ? '🥇 Rank #1'
      : activeIndex === 1
      ? '🥈 Rank #2'
      : activeIndex === 2
      ? '🥉 Rank #3'
      : `⭐ Rank #${activeIndex + 1}`;

  return (
    <div className="mx-4 my-2 select-none">
      <div
        className="w-full rounded-[22px] border p-4.5 relative overflow-hidden transition-all shadow-sm"
        style={{
          backgroundColor: 'var(--primary-tint)',
          borderColor: 'var(--line)',
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Top Header Label */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-xs"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--on-primary)',
              }}
            >
              <Trophy size={13} />
            </span>
            <span
              className="text-xs font-extrabold uppercase tracking-wider"
              style={{
                fontFamily: "var(--font-cabinet), 'Cabinet Grotesk', sans-serif",
                color: 'var(--primary)',
              }}
            >
              {activeIndex === 0 ? 'Star of the Week' : `Star Board Top Rankers`}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: 'var(--surface)',
                color: 'var(--primary)',
                border: '1px solid var(--line)',
              }}
            >
              {rankBadgeText}
            </span>

            {winners.length > 1 && (
              <div className="flex items-center gap-0.5 ml-1">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="w-6 h-6 rounded-full flex items-center justify-center bg-[var(--surface)] border border-[var(--line)] text-[var(--text-muted)] hover:text-[var(--text)] transition cursor-pointer"
                  aria-label="Previous ranker"
                >
                  <ChevronLeft size={13} />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-6 h-6 rounded-full flex items-center justify-center bg-[var(--surface)] border border-[var(--line)] text-[var(--text-muted)] hover:text-[var(--text)] transition cursor-pointer"
                  aria-label="Next ranker"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Row: Avatar, Name, Class, Followers, Follow button */}
        <div className="flex items-center justify-between gap-3 animate-fade-in key={profile.username}">
          <Link
            href={`/u/${profile.username}`}
            className="flex items-center gap-3 min-w-0"
          >
            <div
              className="w-14 h-14 rounded-full overflow-hidden shrink-0 flex items-center justify-center font-bold text-base border-2 shadow-xs"
              style={{
                backgroundColor: avatarColor.bg,
                color: avatarColor.text,
                borderColor: 'var(--surface)',
              }}
            >
              {(profile.avatar || DataStore.getProfileByUsername(profile.username)?.avatar) ? (
                <img
                  src={profile.avatar || DataStore.getProfileByUsername(profile.username)?.avatar || ''}
                  alt={profile.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-bold truncate text-[var(--text)] hover:underline">
                {profile.fullName}
              </h3>
              <p className="text-xs text-[var(--text-muted)] truncate font-medium">
                @{profile.username} · Class {profile.class}-{profile.section || 'A'}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-[var(--primary)] font-bold tabular-nums">
                  {profile.followerCount ?? 0} {profile.followerCount === 1 ? 'follower' : 'followers'}
                </span>
                {(profile.spiritPoints !== undefined && profile.spiritPoints > 0) && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-500 font-bold border border-amber-500/20">
                    ⭐ {profile.spiritPoints} pts
                  </span>
                )}
              </div>
            </div>
          </Link>

          {/* Follow Button (hidden for oneself) */}
          {(!currentUsername || profile.username.toLowerCase().trim() !== currentUsername.toLowerCase().trim()) && (
            <button
              type="button"
              onClick={() => onFollowToggle?.(profile.username)}
              className="px-4 py-2 rounded-full text-xs font-bold transition-all btn-press shrink-0 shadow-xs cursor-pointer"
              style={{
                backgroundColor: followingState || requestedState ? 'var(--surface)' : 'var(--primary)',
                color: followingState || requestedState ? 'var(--text)' : 'var(--on-primary)',
                border: followingState || requestedState ? '1px solid var(--line)' : 'none',
              }}
            >
              {followingState ? 'Following' : requestedState ? 'Requested 🔒' : 'Follow'}
            </button>
          )}
        </div>

        {/* Carousel Dots with Swipe hint */}
        {winners.length > 1 && (
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--line)]">
            <span className="text-[10px] text-[var(--text-muted)] font-medium">
              Swipe or tap arrows to view ranks {winners.length > 2 ? '1-5' : '1-2'}
            </span>
            <div className="flex items-center gap-1.5">
              {winners.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() => setActiveIndex(dotIdx)}
                  className="h-1.5 rounded-full transition-all cursor-pointer"
                  style={{
                    width: dotIdx === activeIndex ? '18px' : '6px',
                    backgroundColor:
                      dotIdx === activeIndex ? 'var(--primary)' : 'var(--line-strong)',
                  }}
                  aria-label={`Go to Rank ${dotIdx + 1}`}
                  title={`Rank #${dotIdx + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroCard;
