'use client';

import React, { useState } from 'react';
import { X, Send, Megaphone, CheckCircle2, ShieldCheck, BookOpen, AlertTriangle, Bus, FileText } from 'lucide-react';

interface TeacherNoticeModalProps {
  channelName: string;
  defaultType?: 'homework' | 'attendance' | 'exam' | 'transport';
  onClose: () => void;
  onDispatch: (data: { text: string; templateType: 'homework' | 'attendance' | 'exam' | 'none'; broadcastToAll: boolean }) => void;
}

export const TeacherNoticeModal: React.FC<TeacherNoticeModalProps> = ({
  channelName,
  defaultType = 'homework',
  onClose,
  onDispatch,
}) => {
  const [selectedType, setSelectedType] = useState<'homework' | 'attendance' | 'exam' | 'transport'>(defaultType);
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [dueDate, setDueDate] = useState('Tomorrow 8:30 AM');
  const [broadcastToAll, setBroadcastToAll] = useState(false);

  // Template suggestions based on type
  const templates = {
    homework: {
      title: '📝 Homework Dispatch',
      defaultSubject: 'Mathematics Chapter 5',
      defaultDetails: 'Solve Exercise 5.2 Questions 1 to 8 in fair copy. Graph paper required for Q7.',
      tag: 'homework' as const,
    },
    attendance: {
      title: '⚠️ Morning Roll Call Alert',
      defaultSubject: 'Period 1 Attendance',
      defaultDetails: 'Morning attendance finalized. Students marked absent must bring a parent-signed leave note tomorrow.',
      tag: 'attendance' as const,
    },
    exam: {
      title: '📋 Examination Guidelines',
      defaultSubject: 'Term Assessment 2026',
      defaultDetails: 'Syllabus and hall ticket guidelines released. Bring verified admit cards and CBSE standard geometry kit.',
      tag: 'exam' as const,
    },
    transport: {
      title: '🚌 Bus & Dispersal Advisory',
      defaultSubject: 'Campus Route 14 & 22',
      defaultDetails: 'Buses will depart 15 minutes after final bell. Please inform parents regarding weather precautions.',
      tag: 'none' as const,
    },
  };

  const currentTemplate = templates[selectedType];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSubject = subject.trim() || currentTemplate.defaultSubject;
    const finalDetails = details.trim() || currentTemplate.defaultDetails;

    let compiledText = '';
    if (selectedType === 'homework') {
      compiledText = `📝 [FACULTY HOMEWORK DISPATCH]\nSubject: ${finalSubject}\nSubmission: ${dueDate}\nInstructions: ${finalDetails}`;
    } else if (selectedType === 'attendance') {
      compiledText = `⚠️ [OFFICIAL ATTENDANCE NOTICE]\nSubject: ${finalSubject}\nStatus: ${finalDetails}`;
    } else if (selectedType === 'exam') {
      compiledText = `📋 [EXAMINATION CIRCULAR]\nSubject: ${finalSubject}\nImportant: ${finalDetails}`;
    } else {
      compiledText = `🚌 [CAMPUS DISPERSAL & TRANSPORT]\n${finalSubject}: ${finalDetails}`;
    }

    onDispatch({
      text: compiledText,
      templateType: currentTemplate.tag,
      broadcastToAll,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-fadeIn">
      <div className="w-full max-w-lg bg-[#111b21] rounded-2xl border border-[#222d34] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-[#202c33] border-b border-[#222d34] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#00a884]/20 text-[#00a884] flex items-center justify-center font-bold">
              <Megaphone size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#e9edef]">Official Teacher Dispatch</h3>
              <p className="text-[11px] text-[#8696a0]">{channelName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#8696a0] hover:text-[#e9edef] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSend} className="p-5 space-y-4">
          {/* Template Type Selector */}
          <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-[#202c33] border border-[#222d34]">
            {(['homework', 'attendance', 'exam', 'transport'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedType(t)}
                className={`py-2 px-1 text-center rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                  selectedType === t
                    ? 'bg-[#00a884] text-[#111b21] shadow-md'
                    : 'text-[#8696a0] hover:text-[#e9edef]'
                }`}
              >
                {t === 'homework' && 'Homework'}
                {t === 'attendance' && 'Roll Call'}
                {t === 'exam' && 'Exams'}
                {t === 'transport' && 'Bus'}
              </button>
            ))}
          </div>

          {/* Subject Field */}
          <div>
            <label className="block text-xs font-medium text-[#8696a0] mb-1">Notice Headline / Subject</label>
            <input
              type="text"
              placeholder={currentTemplate.defaultSubject}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#202c33] text-sm text-[#e9edef] placeholder-[#8696a0] border border-[#222d34] outline-none focus:border-[#00a884]"
            />
          </div>

          {/* Details Field */}
          <div>
            <label className="block text-xs font-medium text-[#8696a0] mb-1">Details & Guidelines</label>
            <textarea
              rows={3}
              placeholder={currentTemplate.defaultDetails}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#202c33] text-xs text-[#e9edef] placeholder-[#8696a0] border border-[#222d34] outline-none focus:border-[#00a884] resize-none leading-relaxed"
            />
          </div>

          {/* Due date if homework */}
          {selectedType === 'homework' && (
            <div>
              <label className="block text-xs font-medium text-[#8696a0] mb-1">Submission Deadline</label>
              <input
                type="text"
                placeholder="Tomorrow 8:30 AM"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#202c33] text-sm text-[#e9edef] placeholder-[#8696a0] border border-[#222d34] outline-none"
              />
            </div>
          )}

          {/* Broadcast to All Classes toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#182229] border border-[#222d34]">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#00a884]" />
              <div>
                <div className="text-xs font-semibold text-[#e9edef]">Broadcast to All 91 Classes</div>
                <div className="text-[10px] text-[#8696a0]">Distribute simultaneously across Nursery to 12th</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={broadcastToAll}
              onChange={(e) => setBroadcastToAll(e.target.checked)}
              className="w-4 h-4 accent-[#00a884] cursor-pointer"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#8696a0] hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#00a884] hover:bg-[#008f6f] text-white flex items-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95"
            >
              <Send size={14} />
              <span>Publish Notice</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
