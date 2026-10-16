'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Pin, VolumeX, Trash2, MoreVertical, BellOff } from 'lucide-react';
import { getAvatarColorPair } from '@/config/tokens';
import { DataStore } from '@/lib/dataStore';

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
  const touchStartY = useRef(0);
  const isDraggingRef = useRef(false);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  const isGroup = Boolean(
    conversation.isGroup ||
    conversation.type === 'group' ||
    conversation.id?.startsWith('conv-group-') ||
    conversation.id?.startsWith('group-') ||
    conversation.id?.includes('class-') ||
    conversation.id?.includes('house-') ||
    conversation.id?.includes('club-')
  );
  const targetUsername = conversation.username || (!isGroup && conversation.id ? conversation.id.replace(/^conv-/, '') : '');
  const liveProfile = targetUsername ? DataStore.getProfileByUsername(targetUsername) : null;
  const effectiveAvatar = liveProfile?.avatar || conversation.avatar || null;
  const isUnread = Boolean(conversation.unreadCount && conversation.unreadCount > 0);
  const hasStory = Boolean(conversation.hasActiveStory);
  const isMuted = Boolean(conversation.isMuted);
  const isPinned = Boolean(conversation.isPinned);

  const pair = getAvatarColorPair(conversation.name || 'chat');
  const initials = (conversation.name || 'CH').slice(0, 2).toUpperCase();

  // Swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDraggingRef.current = false;
    pressTimer.current = setTimeout(() => {
      onLongPress(conversation);
    }, 550);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const diffX = touchStartX.current - e.touches[0].clientX;
    const diffY = touchStartY.current - e.touches[0].clientY;

    // Directional lock: If vertical scrolling is dominant, allow normal page scroll
    if (Math.abs(diffY) > Math.abs(diffX)) {
      if (Math.abs(diffY) > 8 && pressTimer.current) {
        clearTimeout(pressTimer.current);
        pressTimer.current = null;
      }
      return;
    }

    if (Math.abs(diffX) > 10 && pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }

    // Require deliberate horizontal swipe left (at least 20px)
    if (diffX > 20 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
      isDraggingRef.current = true;
      setSwipeOffset(Math.min(diffX, 120));
    }
  };

  const handleTouchEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    if (swipeOffset >= 60) {
      setSwipeOffset(110);
    } else {
      setSwipeOffset(0);
    }
    // Allow click event to process if not a deliberate drag
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 120);
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
          if (swipeOffset >= 60) {
            setSwipeOffset(0);
            return;
          }
          if (isDraggingRef.current) {
            return;
          }
          setSwipeOffset(0);
          onClick();
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
              /* Instagram orange gradient story ring wrapper */
              <div
                className="w-[56px] h-[56px] rounded-full p-[2.5px] flex items-center justify-center -m-0.5"
                style={{
                  background: conversation.hasUnseenStory !== false
                    ? 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.88) 0%, rgba(255, 255, 255, 0.65) 100%)',
                }}
              >
                <div className="w-full h-full rounded-full border-2 border-[var(--surface)] overflow-hidden flex items-center justify-center">
                  {effectiveAvatar ? (
                    <img
                      src={effectiveAvatar}
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
                {effectiveAvatar ? (
                  <img
                    src={effectiveAvatar}
                    alt={conversation.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
            )}
            {/* Active Online Indicator (Green Dot) */}
            {!isGroup && conversation.username && DataStore.isUserActive(conversation.username) && (
              <span
                className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-[var(--surface,#171C26)] z-20 pointer-events-none shadow-xs"
                title="Active now"
              />
            )}
          </div>

          {/* Name & Preview line */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 font-sf-display">
              {isPinned && (
                <Pin size={12} className="text-[var(--primary)] shrink-0 fill-current" />
              )}
              <h3
                className={`text-base leading-tight truncate font-sf-display ${
                  isUnread ? 'font-bold text-[var(--text)]' : 'font-semibold text-[var(--text)]'
                }`}
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF UI Display", "SF Pro Text", "Helvetica Neue", sans-serif',
                }}
              >
                {isGroup ? conversation.name : (conversation.username ? `@${conversation.username}` : conversation.name)}
              </h3>
              {conversation.inboxTier === 'REQUESTS' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-400 shrink-0">
                  Request
                </span>
              )}
              {conversation.class && (
                <span className="text-xs text-[var(--text-muted)] shrink-0 font-medium font-sf-display">
                  Class {conversation.class}
                </span>
              )}
              {isMuted && (
                <VolumeX size={13} className="text-[var(--text-muted)] shrink-0 ml-auto" />
              )}
            </div>

            {/* Preview line: 14px muted with ' · 4h' */}
            <p
              className={`text-sm truncate mt-0.5 leading-tight font-sf-display ${
                isUnread ? 'font-semibold text-[var(--text)]' : 'font-medium text-[var(--text-muted)]'
              }`}
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF UI Display", "SF Pro Text", "Helvetica Neue", sans-serif',
              }}
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
