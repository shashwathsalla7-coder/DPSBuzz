'use client';

import React from 'react';

export const HomeFeedSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 pt-2 animate-pulse" aria-label="Loading feed...">
      {[1, 2].map((i) => (
        <div key={i} className="space-y-3">
          {/* 4:5 Photo Card Skeleton (20px radius, 12px margins) */}
          <div className="mx-3 aspect-[4/5] rounded-[20px] bg-[var(--surface-sunken)] relative overflow-hidden">
            {/* Top-left author skeleton placeholder */}
            <div className="absolute top-3.5 left-3.5 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-black/15" />
              <div className="space-y-1">
                <div className="w-20 h-3 rounded bg-black/15" />
                <div className="w-14 h-2.5 rounded bg-black/10" />
              </div>
            </div>
            {/* Top-right more button skeleton placeholder */}
            <div className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-black/15" />
          </div>

          {/* Action Row & Text Skeletons */}
          <div className="px-4 space-y-2">
            <div className="flex items-center gap-3 py-1">
              <div className="w-6 h-6 rounded-full bg-[var(--surface-sunken)]" />
              <div className="w-6 h-6 rounded-full bg-[var(--surface-sunken)]" />
              <div className="w-6 h-6 rounded-full bg-[var(--surface-sunken)]" />
              <div className="w-6 h-6 rounded-full bg-[var(--surface-sunken)] ml-auto" />
            </div>
            <div className="w-36 h-3 rounded bg-[var(--surface-sunken)]" />
            <div className="w-full h-3 rounded bg-[var(--surface-sunken)]" />
            <div className="w-3/4 h-3 rounded bg-[var(--surface-sunken)]" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default HomeFeedSkeleton;
