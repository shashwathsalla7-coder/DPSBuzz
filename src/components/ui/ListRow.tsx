'use client';

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

export interface ListRowProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  avatar?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
  showDivider?: boolean;
}

/**
 * Standardized List Row component for Chats, Notifications, Search results:
 * - 56px avatar area
 * - Title with class / subtitle in muted text
 * - Light 1px bottom divider
 * - 44px+ touch target
 */
export const ListRow = forwardRef<HTMLDivElement, ListRowProps>(
  (
    {
      avatar,
      title,
      subtitle,
      trailing,
      onClick,
      showDivider = true,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const isClickable = Boolean(onClick);

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={`
          flex items-center gap-3.5 px-4 py-3 min-h-[56px] transition-colors
          ${isClickable ? 'cursor-pointer hover:bg-[var(--surface-sunken)] active:bg-[var(--line)]/50 select-none' : ''}
          ${showDivider ? 'border-b border-[var(--line)]' : ''}
          ${className}
        `}
        {...props}
      >
        {avatar && <div className="shrink-0">{avatar}</div>}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-[var(--text)] truncate">{title}</div>
          {subtitle && (
            <div className="text-xs text-[var(--text-muted)] truncate mt-0.5">{subtitle}</div>
          )}
          {children}
        </div>
        {trailing && <div className="shrink-0 flex items-center gap-2">{trailing}</div>}
      </div>
    );
  }
);

ListRow.displayName = 'ListRow';
export default ListRow;
