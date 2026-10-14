'use client';

import React, { useState, useRef } from 'react';
import { BellOff, Bell, Trash2 } from 'lucide-react';

export interface SwipeActionsProps {
  children: React.ReactNode;
  isMuted?: boolean;
  onMuteToggle: () => void;
  onDeleteRequest: () => void;
  isOpen?: boolean;
}

/**
 * SwipeActions: Reveals Mute and Delete buttons upon swiping left on a conversation row.
 * Includes smooth transition and reset on outside tap.
 */
export const SwipeActions: React.FC<SwipeActionsProps> = ({
  children,
  isMuted = false,
  onMuteToggle,
  onDeleteRequest,
}) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiped, setIsSwiped] = useState(false);
  const startXRef = useRef<number | null>(null);
  const currentXRef = useRef<number>(0);

  const maxSwipeWidth = 120; // 60px each for Mute and Delete

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startXRef.current === null) return;
    const diff = e.touches[0].clientX - startXRef.current;
    if (diff < 0) {
      // Swiping left
      const clamped = Math.max(-maxSwipeWidth, diff);
      setOffsetX(clamped);
      currentXRef.current = clamped;
    } else if (isSwiped && diff > 0) {
      // Swiping right from open state
      const clamped = Math.min(0, -maxSwipeWidth + diff);
      setOffsetX(clamped);
      currentXRef.current = clamped;
    }
  };

  const handleTouchEnd = () => {
    startXRef.current = null;
    if (currentXRef.current < -50) {
      setOffsetX(-maxSwipeWidth);
      setIsSwiped(true);
    } else {
      setOffsetX(0);
      setIsSwiped(false);
    }
  };

  const closeSwipe = () => {
    setOffsetX(0);
    setIsSwiped(false);
  };

  return (
    <div className="relative overflow-hidden w-full h-[72px]">
      {/* Revealed Action Buttons under the row */}
      <div className="absolute inset-y-0 right-0 flex items-stretch z-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMuteToggle();
            closeSwipe();
          }}
          className="w-[60px] flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer"
          style={{
            backgroundColor: 'var(--surface-sunken)',
            color: 'var(--text)',
            borderLeft: '1px solid var(--line)',
          }}
          aria-label={isMuted ? 'Unmute chat' : 'Mute chat'}
        >
          {isMuted ? <Bell size={16} /> : <BellOff size={16} />}
          <span>{isMuted ? 'Unmute' : 'Mute'}</span>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteRequest();
            closeSwipe();
          }}
          className="w-[60px] flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-white transition-colors cursor-pointer"
          style={{
            backgroundColor: 'var(--danger)',
          }}
          aria-label="Delete chat"
        >
          <Trash2 size={16} />
          <span>Delete</span>
        </button>
      </div>

      {/* Main Swiping Content */}
      <div
        className="relative z-10 w-full h-full transition-transform duration-200 ease-out"
        style={{
          transform: `translateX(${offsetX}px)`,
          backgroundColor: 'var(--surface)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
};

export default SwipeActions;
