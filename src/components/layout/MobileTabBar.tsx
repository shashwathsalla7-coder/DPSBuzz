'use client';

import { useState, useEffect, type FC } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Film, SquarePlus, MessageCircle, User } from 'lucide-react';
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
  const isChatsActive = pathname === '/chats' || pathname.startsWith('/chats');
  const isProfileActive = pathname === '/profile' || pathname.startsWith('/u/');

  const activeUser = mounted ? currentUser : null;
  const avatarColor = getAvatarColorPair(activeUser?.username || 'student');
  const userInitials = (activeUser?.fullName || activeUser?.username || 'ST')
    .slice(0, 2)
    .toUpperCase();

  return (
    <nav
      className="fixed z-40 md:hidden transition-colors duration-200"
      style={{
        left: '12px',
        right: '12px',
        bottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
        height: '66px',
        borderRadius: '32px',
        backgroundColor: 'var(--tabbar-bg)',
        borderColor: 'var(--tabbar-border)',
        borderWidth: '1px',
        borderStyle: 'solid',
        boxShadow: 'var(--tabbar-shadow)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-full px-2 relative">
        {/* 1. Home Tab */}
        <Link
          href="/home"
          prefetch={true}
          className="flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors select-none"
          style={{
            color: isHomeActive ? 'var(--primary)' : 'var(--text-muted)',
          }}
          aria-label="Home"
          aria-current={isHomeActive ? 'page' : undefined}
        >
          <Home
            size={22}
            strokeWidth={isHomeActive ? 2.5 : 1.75}
            className={isHomeActive ? 'fill-current' : ''}
          />
          <span className={`text-[12px] leading-tight mt-0.5 ${isHomeActive ? 'font-bold' : 'font-medium'}`}>
            Home
          </span>
        </Link>

        {/* 2. Reels Tab */}
        <Link
          href="/reels"
          prefetch={true}
          className="flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors select-none"
          style={{
            color: isReelsActive ? 'var(--primary)' : 'var(--text-muted)',
          }}
          aria-label="Reels"
          aria-current={isReelsActive ? 'page' : undefined}
        >
          <Film
            size={22}
            strokeWidth={isReelsActive ? 2.5 : 1.75}
            className={isReelsActive ? 'fill-current' : ''}
          />
          <span className={`text-[12px] leading-tight mt-0.5 ${isReelsActive ? 'font-bold' : 'font-medium'}`}>
            Reels
          </span>
        </Link>

        {/* 3. Center Raised Post Button (54px circular primary button, raised above the bar with 4px page-bg ring and blue glow) */}
        <div className="flex flex-col items-center justify-center flex-1 h-full relative select-none">
          <Link
            href="/post/new"
            prefetch={true}
            className="w-[54px] h-[54px] rounded-full flex items-center justify-center transition-transform active:scale-95 -translate-y-3"
            style={{
              backgroundColor: 'var(--primary)',
              color: 'var(--on-primary)',
              boxShadow: '0 8px 24px rgba(43, 75, 255, 0.50)',
              border: '4px solid var(--bg)',
            }}
            aria-label="Create Post"
          >
            <SquarePlus size={26} strokeWidth={2.2} className="text-white" />
          </Link>
        </div>

        {/* 4. Chats Tab (with like-rose unread dot) */}
        <Link
          href="/chats"
          prefetch={true}
          className="flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors select-none"
          style={{
            color: isChatsActive ? 'var(--primary)' : 'var(--text-muted)',
          }}
          aria-label="Chats"
          aria-current={isChatsActive ? 'page' : undefined}
        >
          <div className="relative">
            <MessageCircle
              size={22}
              strokeWidth={isChatsActive ? 2.5 : 1.75}
              className={isChatsActive ? 'fill-current' : ''}
            />
            {unreadChatsCount > 0 && (
              <span
                className="absolute -top-1.5 -right-2 min-w-[17px] h-[17px] px-1 rounded-full text-[9px] font-extrabold text-white flex items-center justify-center leading-none border-2 border-[var(--surface)] animate-bounce-in shadow-xs"
                style={{ backgroundColor: 'var(--like)' }}
                aria-label={`${unreadChatsCount} unread chats`}
              >
                {unreadChatsCount > 9 ? '9+' : unreadChatsCount}
              </span>
            )}
          </div>
          <span className={`text-[12px] leading-tight mt-0.5 ${isChatsActive ? 'font-bold' : 'font-medium'}`}>
            Chats
          </span>
        </Link>

        {/* 5. Profile Tab (Own student avatar 24px, ringed in primary when active) */}
        <Link
          href={mounted && currentUser?.username ? `/u/${currentUser.username}` : '/profile'}
          prefetch={true}
          className="flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors select-none"
          style={{
            color: isProfileActive ? 'var(--primary)' : 'var(--text-muted)',
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
                className="w-full h-full flex items-center justify-center text-[10px] font-bold"
                style={{
                  backgroundColor: avatarColor.bg,
                  color: avatarColor.text,
                }}
              >
                {userInitials}
              </div>
            )}
          </div>
          <span className={`text-[12px] leading-tight mt-0.5 ${isProfileActive ? 'font-bold' : 'font-medium'}`}>
            Profile
          </span>
        </Link>
      </div>
    </nav>
  );
};

export default MobileTabBar;
