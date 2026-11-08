'use client';

import React from 'react';
import {
  MessageSquare,
  Circle,
  Phone,
  Users,
  Star,
  Settings,
  Archive,
  User,
} from 'lucide-react';
import { SidebarTab } from './types';

interface SidebarRailProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  onOpenSettings: () => void;
  onOpenStarred: () => void;
  onOpenProfile: () => void;
  unreadCount?: number;
  missedCallsCount?: number;
  hasUnreadStatus?: boolean;
}

export const SidebarRail: React.FC<SidebarRailProps> = ({
  activeTab,
  onTabChange,
  onOpenSettings,
  onOpenStarred,
  onOpenProfile,
  unreadCount = 2,
  missedCallsCount = 1,
  hasUnreadStatus = true,
}) => {
  return (
    <aside
      className="hidden md:flex w-16 h-full flex-col items-center justify-between py-3 border-r border-[var(--line)] shrink-0 select-none z-20"
      style={{ backgroundColor: 'var(--surface)' }}
    >
      {/* Top action icons */}
      <div className="flex flex-col items-center gap-2 w-full">
        {/* Chats Tab */}
        <button
          onClick={() => onTabChange('chats')}
          className={`relative w-11 h-11 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
            activeTab === 'chats'
              ? 'bg-[#374248] text-[var(--primary)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--line)]'
          }`}
          title="Chats"
        >
          <MessageSquare size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[var(--primary)] text-[var(--bg)] font-bold text-[10px] flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Status / Stories Tab */}
        <button
          onClick={() => onTabChange('status')}
          className={`relative w-11 h-11 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
            activeTab === 'status'
              ? 'bg-[#374248] text-[var(--primary)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--line)]'
          }`}
          title="Status"
        >
          <Circle size={20} />
          {hasUnreadStatus && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--primary)]" />
          )}
        </button>

        {/* Calls Tab */}
        <button
          onClick={() => onTabChange('calls')}
          className={`relative w-11 h-11 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
            activeTab === 'calls'
              ? 'bg-[#374248] text-[var(--primary)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--line)]'
          }`}
          title="Calls"
        >
          <Phone size={20} />
          {missedCallsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[#ea4335] text-white font-bold text-[10px] flex items-center justify-center">
              {missedCallsCount}
            </span>
          )}
        </button>

        {/* Communities Tab */}
        <button
          onClick={() => onTabChange('communities')}
          className={`w-11 h-11 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
            activeTab === 'communities'
              ? 'bg-[#374248] text-[var(--primary)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--line)]'
          }`}
          title="Communities"
        >
          <Users size={20} />
        </button>
      </div>

      {/* Bottom utility icons */}
      <div className="flex flex-col items-center gap-2 w-full">
        {/* Starred Messages */}
        <button
          onClick={onOpenStarred}
          className="w-11 h-11 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--line)] transition-all cursor-pointer"
          title="Starred Messages"
        >
          <Star size={20} />
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="w-11 h-11 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--line)] transition-all cursor-pointer"
          title="Settings"
        >
          <Settings size={20} />
        </button>

        <div className="w-8 h-px bg-[var(--line)] my-1" />

        {/* User Profile Avatar */}
        <button
          onClick={onOpenProfile}
          className="w-9 h-9 rounded-full bg-[var(--primary)] text-white font-semibold text-sm flex items-center justify-center hover:ring-2 hover:ring-[var(--primary)] hover:ring-offset-2 hover:ring-offset-[var(--bg)] transition-all cursor-pointer shadow-xs"
          title="Profile"
        >
          S
        </button>
      </div>
    </aside>
  );
};
