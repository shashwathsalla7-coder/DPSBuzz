'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Trophy, Star } from 'lucide-react';
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
  currentUsername?: string;
}

export const HeroCard: React.FC<HeroCardProps> = ({
  winners = [],
  onFollowToggle,
  isFollowing,
  currentUsername,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!winners || winners.length === 0) {
    return null; // Hidden when there are no ranks yet
  }

  const currentWinner = winners[activeIndex] || winners[0];
  const profile = currentWinner.profile;
  const followingState = isFollowing ? isFollowing(profile.username) : false;
  const avatarColor = getAvatarColorPair(profile.username);
  const initials = (profile.fullName || profile.username || 'ST').slice(0, 2).toUpperCase();

  return (
    <div className="mx-4 my-2 select-none">
      <div
        className="w-full rounded-[20px] border p-4.5 relative overflow-hidden transition-all shadow-sm"
        style={{
          backgroundColor: 'var(--primary-tint)',
          borderColor: 'var(--line)',
        }}
      >
        {/* Top Header Label */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs"
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
              Star of the Week
            </span>
          </div>

          <span
            className="text-[11px] font-bold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: 'var(--surface)',
              color: 'var(--primary)',
              border: '1px solid var(--line)',
            }}
          >
            Rank #1
          </span>
        </div>

        {/* Content Row: Avatar, Name, Class, Followers, Follow button */}
        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/u/${profile.username}`}
            className="flex items-center gap-3 min-w-0"
          >
            <div
              className="w-14 h-14 rounded-full overflow-hidden shrink-0 flex items-center justify-center font-bold text-base border-2"
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
              <p className="text-[11px] text-[var(--primary)] font-bold mt-0.5 tabular-nums">
                {profile.followerCount ?? 0} {profile.followerCount === 1 ? 'follower' : 'followers'}
              </p>
            </div>
          </Link>

          {/* Follow Button (hidden for oneself) */}
          {(!currentUsername || profile.username.toLowerCase().trim() !== currentUsername.toLowerCase().trim()) && (
            <button
              type="button"
              onClick={() => onFollowToggle?.(profile.username)}
              className="px-4 py-2 rounded-full text-xs font-bold transition-all btn-press shrink-0 shadow-xs cursor-pointer"
              style={{
                backgroundColor: followingState ? 'var(--surface)' : 'var(--primary)',
                color: followingState ? 'var(--text)' : 'var(--on-primary)',
                border: followingState ? '1px solid var(--line)' : 'none',
              }}
            >
              {followingState ? 'Following' : 'Follow'}
            </button>
          )}
        </div>

        {/* Carousel Dots if there are several winners */}
        {winners.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {winners.map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                onClick={() => setActiveIndex(dotIdx)}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: dotIdx === activeIndex ? '16px' : '6px',
                  backgroundColor:
                    dotIdx === activeIndex ? 'var(--primary)' : 'var(--line-strong)',
                }}
                aria-label={`Go to winner ${dotIdx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroCard;
