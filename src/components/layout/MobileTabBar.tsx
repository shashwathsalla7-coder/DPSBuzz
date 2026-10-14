'use client';

import { useState, useEffect, type FC } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, SquarePlus, MessageCircle, User } from 'lucide-react';
import { DataStore, type Profile } from '@/lib/dataStore';
import { getAvatarColorPair } from '@/config/tokens';

export const MobileTabBar: FC = () => {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [hasUnreadChats, setHasUnreadChats] = useState(false);

  useEffect(() => {
    const updateUserState = () => {
      const user = DataStore.getCurrentUser();
      setCurrentUser(user);

      // Check unread conversations
      try {
        const convs = JSON.parse(localStorage.getItem('dpsbuzz_chat_conversations_v2') || '[]');
        const unread = convs.some((c: any) => (c.unreadCount || 0) > 0 || c.isUnread);
        setHasUnreadChats(Boolean(unread));
      } catch {
        setHasUnreadChats(false);
      }
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
  const isSearchActive = pathname === '/search' || pathname.startsWith('/search');
  const isChatsActive = pathname === '/chats' || pathname.startsWith('/chats');
  const isProfileActive = pathname === '/profile' || pathname.startsWith('/u/');

  const avatarColor = getAvatarColorPair(currentUser?.username || 'student');
  const userInitials = (currentUser?.fullName || currentUser?.username || 'ST')
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

        {/* 2. Search Tab */}
        <Link
          href="/search"
          prefetch={true}
          className="flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors select-none"
          style={{
            color: isSearchActive ? 'var(--primary)' : 'var(--text-muted)',
          }}
          aria-label="Search"
          aria-current={isSearchActive ? 'page' : undefined}
        >
          <Search
            size={22}
            strokeWidth={isSearchActive ? 2.5 : 1.75}
          />
          <span className={`text-[12px] leading-tight mt-0.5 ${isSearchActive ? 'font-bold' : 'font-medium'}`}>
            Search
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
            {hasUnreadChats && (
              <span
                className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: 'var(--like)',
                  border: '2px solid var(--surface)',
                }}
                aria-label="Unread chats"
              />
            )}
          </div>
          <span className={`text-[12px] leading-tight mt-0.5 ${isChatsActive ? 'font-bold' : 'font-medium'}`}>
            Chats
          </span>
        </Link>

        {/* 5. Profile Tab (Own student avatar 24px, ringed in primary when active) */}
        <Link
          href="/profile"
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
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.fullName}
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
