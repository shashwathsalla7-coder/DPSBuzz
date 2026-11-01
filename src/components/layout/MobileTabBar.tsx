'use client';

import { useState, useEffect, type FC } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Film, SquarePlus, MessageCircle } from 'lucide-react';
import { DataStore, type Profile } from '@/lib/dataStore';
import { getAvatarColorPair } from '@/config/tokens';

export const MobileTabBar: FC = () => {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateUserState = () => {
      const user = DataStore.getCurrentUser();
      setCurrentUser(user);
      setUnreadChatsCount(DataStore.getUnreadChatsCount(user?.username));
    };

    updateUserState();
    window.addEventListener('dpsbuzz:content_updated', updateUserState);
    window.addEventListener('storage', updateUserState);
    return () => {
      window.removeEventListener('dpsbuzz:content_updated', updateUserState);
      window.removeEventListener('storage', updateUserState);
    };
  }, []);

  const isHomeActive = pathname === '/home';
  const isReelsActive = pathname === '/reels' || pathname.startsWith('/reels');
  const isCreateActive = pathname === '/post/new';
  const isChatsActive = pathname === '/chats' || pathname.startsWith('/chats');
  const isProfileActive = pathname === '/profile' || pathname.startsWith('/u/');

  const activeUser = mounted ? currentUser : null;
  const avatarColor = getAvatarColorPair(activeUser?.username || 'student');
  const userInitials = (activeUser?.fullName || activeUser?.username || 'ST')
    .slice(0, 2)
    .toUpperCase();

  // Dark variant on Reels screen per user rule
  const isDarkReels = isReelsActive;

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-40 md:hidden w-full transition-colors border-t select-none ${
        isDarkReels
          ? 'bg-[#0B0F17] border-[#1F2937] text-white'
          : 'bg-[var(--surface)] border-[var(--line)] text-[var(--text)]'
      }`}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-14 px-2 max-w-md mx-auto">
        {/* 1. Home Tab */}
        <Link
          href="/home"
          prefetch={true}
          className="flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors min-h-[44px]"
          style={{
            color: isHomeActive ? 'var(--primary)' : isDarkReels ? '#94A3B8' : 'var(--text-muted)',
          }}
          aria-label="Home"
          aria-current={isHomeActive ? 'page' : undefined}
        >
          <Home
            size={22}
            strokeWidth={isHomeActive ? 2.2 : 1.75}
            className={isHomeActive ? 'fill-current' : ''}
          />
          <span className={`text-[12px] leading-tight mt-0.5 ${isHomeActive ? 'font-semibold' : 'font-medium'}`}>
            Home
          </span>
        </Link>

        {/* 2. Reels Tab */}
        <Link
          href="/reels"
          prefetch={true}
          className="flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors min-h-[44px]"
          style={{
            color: isReelsActive ? (isDarkReels ? '#FFFFFF' : 'var(--primary)') : isDarkReels ? '#94A3B8' : 'var(--text-muted)',
          }}
          aria-label="Reels"
          aria-current={isReelsActive ? 'page' : undefined}
        >
          <Film
            size={22}
            strokeWidth={isReelsActive ? 2.2 : 1.75}
            className={isReelsActive ? 'fill-current' : ''}
          />
          <span className={`text-[12px] leading-tight mt-0.5 ${isReelsActive ? 'font-semibold' : 'font-medium'}`}>
            Reels
          </span>
        </Link>

        {/* 3. Center Create Button (Smaller, cleanly docked inside the bar, no big glow) */}
        <Link
          href="/post/new"
          prefetch={true}
          className="flex flex-col items-center justify-center flex-1 h-full py-1 transition-transform active:scale-95 min-h-[44px]"
          style={{
            color: isCreateActive ? 'var(--primary)' : isDarkReels ? '#94A3B8' : 'var(--text-muted)',
          }}
          aria-label="Create Post"
          aria-current={isCreateActive ? 'page' : undefined}
        >
          <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center shadow-xs">
            <SquarePlus size={18} strokeWidth={2.2} />
          </div>
          <span className={`text-[12px] leading-tight mt-0.5 ${isCreateActive ? 'font-semibold' : 'font-medium'}`}>
            Create
          </span>
        </Link>

        {/* 4. Chats Tab */}
        <Link
          href="/chats"
          data-games-action="/chats?view=games"
          data-game-type="connect4"
          prefetch={true}
          className="flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors min-h-[44px]"
          style={{
            color: isChatsActive ? 'var(--primary)' : isDarkReels ? '#94A3B8' : 'var(--text-muted)',
          }}
          aria-label="Chats"
          aria-current={isChatsActive ? 'page' : undefined}
        >
          <div className="relative">
            <MessageCircle
              size={22}
              strokeWidth={isChatsActive ? 2.2 : 1.75}
              className={isChatsActive ? 'fill-current' : ''}
            />
            {unreadChatsCount > 0 && (
              <span
                className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center leading-none bg-red-600 border border-[var(--surface)] shadow-xs"
                aria-label={`${unreadChatsCount} unread chats`}
              >
                {unreadChatsCount > 9 ? '9+' : unreadChatsCount}
              </span>
            )}
          </div>
          <span className={`text-[12px] leading-tight mt-0.5 ${isChatsActive ? 'font-semibold' : 'font-medium'}`}>
            Chats
          </span>
        </Link>

        {/* 5. Profile Tab */}
        <Link
          href={mounted && currentUser?.username ? `/u/${currentUser.username}` : '/profile'}
          prefetch={true}
          className="flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors min-h-[44px]"
          style={{
            color: isProfileActive ? 'var(--primary)' : isDarkReels ? '#94A3B8' : 'var(--text-muted)',
          }}
          aria-label="Profile"
          aria-current={isProfileActive ? 'page' : undefined}
        >
          <div
            className={`w-6 h-6 rounded-full overflow-hidden flex items-center justify-center transition-all ${
              isProfileActive ? 'ring-2 ring-[var(--primary)] ring-offset-1 ring-offset-[var(--surface)]' : ''
            }`}
          >
            {currentUser?.avatar || (currentUser?.username ? DataStore.getProfileByUsername(currentUser.username)?.avatar : null) ? (
              <img
                src={currentUser?.avatar || (currentUser?.username ? DataStore.getProfileByUsername(currentUser.username)?.avatar || '' : '')}
                alt={currentUser?.fullName || 'Profile'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-[10px] font-semibold"
                style={{
                  backgroundColor: avatarColor.bg,
                  color: avatarColor.text,
                }}
              >
                {userInitials}
              </div>
            )}
          </div>
          <span className={`text-[12px] leading-tight mt-0.5 ${isProfileActive ? 'font-semibold' : 'font-medium'}`}>
            Profile
          </span>
        </Link>
      </div>
    </nav>
  );
};

export default MobileTabBar;
