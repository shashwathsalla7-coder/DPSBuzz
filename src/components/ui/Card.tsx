'use client';

import { forwardRef, type HTMLAttributes } from 'react';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding;
  sunken?: boolean;
}

const paddingStyles: Record<CardPadding, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

/**
 * Card component adhering strictly to DESIGN.md and Master Prompt radius override:
 * - Exactly 12px radius (var(--r-lg))
 * - 1px var(--line) border
 * - Flat solid var(--surface) background
 * - No soft shadows or glassmorphism
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ padding = 'md', sunken = false, className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        style={{ borderRadius: 0 }}
        className={`
          border border-[var(--line)] overflow-hidden transition-colors rounded-none
          ${sunken ? 'bg-[var(--surface-sunken)]' : 'bg-[var(--surface)]'}
          ${paddingStyles[padding]}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
export default Card;
