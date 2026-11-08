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
    <div className="flex flex-col h-full bg-[var(--bg)] border-r border-[var(--line)] overflow-hidden select-none">
      {/* Header */}
      <div className="h-[60px] px-4 flex items-center justify-between bg-[var(--surface)] border-b border-[var(--line)] shrink-0">
        <h1 className="text-lg font-semibold text-[var(--text)]">Calls</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onStartCall('Himaksh', 'voice')}
            className="p-1.5 rounded-full hover:bg-[var(--line)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
            title="New call"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Search & Filter pills */}
      <div className="p-2 border-b border-[var(--line)] flex flex-col gap-2">
        <div className="flex items-center px-3 py-1.5 rounded-[8px] bg-[var(--surface)]">
          <Search size={15} className="text-[var(--text-muted)] mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Search call logs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs text-[var(--text)] bg-transparent focus:outline-none placeholder-[var(--text-muted)]"
          />
        </div>

        <div className="flex items-center gap-1.5 px-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-[var(--primary)] text-[var(--bg)] font-semibold'
                : 'bg-[var(--surface)] text-[var(--text-muted)] hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('missed')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
              filter === 'missed'
                ? 'bg-[var(--primary)] text-[var(--bg)] font-semibold'
                : 'bg-[var(--surface)] text-[var(--text-muted)] hover:text-white'
            }`}
          >
            Missed
          </button>
        </div>
      </div>

      {/* Call Items List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[var(--line)]/40">
        {filteredCalls.length === 0 && (
          <p className="px-6 py-10 text-center text-sm text-[var(--text-muted)]">No calls yet.</p>
        )}
        {filteredCalls.map((call) => {
          const isMissed = call.direction === 'missed';

          return (
            <div
              key={call.id}
              className="px-4 py-3 flex items-center justify-between hover:bg-[var(--surface)] transition-colors group cursor-pointer"
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
                      isMissed ? 'text-[#ea4335]' : 'text-[var(--text)]'
                    }`}
                  >
                    {call.contactName}
                  </h2>

                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mt-0.5">
                    {call.direction === 'incoming' && (
                      <PhoneIncoming size={13} className="text-[var(--primary)]" />
                    )}
                    {call.direction === 'outgoing' && (
                      <PhoneOutgoing size={13} className="text-[var(--primary)]" />
                    )}
                    {call.direction === 'missed' && (
                      <PhoneMissed size={13} className="text-[#ea4335]" />
                    )}

                    <span>{call.time}</span>
                    {call.duration && (
                      <span className="text-[var(--text-muted)]/70">• {call.duration}</span>
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
                  className="p-2 rounded-full text-[var(--primary)] hover:bg-[var(--line)] transition-colors cursor-pointer"
                  title="Voice call"
                >
                  <Phone size={18} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartCall(call.contactName, 'video');
                  }}
                  className="p-2 rounded-full text-[var(--primary)] hover:bg-[var(--line)] transition-colors cursor-pointer"
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
      <div className="p-3 text-center border-t border-[var(--line)] flex items-center justify-center gap-1.5 text-xs text-[var(--text-muted)]">
        <ShieldCheck size={14} className="text-[var(--primary)]" />
        <span>Only people in the call can join it</span>
      </div>
    </div>
  );
};
