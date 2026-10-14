'use client';

import React from 'react';

export const SearchSkeletons: React.FC = () => {
  return (
    <div className="px-4 py-3 space-y-4 animate-pulse">
      {/* Hero card skeleton */}
      <div className="w-full h-32 rounded-[20px] bg-[var(--surface-sunken)]" />

      {/* 2-column trending grid skeleton */}
      <div className="space-y-2 pt-2">
        <div className="w-36 h-4 rounded-md bg-[var(--surface-sunken)]" />
        <div className="grid grid-cols-2 gap-2.5">
          <div className="w-full aspect-[4/5] rounded-[16px] bg-[var(--surface-sunken)]" />
          <div className="w-full aspect-[4/5] rounded-[16px] bg-[var(--surface-sunken)]" />
        </div>
      </div>
    </div>
  );
};

export default SearchSkeletons;
