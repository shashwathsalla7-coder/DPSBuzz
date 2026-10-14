'use client';

import { type FC, type ReactNode } from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: number | string;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  fullWidth?: boolean;
}

/**
 * Segmented Control / Tabs component adhering strictly to DESIGN.md Section 9.7:
 * - 10px container radius (var(--r-md))
 * - Sunken track (var(--surface-sunken)) with 1px border
 * - Active segment in var(--surface) with 1px border and 6px radius (var(--r-sm))
 */
export const Tabs: FC<TabsProps> = ({
  items,
  activeId,
  onChange,
  className = '',
  fullWidth = true,
}) => {
  return (
    <div
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      className={`w-full max-w-full overflow-x-auto [&::-webkit-scrollbar]:hidden ${className}`}
    >
      <div
        style={{ borderRadius: 'var(--r-md)' }}
        className={`
          p-1 bg-[var(--surface-sunken)] border border-[var(--line)]
          inline-flex items-center gap-1 select-none font-sans
          ${fullWidth ? 'min-w-full' : ''}
        `}
        role="tablist"
      >
        {items.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              style={{ borderRadius: 'var(--r-sm)' }}
              className={`
                flex-1 py-1.5 px-3 text-xs font-semibold whitespace-nowrap shrink-0
                flex items-center justify-center gap-1.5 transition-all cursor-pointer
                ${
                  isActive
                    ? 'bg-[var(--surface)] text-[var(--text)] border border-[var(--line)] shadow-none'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)] border border-transparent'
                }
              `}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="ml-1 px-1.5 py-0.2 rounded font-mono text-[10px] bg-[var(--primary-tint)] text-[var(--primary)] font-bold">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Tabs;
