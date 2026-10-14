'use client';

import { type FC, type ReactNode } from 'react';
import Button from './Button';

export type DoodleType = 'notebook' | 'bell' | 'pencil' | 'trophy' | 'search';

export interface EmptyStateProps {
  title: string;
  description?: string;
  doodle?: DoodleType;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const doodleIcons: Record<DoodleType, ReactNode> = {
  notebook: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
      <path d="M6 6h10" />
      <path d="M6 10h10" />
      <path d="M6 14h6" />
    </svg>
  ),
  bell: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  ),
  pencil: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  ),
  trophy: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1h10v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34" />
      <path d="M6 4h12v6c0 3.31-2.69 6-6 6s-6-2.69-6-6V4Z" />
    </svg>
  ),
  search: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
};

/**
 * EmptyState component strictly adhering to DESIGN.md Section 9.9 & 11:
 * - Left-aligned text (never generic centered AI placeholder boxes)
 * - Single subtle 2px doodle off to the side/corner
 * - Authentic Indian school tone
 * - One optional action button
 */
export const EmptyState: FC<EmptyStateProps> = ({
  title,
  description,
  doodle = 'notebook',
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      style={{ borderRadius: 'var(--r-lg)' }}
      className={`
        p-6 bg-[var(--surface)] border border-[var(--line)] text-left
        space-y-4 font-sans ${className}
      `}
    >
      {/* 2px line school doodle */}
      <div
        style={{ borderRadius: 'var(--r-md)' }}
        className="w-12 h-12 bg-[var(--surface-sunken)] border border-[var(--line)] flex items-center justify-center text-[var(--text-muted)]"
      >
        {doodleIcons[doodle]}
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-bold font-display text-[var(--text)] tracking-tight">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actionLabel && onAction && (
        <div className="pt-1">
          <Button variant="secondary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
