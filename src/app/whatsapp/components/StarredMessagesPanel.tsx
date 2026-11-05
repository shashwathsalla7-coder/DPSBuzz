'use client';

import React from 'react';
import { X, Star, ArrowRight } from 'lucide-react';
import { MessageItem } from './types';

interface StarredMessagesPanelProps {
  onClose: () => void;
  starredMessages: Array<{ chatName: string; message: MessageItem }>;
  onUnstar: (msgId: string) => void;
  onJumpToChat: (chatName: string) => void;
}

export const StarredMessagesPanel: React.FC<StarredMessagesPanelProps> = ({
  onClose,
  starredMessages,
  onUnstar,
  onJumpToChat,
}) => {
  return (
    <div className="w-[360px] lg:w-[400px] h-full flex flex-col bg-[#111b21] border-l border-[#222d34] shrink-0 select-none overflow-hidden animate-slideLeft">
      {/* Header */}
      <div className="h-[60px] px-4 flex items-center justify-between bg-[#202c33] border-b border-[#222d34] shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#8696a0] hover:text-[#e9edef] transition-colors cursor-pointer"
            title="Close"
          >
            <X size={19} />
          </button>
          <h2 className="text-sm font-semibold text-[#e9edef] flex items-center gap-2">
            <Star size={16} className="text-[#00a884] fill-[#00a884]" />
            Starred messages
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {starredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#8696a0]">
            <Star size={48} className="text-[#8696a0]/30 mb-3" />
            <h3 className="text-sm font-semibold text-[#e9edef]">No starred messages</h3>
            <p className="text-xs mt-1 leading-relaxed">
              Hover over any message in a chat and click the Star icon to easily find it later.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {starredMessages.map(({ chatName, message }) => (
              <div
                key={message.id}
                className="p-3 rounded-xl bg-[#202c33] border border-[#222d34] space-y-2 group hover:border-[#00a884]/40 transition-colors"
              >
                {/* Header: Chat name & sender */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#00a884] truncate">
                    {chatName}
                  </span>
                  <span className="text-[11px] text-[#8696a0]">{message.time}</span>
                </div>

                <div className="text-xs text-[#8696a0] font-medium">
                  {message.senderName}:
                </div>

                {/* Message body */}
                <div className="text-xs text-[#e9edef] leading-relaxed whitespace-pre-wrap">
                  {message.text}
                </div>

                {/* Actions: Jump to chat / Unstar */}
                <div className="pt-2 border-t border-[#222d34]/60 flex items-center justify-between">
                  <button
                    onClick={() => onJumpToChat(chatName)}
                    className="flex items-center gap-1 text-[11px] text-[#53bdeb] hover:underline cursor-pointer"
                  >
                    <span>Go to chat</span>
                    <ArrowRight size={12} />
                  </button>

                  <button
                    onClick={() => onUnstar(message.id)}
                    className="text-[11px] text-[#8696a0] hover:text-[#ea4335] cursor-pointer"
                  >
                    Unstar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
