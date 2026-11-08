'use client';

import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Send, Heart } from 'lucide-react';
import { StatusItem } from './types';

interface StatusViewerModalProps {
  status: StatusItem;
  onClose: () => void;
  onReply: (text: string) => void;
}

export const StatusViewerModal: React.FC<StatusViewerModalProps> = ({
  status,
  onClose,
  onReply,
}) => {
  const updates = status.updates.length > 0 ? status.updates : [
    {
      id: 'default-status',
      type: 'text' as const,
      content: 'Hey there! I am using DPS Buzz',
      backgroundColor: 'var(--accent-cta)',
      time: status.time,
      viewCount: 15,
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [isPaused, setIsPaused] = useState(false);

  const currentUpdate = updates[currentIndex];

  useEffect(() => {
    if (isPaused) return;

    const step = 2; // 2% every 100ms = 5000ms total
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < updates.length - 1) {
            setCurrentIndex((c) => c + 1);
            return 0;
          } else {
            clearInterval(timer);
            onClose();
            return 100;
          }
        }
        return prev + step;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [currentIndex, updates.length, isPaused, onClose]);

  const handleNext = () => {
    if (currentIndex < updates.length - 1) {
      setCurrentIndex((c) => c + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((c) => c - 1);
      setProgress(0);
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onReply(replyText.trim());
    setReplyText('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-between p-4 sm:p-8 select-none animate-fadeIn"
      onMouseDown={() => setIsPaused(true)}
      onMouseUp={() => setIsPaused(false)}
    >
      {/* Top Header: Segmented Progress Bar & Contact Info */}
      <div className="w-full max-w-xl z-20">
        {/* Segmented Progress Bars */}
        <div className="flex items-center gap-1.5 w-full mb-3">
          {updates.map((up, idx) => (
            <div key={up.id} className="h-1 flex-1 bg-white/25 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100 ease-linear rounded-full"
                style={{
                  width:
                    idx < currentIndex
                      ? '100%'
                      : idx === currentIndex
                      ? `${progress}%`
                      : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Contact info & Close button */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-md"
              style={{ backgroundColor: status.contactColor }}
            >
              {status.contactInitials}
            </div>
            <div>
              <div className="text-sm font-semibold">{status.contactName}</div>
              <div className="text-[11px] text-white/70">{currentUpdate.time}</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-xl flex-1 flex items-center justify-center relative my-4">
        {/* Navigation Arrows */}
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="absolute left-2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors disabled:opacity-0 cursor-pointer z-20"
        >
          <ChevronLeft size={24} />
        </button>

        <button
          onClick={handleNext}
          className="absolute right-2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors cursor-pointer z-20"
        >
          <ChevronRight size={24} />
        </button>

        {/* Story Card */}
        <div
          className="w-full max-w-md aspect-[9/16] rounded-2xl flex flex-col items-center justify-center p-8 text-center text-white shadow-2xl relative overflow-hidden transition-all duration-300"
          style={{ backgroundColor: currentUpdate.backgroundColor || 'var(--accent-cta)' }}
        >
          <div className="text-2xl font-bold leading-relaxed px-4 break-words">
            {currentUpdate.content}
          </div>

          {currentUpdate.caption && (
            <div className="absolute bottom-6 left-4 right-4 bg-black/40 backdrop-blur-xs p-3 rounded-xl text-xs text-white/90">
              {currentUpdate.caption}
            </div>
          )}
        </div>
      </div>

      {/* Footer Reply Form */}
      <div className="w-full max-w-xl z-20">
        <form onSubmit={handleSendReply} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Reply to status..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-full bg-white/15 text-white placeholder-white/60 text-sm outline-none backdrop-blur-xs focus:bg-white/20 transition-colors"
          />
          <button
            type="submit"
            disabled={!replyText.trim()}
            className="p-2.5 rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] disabled:opacity-40 transition-colors cursor-pointer"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
