'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Pin, VolumeX, Trash2, MoreVertical, BellOff } from 'lucide-react';
import { getAvatarColorPair } from '@/config/tokens';

export interface ConversationItem {
  id: string;
  name: string;
  username?: string;
  studentClass?: string;
  class?: string;
  avatar?: string | null;
  avatarUrl?: string | null;
  isGroup?: boolean;
  type?: 'direct' | 'group';
  groupInitials?: string;
  lastMessage?: string;
  timeAgo?: string;
  isUnread?: boolean;
  unreadCount?: number;
  hasUnseenStory?: boolean;
  hasActiveStory?: boolean;
  isMuted?: boolean;
  isPinned?: boolean;
  previewType?: string;
  section?: 'pinned' | 'today' | 'earlier';
  inboxTier?: 'PRIMARY' | 'GENERAL' | 'REQUESTS';
}

export interface ConversationRowProps {
  conversation: ConversationItem;
  onClick: () => void;
  onMuteToggle: (id: string) => void;
  onDelete?: (id: string) => void;
  onDeleteRequest?: (conv: ConversationItem) => void;
  onLongPress: (conv: ConversationItem) => void;
}

export const ConversationRow: React.FC<ConversationRowProps> = ({
  conversation,
  onClick,
  onMuteToggle,
  onDelete,
  onDeleteRequest,
  onLongPress,
}) => {
  const router = useRouter();
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartX = useRef(0);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  const isGroup = conversation.type === 'group';
  const isUnread = Boolean(conversation.unreadCount && conversation.unreadCount > 0);
  const hasStory = Boolean(conversation.hasActiveStory);
  const isMuted = Boolean(conversation.isMuted);
  const isPinned = Boolean(conversation.isPinned);

  const pair = getAvatarColorPair(conversation.name || 'chat');
  const initials = (conversation.name || 'CH').slice(0, 2).toUpperCase();

  // Swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    pressTimer.current = setTimeout(() => {
      onLongPress(conversation);
    }, 550);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.touches[0].clientX;
    if (Math.abs(diff) > 10 && pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    if (diff > 0 && diff < 120) {
      setSwipeOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    if (swipeOffset > 60) {
      setSwipeOffset(110);
    } else {
      setSwipeOffset(0);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onLongPress(conversation);
  };

  return (
    <div className="relative overflow-hidden select-none bg-[var(--surface)]">
      {/* Swipe actions revealed behind the row (Mute, Delete) */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-1 z-0">
        <button
          type="button"
          onClick={() => {
            onMuteToggle(conversation.id);
            setSwipeOffset(0);
          }}
          className="w-12 h-12 rounded-[14px] bg-[var(--surface-sunken)] text-[var(--text)] flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
          aria-label={isMuted ? 'Unmute conversation' : 'Mute conversation'}
          title="Mute"
        >
          <BellOff size={18} />
        </button>
        <button
          type="button"
          onClick={() => {
            if (onDeleteRequest) {
              onDeleteRequest(conversation);
            } else if (onDelete) {
              if (confirm('Delete this chat? It will only be removed for you.')) {
                onDelete(conversation.id);
              }
            }
            setSwipeOffset(0);
          }}
          className="w-12 h-12 rounded-[14px] bg-[var(--danger)] text-white flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
          aria-label="Delete conversation"
          title="Delete"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Main 68px Row Container */}
      <div
        onClick={() => {
          if (swipeOffset > 0) {
            setSwipeOffset(0);
          } else {
            onClick();
          }
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onContextMenu={handleContextMenu}
        className="h-[68px] px-4 flex items-center justify-between border-b cursor-pointer transition-transform relative z-10 hover:bg-[var(--surface-sunken)]/60"
        style={{
          transform: `translateX(-${swipeOffset}px)`,
          borderColor: 'var(--line)',
          backgroundColor: 'var(--surface)',
        }}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
          {/* Avatar 52px: Circle for people, 14px-radius square for groups */}
          <div
            className={`relative shrink-0 ${!isGroup ? 'cursor-pointer hover:opacity-85' : ''}`}
            onClick={(e) => {
              if (!isGroup) {
                const target = conversation.username || (conversation.id ? conversation.id.replace(/^conv-/, '') : '');
                if (target) {
                  e.stopPropagation();
                  router.push(`/u/${target}`);
                }
              }
            }}
            title={!isGroup ? `View ${conversation.name}'s profile` : undefined}
          >
            {hasStory && !isGroup ? (
              /* Neon story ring wrapper */
              <div
                className="w-[56px] h-[56px] rounded-full p-[2.5px] flex items-center justify-center -m-0.5"
                style={{
                  background: 'linear-gradient(135deg, #FF8A1F 0%, #FF2E93 35%, #A855F7 68%, #3B82F6 100%)',
                }}
              >
                <div className="w-full h-full rounded-full border-2 border-[var(--surface)] overflow-hidden flex items-center justify-center">
                  {conversation.avatar ? (
                    <img
                      src={conversation.avatar}
                      alt={conversation.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center font-bold text-xs"
                      style={{ backgroundColor: pair.bg, color: pair.text }}
                    >
                      {initials}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div
                className={`w-[52px] h-[52px] flex items-center justify-center font-bold text-xs overflow-hidden ${
                  isGroup ? 'rounded-[14px]' : 'rounded-full'
                }`}
                style={{
                  backgroundColor: isGroup ? 'var(--primary)' : pair.bg,
                  color: isGroup ? 'var(--on-primary)' : pair.text,
                }}
              >
                {conversation.avatar ? (
                  <img
                    src={conversation.avatar}
                    alt={conversation.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
            )}
          </div>

          {/* Name & Preview line */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {isPinned && (
                <Pin size={12} className="text-[var(--primary)] shrink-0 fill-current" />
              )}
              <h3
                className={`text-base leading-tight truncate ${
                  isUnread ? 'font-bold text-[var(--text)]' : 'font-semibold text-[var(--text)]'
                }`}
              >
                {conversation.name}
              </h3>
              {conversation.class && (
                <span className="text-xs text-[var(--text-muted)] shrink-0 font-normal">
                  Class {conversation.class}
                </span>
              )}
              {isMuted && (
                <VolumeX size={13} className="text-[var(--text-muted)] shrink-0 ml-auto" />
              )}
            </div>

            {/* Preview line: 14px muted with ' · 4h' */}
            <p
              className={`text-sm truncate mt-0.5 leading-tight ${
                isUnread ? 'font-semibold text-[var(--text)]' : 'text-[var(--text-muted)]'
              }`}
            >
              <span>{conversation.lastMessage || 'Say hi to your classmate'}</span>
              <span className="text-xs text-[var(--text-muted)] ml-1.5">
                · {conversation.timeAgo || '2h'}
              </span>
            </p>
          </div>
        </div>

        {/* Right side: 10px primary dot for unread rows */}
        <div className="shrink-0 flex items-center gap-1">
          {isUnread && (
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: 'var(--primary)' }}
              aria-label="Unread message"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationRow;
