import React from 'react';
import { SquarePen, Users } from 'lucide-react';

export interface EmptyChatsProps {
  onNewChatClick: () => void;
  onCreateGroupClick?: () => void;
  className?: string;
}

/**
 * Section H. Empty inbox State:
 * - Left-aligned
 * - Small hand-drawn speech-bubble doodle in muted ink
 * - Copy: "No chats yet. Message a classmate."
 * - Primary button "New chat"
 */
export const EmptyChats: React.FC<EmptyChatsProps> = ({
  onNewChatClick,
  onCreateGroupClick,
  className = '',
}) => {
  return (
    <div className={`p-8 text-left space-y-4 max-w-sm select-none ${className}`}>
      {/* Hand-drawn speech-bubble doodle in muted ink */}
      <div className="w-12 h-12 rounded-[12px] flex items-center justify-center" style={{ backgroundColor: 'var(--surface-sunken)' }}>
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: 'var(--text-muted)' }}
          aria-hidden="true"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          <path d="M8 12h.01M12 12h.01M16 12h.01" strokeWidth="2.5" />
        </svg>
      </div>

      <div className="space-y-1">
        <h3
          className="text-base font-semibold leading-snug"
          style={{ color: 'var(--text)' }}
        >
          No chats yet. Message a classmate.
        </h3>
        <p
          className="text-xs leading-relaxed"
          style={{ color: 'var(--text-muted)' }}
        >
          Find students from your class or school clubs to start a study discussion.
        </p>
      </div>

      <div className="flex items-center gap-2.5 pt-1">
        <button
          type="button"
          onClick={onNewChatClick}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-xs font-bold btn-press cursor-pointer transition-colors shadow-xs"
          style={{
            backgroundColor: 'var(--primary)',
            color: 'var(--on-primary)',
          }}
        >
          <SquarePen size={14} />
          <span>New chat</span>
        </button>

        {onCreateGroupClick && (
          <button
            type="button"
            onClick={onCreateGroupClick}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-xs font-bold btn-press cursor-pointer transition-colors border"
            style={{
              backgroundColor: 'var(--surface-sunken)',
              borderColor: 'var(--line)',
              color: 'var(--text)',
            }}
          >
            <Users size={14} style={{ color: 'var(--primary)' }} />
            <span>+ Create Group</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyChats;
