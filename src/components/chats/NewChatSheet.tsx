'use client';

import React, { useState } from 'react';
import { X, Search, Users } from 'lucide-react';
import { getAvatarColorPair } from '@/config/tokens';

export interface StudentContact {
  id: string;
  name: string;
  username: string;
  studentClass: string;
  avatarUrl?: string | null;
  isFollowing: boolean;
}

export interface NewChatSheetProps {
  isOpen: boolean;
  followingStudents: StudentContact[];
  otherStudents: StudentContact[];
  onClose: () => void;
  onSelectStudent: (student: StudentContact) => void;
}

export const NewChatSheet: React.FC<NewChatSheetProps> = ({
  isOpen,
  followingStudents,
  otherStudents,
  onClose,
  onSelectStudent,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const filterStudents = (list: StudentContact[]) => {
    if (!query.trim()) return list;
    const lower = query.toLowerCase();
    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(lower) ||
        s.username.toLowerCase().includes(lower) ||
        s.studentClass.toLowerCase().includes(lower)
    );
  };

  const filteredFollowing = filterStudents(followingStudents);
  const filteredOther = filterStudents(otherStudents);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center select-none"
      role="dialog"
      aria-modal="true"
      aria-label="New chat"
    >
      {/* Background backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Bottom Sheet: 24px rounded top corners */}
      <div
        className="relative z-10 w-full max-w-[480px] max-h-[85dvh] rounded-t-[24px] flex flex-col overflow-hidden border-t shadow-2xl animate-fade-in"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--line)',
        }}
      >
        {/* Drag Handle & Header */}
        <div className="pt-3 px-4 pb-2 flex flex-col items-center">
          <div
            className="w-10 h-1 rounded-full mb-3"
            style={{ backgroundColor: 'var(--line-strong)' }}
          />

          <div className="w-full flex items-center justify-between">
            <h2
              className="text-lg font-bold tracking-[-0.02em] leading-[1.15] font-display"
              style={{
                fontFamily: "var(--font-cabinet), 'Cabinet Grotesk', sans-serif",
                color: 'var(--text)',
              }}
            >
              New chat
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-none flex items-center justify-center hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
              aria-label="Close sheet"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Search Field */}
        <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--line)' }}>
          <div
            className="h-11 px-3.5 rounded-none flex items-center gap-2.5"
            style={{
              backgroundColor: 'var(--surface-sunken)',
            }}
          >
            <Search size={18} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search students..."
              className="w-full h-full bg-transparent border-none outline-none text-sm placeholder:text-[var(--text-muted)]"
              style={{ color: 'var(--text)' }}
            />
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: 'var(--line)' }}>
          {/* Section: People you follow */}
          {filteredFollowing.length > 0 && (
            <div>
              <div
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider"
                style={{
                  backgroundColor: 'var(--surface-sunken)',
                  color: 'var(--text-muted)',
                }}
              >
                People you follow
              </div>
              {filteredFollowing.map((student) => {
                const colors = getAvatarColorPair(student.username);
                const initials = student.name
                  .split(' ')
                  .filter(Boolean)
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                return (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => {
                      onSelectStudent(student);
                      onClose();
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3.5 text-left hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer btn-press"
                  >
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border"
                      style={{
                        backgroundColor: colors.bg,
                        color: colors.text,
                        borderColor: 'var(--line)',
                      }}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                          {student.name}
                        </span>
                        <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
                          · {student.studentClass}
                        </span>
                      </div>
                      <span className="text-xs truncate block" style={{ color: 'var(--text-muted)' }}>
                        @{student.username}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Section: Other students from the school */}
          {filteredOther.length > 0 && (
            <div>
              <div
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider"
                style={{
                  backgroundColor: 'var(--surface-sunken)',
                  color: 'var(--text-muted)',
                }}
              >
                Other students from DPS
              </div>
              {filteredOther.map((student) => {
                const colors = getAvatarColorPair(student.username);
                const initials = student.name
                  .split(' ')
                  .filter(Boolean)
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                return (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => {
                      onSelectStudent(student);
                      onClose();
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3.5 text-left hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer btn-press"
                  >
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border"
                      style={{
                        backgroundColor: colors.bg,
                        color: colors.text,
                        borderColor: 'var(--line)',
                      }}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                          {student.name}
                        </span>
                        <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
                          · {student.studentClass}
                        </span>
                      </div>
                      <span className="text-xs truncate block" style={{ color: 'var(--text-muted)' }}>
                        @{student.username}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {filteredFollowing.length === 0 && filteredOther.length === 0 && (
            <div className="p-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              Nobody called that. Check the spelling.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewChatSheet;
