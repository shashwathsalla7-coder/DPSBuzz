'use client';

import { useEffect, type FC, type ReactNode } from 'react';
import { X } from 'lucide-react';

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxHeight?: string;
}

/**
 * Bottom sheet component adhering strictly to DESIGN.md and Master Prompt radius override:
 * - Top corners only: 16px radius (var(--r-sheet))
 * - Grabber: 4px x 36px in var(--line-strong)
 * - 280ms smooth slide-up
 */
export const Sheet: FC<SheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxHeight = 'max-h-[85vh]',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          borderTopLeftRadius: 'var(--r-sheet)',
          borderTopRightRadius: 'var(--r-sheet)',
          boxShadow: 'var(--elev-1)',
        }}
        className={`
          w-full max-w-lg bg-[var(--surface)] border-t border-[var(--line)]
          p-6 space-y-4 animate-slide-up overflow-y-auto ${maxHeight}
        `}
      >
        {/* Grabber per Section 9.7 (4x36px) */}
        <div className="w-9 h-1 rounded-full bg-[var(--line-strong)] mx-auto shrink-0 select-none" />

        {title && (
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-base font-bold font-display text-[var(--text)] tracking-tight">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer"
              aria-label="Close sheet"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div>{children}</div>
      </div>
    </div>
  );
};

export default Sheet;
