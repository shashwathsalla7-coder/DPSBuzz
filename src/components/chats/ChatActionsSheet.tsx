'use client';

import React from 'react';
import { Bell, BellOff, Pin, Flag, ShieldAlert, Trash2, X } from 'lucide-react';
import { ConversationItem } from './ConversationRow';
import { DataStore } from '@/lib/dataStore';

export interface ChatActionsSheetProps {
  conversation: ConversationItem | null;
  isOpen: boolean;
  onClose: () => void;
  onMuteToggle: (id: string) => void;
  onPinToggle: (id: string) => void;
  onDeleteRequest: (conv: ConversationItem) => void;
  onReport: (conv: ConversationItem) => void;
  onBlock: (conv: ConversationItem) => void;
}

export const ChatActionsSheet: React.FC<ChatActionsSheetProps> = ({
  conversation,
  isOpen,
  onClose,
  onMuteToggle,
  onPinToggle,
  onDeleteRequest,
  onReport,
  onBlock,
}) => {
  if (!isOpen || !conversation) return null;

  const currentUsername = DataStore.getCurrentUser()?.username?.toLowerCase();
  const isOwnAccount = conversation.username?.toLowerCase() === currentUsername;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Chat options"
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className="relative z-10 w-full max-w-[480px] rounded-t-[24px] overflow-hidden border-t shadow-2xl animate-fade-in p-4 space-y-3"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--line)',
        }}
      >
        <div className="w-10 h-1 rounded-full mx-auto" style={{ backgroundColor: 'var(--line-strong)' }} />

        <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--line)' }}>
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
              {conversation.name}
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {conversation.isGroup ? 'Class Group' : `@${conversation.username}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[var(--surface-sunken)] cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-1 text-sm font-medium">
          {/* Mute */}
          <button
            type="button"
            onClick={() => {
              onMuteToggle(conversation.id);
              onClose();
            }}
            className="w-full px-3 py-2.5 rounded-[10px] flex items-center gap-3 text-left hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer"
            style={{ color: 'var(--text)' }}
          >
            {conversation.isMuted ? <Bell size={18} /> : <BellOff size={18} />}
            <span>{conversation.isMuted ? 'Unmute notifications' : 'Mute notifications'}</span>
          </button>

          {/* Pin */}
          <button
            type="button"
            onClick={() => {
              onPinToggle(conversation.id);
              onClose();
            }}
            className="w-full px-3 py-2.5 rounded-[10px] flex items-center gap-3 text-left hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer"
            style={{ color: 'var(--text)' }}
          >
            <Pin size={18} className="transform rotate-45" />
            <span>{conversation.isPinned ? 'Unpin from top' : 'Pin to top'}</span>
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() => {
              onDeleteRequest(conversation);
              onClose();
            }}
            className="w-full px-3 py-2.5 rounded-[10px] flex items-center gap-3 text-left hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer"
            style={{ color: 'var(--danger, #EF4444)' }}
          >
            <Trash2 size={18} />
            <span>Delete conversation</span>
          </button>

          {/* Report - Cannot report yourself */}
          {!isOwnAccount && (
            <button
              type="button"
              onClick={() => {
                onReport(conversation);
                onClose();
              }}
              className="w-full px-3 py-2.5 rounded-[10px] flex items-center gap-3 text-left hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer"
              style={{ color: 'var(--text)' }}
            >
              <Flag size={18} />
              <span>Report conversation</span>
            </button>
          )}

          {/* Block - Cannot block yourself or class groups */}
          {!conversation.isGroup && !isOwnAccount && (
            <button
              type="button"
              onClick={() => {
                onBlock(conversation);
                onClose();
              }}
              className="w-full px-3 py-2.5 rounded-[10px] flex items-center gap-3 text-left hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer"
              style={{ color: 'var(--danger)' }}
            >
              <ShieldAlert size={18} />
              <span>Block student</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatActionsSheet;
