'use client';

import { useState, useEffect, useRef } from 'react';
import { Flame, Sparkles, Check, Heart } from 'lucide-react';

interface HangingMonkeyMascotProps {
  streakDays: number;
  username?: string;
  postedToday?: boolean;
  onPostClick?: () => void;
}

export default function HangingMonkeyMascot({
  streakDays,
  username = 'Student',
  postedToday = false,
  onPostClick,
}: HangingMonkeyMascotProps) {
  const [scrollY, setScrollY] = useState(0);
  const [isWiggling, setIsWiggling] = useState(false);
  const [showBubble, setShowBubble] = useState(true);
  const [cheerCount, setCheerCount] = useState(0);
  const [hearts, setHearts] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (animFrameRef.current) return;
      animFrameRef.current = requestAnimationFrame(() => {
        setScrollY(window.scrollY);
        animFrameRef.current = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Calculate dynamic pendulum swing angle based on scroll depth
  // Alternates left and right as the user scrolls down!
  // Cycle roughly every 160-200px of scroll
  const swingAngle = Math.sin(scrollY * 0.028) * 22;

  // Streak Tier calculation: "Good, Better, Best"
  const getTier = (days: number) => {
    if (days >= 14) {
      return {
        label: 'Best Tier 🏆',
        tag: 'School Legend',
        color: '#F2B705',
        speech: 'Legendary! 14d+ Best tier! 🍌👑',
        nextTarget: 'Max Crown Kept!',
      };
    }
    if (days >= 7) {
      return {
        label: 'Better Tier ⚡',
        tag: 'Habit Master',
        color: '#E3A94B',
        speech: `${14 - days} days left to Best tier! 🚀`,
        nextTarget: `${days}/14 days to Best`,
      };
    }
    if (days >= 3) {
      return {
        label: 'Good Tier 🌱',
        tag: 'Consistent Spark',
        color: '#4CC38A',
        speech: `${7 - days} days left to Better tier! 🔥`,
        nextTarget: `${days}/7 days to Better`,
      };
    }
    return {
      label: 'Starter 🐣',
      tag: 'Day 1 Launch',
      color: '#7C9BFF',
      speech: 'Post today to hit Good tier (3d)! 🌱',
      nextTarget: `${days}/3 days to Good`,
    };
  };

  const currentTier = getTier(streakDays);

  const handleMonkeyClick = (e: React.MouseEvent) => {
    setIsWiggling(true);
    setCheerCount((prev) => prev + 1);

    // Spawn floating mini hearts / bananas
    const rect = e.currentTarget.getBoundingClientRect();
    const newHeart = {
      id: Date.now() + Math.random(),
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    setHearts((prev) => [...prev.slice(-4), newHeart]);

    setTimeout(() => {
      setIsWiggling(false);
    }, 900);
  };

  return (
    <div className="relative z-30 select-none pointer-events-none">
      {/* Floating Monkey Container (Fixed at top-right corner, swinging as user scrolls) */}
      <div className="fixed top-12 right-2 md:right-8 z-30 flex flex-col items-center pointer-events-auto">
        {/* Playful Speech Bubble */}
        {showBubble && (
          <div
            onClick={() => setShowBubble(false)}
            className="mb-1 max-w-[150px] p-2 rounded-xl text-left shadow-lg border text-[11px] font-semibold leading-tight animate-bounce-in cursor-pointer transition-all hover:scale-105"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--line)',
              color: 'var(--text)',
              transform: `translateX(${swingAngle * 0.4}px)`,
              boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            }}
            title="Click to dismiss or tap monkey to cheer!"
          >
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                {currentTier.label}
              </span>
              <span className="text-[10px] text-amber-500 font-mono font-bold">
                🔥 {streakDays}d
              </span>
            </div>
            <p className="text-[11px] font-medium" style={{ color: 'var(--text)' }}>
              {currentTier.speech}
            </p>
            <div className="text-[10px] text-[var(--text-muted)] mt-1 flex items-center justify-between">
              <span>{postedToday ? 'Posted ✓' : 'Pending ⏳'}</span>
              <span className="text-[9px] opacity-75">tap me 🍌</span>
            </div>
          </div>
        )}

        {/* The Hanging Vine & Animated Monkey */}
        <div
          onClick={handleMonkeyClick}
          className="relative cursor-pointer transition-transform duration-150 ease-out origin-top"
          style={{
            transform: `rotate(${isWiggling ? swingAngle * 1.5 + 15 : swingAngle}deg)`,
            transformOrigin: '28px 0px',
          }}
          aria-label="Interactive School Streak Monkey Mascot"
          title="Scroll down to watch monkey swing left and right! Tap for a banana boost!"
        >
          {/* Green Jungle Vine with Leaves */}
          <svg
            width="64"
            height="115"
            viewBox="0 0 64 115"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-md"
          >
            {/* Vine Stem (Curving organic green branch) */}
            <path
              d="M28 0 C30 18, 22 36, 28 55 C32 68, 24 85, 26 95"
              stroke="#16a34a"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Secondary thin vine coil */}
            <path
              d="M28 2 C35 12, 38 24, 30 35 C22 45, 26 60, 32 72"
              stroke="#22c55e"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="4 2"
            />

            {/* Lush Green Leaf 1 (Top Left) */}
            <path
              d="M28 12 C18 8, 12 16, 16 22 C22 26, 28 20, 28 12 Z"
              fill="#22c55e"
              stroke="#15803d"
              strokeWidth="1.2"
            />
            {/* Lush Green Leaf 2 (Right Mid) */}
            <path
              d="M27 38 C38 32, 44 40, 40 48 C34 52, 28 46, 27 38 Z"
              fill="#4ade80"
              stroke="#16a34a"
              strokeWidth="1.2"
            />
            {/* Leaf 3 (Small sprouting bud) */}
            <path
              d="M26 64 C19 60, 15 67, 18 71 C22 74, 26 70, 26 64 Z"
              fill="#22c55e"
              stroke="#15803d"
              strokeWidth="1"
            />

            {/* MONKEY BODY & TAIL */}
            {/* Curled Tail wrapping around vine */}
            <path
              d="M26 90 C18 92, 10 82, 16 74 C22 66, 32 74, 30 84 C29 90, 26 92, 26 95"
              stroke="#854d0e"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />

            {/* Monkey Torso */}
            <ellipse cx="36" cy="78" rx="13" ry="16" fill="#a16207" />
            {/* Cream Tummy */}
            <ellipse cx="36" cy="80" rx="9" ry="11" fill="#fef08a" />

            {/* Left Hanging Arm (Reaching up holding vine) */}
            <path
              d="M28 70 C24 55, 25 44, 28 35"
              stroke="#a16207"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Hand gripping the vine */}
            <circle cx="28" cy="35" r="3.5" fill="#ca8a04" />

            {/* Right Arm (Holding a glowing streak flame!) */}
            <path
              d="M44 74 C52 76, 56 68, 54 62"
              stroke="#a16207"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Paw holding flame */}
            <circle cx="54" cy="62" r="3" fill="#ca8a04" />

            {/* Miniature Flame in Monkey's hand */}
            <path
              d="M54 58 C56 54, 60 52, 57 48 C55 52, 53 50, 52 46 C50 51, 51 56, 54 58 Z"
              fill="#f97316"
            />
            <path
              d="M54 57 C55 55, 57 53, 55 50 C54 53, 53 52, 52 49 C51 52, 52 56, 54 57 Z"
              fill="#fbbf24"
            />

            {/* Monkey Head */}
            <circle cx="36" cy="54" r="13" fill="#a16207" />

            {/* Left Ear */}
            <circle cx="23" cy="52" r="4.5" fill="#a16207" />
            <circle cx="23" cy="52" r="2.8" fill="#fef08a" />

            {/* Right Ear */}
            <circle cx="49" cy="52" r="4.5" fill="#a16207" />
            <circle cx="49" cy="52" r="2.8" fill="#fef08a" />

            {/* Face Mask (Heart-shaped cream face) */}
            <path
              d="M31 46 C34 44, 38 44, 41 46 C45 49, 45 58, 41 62 C38 64, 34 64, 31 62 C27 58, 27 49, 31 46 Z"
              fill="#fef08a"
            />

            {/* Eyes (Cute, big cartoon eyes) */}
            <ellipse cx="33" cy="52" rx="2" ry="2.5" fill="#1e293b" />
            <ellipse cx="39" cy="52" rx="2" ry="2.5" fill="#1e293b" />
            {/* Eye sparkle highlights */}
            <circle cx="33.7" cy="51" r="0.8" fill="#ffffff" />
            <circle cx="39.7" cy="51" r="0.8" fill="#ffffff" />

            {/* Cute Nose */}
            <ellipse cx="36" cy="56" rx="1.5" ry="1" fill="#78350f" />

            {/* Cheerful Smile */}
            <path
              d="M33 58 Q36 62, 39 58"
              stroke="#78350f"
              strokeWidth="1.3"
              strokeLinecap="round"
              fill="none"
            />

            {/* Rosy Cheeks */}
            <circle cx="30" cy="56" r="1.8" fill="#f43f5e" opacity="0.6" />
            <circle cx="42" cy="56" r="1.8" fill="#f43f5e" opacity="0.6" />

            {/* Little Feet dangling at bottom */}
            <ellipse cx="32" cy="95" rx="3.5" ry="3" fill="#ca8a04" />
            <ellipse cx="40" cy="95" rx="3.5" ry="3" fill="#ca8a04" />
          </svg>

          {/* Cheer Sparkles / Hearts on click */}
          {hearts.map((h) => (
            <div
              key={h.id}
              className="absolute pointer-events-none text-xs font-bold text-amber-400 animate-ping"
              style={{
                left: h.x,
                top: h.y,
              }}
            >
              🍌 +1
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
