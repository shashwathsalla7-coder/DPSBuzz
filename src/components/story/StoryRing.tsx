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
  onAddStory?: () => void;
  onClick?: () => void;
}

/**
 * StoryRing Component (DESIGN.md Section 9.3 & Master Prompt Quality Pass Override)
 * 
 * - Exception to "no orange": orange allowed inside story rings & text backgrounds only.
 * - Unseen ring: outer ring with 3px linear-gradient(135deg, #FF8A1F 0%, #FF2E93 35%, #A855F7 68%, #3B82F6 100%),
 *   then 2px WHITE (#FFFFFF) inner ring in both light and dark mode.
 * - Dark mode only: 0 0 10px rgba(255,70,150,.45) glow on unseen ring.
 * - Seen ring: flat #C4CCD8 in light, #3A4357 in dark. Inner ring is page colour in dark mode, not white.
 * - Your story: dashed ring in line-strong colour, primary plus badge with 2px white border.
 * - New story: one 1s pulse of the ring (scale 1 > 1.04 > 1), then still. Respects reduced-motion.
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
  );
};

export default StoryRing;
