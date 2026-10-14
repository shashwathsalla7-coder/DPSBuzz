'use client';

import React from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { type Notice } from '@/lib/dataStore';
import { colors } from '@/config/tokens';

export interface NoticeStripProps {
  notice: Notice | null;
  onDismiss?: (id: string) => void;
  onMarkRead?: (id: string) => void;
}

export const NoticeStrip: React.FC<NoticeStripProps> = ({
  notice,
  onDismiss,
  onMarkRead,
}) => {
  if (!notice) return null;

  const isUrgent = notice.isUrgent;

  // 1. URGENT STATE: Full-width danger banner, white text, dismissible
  if (isUrgent) {
    return (
      <div
        className="w-full h-10 px-4 flex items-center justify-between text-xs z-20 shrink-0 select-none animate-fade-in"
        style={{
          backgroundColor: 'var(--danger)',
          color: '#FFFFFF',
        }}
        role="alert"
        aria-live="assertive"
      >
        <div className="flex items-center gap-2 overflow-hidden mr-2">
          <span className="font-extrabold uppercase text-[10px] tracking-wider shrink-0 px-1.5 py-0.5 rounded bg-black/20">
            Urgent
          </span>
          <span className="font-semibold text-xs truncate">
            {notice.title}
          </span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href={`/notices/${notice.id}`}
            onClick={() => onMarkRead?.(notice.id)}
            className="font-bold underline text-xs text-white hover:opacity-90 whitespace-nowrap"
          >
            Read
          </Link>
          {onDismiss && (
            <button
              type="button"
              onClick={() => onDismiss(notice.id)}
              className="p-1 text-white hover:opacity-75 transition-opacity cursor-pointer"
              aria-label="Dismiss urgent notice"
            >
              <X size={15} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // 2. NORMAL STATE: 40px height, category colour edge (3px left), label, title, "Read"
  const catKey = (notice.category || 'exams').toLowerCase();
  const noticeColorMap = colors.notices as Record<string, { light: string; dark: string }>;
  const categoryColor = noticeColorMap[catKey]?.light || 'var(--primary)';

  return (
    <div
      className="w-full h-10 px-4 border-b flex items-center justify-between text-xs select-none transition-colors"
      style={{
        backgroundColor: 'var(--surface-sunken)',
        borderColor: 'var(--line)',
        borderLeft: `3px solid ${categoryColor}`,
      }}
    >
      <div className="flex items-center gap-2 overflow-hidden mr-3">
        <span
          className="text-[10px] font-bold tracking-wider uppercase shrink-0"
          style={{ color: categoryColor }}
        >
          {notice.category}
        </span>
        <span className="truncate font-medium text-xs text-[var(--text)]">
          {notice.title}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Link
          href={`/notices/${notice.id}`}
          onClick={() => onMarkRead?.(notice.id)}
          className="font-bold text-xs hover:underline whitespace-nowrap"
          style={{ color: 'var(--primary)' }}
        >
          Read
        </Link>
        {onDismiss && (
          <button
            type="button"
            onClick={() => onDismiss(notice.id)}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
            aria-label="Dismiss notice"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default NoticeStrip;
