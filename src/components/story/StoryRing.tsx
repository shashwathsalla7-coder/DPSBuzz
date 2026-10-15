'use client';

import React from 'react';
import { getAvatarColorPair } from '@/config/tokens';

export interface StoryRingProps {
  variant: 'unseen' | 'seen' | 'your-story' | 'reward';
  username: string;
  name?: string;
  avatarUrl?: string | null;
  isNew?: boolean;
  size?: 'md' | 'lg'; // 'md' for compact (62px), 'lg' for enlarged prominent stories (74px)
  className?: string;
  hasStory?: boolean;
  isActive?: boolean;
  onAddStory?: () => void;
  onClick?: () => void;
}

/**
 * StoryRing Component
 * - Unseen ring: Instagram vibrant orange-pink gradient ring
 * - Seen ring: Visible soft off-white ring when stories are already seen
 * - Active indicator: Green dot badge showing user is active
 * - Displays username consistently
 */
export const StoryRing: React.FC<StoryRingProps> = ({
  variant,
  username,
  name,
  avatarUrl,
  isNew = false,
  size = 'lg',
  className = '',
  hasStory = false,
  isActive = false,
  onAddStory,
  onClick,
}) => {
  const isLg = size === 'lg';
  const identifier = username || name || 'student';
  const colors = getAvatarColorPair(identifier);
  const initials = (name || username || 'ST')
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Avatar diameter: 75px for 'lg' (outer 88px Instagram standard), 56px for 'md'
  const avatarClass = isLg ? 'w-[75px] h-[75px] text-base' : 'w-[56px] h-[56px] text-xs';

  const innerAvatar = avatarUrl ? (
    <img
      src={avatarUrl}
      alt={username}
      className={`${avatarClass} rounded-full object-cover shrink-0 select-none`}
    />
  ) : (
    <div
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
      }}
      className={`${avatarClass} rounded-full flex items-center justify-center font-bold select-none shrink-0 tabular-nums`}
    >
      {initials}
    </div>
  );

  const outerRingClass = isLg ? 'story-ring-lg' : '';

  if (variant === 'your-story') {
    if (hasStory) {
      // Active story: Instagram vibrant gradient ring + plus badge to add more
      return (
        <div className="relative inline-block">
          <button
            type="button"
            onClick={onClick}
            className={`story-ring-unseen ${outerRingClass} cursor-pointer transition-transform duration-150 hover:scale-[1.03] active:scale-[0.97] ${className}`}
            aria-label="View your story"
          >
            <div className={`story-ring-inner ${isLg ? 'p-[3px]' : ''}`}>
              {innerAvatar}
            </div>
          </button>
          {onAddStory && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddStory();
              }}
              className={`story-plus-badge ${isLg ? 'story-plus-badge-lg' : ''} cursor-pointer hover:scale-110 active:scale-95 transition-transform`}
              aria-label="Add to story"
            >
              +
            </button>
          )}
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={onClick}
        className={`story-ring-your-story ${outerRingClass} cursor-pointer transition-transform duration-150 hover:scale-[1.03] active:scale-[0.97] ${className}`}
        aria-label="Create your story"
      >
        <div
          className={`${avatarClass} rounded-full flex items-center justify-center font-semibold select-none`}
          style={{
            backgroundColor: 'var(--surface-sunken)',
            color: 'var(--text-muted)',
          }}
        >
          {innerAvatar}
        </div>
        {/* Plus badge with 2px white border */}
        <div className={`story-plus-badge ${isLg ? 'story-plus-badge-lg' : ''}`} aria-hidden="true">
          +
        </div>
      </button>
    );
  }

  const ringClass =
    variant === 'unseen'
      ? `story-ring-unseen ${isNew ? 'story-ring-pulse' : ''}`
      : variant === 'seen'
      ? 'story-ring-seen'
      : 'story-ring-reward';

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={onClick}
        className={`${ringClass} ${outerRingClass} cursor-pointer transition-transform duration-150 hover:scale-[1.03] active:scale-[0.97] ${className}`}
        aria-label={`View story by ${username}`}
      >
        <div className={`story-ring-inner ${isLg ? 'p-[3px]' : ''}`}>
          {innerAvatar}
        </div>
      </button>
      {isActive && (
        <span
          className={`absolute bottom-0.5 right-0.5 rounded-full bg-emerald-500 ring-[2.5px] ring-[var(--surface,#171C26)] z-20 pointer-events-none shadow-sm ${
            isLg ? 'w-4 h-4' : 'w-3 h-3'
          }`}
          title={`@${username} is active now`}
          aria-label={`@${username} is active now`}
        />
      )}
    </div>
  );
};

export default StoryRing;
