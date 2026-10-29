'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Film,
  Plus,
  ChevronUp,
  ChevronDown,
  Sparkles,
  RefreshCw,
  Video,
} from 'lucide-react';
import { DataStore, type Post, type Profile } from '@/lib/dataStore';
import { ReelCard } from '@/components/reels/ReelCard';
import { CreateReelModal } from '@/components/reels/CreateReelModal';
import { ReelCommentsDrawer } from '@/components/reels/ReelCommentsDrawer';
import { SharePostModal } from '@/components/home/SharePostModal';
import { LikesViewsModal } from '@/components/reels/LikesViewsModal';

export default function ReelsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [reels, setReels] = useState<Post[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCommentsReel, setSelectedCommentsReel] = useState<Post | null>(null);
  const [selectedShareReel, setSelectedShareReel] = useState<Post | null>(null);
  const [selectedLikesViewsReel, setSelectedLikesViewsReel] = useState<Post | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const user = DataStore.getCurrentUser();
    setCurrentUser(user);
    loadReels();

    const handleContentUpdated = () => {
      loadReels();
    };

    window.addEventListener('dpsbuzz:content_updated', handleContentUpdated);
    window.addEventListener('storage', handleContentUpdated);
    return () => {
      window.removeEventListener('dpsbuzz:content_updated', handleContentUpdated);
      window.removeEventListener('storage', handleContentUpdated);
    };
  }, []);

  const loadReels = () => {
    try {
      const user = DataStore.getCurrentUser();
      const myUsername = (user?.username || '').toLowerCase().trim();
      const allReels = DataStore.getReels();
      const now = Date.now();
      const OWN_REEL_LIFESPAN_HOURS = 48; // User's own reel shows in feed for 2 days, then profile only

      // Filter out user's own reels older than 48 hours
      const visibleReels = allReels.filter((r) => {
        const author = (r.username || '').toLowerCase().trim();
        if (author && author === myUsername) {
          const reelTime = r.createdAt ? new Date(r.createdAt).getTime() : 0;
          const ageHours = reelTime > 0 ? (now - reelTime) / (1000 * 60 * 60) : 0;
          if (ageHours > OWN_REEL_LIFESPAN_HOURS) return false;
        }
        return true;
      });

      // Algorithm: Freshness first (today/yesterday), balanced with engagement
      visibleReels.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        const ageA = Math.max(0, (now - timeA) / (1000 * 60 * 60));
        const ageB = Math.max(0, (now - timeB) / (1000 * 60 * 60));

        const freshnessA = ageA < 24 ? 1200 - ageA * 35 : Math.max(0, 360 - ageA * 5);
        const freshnessB = ageB < 24 ? 1200 - ageB * 35 : Math.max(0, 360 - ageB * 5);

        const scoreA = freshnessA + (a.likes || 0) * 10 + (a.views || 0) * 0.3;
        const scoreB = freshnessB + (b.likes || 0) * 10 + (b.views || 0) * 0.3;

        return scoreB - scoreA || timeB - timeA;
      });

      setReels(visibleReels);
    } catch {
      setReels([]);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Track active reel on scroll
  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    const itemHeight = container.clientHeight;
    if (itemHeight <= 0) return;
    const currentScroll = container.scrollTop;
    const index = Math.round(currentScroll / itemHeight);
    if (index !== activeIndex && index >= 0 && index < reels.length) {
      setActiveIndex(index);
    }
  };

  // Keyboard navigation for desktop (ArrowUp / ArrowDown)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        scrollToIndex(activeIndex + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        scrollToIndex(activeIndex - 1);
      } else if (e.key === 'm' || e.key === 'M') {
        setIsMuted((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, reels.length]);

  const scrollToIndex = (index: number) => {
    const container = containerRef.current;
    if (!container) return;
    const targetIndex = Math.max(0, Math.min(reels.length - 1, index));
    const targetScroll = targetIndex * container.clientHeight;
    container.scrollTo({ top: targetScroll, behavior: 'smooth' });
    setActiveIndex(targetIndex);
  };

  const handleReelCreated = (newReel: Post) => {
    loadReels();
    showToast('Reel published to DPS Buzz! 🎬✨');
    scrollToIndex(0);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-black overflow-hidden flex items-center justify-center">
      {/* Top Floating Header */}
      <div className="absolute top-0 inset-x-0 z-40 px-4 pt-3 pb-2 flex items-center justify-between pointer-events-none sm:max-w-[440px] sm:mx-auto">
        <div className="flex items-center gap-2 pointer-events-auto">
          <Link
            href="/reels"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-white shadow-md active:scale-95 transition-transform"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center text-white">
              <Film size={12} strokeWidth={2.5} />
            </div>
            <span className="text-sm font-extrabold tracking-tight">Reels</span>
          </Link>
        </div>

        {/* Post Reel Button */}
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-600 to-rose-600 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-rose-900/40 active:scale-95 transition-all cursor-pointer"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>Post Reel</span>
        </button>
      </div>

      {/* Desktop Up/Down Quick Navigation Controls */}
      <div className="hidden lg:flex fixed right-8 top-1/2 -translate-y-1/2 z-40 flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => scrollToIndex(activeIndex - 1)}
          disabled={activeIndex === 0}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white flex items-center justify-center disabled:opacity-20 cursor-pointer transition-all active:scale-90"
          aria-label="Previous reel"
          title="Previous reel (Up Arrow)"
        >
          <ChevronUp size={22} />
        </button>
        <span className="text-xs font-mono font-bold text-white/70">
          {activeIndex + 1}/{reels.length}
        </span>
        <button
          type="button"
          onClick={() => scrollToIndex(activeIndex + 1)}
          disabled={activeIndex >= reels.length - 1}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white flex items-center justify-center disabled:opacity-20 cursor-pointer transition-all active:scale-90"
          aria-label="Next reel"
          title="Next reel (Down Arrow)"
        >
          <ChevronDown size={22} />
        </button>
      </div>

      {/* Reels Vertical Snap Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
        style={{ scrollBehavior: 'smooth' }}
      >
        {reels.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-white text-center p-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center">
              <Film size={32} />
            </div>
            <div>
              <h2 className="text-base font-bold">No Reels Yet</h2>
              <p className="text-xs text-white/60 mt-1 max-w-xs">
                Be the first classmate to record and share a reel on DPS Buzz!
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2.5 rounded-full bg-[var(--primary)] text-white text-xs font-bold shadow-md cursor-pointer"
            >
              Post First Reel 🎬
            </button>
          </div>
        ) : (
          reels.map((reel, index) => (
            <ReelCard
              key={reel.id}
              reel={reel}
              isActive={index === activeIndex}
              isMuted={isMuted}
              onToggleMute={() => setIsMuted((prev) => !prev)}
              onOpenComments={(r) => setSelectedCommentsReel(r)}
              onOpenShare={(r) => setSelectedShareReel(r)}
              onOpenLikesViews={(r) => setSelectedLikesViewsReel(r)}
              currentUser={currentUser}
            />
          ))
        )}
      </div>

      {/* Create Reel Modal */}
      {isCreateModalOpen && (
        <CreateReelModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onReelCreated={handleReelCreated}
        />
      )}

      {/* Reel Comments Drawer */}
      {selectedCommentsReel && (
        <ReelCommentsDrawer
          isOpen={Boolean(selectedCommentsReel)}
          reelId={selectedCommentsReel.id}
          onClose={() => setSelectedCommentsReel(null)}
          onCommentAdded={() => {
            loadReels();
          }}
        />
      )}

      {/* Share Reel Modal */}
      {selectedShareReel && (
        <SharePostModal
          isOpen={Boolean(selectedShareReel)}
          post={selectedShareReel}
          onClose={() => setSelectedShareReel(null)}
          onPostShared={() => {
            showToast('Reel sent to chat! ✈️');
            setSelectedShareReel(null);
          }}
        />
      )}

      {/* Likes & Views Modal */}
      {selectedLikesViewsReel && (
        <LikesViewsModal
          isOpen={Boolean(selectedLikesViewsReel)}
          postId={selectedLikesViewsReel.id}
          postAuthor={selectedLikesViewsReel.username}
          currentUser={currentUser}
          onClose={() => setSelectedLikesViewsReel(null)}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-black/85 backdrop-blur-md border border-white/20 text-white text-xs font-semibold shadow-2xl animate-fade-in flex items-center gap-2">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
