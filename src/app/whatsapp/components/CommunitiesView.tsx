'use client';

import React, { useState } from 'react';
import { Users, Plus, ChevronRight, Megaphone, ShieldCheck } from 'lucide-react';
import { CommunityItem } from './types';
import { DEMO_COMMUNITIES } from './constants';

interface CommunitiesViewProps {
  onSelectGroup: (groupName: string) => void;
}

export const CommunitiesView: React.FC<CommunitiesViewProps> = ({
  onSelectGroup,
}) => {
  const [communities, setCommunities] = useState<CommunityItem[]>(DEMO_COMMUNITIES);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newCommName, setNewCommName] = useState('');
  const [newCommDesc, setNewCommDesc] = useState('');

  const handleCreateCommunity = () => {
    if (!newCommName.trim()) return;
    const newComm: CommunityItem = {
      id: `comm-${Date.now()}`,
      name: newCommName.trim(),
      description: newCommDesc.trim() || 'New community for DPS students',
      avatarColor: '#25d366',
      initials: newCommName.slice(0, 2).toUpperCase(),
      memberCount: 1,
      groups: ['Announcements', 'General Chat'],
    };
    setCommunities([newComm, ...communities]);
    setNewCommName('');
    setNewCommDesc('');
    setShowNewModal(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#111b21] border-r border-[#222d34] overflow-y-auto select-none">
      {/* Header */}
      <div className="h-[60px] px-4 flex items-center justify-between bg-[#202c33] border-b border-[#222d34] shrink-0">
        <h1 className="text-lg font-semibold text-[#e9edef]">Communities</h1>
        <button
          onClick={() => setShowNewModal(true)}
          className="p-1.5 rounded-full hover:bg-[#2a3942] text-[#8696a0] hover:text-[#e9edef] transition-colors cursor-pointer"
          title="New Community"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* New Community Modal / Drawer */}
      {showNewModal && (
        <div className="p-4 bg-[#202c33] border-b border-[#222d34] animate-fadeIn">
          <div className="text-xs text-[#00a884] font-semibold uppercase mb-2">Create Community</div>
          <input
            type="text"
            placeholder="Community Name (e.g. DPS Robotics)"
            value={newCommName}
            onChange={(e) => setNewCommName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#2a3942] text-sm text-[#e9edef] placeholder-[#8696a0] outline-none mb-2"
          />
          <textarea
            placeholder="Description..."
            value={newCommDesc}
            onChange={(e) => setNewCommDesc(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-[#2a3942] text-xs text-[#e9edef] placeholder-[#8696a0] outline-none resize-none mb-3"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowNewModal(false)}
              className="px-3 py-1 text-xs text-[#8696a0] hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateCommunity}
              disabled={!newCommName.trim()}
              className="px-3 py-1 rounded-md text-xs font-semibold bg-[#00a884] text-[#111b21] disabled:opacity-50 cursor-pointer"
            >
              Create
            </button>
          </div>
        </div>
      )}

      {/* Communities List */}
      <div className="flex-1 overflow-y-auto">
        {/* Intro banner */}
        <div className="p-4 border-b border-[#222d34] bg-[#111b21]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#00a884]/20 border border-[#00a884]/40 flex items-center justify-center text-[#00a884] shrink-0">
              <Users size={24} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#e9edef]">Stay connected with your clubs</h2>
              <p className="text-xs text-[#8696a0] mt-0.5 leading-snug">
                Communities bring campus classrooms, clubs, and houses together in one space.
              </p>
            </div>
          </div>
        </div>

        {/* Community Cards */}
        {communities.map((comm) => (
          <div key={comm.id} className="border-b border-[#222d34]/60">
            {/* Community Header */}
            <div className="px-4 py-3 flex items-center gap-3.5 bg-[#182229] hover:bg-[#202c33] transition-colors cursor-pointer">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-xs"
                style={{ backgroundColor: comm.avatarColor }}
              >
                {comm.initials}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-[#e9edef] truncate">{comm.name}</h3>
                <p className="text-xs text-[#8696a0] truncate mt-0.5">
                  {comm.memberCount} members
                </p>
              </div>
            </div>

            {/* Sub-groups inside this community */}
            <div className="pl-6 divide-y divide-[#222d34]/30 bg-[#111b21]">
              {/* Announcements group */}
              <div
                onClick={() => onSelectGroup(`${comm.name} Dispatches`)}
                className="px-4 py-2.5 flex items-center gap-3 hover:bg-[#202c33] transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-[#00a884]/20 text-[#00a884] flex items-center justify-center shrink-0">
                  <Megaphone size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-[#e9edef] truncate block">
                    Announcements
                  </span>
                  <span className="text-[11px] text-[#8696a0] truncate block">
                    Tap to view admin broadcasts
                  </span>
                </div>
                <ChevronRight size={14} className="text-[#8696a0]" />
              </div>

              {/* Sub-group list */}
              {comm.groups.map((grp, idx) => (
                <div
                  key={idx}
                  onClick={() => onSelectGroup(grp)}
                  className="px-4 py-2.5 flex items-center gap-3 hover:bg-[#202c33] transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-[#202c33] text-[#8696a0] flex items-center justify-center shrink-0 text-xs font-semibold">
                    #
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-[#e9edef] truncate block">
                      {grp}
                    </span>
                    <span className="text-[11px] text-[#8696a0] truncate block">
                      Click to chat
                    </span>
                  </div>
                  <ChevronRight size={14} className="text-[#8696a0]" />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="p-4 text-center text-xs text-[#8696a0] flex items-center justify-center gap-1.5">
          <ShieldCheck size={14} className="text-[#00a884]" />
          <span>Only administrators can post announcements</span>
        </div>
      </div>
    </div>
  );
};
