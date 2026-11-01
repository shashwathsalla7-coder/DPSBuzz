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
 * Card component adhering to Unified Calm Design System:
 * - Exactly 14px radius (about 14px moderate curves)
 * - 1px border border-[var(--line)]
 * - Flat solid background (var(--surface)), no card gradients
 * - Very subtle shadow (shadow-xs)
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ padding = 'md', sunken = false, className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          border border-[var(--line)] rounded-[14px] overflow-hidden transition-colors shadow-xs
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
