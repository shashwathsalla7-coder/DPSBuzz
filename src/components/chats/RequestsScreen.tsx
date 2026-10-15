'use client';

import React, { useState } from 'react';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { getAvatarColorPair } from '@/config/tokens';
import { DataStore } from '@/lib/dataStore';

export interface RequestItem {
  id: string;
  name: string;
  username: string;
  studentClass: string;
  avatarUrl?: string | null;
  messagePreview: string;
  timeAgo: string;
}

export interface RequestsScreenProps {
  initialRequests?: RequestItem[];
  onBack: () => void;
  onAccept: (request: RequestItem) => void;
  onIgnore: (requestId: string) => void;
  onBlock: (request: RequestItem) => void;
}

export const RequestsScreen: React.FC<RequestsScreenProps> = ({
  initialRequests = [],
  onBack,
  onAccept,
  onIgnore,
  onBlock,
}) => {
  const [requests, setRequests] = useState<RequestItem[]>(initialRequests);

  const handleAcceptItem = (req: RequestItem) => {
    setRequests((prev) => prev.filter((r) => r.id !== req.id));
    onAccept(req);
  };

  const handleIgnoreItem = (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    onIgnore(id);
  };

  const handleBlockItem = (req: RequestItem) => {
    setRequests((prev) => prev.filter((r) => r.id !== req.id));
    onBlock(req);
  };

  return (
    <div
      className="min-h-dvh flex flex-col select-none"
      style={{
        backgroundColor: 'var(--bg)',
        color: 'var(--text)',
      }}
    >
      {/* Header, 56px */}
      <header
        className="h-14 px-4 flex items-center gap-3 border-b shrink-0 sticky top-0 z-30"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--line)',
        }}
      >
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-[10px] flex items-center justify-center btn-press hover:bg-[var(--surface-sunken)] cursor-pointer"
          style={{ color: 'var(--text)' }}
          aria-label="Back to inbox"
        >
          <ArrowLeft size={20} />
        </button>
        <h1
          className="text-lg font-extrabold tracking-[-0.02em] leading-[1.15] font-display"
          style={{
            fontFamily: "var(--font-cabinet), 'Cabinet Grotesk', sans-serif",
            fontWeight: 800,
          }}
        >
          Requests
        </h1>
      </header>

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

      {/* Requests List */}
      <div className="flex-1 divide-y" style={{ borderColor: 'var(--line)' }}>
        {requests.length === 0 ? (
          /* Empty state: "No requests." */
          <div className="p-8 text-left space-y-2">
            <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
              No requests.
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              When students you don't follow send you a message, they will appear here.
            </p>
          </div>
        ) : (
          requests.map((req) => {
            const liveProf = DataStore.getProfileByUsername(req.username);
            const effectiveAvatar = liveProf?.avatar || req.avatarUrl || null;
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
                className="p-4 flex flex-col gap-3"
                style={{
                  backgroundColor: 'var(--surface)',
                }}
              >
                <div className="flex items-start gap-3.5">
                  {/* Avatar 56px */}
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border overflow-hidden"
                    style={{
                      backgroundColor: colors.bg,
                      color: colors.text,
                      borderColor: 'var(--line)',
                    }}
                  >
                    {effectiveAvatar ? (
                      <img src={effectiveAvatar} alt={req.name} className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>

                  {/* Name, Class & Message Preview */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-base font-semibold truncate" style={{ color: 'var(--text)' }}>
                          {req.name}
                        </span>
                        <span className="text-sm font-normal shrink-0" style={{ color: 'var(--text-muted)' }}>
                          · {req.studentClass}
                        </span>
                      </div>
                      <span className="text-xs shrink-0 tabular-nums" style={{ color: 'var(--text-muted)' }}>
                        {req.timeAgo}
                      </span>
                    </div>

                    <p className="text-sm line-clamp-2 mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      "{req.messagePreview}"
                    </p>
                  </div>
                </div>

                {/* Three Action Buttons: Accept (primary), Ignore (secondary), Block (quiet danger) */}
                <div className="flex items-center justify-end gap-2.5 pt-1 pl-16">
                  <button
                    type="button"
                    onClick={() => handleBlockItem(req)}
                    className="text-xs font-semibold px-2 py-1.5 rounded-[10px] btn-press transition-colors cursor-pointer"
                    style={{ color: 'var(--danger)' }}
                    aria-label={`Block ${req.name}`}
                  >
                    Block
                  </button>
                  <button
                    type="button"
                    onClick={() => handleIgnoreItem(req.id)}
                    className="text-xs font-semibold px-3.5 py-1.5 rounded-[10px] border btn-press transition-colors cursor-pointer"
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
                    onClick={() => handleAcceptItem(req)}
                    className="text-xs font-bold px-4 py-1.5 rounded-[10px] btn-press transition-colors cursor-pointer shadow-xs"
                    style={{
                      backgroundColor: 'var(--primary)',
                      color: 'var(--on-primary)',
                    }}
                    aria-label={`Accept message from ${req.name}`}
                  >
                    Accept
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

export default RequestsScreen;
