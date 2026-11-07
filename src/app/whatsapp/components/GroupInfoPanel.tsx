'use client';

import React, { useState } from 'react';
import {
  X,
  Phone,
  Video,
  Search,
  Bell,
  Clock,
  Lock,
  ChevronRight,
  UserPlus,
  ShieldAlert,
  LogOut,
  ThumbsDown,
  Image as ImageIcon,
  FileText,
  Link2,
} from 'lucide-react';
import { ChatRoom, ContactItem } from './types';
import { DEMO_CONTACTS } from './constants';

interface GroupInfoPanelProps {
  chat: ChatRoom;
  onClose: () => void;
  onOpenMediaGallery: () => void;
  onStartCall: (type: 'voice' | 'video') => void;
  onAddMember?: () => void;
  isTeacher?: boolean;
  isAdmin?: boolean;
  onToggleLock?: (locked: boolean) => void;
  onQuickDispatch?: (type: 'homework' | 'attendance' | 'exam') => void;
}

export const GroupInfoPanel: React.FC<GroupInfoPanelProps> = ({
  chat,
  onClose,
  onOpenMediaGallery,
  onStartCall,
  onAddMember,
  isTeacher = false,
  isAdmin = false,
  onToggleLock,
  onQuickDispatch,
}) => {
  const [memberSearch, setMemberSearch] = useState('');
  const [isMuted, setIsMuted] = useState(chat.isMuted || false);
  const [disappearingDuration, setDisappearingDuration] = useState('Off');

  const members: ContactItem[] = chat.members || DEMO_CONTACTS.slice(0, 7);

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.phone.includes(memberSearch)
  );

  return (
    <div className="fixed inset-0 z-40 md:relative md:inset-auto w-full md:w-[360px] lg:w-[400px] h-full flex flex-col bg-[#111b21] border-l border-[#222d34] shrink-0 select-none overflow-hidden animate-slideLeft">
      {/* Header */}
      <div className="h-[60px] px-4 flex items-center justify-between bg-[#202c33] border-b border-[#222d34] shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#8696a0] hover:text-[#e9edef] transition-colors cursor-pointer"
            title="Close"
          >
            <X size={19} />
          </button>
          <h2 className="text-sm font-semibold text-[#e9edef]">
            {chat.isGroup ? 'Group info' : 'Contact info'}
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pb-6">
        {/* Top Hero: Avatar & Title */}
        <div className="p-6 bg-[#111b21] flex flex-col items-center text-center border-b border-[#222d34]/60">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center font-bold text-white text-3xl shadow-md mb-3"
            style={{ backgroundColor: chat.avatarColor }}
          >
            {chat.initials}
          </div>
          <h3 className="text-lg font-semibold text-[#e9edef] leading-snug">{chat.name}</h3>
          <p className="text-xs text-[#8696a0] mt-1">
            {chat.isGroup ? `Group • ${members.length} participants` : chat.subtitle}
          </p>

          {/* Quick Call Action Buttons */}
          <div className="flex items-center gap-6 mt-4">
            <button
              onClick={() => onStartCall('voice')}
              className="flex flex-col items-center gap-1 text-[#00a884] hover:text-[#008f6f] cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-[#202c33] flex items-center justify-center">
                <Phone size={18} />
              </div>
              <span className="text-[11px] font-medium">Audio</span>
            </button>
            <button
              onClick={() => onStartCall('video')}
              className="flex flex-col items-center gap-1 text-[#00a884] hover:text-[#008f6f] cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-[#202c33] flex items-center justify-center">
                <Video size={18} />
              </div>
              <span className="text-[11px] font-medium">Video</span>
            </button>
          </div>
        </div>

        {/* Description Section */}
        {chat.description && (
          <div className="p-4 bg-[#111b21] border-b border-[#222d34]/60">
            <div className="text-xs text-[#8696a0] font-medium mb-1">Description</div>
            <div className="text-xs text-[#e9edef] leading-relaxed">{chat.description}</div>
            <div className="text-[11px] text-[#8696a0] mt-2">
              Created by {chat.createdBy || 'Anita Madam'} • {chat.createdAt || '2026-08-15'}
            </div>
          </div>
        )}

        {/* Media, Links & Docs Shortcut */}
        <div
          onClick={onOpenMediaGallery}
          className="p-4 bg-[#111b21] hover:bg-[#202c33] transition-colors cursor-pointer border-b border-[#222d34]/60 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[#8696a0]">
              <ImageIcon size={18} />
              <FileText size={18} />
              <Link2 size={18} />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#e9edef]">Media, links and docs</div>
              <div className="text-[11px] text-[#8696a0]">{chat.mediaCount || 24} items shared</div>
            </div>
          </div>
          <ChevronRight size={16} className="text-[#8696a0]" />
        </div>

        {/* Mute Notifications Toggle */}
        <div className="p-4 bg-[#111b21] border-b border-[#222d34]/60 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[#e9edef]">
            <Bell size={18} className="text-[#8696a0]" />
            <span className="text-xs">Mute notifications</span>
          </div>
          <input
            type="checkbox"
            checked={isMuted}
            onChange={(e) => setIsMuted(e.target.checked)}
            className="accent-[#00a884] w-4 h-4 cursor-pointer"
          />
        </div>

        {/* Disappearing Messages Duration */}
        <div className="p-4 bg-[#111b21] border-b border-[#222d34]/60 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[#e9edef]">
            <Clock size={18} className="text-[#8696a0]" />
            <div>
              <span className="text-xs block">Disappearing messages</span>
              <span className="text-[11px] text-[#8696a0]">{disappearingDuration}</span>
            </div>
          </div>
          <select
            value={disappearingDuration}
            onChange={(e) => setDisappearingDuration(e.target.value)}
            className="bg-[#202c33] text-xs text-[#e9edef] rounded px-2 py-1 outline-none"
          >
            <option value="Off">Off</option>
            <option value="24 hours">24 hours</option>
            <option value="7 days">7 days</option>
            <option value="90 days">90 days</option>
          </select>
        </div>

        {/* Encryption Notice */}
        <div className="p-4 bg-[#111b21] border-b border-[#222d34]/60 flex items-start gap-3">
          <Lock size={18} className="text-[#8696a0] shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-semibold text-[#e9edef]">Encryption</div>
            <div className="text-[11px] text-[#8696a0] mt-0.5 leading-relaxed">
              Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.
            </div>
          </div>
        </div>

        {/* Teacher / Admin Controls Section */}
        {chat.isGroup && (
          <div className="p-4 bg-[#182229]/70 border-b border-[#222d34] space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#00a884]">
              Classroom Administration
            </div>

            {/* Broadcast Mode Lock Switch */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#202c33] border border-[#222d34]">
              <div className="flex items-start gap-2.5">
                <Lock size={16} className={chat.isLocked ? 'text-[#00a884]' : 'text-[#8696a0]'} />
                <div>
                  <div className="text-xs font-semibold text-[#e9edef] flex items-center gap-1.5">
                    Broadcast Lock
                    {chat.isLocked ? (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#00a884]/20 text-[#00a884] font-bold">
                        LOCKED
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-[#8696a0] font-bold">
                        OPEN
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-[#8696a0] mt-0.5">
                    {chat.isLocked
                      ? 'Only verified faculty & admins can send messages.'
                      : 'All enrolled students can send messages and doubts.'}
                  </div>
                </div>
              </div>

              {(isTeacher || isAdmin) ? (
                <button
                  type="button"
                  onClick={() => onToggleLock && onToggleLock(!chat.isLocked)}
                  className={`w-11 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-colors shrink-0 ${
                    chat.isLocked ? 'bg-[#00a884]' : 'bg-[#2a3942]'
                  }`}
                  title="Toggle Broadcast Lock"
                >
                  <div
                    className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                      chat.isLocked ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              ) : (
                <span className="text-[10px] text-[#8696a0] font-medium shrink-0">
                  {chat.isLocked ? 'Locked' : 'Open'}
                </span>
              )}
            </div>

            {/* Teacher Quick Dispatcher */}
            {(isTeacher || isAdmin) && onQuickDispatch && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-[#8696a0]">Quick Faculty Dispatches</div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => onQuickDispatch('homework')}
                    className="p-2 rounded-lg bg-[#202c33] hover:bg-[#2a3942] text-[11px] font-medium text-[#e9edef] text-center border border-[#222d34] transition-colors cursor-pointer"
                  >
                    📝 Homework
                  </button>
                  <button
                    onClick={() => onQuickDispatch('attendance')}
                    className="p-2 rounded-lg bg-[#202c33] hover:bg-[#2a3942] text-[11px] font-medium text-[#e9edef] text-center border border-[#222d34] transition-colors cursor-pointer"
                  >
                    ⚠️ Roll Call
                  </button>
                  <button
                    onClick={() => onQuickDispatch('exam')}
                    className="p-2 rounded-lg bg-[#202c33] hover:bg-[#2a3942] text-[11px] font-medium text-[#e9edef] text-center border border-[#222d34] transition-colors cursor-pointer"
                  >
                    📋 Exam Notice
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Participants Section */}
        {chat.isGroup && (
          <div className="p-4 bg-[#111b21]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider">
                {members.length} participants
              </span>
              <button
                onClick={onAddMember}
                className="flex items-center gap-1.5 text-xs text-[#00a884] hover:text-[#008f6f] cursor-pointer"
              >
                <UserPlus size={14} />
                <span>Add participant</span>
              </button>
            </div>

            {/* Member search bar */}
            <div className="flex items-center px-2.5 py-1.5 rounded-lg bg-[#202c33] mb-3">
              <Search size={13} className="text-[#8696a0] mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search participants"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full text-xs text-[#e9edef] bg-transparent outline-none placeholder-[#8696a0]"
              />
            </div>

            {/* Member List */}
            <div className="space-y-2">
              {filteredMembers.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-[#202c33] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0"
                      style={{ backgroundColor: m.avatarColor }}
                    >
                      {m.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-[#e9edef] truncate">{m.name}</div>
                      <div className="text-[11px] text-[#8696a0] truncate">{m.about || m.phone}</div>
                    </div>
                  </div>

                  {m.isAdmin && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#00a884]/20 text-[#00a884] shrink-0">
                      Group Admin
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Exit & Report Actions */}
        <div className="p-4 space-y-1">
          <button className="w-full px-3 py-2.5 flex items-center gap-3 text-xs text-[#ea4335] hover:bg-[#202c33] rounded-lg transition-colors cursor-pointer text-left">
            <LogOut size={16} />
            <span>Exit group</span>
          </button>
          <button className="w-full px-3 py-2.5 flex items-center gap-3 text-xs text-[#ea4335] hover:bg-[#202c33] rounded-lg transition-colors cursor-pointer text-left">
            <ThumbsDown size={16} />
            <span>Report group</span>
          </button>
        </div>
      </div>
    </div>
  );
};
