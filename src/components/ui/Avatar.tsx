'use client';

import { useState, type FC } from 'react';
import { getAvatarColorPair } from '@/config/tokens';
import { DataStore } from '@/lib/dataStore';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarShape = 'circle' | 'square'; // circle for people, square (10px) for groups
export type AvatarRing = 'none' | 'unseen-story' | 'seen-story' | 'reward';

export interface AvatarProps {
  src?: string | null;
  name: string;
  username?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  ring?: AvatarRing;
  className?: string;
}

const sizeMap: Record<AvatarSize, { px: number; textSize: string; ringPad: string }> = {
  xs: { px: 28, textSize: 'text-[11px]', ringPad: 'p-[2px]' },
  sm: { px: 36, textSize: 'text-xs', ringPad: 'p-[2px]' },
  md: { px: 44, textSize: 'text-sm', ringPad: 'p-[3px]' },
  lg: { px: 64, textSize: 'text-lg', ringPad: 'p-[3px]' },
  xl: { px: 88, textSize: 'text-2xl', ringPad: 'p-[4px]' },
};

/**
 * Avatar component adhering strictly to DESIGN.md:
 * - People are strictly circles
 * - Groups are strictly rounded squares with 10px radius (var(--r-md))
 * - Deterministic color pair from 8 curated pairs based on username/name
 * - Prioritizes uploaded profile picture everywhere across the app
 */
export const Avatar: FC<AvatarProps> = ({
  src,
  name,
  username,
  size = 'md',
  shape = 'circle',
  ring = 'none',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);
  const { px, textSize, ringPad } = sizeMap[size];
  const identifier = username || name || 'student';
  const colors = getAvatarColorPair(identifier);

  // If a profile picture exists on the user profile or in DataStore, ALWAYS display it
  const liveProf = username ? DataStore.getProfileByUsername(username) : null;
  const effectiveSrc = !imgError ? (src || liveProf?.avatar || null) : null;

  const initials = name
    ? name
        .split(' ')
        .filter(Boolean)
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : identifier.substring(0, 2).toUpperCase();

  const isSquare = shape === 'square';
  const borderRadius = isSquare ? 'var(--r-md)' : 'var(--r-full)';

  const avatarElement = effectiveSrc ? (
    <img
      src={effectiveSrc}
      alt={name}
      onError={() => setImgError(true)}
      style={{
        width: `${px}px`,
        height: `${px}px`,
        borderRadius,
      }}
      className="object-cover shrink-0 select-none"
    />
  ) : (
    <div
      style={{
        width: `${px}px`,
        height: `${px}px`,
        borderRadius,
        backgroundColor: colors.bg,
        color: colors.text,
      }}
      className={`flex items-center justify-center font-bold tracking-tight select-none shrink-0 ${textSize}`}
      aria-label={name}
    >
      {initials}
    </div>
  );

  if (ring === 'none') {
    return <div className={`inline-flex shrink-0 ${className}`}>{avatarElement}</div>;
  }

  const ringClass =
    ring === 'unseen-story'
      ? 'story-ring-unseen'
      : ring === 'seen-story'
      ? 'story-ring-seen'
      : 'story-ring-reward';

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 ${ringClass} ${className}`}
      style={{
        width: '62px',
        height: '62px',
        borderRadius: isSquare ? 'calc(var(--r-md) + 3px)' : 'var(--r-full)',
      }}
    >
      <div
        className="story-ring-inner"
        style={{ borderRadius }}
      >
        {avatarElement}
      </div>
    </div>
  );
};

export default Avatar;
