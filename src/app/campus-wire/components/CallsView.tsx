'use client';

import React, { useState } from 'react';
import {
  Phone,
  Video,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Plus,
  ShieldCheck,
  Search,
  Filter,
} from 'lucide-react';
import { CallItem } from './types';
import { DEMO_CALLS } from './constants';

interface CallsViewProps {
  onStartCall: (contactName: string, type: 'voice' | 'video') => void;
}

export const CallsView: React.FC<CallsViewProps> = ({ onStartCall }) => {
  const [calls, setCalls] = useState<CallItem[]>(DEMO_CALLS);
  const [filter, setFilter] = useState<'all' | 'missed'>('all');
  const [search, setSearch] = useState('');

  const filteredCalls = calls.filter((c) => {
    if (filter === 'missed' && c.direction !== 'missed') return false;
    if (search && !c.contactName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-[#111b21] border-r border-[#222d34] overflow-hidden select-none">
      {/* Header */}
      <div className="h-[60px] px-4 flex items-center justify-between bg-[#202c33] border-b border-[#222d34] shrink-0">
        <h1 className="text-lg font-semibold text-[#e9edef]">Calls</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onStartCall('Himaksh', 'voice')}
            className="p-1.5 rounded-full hover:bg-[#2a3942] text-[#8696a0] hover:text-[#e9edef] transition-colors cursor-pointer"
            title="New call"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Search & Filter pills */}
      <div className="p-2 border-b border-[#222d34] flex flex-col gap-2">
        <div className="flex items-center px-3 py-1.5 rounded-[8px] bg-[#202c33]">
          <Search size={15} className="text-[#8696a0] mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Search call logs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs text-[#e9edef] bg-transparent focus:outline-none placeholder-[#8696a0]"
          />
        </div>

        <div className="flex items-center gap-1.5 px-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-[#00a884] text-[#111b21] font-semibold'
                : 'bg-[#202c33] text-[#8696a0] hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('missed')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
              filter === 'missed'
                ? 'bg-[#00a884] text-[#111b21] font-semibold'
                : 'bg-[#202c33] text-[#8696a0] hover:text-white'
            }`}
          >
            Missed
          </button>
        </div>
      </div>

      {/* Call Items List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#222d34]/40">
        {filteredCalls.map((call) => {
          const isMissed = call.direction === 'missed';

          return (
            <div
              key={call.id}
              className="px-4 py-3 flex items-center justify-between hover:bg-[#202c33] transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-xs"
                  style={{ backgroundColor: call.contactColor }}
                >
                  {call.contactInitials}
                </div>

                <div className="min-w-0">
                  <h2
                    className={`text-sm font-semibold truncate ${
                      isMissed ? 'text-[#ea4335]' : 'text-[#e9edef]'
                    }`}
                  >
                    {call.contactName}
                  </h2>

                  <div className="flex items-center gap-1.5 text-xs text-[#8696a0] mt-0.5">
                    {call.direction === 'incoming' && (
                      <PhoneIncoming size={13} className="text-[#00a884]" />
                    )}
                    {call.direction === 'outgoing' && (
                      <PhoneOutgoing size={13} className="text-[#00a884]" />
                    )}
                    {call.direction === 'missed' && (
                      <PhoneMissed size={13} className="text-[#ea4335]" />
                    )}

                    <span>{call.time}</span>
                    {call.duration && (
                      <span className="text-[#8696a0]/70">• {call.duration}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Voice / Video Call */}
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartCall(call.contactName, 'voice');
                  }}
                  className="p-2 rounded-full text-[#00a884] hover:bg-[#2a3942] transition-colors cursor-pointer"
                  title="Voice call"
                >
                  <Phone size={18} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartCall(call.contactName, 'video');
                  }}
                  className="p-2 rounded-full text-[#00a884] hover:bg-[#2a3942] transition-colors cursor-pointer"
                  title="Video call"
                >
                  <Video size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* End-to-end encrypted call notice */}
      <div className="p-3 text-center border-t border-[#222d34] flex items-center justify-center gap-1.5 text-xs text-[#8696a0]">
        <ShieldCheck size={14} className="text-[#00a884]" />
        <span>End-to-end encrypted audio and video calls</span>
      </div>
    </div>
  );
};
