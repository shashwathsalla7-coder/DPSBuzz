'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Send,
  Check,
  Share2,
  Copy,
  Users,
  Image as ImageIcon,
} from 'lucide-react';
import { DataStore, type Profile } from '@/lib/dataStore';
import { getAvatarColorPair } from '@/config/tokens';

interface ForwardMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: any | null;
  currentUsername: string;
  onForwardSuccess?: (targetUsername: string) => void;
}

export const ForwardMessageModal: React.FC<ForwardMessageModalProps> = ({
  isOpen,
  onClose,
  message,
  currentUsername,
  onForwardSuccess,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [recipients, setRecipients] = useState<any[]>([]);
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSentMap({});
      setCopied(false);
      setSearchQuery('');
      loadRecipients();
    }
  }, [isOpen, currentUsername]);

  const loadRecipients = () => {
    try {
      const profiles = DataStore.getProfiles().filter(
        (p) => p.username.toLowerCase() !== (currentUsername || '').toLowerCase()
      );
      const groups = DataStore.getGroups();
      const combined = [
        ...groups.map((g) => ({
          id: g.id,
          name: g.name,
          username: g.id,
          avatar: g.avatarUrl || null,
          isGroup: true,
          subtitle: `${g.memberCount || g.members?.length || 1} members • Group`,
        })),
        ...profiles.map((p) => ({
          id: p.id || p.username,
          name: p.fullName || p.username,
          username: p.username,
          avatar: p.avatar || null,
          isGroup: false,
          subtitle: `@${p.username} • Class ${p.class || '8'}-${p.section || 'A'}`,
        })),
      ];
      setRecipients(combined);
    } catch {
      setRecipients([]);
    }
  };

  if (!isOpen || !message) return null;

  const filteredRecipients = recipients.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      r.name.toLowerCase().includes(q) ||
      r.username.toLowerCase().includes(q) ||
      (r.subtitle && r.subtitle.toLowerCase().includes(q))
    );
  });

  const handleForwardTo = async (recipient: any) => {
    const targetKey = recipient.username;
    if (sentMap[targetKey]) return;

    try {
      const isGroup = recipient.isGroup;
      const targetChatId = isGroup
        ? recipient.id
        : [currentUsername.toLowerCase(), recipient.username.toLowerCase()].sort().join('__');

      // 1. Prepare message content to forward
      let forwardedText = message.text || '';
      let sharedPostPayload = message.sharedPost || message.post_preview || null;

      if (!forwardedText && !sharedPostPayload) {
        forwardedText = 'Forwarded message';
      }

      // 2. If it's a shared post, forward using DataStore.sharePostToChat
      if (sharedPostPayload && sharedPostPayload.id) {
        DataStore.sharePostToChat(
          {
            id: sharedPostPayload.id,
            username: sharedPostPayload.username || 'student',
            caption: sharedPostPayload.caption || '',
            images: sharedPostPayload.images || (sharedPostPayload.imageUrl ? [sharedPostPayload.imageUrl] : []),
            imageUrl: sharedPostPayload.imageUrl,
            videoUrl: sharedPostPayload.videoUrl,
            isVideo: sharedPostPayload.isVideo,
          } as any,
          [recipient.username],
          currentUsername,
          forwardedText && !forwardedText.startsWith('Shared @') ? forwardedText : undefined
        );
      } else {
        // 3. Regular text or photo message forwarding
        const now = Date.now();
        const fwdId = `fwd-${now}-${Math.random().toString(36).substring(2, 7)}`;
        const forwardMsgObj = {
          id: fwdId,
          client_id: fwdId,
          text: forwardedText,
          sender: 'me',
          senderUsername: currentUsername,
          time: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(now)),
          createdAt: new Date(now).toISOString(),
          timestamp: now,
          status: 'sent',
          isDelivered: true,
          is_read: false,
          sharedPost: message.sharedPost || undefined,
          isChatPhoto: message.isChatPhoto || false,
        };

        // Save locally to user messages store
        const storageKey = `dpsbuzz_chat_messages_${currentUsername}_v3`;
        try {
          const raw = localStorage.getItem(storageKey);
          const map = raw ? JSON.parse(raw) : {};
          const currentList = map[targetChatId] || [];
          map[targetChatId] = [...currentList, forwardMsgObj];
          localStorage.setItem(storageKey, JSON.stringify(map));
        } catch {}

        // Send to server API
        fetch('/api/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: targetChatId,
            message: forwardMsgObj,
            isGroup,
            groupId: isGroup ? recipient.id : undefined,
          }),
        }).catch(() => {});
      }

      setSentMap((prev) => ({ ...prev, [targetKey]: true }));
      onForwardSuccess?.(recipient.name);
      window.dispatchEvent(new CustomEvent('dpsbuzz:content_updated', { detail: { type: 'message_forwarded' } }));
    } catch (e) {
      console.error('Forward failed:', e);
    }
  };

  const handleCopyText = () => {
    const textToCopy = message.text || message.sharedPost?.caption || '';
    if (textToCopy && navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareExternal = async () => {
    const text = message.text || message.sharedPost?.caption || 'Shared message from DPS Buzz';
    const url = message.sharedPost?.id ? `https://dpsbuzz.in/home#post-${message.sharedPost.id}` : window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'DPS Buzz',
          text,
          url,
        });
      } catch {}
    } else {
      handleCopyText();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-[var(--surface)] border border-[var(--line)] rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col max-h-[82vh] overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile handle */}
        <div className="w-full flex items-center justify-center pt-2.5 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-[var(--line)]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--line)]">
          <div className="flex items-center gap-2">
            <Share2 size={18} className="text-[var(--primary)]" />
            <h3 className="text-sm font-bold text-[var(--text)]">Forward / Share Message</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Message Preview Snippet */}
        <div className="px-5 py-2.5 bg-[var(--surface-sunken)] border-b border-[var(--line)] text-xs text-[var(--text)] flex items-center gap-2.5">
          <span className="text-[11px] font-semibold text-[var(--text-muted)] shrink-0">Content:</span>
          <div className="flex-1 truncate">
            {message.sharedPost ? (
              <span className="font-semibold text-[var(--primary)] truncate flex items-center gap-1">
                <span>📸 Post by @{message.sharedPost.username}:</span>
                <span className="text-[var(--text-muted)] font-normal italic truncate">
                  &ldquo;{message.sharedPost.caption || 'Photo'}&rdquo;
                </span>
              </span>
            ) : message.text ? (
              <span className="italic truncate block">
                &ldquo;{message.text}&rdquo;
              </span>
            ) : (
              <span className="text-[var(--text-muted)] italic">Photo / Attachment</span>
            )}
          </div>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-[var(--line)]">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search classmates or groups..."
              className="w-full h-10 pl-9 pr-4 rounded-full bg-[var(--surface-sunken)] border border-[var(--line)] text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--primary)] font-medium"
            />
          </div>
        </div>

        {/* Recipients List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-[var(--line)]/40">
          {filteredRecipients.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--text-muted)]">
              No matching classmates or groups found.
            </div>
          ) : (
            filteredRecipients.map((rec) => {
              const isSent = Boolean(sentMap[rec.username]);
              const color = getAvatarColorPair(rec.username);
              const initials = rec.name.slice(0, 2).toUpperCase();

              return (
                <div
                  key={rec.id}
                  className="flex items-center justify-between p-2.5 hover:bg-[var(--surface-sunken)] rounded-2xl transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-[var(--line)] flex items-center justify-center">
                      {rec.avatar ? (
                        <img src={rec.avatar} alt={rec.name} className="w-full h-full object-cover" />
                      ) : rec.isGroup ? (
                        <div className="w-full h-full bg-cyan-600 text-white flex items-center justify-center">
                          <Users size={16} />
                        </div>
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-xs font-bold"
                          style={{ backgroundColor: color.bg, color: color.text }}
                        >
                          {initials}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[var(--text)] truncate">{rec.name}</p>
                      <p className="text-[10px] text-[var(--text-muted)] truncate">{rec.subtitle}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleForwardTo(rec)}
                    disabled={isSent}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                      isSent
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 cursor-default'
                        : 'bg-[var(--primary)] text-white hover:opacity-90 shadow-xs'
                    }`}
                  >
                    {isSent ? (
                      <>
                        <Check size={13} strokeWidth={2.5} />
                        <span>Sent</span>
                      </>
                    ) : (
                      <>
                        <Send size={12} />
                        <span>Send</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with External Share Options */}
        <div className="p-3 border-t border-[var(--line)] bg-[var(--surface)] flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handleCopyText}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--line)] text-[var(--text)] hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy Text'}</span>
          </button>

          <button
            type="button"
            onClick={handleShareExternal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] text-[var(--primary)] font-semibold hover:border-[var(--primary)] transition-colors cursor-pointer"
          >
            <Share2 size={14} />
            <span>Share via Apps</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForwardMessageModal;
