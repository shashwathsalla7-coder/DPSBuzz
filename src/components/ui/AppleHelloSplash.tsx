'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { DataStore } from '@/lib/dataStore';

const GREETINGS = [
  { text: 'hello', lang: 'English' },
  { text: 'namaste', lang: 'Hindi' },
  { text: 'hola', lang: 'Spanish' },
  { text: 'bonjour', lang: 'French' },
  { text: 'ciao', lang: 'Italian' },
];

export const AppleHelloSplash: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [greetingIndex, setGreetingIndex] = useState(0);
  const [activeUser, setActiveUser] = useState<any>(null);

  useEffect(() => {
    // Check if user has already been greeted in this session or requested no splash
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    if (params?.get('nosplash') === '1') {
      return;
    }
    const hasGreeted = typeof window !== 'undefined' && sessionStorage.getItem('dpsbuzz_greeted_v2');

    // Retrieve active student profile
    const updateActiveUser = () => {
      try {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('dpsbuzz_user') : null;
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.username && parsed.username !== 'guest') {
            let cleanFullName = (parsed.fullName || parsed.name || parsed.username || '').replace(/\s*\(Admin\)/gi, '').trim();
            if (parsed.username.toLowerCase() === 'shashwath71845' && (!cleanFullName || cleanFullName === 'Shashwath')) {
              cleanFullName = 'Shashwath Salla';
            }
            parsed.fullName = cleanFullName;
            setActiveUser(parsed);
            return;
          }
        }
      } catch {}
      try {
        const fallback = DataStore.getCurrentUser();
        if (fallback && fallback.username && fallback.username !== 'guest') {
          let cleanFullName = (fallback.fullName || fallback.username || '').replace(/\s*\(Admin\)/gi, '').trim();
          if (fallback.username.toLowerCase() === 'shashwath71845' && (!cleanFullName || cleanFullName === 'Shashwath')) {
            cleanFullName = 'Shashwath Salla';
          }
          fallback.fullName = cleanFullName;
          setActiveUser(fallback);
          return;
        }
      } catch {}
      setActiveUser(null);
    };

    updateActiveUser();

    if (!hasGreeted) {
      setIsVisible(true);
      sessionStorage.setItem('dpsbuzz_greeted_v2', 'true');
    }

    // Allow manual replay from anywhere (e.g. Settings or Demo button)
    const handleReplay = () => {
      updateActiveUser();
      setIsFadingOut(false);
      setIsVisible(true);
      setGreetingIndex(0);
    };

    window.addEventListener('dpsbuzz_replay_apple_hello', handleReplay);
    window.addEventListener('storage', updateActiveUser);
    window.addEventListener('dpsbuzz:content_updated', updateActiveUser);
    return () => {
      window.removeEventListener('dpsbuzz_replay_apple_hello', handleReplay);
      window.removeEventListener('storage', updateActiveUser);
      window.removeEventListener('dpsbuzz:content_updated', updateActiveUser);
    };
  }, []);

  // Cycle through greetings every 600ms for Apple-style multilingual charm
  useEffect(() => {
    if (!isVisible || isFadingOut) return;
    const interval = setInterval(() => {
      setGreetingIndex((prev) => (prev + 1) % GREETINGS.length);
    }, 650);
    return () => clearInterval(interval);
  }, [isVisible, isFadingOut]);

  const dismiss = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsFadingOut(false);
    }, 600);
  };

  // Auto-dismiss after 2.4 seconds
  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => {
      dismiss();
    }, 2400);
    return () => clearTimeout(timer);
  }, [isVisible]);

  if (!isVisible) return null;

  const currentGreeting = GREETINGS[greetingIndex];

  return (
    <div
      onClick={dismiss}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-between p-8 select-none transition-all duration-600 ease-out cursor-pointer ${
        isFadingOut ? 'opacity-0 scale-105 blur-sm pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        backgroundColor: 'rgba(5, 5, 5, 0.94)',
        backdropFilter: 'blur(36px)',
        WebkitBackdropFilter: 'blur(36px)',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to DPS Buzz"
    >
      {/* Background ambient lighting orbs (Apple glass glow) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-violet-600/15 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/3 w-72 h-72 rounded-full bg-amber-500/10 blur-[90px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-64 h-64 rounded-full bg-pink-500/12 blur-[90px] pointer-events-none" />

      {/* Top Bar: subtle school pill */}
      <div className="pt-4 flex items-center gap-2 animate-apple-fade-up">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span className="text-[11px] font-semibold tracking-wider uppercase text-neutral-400">
          DPS Buzz Campus 🐝
        </span>
      </div>

      {/* Centerpiece: Iconic Apple-Style "hello" cursive calligraphy */}
      <div className="flex flex-col items-center justify-center text-center space-y-6 my-auto">
        {/* SVG Drawing of Apple-style cursive "hello" */}
        <div className="relative flex items-center justify-center">
          <svg
            className="w-[280px] h-[110px] sm:w-[360px] sm:h-[135px] text-white drop-shadow-[0_4px_24px_rgba(255,255,255,0.22)]"
            viewBox="0 0 320 110"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Apple signature cursive "hello" stroke path */}
            <path
              d="M 28 85 C 32 60 38 32 42 16 C 43 12 47 13 46 22 C 44 42 39 74 38 88 C 45 74 53 62 62 62 C 70 62 72 70 69 82 C 67 90 73 91 80 84 C 91 74 97 64 94 62 C 89 60 81 68 83 78 C 85 86 92 88 101 84 C 109 77 114 62 119 32 C 121 20 126 19 125 32 C 122 54 117 80 119 86 C 122 93 129 86 135 78 C 143 68 149 48 153 28 C 156 16 160 18 159 32 C 156 56 152 79 155 86 C 159 92 165 87 172 79 C 182 68 190 62 196 62 C 205 62 208 72 204 84 C 200 94 207 96 215 88 C 224 80 231 69 229 65 C 225 61 216 70 219 82 C 222 93 234 94 246 84"
              stroke="url(#appleHelloGradient)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-apple-stroke"
            />
            <defs>
              <linearGradient id="appleHelloGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="45%" stopColor="#F9FAFB" />
                <stop offset="75%" stopColor="#FED7AA" />
                <stop offset="100%" stopColor="#FBCFE8" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Dynamic multilingual greeting subtitle */}
        <div className="space-y-2">
          <div className="h-8 flex items-center justify-center">
            <p
              key={currentGreeting.text}
              className="text-2xl sm:text-3xl font-light tracking-wide text-neutral-200 capitalize animate-fade-in font-display"
              style={{ fontFamily: "var(--font-cabinet), 'Cabinet Grotesk', sans-serif" }}
            >
              {currentGreeting.text}
            </p>
          </div>

          {activeUser && activeUser.username && activeUser.username !== 'guest' ? (
            <div className="flex flex-col items-center gap-1.5 animate-fade-in pt-1">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-bold text-white tracking-tight">
                  @{activeUser.username}
                </span>
                {activeUser.fullName && (
                  <span className="text-xs text-neutral-300 font-medium border-l border-white/20 pl-2">
                    {activeUser.fullName}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 font-medium">
                {activeUser.class ? `Class ${activeUser.class}${activeUser.section ? `-${activeUser.section}` : ''} • ` : ''}Your School. Your Vibe. 🐝
              </p>
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-neutral-400 font-medium">
              Your School. Your Vibe. 🐝
            </p>
          )}
        </div>
      </div>

      {/* Bottom Apple Home Swipe / Tap Indicator */}
      <div className="pb-4 flex flex-col items-center gap-2 animate-apple-fade-up">
        <p className="text-[11px] text-neutral-400 font-medium tracking-wide">
          Tap anywhere or swipe up to enter
        </p>
        {/* Apple-style Home Bar */}
        <div className="w-32 h-1 rounded-full bg-white/60 shadow-[0_0_8px_rgba(255,255,255,0.4)] animate-pulse" />
      </div>
    </div>
  );
};

export default AppleHelloSplash;
