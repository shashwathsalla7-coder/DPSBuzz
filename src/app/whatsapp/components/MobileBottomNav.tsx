'use client';

import React from 'react';
import { MessageSquare, Circle, Users, Phone } from 'lucide-react';
import { SidebarTab } from './types';

interface MobileBottomNavProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  unreadCount?: number;
  missedCallsCount?: number;
  hasUnreadStatus?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  unreadCount = 2,
  missedCallsCount = 1,
  hasUnreadStatus = true,
}) => {
  return (
    <nav
      className="md:hidden h-16 w-full flex items-center justify-around border-t border-[#222d34] shrink-0 select-none z-30"
      style={{ backgroundColor: '#111b21' }}
    >
      {/* 1. Chats Tab */}
      <button
        onClick={() => onTabChange('chats')}
        className={`flex-1 flex flex-col items-center justify-center h-full relative transition-colors cursor-pointer active:scale-95 ${
          activeTab === 'chats' ? 'text-[#00a884]' : 'text-[#8696a0]'
        }`}
      >
        <div className="relative">
          <MessageSquare size={22} />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-4 px-1 rounded-full bg-[#00a884] text-[#111b21] font-bold text-[10px] flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </div>
        <span className="text-[11px] font-medium mt-1">Chats</span>
      </button>

      {/* 2. Updates / Status Tab */}
      <button
        onClick={() => onTabChange('status')}
        className={`flex-1 flex flex-col items-center justify-center h-full relative transition-colors cursor-pointer active:scale-95 ${
          activeTab === 'status' ? 'text-[#00a884]' : 'text-[#8696a0]'
        }`}
      >
        <div className="relative">
          <Circle size={22} />
          {hasUnreadStatus && (
            <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-[#00a884] ring-2 ring-[#111b21]" />
          )}
        </div>
        <span className="text-[11px] font-medium mt-1">Updates</span>
      </button>

      {/* 3. Communities Tab */}
      <button
        onClick={() => onTabChange('communities')}
        className={`flex-1 flex flex-col items-center justify-center h-full relative transition-colors cursor-pointer active:scale-95 ${
          activeTab === 'communities' ? 'text-[#00a884]' : 'text-[#8696a0]'
        }`}
      >
        <Users size={22} />
        <span className="text-[11px] font-medium mt-1">Communities</span>
      </button>

      {/* 4. Calls Tab */}
      <button
        onClick={() => onTabChange('calls')}
        className={`flex-1 flex flex-col items-center justify-center h-full relative transition-colors cursor-pointer active:scale-95 ${
          activeTab === 'calls' ? 'text-[#00a884]' : 'text-[#8696a0]'
        }`}
      >
        <div className="relative">
          <Phone size={22} />
          {missedCallsCount > 0 && (
            <span className="absolute -top-1.5 -right-2 min-w-[17px] h-4 px-1 rounded-full bg-[#ea4335] text-white font-bold text-[10px] flex items-center justify-center">
              {missedCallsCount}
            </span>
          )}
        </div>
        <span className="text-[11px] font-medium mt-1">Calls</span>
      </button>
    </nav>
  );
};
