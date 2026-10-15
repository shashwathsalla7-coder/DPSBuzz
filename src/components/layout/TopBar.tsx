'use client';

import { useState, useEffect, type FC } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Menu, X, Megaphone, Users, Trophy, Settings, Shield, Download } from 'lucide-react';
import { school } from '@/config/school';
import { DataStore, type Notice } from '@/lib/dataStore';
import { colors } from '@/config/tokens';
import Logo from '@/components/ui/Logo';

interface TopBarProps {
  notificationCount?: number;
}

export const TopBar: FC<TopBarProps> = ({ notificationCount = 0 }) => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadCount, setUnreadCount] = useState(notificationCount);

  useEffect(() => {
    const updateStats = () => {
      const user = DataStore.getCurrentUser();
      setIsAdmin(user?.username?.toLowerCase() === 'shashwath71845');

      const notifs = DataStore.getNotifications();
      const unreadNotifs = notifs.filter((n) => !n.isRead).length;

      try {
        const convs = JSON.parse(localStorage.getItem('dpsbuzz_chat_conversations_v2') || '[]');
        const unreadChats = convs.filter((c: any) => c.isUnread || (c.unreadCount || 0) > 0).length;
        setUnreadCount(unreadNotifs + unreadChats);
      } catch {
        setUnreadCount(unreadNotifs);
      }
    };
    updateStats();
    window.addEventListener('dpsbuzz:content_updated', updateStats);
    window.addEventListener('storage', updateStats);
    return () => {
      window.removeEventListener('dpsbuzz:content_updated', updateStats);
      window.removeEventListener('storage', updateStats);
    };
  }, []);

  // Dedicated screen headers exist on Search and Chats
  if (pathname.startsWith('/chats') || pathname.startsWith('/search')) {
    return null;
  }

  const baseMenuItems = [
    { title: 'Notices', href: '/notices', icon: Megaphone, desc: 'School schedule & dispatches' },
    { title: 'Groups', href: '/groups', icon: Users, desc: 'Class sections & clubs' },
    { title: 'Star Board', href: '/leaderboard', icon: Trophy, desc: 'Class & student honours' },
    { title: 'Install & Download App', href: '/download', icon: Download, desc: 'Laptop, Android APK v1.4 & iPhone' },
    { title: 'Settings', href: '/settings', icon: Settings, desc: 'Theme, privacy & safety' },
  ];

  const menuItems = isAdmin
    ? [...baseMenuItems, { title: 'Admin Center', href: '/admin', icon: Shield, desc: 'Audit console' }]
    : baseMenuItems;

  return (
    <>
      <header
        className="sticky top-0 z-30 md:hidden flex flex-col border-b transition-all"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--line)',
          paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)',
        }}
      >
        {/* Main 56px Top Bar with safe breathing room from top edge */}
        <div className="flex items-center justify-between px-4 h-14 pb-1">
          <Link href="/home" className="flex items-center gap-2 select-none" aria-label="DPS Buzz Home">
            <Logo size="md" />
          </Link>

          <div className="flex items-center gap-2">
            {/* Notification Bell with like-rose badge or count up to 9+ */}
            <Link
              href="/notifications"
              className="w-11 h-11 rounded-full flex items-center justify-center relative btn-press hover:bg-[var(--surface-sunken)] active:scale-95 transition-all border border-transparent hover:border-[var(--line)]"
              style={{ color: 'var(--text)' }}
              aria-label="Notifications"
            >
              <Bell size={21} strokeWidth={1.8} />
              {unreadCount > 0 && (
                <span
                  className="absolute top-1.5 right-1.5 min-w-[17px] h-[17px] px-1 rounded-full text-[10px] font-extrabold text-white flex items-center justify-center tabular-nums leading-none border border-[var(--surface)] animate-bounce-in shadow-xs"
                  style={{ backgroundColor: 'var(--like)' }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Menu Drawer Button (Three Lines / Tree Type Button) */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="w-11 h-11 rounded-full flex items-center justify-center btn-press hover:bg-[var(--surface-sunken)] active:scale-95 transition-all cursor-pointer shadow-xs border border-[var(--line)]"
              style={{
                color: 'var(--text)',
                backgroundColor: 'var(--surface-sunken)',
              }}
              aria-label="Open menu"
              title="Open school menu"
            >
              <Menu size={22} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </header>

      {/* Menu Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsMenuOpen(false)}
          />
          <div
            className="relative ml-auto w-72 h-full flex flex-col p-5 shadow-2xl z-10"
            style={{
              backgroundColor: 'var(--surface)',
              color: 'var(--text)',
            }}
          >
            <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--line)' }}>
              <span
                className="font-bold text-base tracking-[-0.02em]"
                style={{ fontFamily: "var(--font-cabinet), 'Cabinet Grotesk', sans-serif" }}
              >
                School Navigation
              </span>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="w-8 h-8 rounded flex items-center justify-center btn-press"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="py-4 space-y-2 flex-1 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-xl border transition btn-press"
                    style={{
                      borderColor: 'var(--line)',
                      backgroundColor: 'var(--surface-sunken)',
                    }}
                  >
                    <Icon size={18} style={{ color: 'var(--primary)' }} />
                    <div>
                      <div className="text-xs font-bold">{item.title}</div>
                      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{item.desc}</div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="pt-4 border-t text-[11px]" style={{ borderColor: 'var(--line)', color: 'var(--text-muted)' }}>
              {school.schoolName}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TopBar;
