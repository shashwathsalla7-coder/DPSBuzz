'use client';

import React from 'react';
import { SquarePen, Users } from 'lucide-react';

export interface ChatsHeaderProps {
  onComposeClick: () => void;
  onCreateGroupClick?: () => void;
  onOpenGames?: () => void;
}

/**
 * Chats Header:
 * - Title "Chats" on the left
 * - One "New Group" button and one compose icon on the right
 * - 44px minimum tap targets, single blue accent, clean borders
 */
export const ChatsHeader: React.FC<ChatsHeaderProps> = React.memo(({
  onComposeClick,
  onCreateGroupClick,
}) => {
  return (
    <header
      className="px-4 h-14 flex items-center justify-between border-b shrink-0 sticky top-0 z-30 transition-all"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--line)',
      }}
    >
      <h1
        className="text-xl font-bold tracking-tight select-none"
        style={{
          color: 'var(--text)',
        }}
      >
        Chats
      </h1>

      <div className="flex items-center gap-2">
        {onCreateGroupClick && (
          <button
            type="button"
            onClick={onCreateGroupClick}
            className="h-9 px-3 rounded-[12px] flex items-center gap-1.5 text-xs font-semibold border transition-all hover:bg-[var(--surface-sunken)] active:scale-95 cursor-pointer"
            style={{
              backgroundColor: 'var(--surface)',
              color: 'var(--text)',
              borderColor: 'var(--line)',
            }}
            aria-label="Create new group"
            title="Create group"
          >
            <Users size={15} />
            <span>New Group</span>
          </button>
        )}

        <button
          type="button"
          onClick={onComposeClick}
          className="w-10 h-10 rounded-[12px] flex items-center justify-center transition-colors hover:bg-[var(--surface-sunken)] active:scale-95 cursor-pointer"
          style={{
            color: 'var(--text)',
          }}
          aria-label="New chat"
          title="New chat"
        >
          <SquarePen size={20} />
        </button>
      </div>
    </header>
  );
});

ChatsHeader.displayName = 'ChatsHeader';

export default ChatsHeader;
