'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

export interface ChatSearchProps {
  value: string;
  onChange: (val: string) => void;
  onClear?: () => void;
  className?: string;
  placeholder?: string;
}

/**
 * Chats Search Field (matching Section C style):
 * - 48px field (h-12)
 * - Sunken background
 * - Pill radius (rounded-full)
 * - Search icon
 * - Clear button
 */
export const ChatSearch: React.FC<ChatSearchProps> = ({
  value,
  onChange,
  onClear,
  className = '',
  placeholder = 'Search chats or classmates',
}) => {
  return (
    <div className={`px-4 py-2 ${className}`}>
      <div
        className="h-12 px-4 rounded-full flex items-center gap-3 transition-colors focus-within:ring-2 focus-within:ring-[var(--primary)] border"
        style={{
          backgroundColor: 'var(--surface-sunken)',
          borderColor: 'var(--line)',
        }}
      >
        <Search
          size={18}
          className="shrink-0"
          style={{ color: 'var(--text-muted)' }}
          aria-hidden="true"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-full bg-transparent border-none outline-none text-sm font-normal placeholder:text-[var(--text-muted)]"
          style={{
            color: 'var(--text)',
            fontSize: '14px',
          }}
          aria-label={placeholder}
        />
        {value.length > 0 && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              if (onClear) onClear();
            }}
            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-[var(--line)] transition-colors cursor-pointer shrink-0"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatSearch;
