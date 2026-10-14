'use client';

import React from 'react';

export interface FeedTabsProps {
  activeTab: 'following' | 'all';
  onChange: (tab: 'following' | 'all') => void;
}

/**
 * Feed tabs as a segmented control:
 * - Sunken track
 * - Selected segment in surface with a 1px line border
 * - 180ms transition
 */
export const FeedTabs: React.FC<FeedTabsProps> = ({ activeTab, onChange }) => {
  return (
    <div className="px-4 py-2.5">
      <div
        className="w-full p-1 rounded-full flex items-center select-none"
        style={{
          backgroundColor: 'var(--surface-sunken)',
          border: '1px solid var(--line)',
        }}
        role="tablist"
        aria-label="Feed selection"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'following'}
          onClick={() => onChange('following')}
          className="flex-1 py-1.5 px-3 rounded-full text-xs font-semibold text-center transition-all duration-[180ms] ease-out cursor-pointer"
          style={{
            backgroundColor: activeTab === 'following' ? 'var(--surface)' : 'transparent',
            color: activeTab === 'following' ? 'var(--text)' : 'var(--text-muted)',
            border: activeTab === 'following' ? '1px solid var(--line)' : '1px solid transparent',
            boxShadow: activeTab === 'following' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
          }}
        >
          Following
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'all'}
          onClick={() => onChange('all')}
          className="flex-1 py-1.5 px-3 rounded-full text-xs font-semibold text-center transition-all duration-[180ms] ease-out cursor-pointer"
          style={{
            backgroundColor: activeTab === 'all' ? 'var(--surface)' : 'transparent',
            color: activeTab === 'all' ? 'var(--text)' : 'var(--text-muted)',
            border: activeTab === 'all' ? '1px solid var(--line)' : '1px solid transparent',
            boxShadow: activeTab === 'all' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
          }}
        >
          Whole School
        </button>
      </div>
    </div>
  );
};

export default FeedTabs;
