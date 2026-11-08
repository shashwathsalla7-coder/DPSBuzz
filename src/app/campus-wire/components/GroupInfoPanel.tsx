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
  UserCheck,
} from 'lucide-react';
import { ChatRoom, ContactItem } from './types';
import { DEMO_CONTACTS } from './constants';

interface GroupInfoPanelProps {
  chat: ChatRoom;
  onClose: () => void;
  onOpenMediaGallery: () => void;
  onStartCall: (type: 'voice' | 'video') => void;
  onAddMember?: () => void;
  onOpenInviteModal?: () => void;
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
  onOpenInviteModal,
  isTeacher = false,
  isAdmin = false,
  onToggleLock,
  onQuickDispatch,
}) => {
  const [memberSearch, setMemberSearch] = useState('');
  const [isMuted, setIsMuted] = useState(chat.isMuted || false);
  const [disappearingDuration, setDisappearingDuration] = useState('Off');
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [requestActionLoading, setRequestActionLoading] = useState<string | null>(null);

  // Poll / fetch pending join requests for admins
  React.useEffect(() => {
    if (chat.isGroup && (isAdmin || isTeacher)) {
      fetch(`/api/campus?action=get_join_requests&channelId=${chat.id}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success && Array.isArray(d.requests)) {
            setPendingRequests(d.requests);
          }
        })
        .catch(() => {});
    }
  }, [chat.id, isAdmin, isTeacher]);

  const handleRequestDecision = async (requestId: string, decision: 'approved' | 'rejected') => {
    setRequestActionLoading(requestId);
    try {
      const res = await fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'respond_to_join_request',
          requestId,
          decision,
          reviewerUsername: isAdmin ? 'Admin' : 'Faculty',
        }),
      });
      const d = await res.json();
      if (d.success) {
        setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
      } else {
        alert(d.error || 'Failed to update request');
      }
    } catch {
      alert('Network error updating request');
    } finally {
      setRequestActionLoading(null);
    }
  };

  const members: ContactItem[] = chat.members || DEMO_CONTACTS.slice(0, 7);

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.phone.includes(memberSearch)
  );

  return (
    <div className="fixed inset-0 z-40 md:relative md:inset-auto w-full md:w-[360px] lg:w-[400px] h-full flex flex-col bg-[var(--bg)] border-l border-[var(--line)] shrink-0 select-none overflow-hidden animate-slideLeft">
      {/* Header */}
      <div className="h-[60px] px-4 flex items-center justify-between bg-[var(--surface)] border-b border-[var(--line)] shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
            title="Close"
          >
            <X size={19} />
          </button>
          <h2 className="text-sm font-semibold text-[var(--text)]">
            {chat.isGroup ? 'Group info' : 'Contact info'}
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pb-6">
        {/* Top Hero: Avatar & Title */}
        <div className="p-6 bg-[var(--bg)] flex flex-col items-center text-center border-b border-[var(--line)]/60">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center font-bold text-white text-3xl shadow-md mb-3"
            style={{ backgroundColor: chat.avatarColor }}
          >
            {chat.initials}
          </div>
          <h3 className="text-lg font-semibold text-[var(--text)] leading-snug">{chat.name}</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {chat.isGroup ? `Group • ${members.length} participants` : chat.subtitle}
          </p>

          {/* Quick Call Action Buttons */}
          <div className="flex items-center gap-6 mt-4">
            <button
              onClick={() => onStartCall('voice')}
              className="flex flex-col items-center gap-1 text-[var(--primary)] hover:text-[var(--primary-hover)] cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-[var(--surface)] flex items-center justify-center">
                <Phone size={18} />
              </div>
              <span className="text-[11px] font-medium">Audio</span>
            </button>
            <button
              onClick={() => onStartCall('video')}
              className="flex flex-col items-center gap-1 text-[var(--primary)] hover:text-[var(--primary-hover)] cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-[var(--surface)] flex items-center justify-center">
                <Video size={18} />
              </div>
              <span className="text-[11px] font-medium">Video</span>
            </button>
          </div>
        </div>

        {/* Description Section */}
        {chat.description && (
          <div className="p-4 bg-[var(--bg)] border-b border-[var(--line)]/60">
            <div className="text-xs text-[var(--text-muted)] font-medium mb-1">Description</div>
            <div className="text-xs text-[var(--text)] leading-relaxed">{chat.description}</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-2">
              Created by {chat.createdBy || 'Anita Madam'} • {chat.createdAt || '2026-08-15'}
            </div>
          </div>
        )}

        {/* Media, Links & Docs Shortcut */}
        <div
          onClick={onOpenMediaGallery}
          className="p-4 bg-[var(--bg)] hover:bg-[var(--surface)] transition-colors cursor-pointer border-b border-[var(--line)]/60 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[var(--text-muted)]">
              <ImageIcon size={18} />
              <FileText size={18} />
              <Link2 size={18} />
            </div>
            <div>
              <div className="text-xs font-semibold text-[var(--text)]">Media, links and docs</div>
              <div className="text-[11px] text-[var(--text-muted)]">{chat.mediaCount || 24} items shared</div>
            </div>
          </div>
          <ChevronRight size={16} className="text-[var(--text-muted)]" />
        </div>

        {/* Mute Notifications Toggle */}
        <div className="p-4 bg-[var(--bg)] border-b border-[var(--line)]/60 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[var(--text)]">
            <Bell size={18} className="text-[var(--text-muted)]" />
            <span className="text-xs">Mute notifications</span>
          </div>
          <input
            type="checkbox"
            checked={isMuted}
            onChange={(e) => setIsMuted(e.target.checked)}
            className="accent-[var(--primary)] w-4 h-4 cursor-pointer"
          />
        </div>

        {/* Disappearing Messages Duration */}
        <div className="p-4 bg-[var(--bg)] border-b border-[var(--line)]/60 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[var(--text)]">
            <Clock size={18} className="text-[var(--text-muted)]" />
            <div>
              <span className="text-xs block">Disappearing messages</span>
              <span className="text-[11px] text-[var(--text-muted)]">{disappearingDuration}</span>
            </div>
          </div>
          <select
            value={disappearingDuration}
            onChange={(e) => setDisappearingDuration(e.target.value)}
            className="bg-[var(--surface)] text-xs text-[var(--text)] rounded px-2 py-1 outline-none"
          >
            <option value="Off">Off</option>
            <option value="24 hours">24 hours</option>
            <option value="7 days">7 days</option>
            <option value="90 days">90 days</option>
          </select>
        </div>

        {/* Encryption Notice */}
        <div className="p-4 bg-[var(--bg)] border-b border-[var(--line)]/60 flex items-start gap-3">
          <Lock size={18} className="text-[var(--text-muted)] shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-semibold text-[var(--text)]">Encryption</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed">
              Only members of this group can read its messages. School admins can review messages for safety.
            </div>
          </div>
        </div>

        {/* Teacher / Admin Controls Section */}
        {chat.isGroup && (
          <div className="p-4 bg-[#182229]/70 border-b border-[var(--line)] space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--primary)]">
              Classroom Administration
            </div>

            {/* Broadcast Mode Lock Switch */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface)] border border-[var(--line)]">
              <div className="flex items-start gap-2.5">
                <Lock size={16} className={chat.isLocked ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'} />
                <div>
                  <div className="text-xs font-semibold text-[var(--text)] flex items-center gap-1.5">
                    Broadcast Lock
                    {chat.isLocked ? (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--primary)]/20 text-[var(--primary)] font-bold">
                        LOCKED
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-[var(--text-muted)] font-bold">
                        OPEN
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
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
                    chat.isLocked ? 'bg-[var(--primary)]' : 'bg-[var(--line)]'
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
                <span className="text-[10px] text-[var(--text-muted)] font-medium shrink-0">
                  {chat.isLocked ? 'Locked' : 'Open'}
                </span>
              )}
            </div>

            {/* Teacher Quick Dispatcher */}
            {(isTeacher || isAdmin) && onQuickDispatch && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-[var(--text-muted)]">Quick Faculty Dispatches</div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => onQuickDispatch('homework')}
                    className="p-2 rounded-lg bg-[var(--surface)] hover:bg-[var(--line)] text-[11px] font-medium text-[var(--text)] text-center border border-[var(--line)] transition-colors cursor-pointer"
                  >
                    📝 Homework
                  </button>
                  <button
                    onClick={() => onQuickDispatch('attendance')}
                    className="p-2 rounded-lg bg-[var(--surface)] hover:bg-[var(--line)] text-[11px] font-medium text-[var(--text)] text-center border border-[var(--line)] transition-colors cursor-pointer"
                  >
                    ⚠️ Roll Call
                  </button>
                  <button
                    onClick={() => onQuickDispatch('exam')}
                    className="p-2 rounded-lg bg-[var(--surface)] hover:bg-[var(--line)] text-[11px] font-medium text-[var(--text)] text-center border border-[var(--line)] transition-colors cursor-pointer"
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
          <div className="p-4 bg-[var(--bg)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                {members.length} participants
              </span>
              <button
                onClick={onAddMember}
                className="flex items-center gap-1.5 text-xs text-[var(--primary)] hover:text-[var(--primary-hover)] cursor-pointer"
              >
                <UserPlus size={14} />
                <span>Add participant</span>
              </button>
            </div>

            {/* Invite via Link Button */}
            <button
              onClick={onOpenInviteModal}
              className="w-full mb-3 p-2.5 rounded-xl bg-[var(--surface)] hover:bg-[var(--line)] border border-white/5 flex items-center justify-between text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#4f46e5]/20 text-[#6366f1] flex items-center justify-center shrink-0">
                  <Link2 size={16} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[var(--text)] group-hover:text-white">Invite to group via link</div>
                  <div className="text-[10px] text-[var(--text-muted)]">Shareable link, password & admin rights</div>
                </div>
              </div>
              <ChevronRight size={15} className="text-[var(--text-muted)]" />
            </button>

            {/* Pending Join Requests for Admins */}
            {pendingRequests.length > 0 && (
              <div className="mb-3 p-3 rounded-xl bg-[#1e293b] border border-[#6366f1]/30 space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <UserCheck size={14} className="text-[#38bdf8]" />
                    Pending Join Requests ({pendingRequests.length})
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#6366f1]/20 text-[#818cf8]">
                    Needs Review
                  </span>
                </div>
                <div className="space-y-2">
                  {pendingRequests.map((req) => (
                    <div key={req.id} className="p-2 rounded-lg bg-[#0b0f17] border border-white/5 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[#f8fafc] truncate">{req.requester_name}</div>
                        <div className="text-[10px] text-[#94a3b8] truncate">
                          @{req.requester_username} • Role: {req.requested_role === 'admin' ? '⭐️ Admin' : 'Member'}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleRequestDecision(req.id, 'approved')}
                          disabled={requestActionLoading === req.id}
                          className="px-2 py-1 rounded-md bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRequestDecision(req.id, 'rejected')}
                          disabled={requestActionLoading === req.id}
                          className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[#f87171] text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Member search bar */}
            <div className="flex items-center px-2.5 py-1.5 rounded-lg bg-[var(--surface)] mb-3">
              <Search size={13} className="text-[var(--text-muted)] mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search participants"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full text-xs text-[var(--text)] bg-transparent outline-none placeholder-[var(--text-muted)]"
              />
            </div>

            {/* Member List */}
            <div className="space-y-2">
              {filteredMembers.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--surface)] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0"
                      style={{ backgroundColor: m.avatarColor }}
                    >
                      {m.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-[var(--text)] truncate">{m.name}</div>
                      <div className="text-[11px] text-[var(--text-muted)] truncate">{m.about || m.phone}</div>
                    </div>
                  </div>

                  {m.isAdmin && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--primary)]/20 text-[var(--primary)] shrink-0">
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
          <button className="w-full px-3 py-2.5 flex items-center gap-3 text-xs text-[#ea4335] hover:bg-[var(--surface)] rounded-lg transition-colors cursor-pointer text-left">
            <LogOut size={16} />
            <span>Exit group</span>
          </button>
          <button className="w-full px-3 py-2.5 flex items-center gap-3 text-xs text-[#ea4335] hover:bg-[var(--surface)] rounded-lg transition-colors cursor-pointer text-left">
            <ThumbsDown size={16} />
            <span>Report group</span>
          </button>
        </div>
      </div>
    </div>
  );
};
