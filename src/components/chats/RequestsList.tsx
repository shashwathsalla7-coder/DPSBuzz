'use client';

import React, { useState } from 'react';
import { getAvatarColorPair } from '@/config/tokens';

export interface MessageRequestItem {
  id: string;
  name: string;
  username: string;
  studentClass: string;
  avatarUrl?: string | null;
  avatar?: string | null;
  messagePreview: string;
  timeAgo: string;
  mutualFollowsCount?: number;
}

export interface RequestsListProps {
  initialRequests?: MessageRequestItem[];
  onAccept?: (req: MessageRequestItem) => void;
  onIgnore?: (id: string) => void;
  onBlock?: (req: MessageRequestItem) => void;
  onSelectRequest?: (req: MessageRequestItem) => void;
  className?: string;
}

const DEFAULT_MOCK_REQUESTS: MessageRequestItem[] = [
  {
    id: 'req-1',
    name: 'Tarun Rao',
    username: 'tarun_9b',
    studentClass: '9-B',
    avatarUrl: null,
    messagePreview: 'Hey! Did sir share the chemistry notes PDF with you?',
    timeAgo: '2h',
  },
  {
    id: 'req-2',
    name: 'Aditi Chawla',
    username: 'aditi_7c',
    studentClass: '7-C',
    avatarUrl: null,
    messagePreview: 'Hi! Are you taking part in the debate competition this Friday?',
    timeAgo: '1d',
  },
];

/**
 * Section D.3: Message Requests List
 * Explanation banner: "Messages from people you don't follow. They can't see if you've read them until you accept."
 * Actions: Accept, Ignore, Block
 */
export const RequestsList: React.FC<RequestsListProps> = ({
  initialRequests = DEFAULT_MOCK_REQUESTS,
  onAccept,
  onIgnore,
  onBlock,
  onSelectRequest,
  className = '',
}) => {
  const [requests, setRequests] = useState<MessageRequestItem[]>(initialRequests);

  React.useEffect(() => {
    setRequests(initialRequests);
  }, [initialRequests]);

  const handleAccept = (req: MessageRequestItem) => {
    setRequests((prev) => prev.filter((r) => r.id !== req.id));
    if (onAccept) onAccept(req);
  };

  const handleIgnore = (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    if (onIgnore) onIgnore(id);
  };

  const handleBlock = (req: MessageRequestItem) => {
    setRequests((prev) => prev.filter((r) => r.id !== req.id));
    if (onBlock) onBlock(req);
  };

  return (
    <div className={`w-full select-none ${className}`}>
      {/* Explanation Banner */}
      <div
        className="px-4 py-3 border-b text-xs leading-relaxed"
        style={{
          backgroundColor: 'var(--surface-sunken)',
          borderColor: 'var(--line)',
          color: 'var(--text-muted)',
        }}
      >
        Messages from people you don't follow. They can't see if you've read them until you accept.
      </div>

      {/* List */}
      <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
        {requests.length === 0 ? (
          <div className="p-8 text-left space-y-2">
            <h3 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
              No requests
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              When students you don't follow send you a message, they will appear here.
            </p>
          </div>
        ) : (
          requests.map((req) => {
            const colors = getAvatarColorPair(req.username);
            const initials = req.name
              .split(' ')
              .filter(Boolean)
              .map((p) => p[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <div
                key={req.id}
                className="p-4 flex flex-col gap-3 transition-colors hover:bg-[var(--surface-sunken)]/50"
                style={{
                  backgroundColor: 'var(--surface)',
                }}
              >
                <div
                  className="flex items-start gap-3 cursor-pointer group"
                  onClick={() => onSelectRequest?.(req)}
                >
                  {/* 52px Avatar */}
                  <div
                    className="w-[52px] h-[52px] rounded-full flex items-center justify-center font-bold text-sm shrink-0 border overflow-hidden"
                    style={{
                      backgroundColor: colors.bg,
                      color: colors.text,
                      borderColor: 'var(--line)',
                    }}
                  >
                    {req.avatarUrl ? (
                      <img src={req.avatarUrl} alt={req.name} className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>

                  {/* Info & preview */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-base font-bold truncate" style={{ color: 'var(--text)' }}>
                          @{req.username}
                        </span>
                        <span className="text-xs font-normal shrink-0" style={{ color: 'var(--text-muted)' }}>
                          · Class {req.studentClass}
                        </span>
                      </div>
                      <span className="text-xs shrink-0 tabular-nums ml-2" style={{ color: 'var(--text-muted)' }}>
                        {req.timeAgo}
                      </span>
                    </div>

                    <p className="text-sm line-clamp-2 mt-1 leading-snug" style={{ color: 'var(--text-muted)' }}>
                      "{req.messagePreview}"
                    </p>
                  </div>
                </div>

                {/* Actions: Block (quiet danger), Ignore (pill), Accept (primary pill) */}
                <div className="flex items-center justify-end gap-2 pt-1 pl-[52px]">
                  <button
                    type="button"
                    onClick={() => handleBlock(req)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full transition-colors cursor-pointer hover:bg-[var(--danger)]/10"
                    style={{ color: 'var(--danger)' }}
                    aria-label={`Block ${req.name}`}
                  >
                    Block
                  </button>
                  <button
                    type="button"
                    onClick={() => handleIgnore(req.id)}
                    className="text-xs font-semibold px-4 py-1.5 rounded-full border transition-colors cursor-pointer hover:bg-[var(--line)]"
                    style={{
                      backgroundColor: 'var(--surface-sunken)',
                      borderColor: 'var(--line)',
                      color: 'var(--text)',
                    }}
                    aria-label={`Ignore ${req.name}`}
                  >
                    Ignore
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAccept(req)}
                    className="text-xs font-bold px-4 py-1.5 rounded-full transition-all cursor-pointer shadow-xs active:scale-95"
                    style={{
                      backgroundColor: 'var(--primary)',
                      color: 'var(--on-primary)',
                    }}
                    aria-label={`Accept message from ${req.username}`}
                  >
                    Accept & Follow
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RequestsList;
