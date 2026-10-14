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
 * Chip component adhering strictly to DESIGN.md and Master Prompt radius override:
 * - 6px radius (var(--r-sm))
 * - 32px standard height (md)
 * - Selected state in var(--primary-tint) with var(--primary) text
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
      style={{ borderRadius: 'var(--r-sm)' }}
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 transition-colors font-sans
        border select-none
        ${size === 'sm' ? 'h-6 px-2 text-xs font-medium' : 'h-8 px-2.5 text-xs font-semibold'}
        ${isClickable ? 'cursor-pointer' : ''}
        ${
          selected
            ? 'bg-[var(--primary-tint)] text-[var(--primary)] border-[var(--primary)]/30'
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
