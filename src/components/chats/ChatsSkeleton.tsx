'use client';

import React from 'react';

export interface ChatsSkeletonProps {
  count?: number;
}

/**
 * Chats loading skeleton rows
 * Rows 68px: 52px avatar, two text lines
 */
export const ChatsSkeleton: React.FC<ChatsSkeletonProps> = ({ count = 6 }) => {
  return (
    <div className="divide-y select-none" style={{ borderColor: 'var(--line)' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="w-full h-[68px] px-4 flex items-center gap-3"
          style={{ backgroundColor: 'var(--surface)' }}
        >
          {/* Avatar Skeleton: 52px circle */}
          <div
            className="w-[52px] h-[52px] rounded-full shrink-0 animate-pulse"
            style={{
              backgroundColor: 'var(--surface-sunken)',
              animationDuration: '1.6s',
            }}
          />

          {/* Two Text Lines Skeleton */}
          <div className="flex-1 space-y-2 py-1">
            {/* Name line */}
            <div
              className="h-4 rounded-[6px] w-32 animate-pulse"
              style={{
                backgroundColor: 'var(--surface-sunken)',
                animationDuration: '1.6s',
              }}
            />
            {/* Preview line */}
            <div
              className="h-3.5 rounded-[6px] w-52 animate-pulse"
              style={{
                backgroundColor: 'var(--surface-sunken)',
                animationDuration: '1.6s',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export const ChatsSkeletons = ChatsSkeleton;
export default ChatsSkeleton;
