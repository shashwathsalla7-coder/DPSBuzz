'use client';

import { type FC, type ReactNode } from 'react';
import { X } from 'lucide-react';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  icon?: ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Chip component adhering to Unified Calm Design System:
 * - Fully round pill shape (rounded-full)
 * - Clean neutral styling with single blue accent when selected
 * - Minimum accessible tap target
 */
export const Chip: FC<ChipProps> = ({
  label,
  selected = false,
  onClick,
  onRemove,
  icon,
  size = 'md',
  className = '',
}) => {
  const isClickable = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 transition-colors font-sans rounded-full
        border select-none
        ${size === 'sm' ? 'h-8 px-3 text-xs font-medium' : 'h-9 px-3.5 text-xs font-semibold'}
        ${isClickable ? 'cursor-pointer' : ''}
        ${
          selected
            ? 'bg-[var(--primary)] text-white border-transparent shadow-xs'
            : 'bg-[var(--surface-sunken)] text-[var(--text)] border-[var(--line)] hover:bg-[var(--line)]/50'
        }
        ${className}
      `}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--danger)] cursor-pointer"
          aria-label={`Remove ${label}`}
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
};

export default Chip;
