'use client';

import React from 'react';
import { Pin, X, ChevronRight } from 'lucide-react';

interface PinnedNoticeBannerProps {
  pinnedNotice: {
    id: string;
    senderName: string;
    text: string;
  };
  canUnpin?: boolean;
  onJumpToMessage: (id: string) => void;
  onUnpin?: () => void;
}

export const PinnedNoticeBanner: React.FC<PinnedNoticeBannerProps> = ({
  pinnedNotice,
  canUnpin = false,
  onJumpToMessage,
  onUnpin,
}) => {
  return (
    <div className="shrink-0 px-3 py-2 bg-[#182229]/95 backdrop-blur-md border-b border-[#222d34] flex items-center justify-between z-10 select-none shadow-sm transition-all">
      <button
        type="button"
        onClick={() => onJumpToMessage(pinnedNotice.id)}
        className="flex-1 flex items-center gap-2.5 text-left cursor-pointer min-w-0"
        title="Tap to jump to pinned notice"
      >
        <div className="w-6 h-6 rounded-full bg-[#00a884]/20 text-[#00a884] flex items-center justify-center shrink-0">
          <Pin size={12} className="rotate-45" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold text-[#00a884] flex items-center gap-1.5 truncate">
            <span>Pinned Circular</span>
            <span className="text-[#8696a0] font-normal">• {pinnedNotice.senderName}</span>
          </div>
          <div className="text-xs text-[#e9edef] truncate leading-tight">
            {pinnedNotice.text}
          </div>
        </div>
        <ChevronRight size={14} className="text-[#8696a0] shrink-0 mr-1" />
      </button>

      {canUnpin && onUnpin && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUnpin();
          }}
          className="p-1 rounded-full text-[#8696a0] hover:text-[#ea4335] hover:bg-[#202c33] transition-colors cursor-pointer shrink-0 ml-1"
          title="Unpin circular"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};
