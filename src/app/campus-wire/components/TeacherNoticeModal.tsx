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
      <div className="w-full max-w-lg bg-[var(--bg)] rounded-2xl border border-[var(--line)] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-[var(--surface)] border-b border-[var(--line)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/20 text-[var(--primary)] flex items-center justify-center font-bold">
              <Megaphone size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text)]">Official Teacher Dispatch</h3>
              <p className="text-[11px] text-[var(--text-muted)]">{channelName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSend} className="p-5 space-y-4">
          {/* Template Type Selector */}
          <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-[var(--surface)] border border-[var(--line)]">
            {(['homework', 'attendance', 'exam', 'transport'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedType(t)}
                className={`py-2 px-1 text-center rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                  selectedType === t
                    ? 'bg-[var(--primary)] text-[var(--bg)] shadow-md'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
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
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Notice Headline / Subject</label>
            <input
              type="text"
              placeholder={currentTemplate.defaultSubject}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--surface)] text-sm text-[var(--text)] placeholder-[var(--text-muted)] border border-[var(--line)] outline-none focus:border-[var(--primary)]"
            />
          </div>

          {/* Details Field */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Details & Guidelines</label>
            <textarea
              rows={3}
              placeholder={currentTemplate.defaultDetails}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--surface)] text-xs text-[var(--text)] placeholder-[var(--text-muted)] border border-[var(--line)] outline-none focus:border-[var(--primary)] resize-none leading-relaxed"
            />
          </div>

          {/* Due date if homework */}
          {selectedType === 'homework' && (
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Submission Deadline</label>
              <input
                type="text"
                placeholder="Tomorrow 8:30 AM"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--surface)] text-sm text-[var(--text)] placeholder-[var(--text-muted)] border border-[var(--line)] outline-none"
              />
            </div>
          )}

          {/* Broadcast to All Classes toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#182229] border border-[var(--line)]">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-[var(--primary)]" />
              <div>
                <div className="text-xs font-semibold text-[var(--text)]">Broadcast to All 91 Classes</div>
                <div className="text-[10px] text-[var(--text-muted)]">Distribute simultaneously across Nursery to 12th</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={broadcastToAll}
              onChange={(e) => setBroadcastToAll(e.target.checked)}
              className="w-4 h-4 accent-[var(--primary)] cursor-pointer"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white flex items-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95"
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
