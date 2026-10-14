'use client';

import { useEffect, type FC } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';

export type ToastType = 'info' | 'success' | 'danger';

export interface ToastProps {
  message: string;
  type?: ToastType;
  isVisible: boolean;
  onClose: () => void;
  durationMs?: number;
}

/**
 * Toast component adhering strictly to DESIGN.md Section 9.7:
 * - Positioned at bottom above the tab bar
 * - 3 seconds duration
 * - 10px radius (var(--r-md))
 * - --elev-1 shadow, one line of plain text
 */
export const Toast: FC<ToastProps> = ({
  message,
  type = 'info',
  isVisible,
  onClose,
  durationMs = 3000,
}) => {
  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => {
      onClose();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [isVisible, durationMs, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 flex justify-center pointer-events-none animate-slide-up">
      <div
        style={{
          borderRadius: 'var(--r-md)',
          boxShadow: 'var(--elev-1)',
        }}
        className={`
          pointer-events-auto max-w-sm w-full p-3.5 flex items-center justify-between gap-3
          bg-[var(--surface)] border text-xs font-semibold
          ${
            type === 'success'
              ? 'border-[var(--success)]/40 text-[var(--success)]'
              : type === 'danger'
              ? 'border-[var(--danger)]/40 text-[var(--danger)]'
              : 'border-[var(--line)] text-[var(--text)]'
          }
        `}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {type === 'success' && <CheckCircle2 size={16} className="shrink-0" />}
          {type === 'danger' && <AlertCircle size={16} className="shrink-0" />}
          {type === 'info' && <AlertTriangle size={16} className="shrink-0 text-[var(--primary)]" />}
          <span className="truncate">{message}</span>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer shrink-0"
          aria-label="Dismiss notification"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default Toast;
