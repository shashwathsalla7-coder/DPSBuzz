'use client';

import { type FC } from 'react';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string;
  height?: string;
  style?: React.CSSProperties;
}

/**
 * Skeleton component adhering strictly to DESIGN.md Section 8 & 9.9:
 * - Low-contrast slow shimmer (1.6s) matching final layout
 * - Tokenized corner radii (var(--r-sm), var(--r-md), var(--r-full))
 */
export const Skeleton: FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  style,
}) => {
  const getRadius = () => {
    if (variant === 'circular') return 'var(--r-full)';
    if (variant === 'text') return 'var(--r-sm)';
    return 'var(--r-md)';
  };

  return (
    <div
      style={{
        width,
        height,
        borderRadius: getRadius(),
        ...style,
      }}
      className={`
        bg-[var(--surface-sunken)] border border-[var(--line)]/50
        animate-pulse duration-[1600ms] select-none
        ${className}
      `}
      aria-hidden="true"
    />
  );
};

export const AvatarSkeleton: FC<{ size?: number }> = ({ size = 44 }) => (
  <div className="flex items-center gap-3">
    <Skeleton
      variant="circular"
      style={{ width: `${size}px`, height: `${size}px` } as any}
    />
    <div className="flex-1 space-y-1.5">
      <Skeleton className="h-3.5 w-24" />
      <Skeleton className="h-2.5 w-16" />
    </div>
  </div>
);

export const PostCardSkeleton: FC = () => (
  <div
    style={{ borderRadius: 'var(--r-lg)' }}
    className="bg-[var(--surface)] border border-[var(--line)] p-4 space-y-3"
  >
    <AvatarSkeleton />
    <Skeleton className="w-full aspect-[4/5]" style={{ borderRadius: 'var(--r-md)' } as any} />
    <div className="space-y-2 pt-1">
      <Skeleton className="h-3.5 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  </div>
);

export default Skeleton;
