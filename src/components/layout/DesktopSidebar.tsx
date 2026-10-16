'use client';

import { useState, useEffect, type FC } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Search, PlusSquare, MessageCircle, Users,
  Megaphone, Trophy, User, Settings, Bell, Shield, Smartphone, Download
} from 'lucide-react';
import { schoolConfig } from '@/config/school';
import { DataStore } from '@/lib/dataStore';
import Logo from '@/components/ui/Logo';

const navItems = [
  { href: '/home', icon: Home, label: 'Home' },
  { href: '/search', icon: Search, label: 'Search' },
  { href: '/post/new', icon: PlusSquare, label: 'Post' },
  { href: '/chats', icon: MessageCircle, label: 'Chats' },
  { href: '/groups', icon: Users, label: 'Groups' },
  { href: '/notices', icon: Megaphone, label: 'Notices' },
  { href: '/leaderboard', icon: Trophy, label: 'Star Board' },
  { href: '/notifications', icon: Bell, label: 'Alerts' },
];

export const DesktopSidebar: FC = () => {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  useEffect(() => {
    const updateStats = () => {
      const cur = DataStore.getCurrentUser();
      setIsAdmin(cur?.username?.toLowerCase() === 'shashwath71845');
      setUnreadNotifsCount(DataStore.getUnreadNotificationCount(cur?.username));
      setUnreadChatsCount(DataStore.getUnreadChatsCount(cur?.username));
    };

    updateStats();
    window.addEventListener('dpsbuzz:content_updated', updateStats);
    window.addEventListener('storage', updateStats);
    return () => {
      window.removeEventListener('dpsbuzz:content_updated', updateStats);
      window.removeEventListener('storage', updateStats);
    };
  }, []);

  const bottomItems = [
    ...(isAdmin ? [{ href: '/admin', icon: Shield, label: 'Admin ID' }] : []),
    { href: '/download', icon: Download, label: 'Install App' },
    { href: '/profile', icon: User, label: 'Profile' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];

  const renderNavLink = (item: typeof navItems[0]) => {
    const isActive = pathname === item.href || (item.href !== '/home' && pathname.startsWith(item.href));
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        prefetch={true}
        className={`
          flex items-center gap-3.5 px-3 py-2.5 rounded-none transition-colors
          group relative min-h-[44px]
          ${isActive
            ? 'bg-[var(--surface-sunken)] text-[var(--primary)] font-semibold'
            : 'text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text)]'
          }
        `}
        aria-label={item.label}
        aria-current={isActive ? 'page' : undefined}
      >
        <div className="relative">
          <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
          {item.label === 'Chats' && unreadChatsCount > 0 && (
            <span
              className="lg:hidden absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: 'var(--like)' }}
            />
          )}
          {item.label === 'Alerts' && unreadNotifsCount > 0 && (
            <span
              className="lg:hidden absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-pink-500"
            />
          )}
        </div>
        <span className="hidden lg:block text-sm">{item.label}</span>
        {item.label === 'Chats' && unreadChatsCount > 0 && (
          <span
            className="hidden lg:flex ml-auto min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-extrabold items-center justify-center animate-bounce-in shadow-xs"
            style={{ backgroundColor: 'var(--like)' }}
          >
            {unreadChatsCount > 9 ? '9+' : unreadChatsCount}
          </span>
        )}
        {item.label === 'Alerts' && unreadNotifsCount > 0 && (
          <span className="hidden lg:flex ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-pink-500 text-white text-[10px] font-extrabold items-center justify-center animate-bounce-in shadow-xs">
            {unreadNotifsCount > 9 ? '9+' : unreadNotifsCount}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside
      className="hidden md:flex flex-col fixed left-0 top-0 h-full
        w-[72px] lg:w-[240px] border-r border-[var(--line)]
        bg-[var(--surface)] z-40"
      aria-label="Sidebar navigation"
    >
      {/* Logo */}
      <div className="p-4 lg:px-5 flex items-center h-14 border-b border-[var(--line)]">
        <Link href="/home" className="flex items-center gap-2" aria-label="DPS Buzz Home">
          <Logo size="sm" showText={false} className="lg:hidden" />
          <Logo size="md" className="hidden lg:flex" />
        </Link>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 px-2.5 lg:px-3 py-3 space-y-1 overflow-y-auto">
        {navItems.map(renderNavLink)}
      </nav>

      {/* Bottom section */}
      <div className="px-2.5 lg:px-3 pb-4 space-y-1 border-t border-[var(--line)] pt-3">
        {bottomItems.map(renderNavLink)}
      </div>
    </aside>
  );
};

export default DesktopSidebar;
