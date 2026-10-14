'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { getAvatarColorPair } from '@/config/tokens';
import { getNoteColorTheme } from '@/config/noteThemes';

export interface NoteItem {
  id: string;
  username: string;
  name: string;
  avatarUrl?: string | null;
  text: string;
  hasActiveStory?: boolean;
  storyRingVariant?: 'unseen' | 'seen' | 'none';
  createdAt?: string;
}

export interface NotesRowProps {
  userNote?: string | null;
  notes: NoteItem[];
  onAddNoteClick?: () => void;
  onNoteClick?: (note: NoteItem) => void;
  className?: string;
}

/**
 * Section C. Notes row:
 * - Horizontal snap scroll, scrollbar hidden.
 * - First item "Your note" with a dashed bubble and a small plus.
 * - Others show a short text bubble above the avatar (max 60 chars, 24h expiry, profanity filtered, followed students only).
 * - Bubble: sunken background, 12px text, 2 lines maximum, radius 12 with a small tail.
 * - Avatar 56px; if the person has an active story, show the neon story ring around the avatar.
 */
export const NotesRow: React.FC<NotesRowProps> = ({
  userNote,
  notes,
  onAddNoteClick,
  onNoteClick,
  className = '',
}) => {
  return (
    <div
      className={`py-3 px-4 border-b overflow-hidden select-none ${className}`}
      style={{
        borderColor: 'var(--line)',
        backgroundColor: 'var(--surface)',
      }}
    >
      <div
        className="flex items-start gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Item 1: Your note */}
        <div
          onClick={onAddNoteClick}
          className="flex flex-col items-center shrink-0 snap-start cursor-pointer group btn-press w-20"
          role="button"
          tabIndex={0}
          aria-label="Create your note"
        >
          {/* Mixed color bubble with small plus */}
          {(() => {
            const myTheme = getNoteColorTheme('sunset');
            return (
              <div
                className="relative mb-2.5 px-2.5 py-1.5 rounded-[14px] flex items-center justify-center gap-1 min-h-[34px] w-full shadow-sm transition-all"
                style={{
                  background: userNote ? myTheme.gradient : 'var(--surface-sunken)',
                  border: userNote ? `1px solid ${myTheme.border}` : '1px dashed var(--line-strong)',
                  boxShadow: userNote ? myTheme.bubbleShadow : 'none',
                  color: userNote ? myTheme.textColor : 'var(--text-muted)',
                }}
              >
                {userNote ? (
                  <span
                    className="text-[12px] leading-tight line-clamp-2 text-center font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
                    style={{ color: '#FFFFFF' }}
                  >
                    {userNote}
                  </span>
                ) : (
                  <div className="flex items-center gap-1">
                    <Plus size={12} strokeWidth={2.5} style={{ color: 'var(--primary)' }} />
                    <span className="text-[11px] font-medium">Note</span>
                  </div>
                )}

                {/* Bubble Tail */}
                <div
                  className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0"
                  style={{
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderTop: userNote ? `6px solid ${myTheme.accent}` : '6px solid var(--line-strong)',
                  }}
                />
              </div>
            );
          })()}

          {/* 56px Avatar */}
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xs shrink-0 select-none border"
            style={{
              backgroundColor: 'var(--surface-sunken)',
              borderColor: 'var(--line)',
              color: 'var(--text-muted)',
            }}
          >
            You
          </div>

          <span
            className="text-[12px] font-medium mt-1.5 w-18 truncate text-center"
            style={{ color: 'var(--text-muted)' }}
          >
            Your note
          </span>
        </div>

        {/* Other Notes */}
        {notes.map((note) => {
          const colors = getAvatarColorPair(note.username);
          const noteTheme = getNoteColorTheme(undefined, note.username);
          const initials = note.name
            .split(' ')
            .filter(Boolean)
            .map((p) => p[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();

          const hasUnseenStory = note.storyRingVariant === 'unseen' || (note.hasActiveStory && note.storyRingVariant !== 'seen');
          const hasSeenStory = note.storyRingVariant === 'seen';

          return (
            <div
              key={note.id}
              onClick={() => onNoteClick && onNoteClick(note)}
              className="flex flex-col items-center shrink-0 snap-start cursor-pointer group btn-press w-20"
              role="button"
              tabIndex={0}
              aria-label={`Note by ${note.name}`}
            >
              {/* Note Bubble: Mixed color gradient, bold white text, radius 14 with tail */}
              <div
                className="relative mb-2.5 px-2.5 py-1.5 rounded-[14px] min-h-[34px] w-full flex items-center justify-center shadow-md transition-transform group-hover:scale-105"
                style={{
                  background: noteTheme.gradient,
                  border: `1px solid ${noteTheme.border}`,
                  boxShadow: noteTheme.bubbleShadow,
                }}
              >
                <span
                  className="text-[12px] leading-tight line-clamp-2 text-center font-bold break-words drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]"
                  style={{ color: '#FFFFFF' }}
                >
                  {note.text}
                </span>

                {/* Bubble Tail */}
                <div
                  className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0"
                  style={{
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderTop: `6px solid ${noteTheme.accent}`,
                  }}
                />
              </div>

              {/* Avatar 56px with neon story ring if active story */}
              {hasUnseenStory ? (
                <div className="story-ring-unseen" style={{ width: '56px', height: '56px', padding: '2.5px' }}>
                  <div className="story-ring-inner" style={{ padding: '2px' }}>
                    <div
                      className="w-[45px] h-[45px] rounded-full flex items-center justify-center font-bold text-xs shrink-0 select-none"
                      style={{
                        backgroundColor: colors.bg,
                        color: colors.text,
                      }}
                    >
                      {initials}
                    </div>
                  </div>
                </div>
              ) : hasSeenStory ? (
                <div className="story-ring-seen" style={{ width: '56px', height: '56px', padding: '2.5px' }}>
                  <div className="story-ring-inner" style={{ padding: '2px' }}>
                    <div
                      className="w-[45px] h-[45px] rounded-full flex items-center justify-center font-bold text-xs shrink-0 select-none"
                      style={{
                        backgroundColor: colors.bg,
                        color: colors.text,
                      }}
                    >
                      {initials}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xs shrink-0 select-none border"
                  style={{
                    backgroundColor: colors.bg,
                    color: colors.text,
                    borderColor: 'var(--line)',
                  }}
                >
                  {initials}
                </div>
              )}

              <span
                className="text-[12px] font-medium mt-1.5 w-18 truncate text-center"
                style={{ color: 'var(--text)' }}
              >
                {note.name.split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NotesRow;
