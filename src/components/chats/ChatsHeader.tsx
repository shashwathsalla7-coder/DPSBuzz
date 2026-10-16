'use client';

import React from 'react';
import { SquarePen, Users, Gamepad2 } from 'lucide-react';

export interface ChatsHeaderProps {
  onComposeClick: () => void;
  onCreateGroupClick?: () => void;
  onOpenGames?: () => void;
}

/**
 * Section A. Header, 56px:
 * - Title "Chats" in the display font (800) on the left.
 * - On the right a compose icon (pencil in a square) and a Create Group icon.
 */
export const ChatsHeader: React.FC<ChatsHeaderProps> = React.memo(({
  onComposeClick,
  onCreateGroupClick,
  onOpenGames,
}) => {
  return (
    <header
      className="px-4 flex items-center justify-between border-b shrink-0 sticky top-0 z-30 transition-all"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--line)',
        paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)',
        paddingBottom: '8px',
      }}
    >
      <h1
        className="text-2xl font-extrabold tracking-[-0.02em] leading-[1.1] font-display select-none"
        style={{
          color: 'var(--text)',
          fontFamily: "var(--font-cabinet), 'Cabinet Grotesk', sans-serif",
          fontWeight: 800,
        }}
      >
        Chats
      </h1>

      <div className="flex items-center gap-1.5">
        {onOpenGames && (
          <button
            type="button"
            onClick={onOpenGames}
            className="w-9 h-9 rounded-[10px] flex items-center justify-center transition-colors btn-press hover:bg-[var(--surface-sunken)] active:scale-95 cursor-pointer text-pink-500"
            aria-label="Guess the Cricketer & Games"
            title="Guess the Cricketer & Games 🏏"
          >
            <Gamepad2 size={20} strokeWidth={2.2} />
          </button>
        )}
        {onCreateGroupClick && (
          <button
            type="button"
            onClick={onCreateGroupClick}
            className="h-8 px-3 rounded-[6px] flex items-center gap-1.5 text-xs font-semibold border transition-all btn-press hover:opacity-90 active:scale-95 cursor-pointer shadow-xs"
            style={{
              backgroundColor: 'var(--accent-cta)',
              color: 'var(--on-accent-cta)',
              borderColor: 'transparent',
            }}
            aria-label="Create new group"
            title="Create group with classmates"
          >
            <Users size={14} strokeWidth={2.2} />
            <span className="font-bold">+ New Group</span>
          </button>
        )}

        <button
          type="button"
          onClick={onComposeClick}
          className="w-10 h-10 rounded-[10px] flex items-center justify-center transition-colors btn-press hover:bg-[var(--surface-sunken)] active:scale-95 cursor-pointer"
          style={{
            color: 'var(--text)',
          }}
          aria-label="New chat"
          title="New chat"
        >
          <SquarePen size={22} strokeWidth={2.25} />
        </button>
      </div>
    </header>
  );
});

ChatsHeader.displayName = 'ChatsHeader';

export default ChatsHeader;
