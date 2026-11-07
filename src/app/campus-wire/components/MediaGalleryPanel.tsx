'use client';

import React, { useState } from 'react';
import { X, Play, FileText, ExternalLink, Download } from 'lucide-react';

interface MediaGalleryPanelProps {
  chatName: string;
  onClose: () => void;
}

export const MediaGalleryPanel: React.FC<MediaGalleryPanelProps> = ({
  chatName,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'media' | 'docs' | 'links'>('media');

  const demoMedia = [
    { id: 'm1', type: 'video', duration: '2:20', title: 'Prime Campus Highlight 2026', date: 'Today' },
    { id: 'm2', type: 'image', title: 'Ramanujan Lab Experiment', date: 'Yesterday' },
    { id: 'm3', type: 'video', duration: '0:45', title: 'Robotics Demo', date: 'Nov 3' },
    { id: 'm4', type: 'image', title: 'Campus Sports Day', date: 'Nov 2' },
    { id: 'm5', type: 'image', title: 'Math Olympiad Prep', date: 'Nov 1' },
    { id: 'm6', type: 'video', duration: '1:15', title: 'Assembly Speech', date: 'Oct 30' },
  ];

  const demoDocs = [
    { id: 'd1', name: 'English_Chapter_4_Summit_Within.pdf', size: '2.4 MB', date: 'Today, 7:30 pm' },
    { id: 'd2', name: 'Math_Quadratic_Equations_Formulas.pdf', size: '1.1 MB', date: 'Nov 3, 4:15 pm' },
    { id: 'd3', name: 'Physics_Sound_Waves_Notes.pdf', size: '3.8 MB', date: 'Nov 2, 11:20 am' },
    { id: 'd4', name: 'Half_Yearly_Exam_DateSheet_2026.pdf', size: '540 KB', date: 'Oct 28, 9:00 am' },
  ];

  const demoLinks = [
    { id: 'l1', url: 'https://dpsbuzz.edu/events/robotics-2026', title: 'DPS Robotics Workshop 2026', domain: 'dpsbuzz.edu' },
    { id: 'l2', url: 'https://khanacademy.org/math/algebra', title: 'Algebra quadratic formulas study guide', domain: 'khanacademy.org' },
    { id: 'l3', url: 'https://ncert.nic.in/textbook/class8', title: 'Official NCERT Class 8 Textbook PDF', domain: 'ncert.nic.in' },
  ];

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
          <h2 className="text-sm font-semibold text-[#e9edef] truncate max-w-[240px]">
            {chatName}
          </h2>
        </div>
      </div>

      {/* Tabs: Media / Docs / Links */}
      <div className="flex border-b border-[#222d34] bg-[#111b21]">
        {(['media', 'docs', 'links'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex-1 py-3 text-xs font-semibold capitalize tracking-wide transition-colors relative cursor-pointer ${
              activeTab === t ? 'text-[#00a884]' : 'text-[#8696a0] hover:text-white'
            }`}
          >
            {t}
            {activeTab === t && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00a884]" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* MEDIA TAB */}
        {activeTab === 'media' && (
          <div className="grid grid-cols-3 gap-2">
            {demoMedia.map((m) => (
              <div
                key={m.id}
                className="aspect-square rounded-md overflow-hidden bg-gradient-to-br from-[#202c33] to-[#2a3942] relative group cursor-pointer border border-white/5"
              >
                <div className="w-full h-full flex items-center justify-center text-white/50 group-hover:scale-105 transition-transform">
                  {m.type === 'video' ? (
                    <div className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white">
                      <Play size={14} className="ml-0.5 fill-white" />
                    </div>
                  ) : (
                    <span className="text-[10px] text-white/70 font-medium px-1 text-center">
                      {m.title}
                    </span>
                  )}
                </div>

                {m.duration && (
                  <span className="absolute bottom-1 left-1 px-1 rounded bg-black/70 text-[9px] text-white font-medium">
                    {m.duration}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* DOCS TAB */}
        {activeTab === 'docs' && (
          <div className="space-y-2">
            {demoDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-3 rounded-lg bg-[#202c33] hover:bg-[#2a3942] transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded bg-[#ea4335]/20 text-[#ea4335] flex items-center justify-center shrink-0">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-[#e9edef] truncate">{doc.name}</div>
                    <div className="text-[11px] text-[#8696a0] mt-0.5">
                      {doc.size} • {doc.date}
                    </div>
                  </div>
                </div>

                <button
                  className="p-1.5 rounded text-[#8696a0] hover:text-[#00a884] transition-colors"
                  title="Download"
                >
                  <Download size={15} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* LINKS TAB */}
        {activeTab === 'links' && (
          <div className="space-y-2">
            {demoLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-lg bg-[#202c33] hover:bg-[#2a3942] transition-colors block group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-[#53bdeb] group-hover:underline truncate">
                    {link.title}
                  </div>
                  <ExternalLink size={13} className="text-[#8696a0] shrink-0 ml-2" />
                </div>
                <div className="text-[11px] text-[#8696a0] mt-1 truncate">{link.url}</div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
