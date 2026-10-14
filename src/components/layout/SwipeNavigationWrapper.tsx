'use client';

import React, { useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * Universal Mobile Gesture Swipe Navigation for DPS Buzz
 * Headless listener component.
 * Navigation Chain:
 * - On /home: Swipe Right -> /chats; Swipe Left -> Opens Stories
 * - On /chats: Swipe Right -> /profile; Swipe Left -> /post/new
 * - On /profile or /u/*: Swipe Left -> /chats
 * - On /post/new: Swipe Left -> /home; Swipe Right -> /chats
 */
export const SwipeNavigationWrapper: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastNavTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];

      // Exclude interactive form controls, contenteditable, and horizontal scrubbers
      const target = e.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName.toLowerCase();
        if (
          tagName === 'input' ||
          tagName === 'textarea' ||
          tagName === 'select' ||
          target.closest('input') ||
          target.closest('textarea') ||
          target.closest('[data-no-swipe="true"]') ||
          target.closest('.no-swipe') ||
          target.getAttribute('type') === 'range'
        ) {
          touchStartRef.current = null;
          return;
        }
      }

      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      if (e.changedTouches.length !== 1) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const duration = Date.now() - touchStartRef.current.time;
      touchStartRef.current = null;

      // Ignore slow drags (>650ms) or short distance (<65px)
      if (duration > 650 || Math.abs(deltaX) < 65) return;

      // Ignore mostly vertical gestures (must be strongly horizontal)
      if (Math.abs(deltaX) < Math.abs(deltaY) * 1.5) return;

      // Cooldown debounce to prevent double-navigation
      const now = Date.now();
      if (now - lastNavTimeRef.current < 450) return;
      lastNavTimeRef.current = now;

      const isSwipeLeft = deltaX < 0; // finger moves left -> next rightward view
      const isSwipeRight = deltaX > 0; // finger moves right -> back/leftward view

      const cleanPath = pathname || '';

      // Optional light haptic tick
      try {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(20);
        }
      } catch {}

      // 1. HOME SCREEN GESTURES
      if (cleanPath === '/home' || cleanPath === '/') {
        if (isSwipeRight) {
          // Home Swipe Right -> Advance to Chats
          router.push('/chats');
        } else if (isSwipeLeft) {
          // Home Swipe Left -> Open School Stories
          window.dispatchEvent(new CustomEvent('dpsbuzz:open_stories'));
        }
        return;
      }

      // 2. CHATS SCREEN GESTURES
      if (cleanPath.startsWith('/chats')) {
        if (isSwipeRight) {
          // Chats Swipe Right -> Advance to Profile
          router.push('/profile');
        } else if (isSwipeLeft) {
          // Chats Swipe Left -> Go to Post Create
          router.push('/post/new');
        }
        return;
      }

      // 3. PROFILE SCREEN GESTURES
      if (cleanPath.startsWith('/profile') || cleanPath.startsWith('/u/')) {
        if (isSwipeLeft) {
          // Profile Swipe Left -> Back to Chats
          router.push('/chats');
        }
        return;
      }

      // 4. POST CREATION SCREEN GESTURES
      if (cleanPath.startsWith('/post/new') || cleanPath.startsWith('/post')) {
        if (isSwipeLeft) {
          // Post Swipe Left -> Back to Home Page
          router.push('/home');
        } else if (isSwipeRight) {
          // Post Swipe Right -> Advance to Chats
          router.push('/chats');
        }
        return;
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pathname, router]);

  return null;
};

export default SwipeNavigationWrapper;
