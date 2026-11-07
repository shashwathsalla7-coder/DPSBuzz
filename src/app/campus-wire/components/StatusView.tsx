'use client';

import React, { useState } from 'react';
import { Plus, MoreVertical, ShieldCheck, Eye, Sparkles } from 'lucide-react';
import { StatusItem, StatusUpdate } from './types';
import { DEMO_STATUSES } from './constants';

interface StatusViewProps {
  onSelectStatus: (status: StatusItem) => void;
  onCreateStatus: (text: string, color: string) => void;
}

export const StatusView: React.FC<StatusViewProps> = ({
  onSelectStatus,
  onCreateStatus,
}) => {
  const [statuses, setStatuses] = useState<StatusItem[]>(DEMO_STATUSES);
  const [isCreatingText, setIsCreatingText] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [selectedBg, setSelectedBg] = useState('#005c4b');

  const bgOptions = ['#005c4b', '#7c5ce0', '#ff5722', '#00bcd4', '#e542a3', '#ff9f00', '#202c33'];

  const myStatus = statuses.find((s) => s.id === 'st1');
  const recentUpdates = statuses.filter((s) => s.id !== 'st1' && !s.viewed);
  const viewedUpdates = statuses.filter((s) => s.id !== 'st1' && s.viewed);

  const handlePostStatus = () => {
    if (!statusText.trim()) return;
    const newUpdate: StatusUpdate = {
      id: `su-${Date.now()}`,
      type: 'text',
      content: statusText.trim(),
      backgroundColor: selectedBg,
      time: 'Just now',
      viewCount: 0,
    };

    setStatuses((prev) =>
      prev.map((s) =>
        s.id === 'st1'
          ? {
              ...s,
              time: 'Just now',
              updates: [...s.updates, newUpdate],
            }
          : s
      )
    );

    onCreateStatus(statusText.trim(), selectedBg);
    setStatusText('');
    setIsCreatingText(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#111b21] border-r border-[#222d34] overflow-y-auto select-none">
      {/* Header */}
      <div className="h-[60px] px-4 flex items-center justify-between bg-[#202c33] border-b border-[#222d34] shrink-0">
        <h1 className="text-lg font-semibold text-[#e9edef]">Status</h1>
        <div className="flex items-center gap-3 text-[#8696a0]">
          <button
            onClick={() => setIsCreatingText(true)}
            className="p-1.5 rounded-full hover:bg-[#2a3942] hover:text-[#e9edef] transition-colors cursor-pointer"
            title="Add text status"
          >
            <Plus size={20} />
          </button>
          <button
            className="p-1.5 rounded-full hover:bg-[#2a3942] hover:text-[#e9edef] transition-colors cursor-pointer"
            title="Status Privacy"
          >
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Text Status Creator Drawer / Modal */}
      {isCreatingText && (
        <div className="p-4 bg-[#202c33] border-b border-[#222d34] animate-fadeIn">
          <div className="text-xs text-[#8696a0] mb-2 font-medium">Create Text Status</div>
          <div
            className="p-4 rounded-xl min-h-[90px] flex items-center justify-center transition-colors"
            style={{ backgroundColor: selectedBg }}
          >
            <textarea
              value={statusText}
              onChange={(e) => setStatusText(e.target.value)}
              placeholder="Type a status update..."
              className="w-full bg-transparent text-center font-medium text-white placeholder-white/70 outline-none resize-none text-base"
              rows={2}
              autoFocus
            />
          </div>

          {/* Color palette selector */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1.5">
              {bgOptions.map((bg) => (
                <button
                  key={bg}
                  onClick={() => setSelectedBg(bg)}
                  className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${
                    selectedBg === bg ? 'scale-125 ring-2 ring-white' : ''
                  }`}
                  style={{ backgroundColor: bg }}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCreatingText(false)}
                className="px-3 py-1 text-xs text-[#8696a0] hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handlePostStatus}
                disabled={!statusText.trim()}
                className="px-3 py-1 rounded-md text-xs font-semibold bg-[#00a884] text-[#111b21] hover:bg-[#008f6f] disabled:opacity-50 cursor-pointer"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content list */}
      <div className="flex-1 overflow-y-auto">
        {/* My Status */}
        <div
          onClick={() => {
            if (myStatus && myStatus.updates.length > 0) {
              onSelectStatus(myStatus);
            } else {
              setIsCreatingText(true);
            }
          }}
          className="px-4 py-3 flex items-center gap-3.5 hover:bg-[#202c33] transition-colors cursor-pointer border-b border-[#222d34]/60"
        >
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-full bg-[#00a884] flex items-center justify-center text-white font-bold text-base shadow-xs">
              S
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#00a884] ring-2 ring-[#111b21] flex items-center justify-center text-white">
              <Plus size={12} strokeWidth={3} />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-[#e9edef]">My Status</h2>
            <p className="text-xs text-[#8696a0] truncate mt-0.5">
              {myStatus && myStatus.updates.length > 0
                ? `${myStatus.updates.length} update • ${myStatus.time}`
                : 'Click to add status update'}
            </p>
          </div>
        </div>

        {/* Recent Updates Header */}
        {recentUpdates.length > 0 && (
          <div className="px-4 pt-4 pb-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-[#00a884]">
              Recent updates
            </span>
          </div>
        )}

        {/* Recent Updates List */}
        {recentUpdates.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectStatus(item)}
            className="px-4 py-3 flex items-center gap-3.5 hover:bg-[#202c33] transition-colors cursor-pointer"
          >
            {/* Status Green Circle Ring */}
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-full p-[2.5px] border-2 border-[#00a884] flex items-center justify-center">
                <div
                  className="w-full h-full rounded-full flex items-center justify-center font-bold text-white text-xs shadow-xs"
                  style={{ backgroundColor: item.contactColor }}
                >
                  {item.contactInitials}
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-medium text-[#e9edef] truncate">{item.contactName}</h2>
              <p className="text-xs text-[#8696a0] mt-0.5">{item.time}</p>
            </div>
          </div>
        ))}

        {/* Viewed Updates Header */}
        {viewedUpdates.length > 0 && (
          <div className="px-4 pt-5 pb-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-[#8696a0]">
              Viewed updates
            </span>
          </div>
        )}

        {/* Viewed Updates List */}
        {viewedUpdates.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectStatus(item)}
            className="px-4 py-3 flex items-center gap-3.5 hover:bg-[#202c33] transition-colors cursor-pointer opacity-80 hover:opacity-100"
          >
            {/* Muted Ring */}
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-full p-[2.5px] border-2 border-[#8696a0]/50 flex items-center justify-center">
                <div
                  className="w-full h-full rounded-full flex items-center justify-center font-bold text-white text-xs shadow-xs"
                  style={{ backgroundColor: item.contactColor }}
                >
                  {item.contactInitials}
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-medium text-[#e9edef] truncate">{item.contactName}</h2>
              <p className="text-xs text-[#8696a0] mt-0.5">{item.time}</p>
            </div>
          </div>
        ))}

        {/* End-to-end encrypted notice */}
        <div className="mt-8 px-6 py-4 text-center flex flex-col items-center gap-1.5 text-xs text-[#8696a0]/70">
          <ShieldCheck size={16} className="text-[#00a884]" />
          <span>Your status updates are end-to-end encrypted</span>
        </div>
      </div>
    </div>
  );
};
