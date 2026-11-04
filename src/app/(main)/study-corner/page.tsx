'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Plus,
  Heart,
  Download,
  Search,
  Sparkles,
  Check,
  X,
  FileText,
  Bookmark,
  Share2,
} from 'lucide-react';
import { SchoolFeatures, type StudyNoteItem } from '@/lib/schoolFeatures';
import { DataStore } from '@/lib/dataStore';

export default function StudyCornerPage() {
  const [notes, setNotes] = useState<StudyNoteItem[]>(() => SchoolFeatures.getStudyNotes());
  const [selectedGrade, setSelectedGrade] = useState<string>('All');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activePreviewNote, setActivePreviewNote] = useState<StudyNoteItem | null>(null);

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Mathematics');
  const [newGrade, setNewGrade] = useState('Class 8');
  const [newDesc, setNewDesc] = useState('');
  const [newContent, setNewContent] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const currentUser = DataStore.getCurrentUser();
  const username = currentUser?.username || 'student';

  useEffect(() => {
    SchoolFeatures.sync(username);

    const handleUpdate = () => {
      setNotes(SchoolFeatures.getStudyNotes());
    };
    window.addEventListener('dpsbuzz:campus_updated', handleUpdate);
    return () => window.removeEventListener('dpsbuzz:campus_updated', handleUpdate);
  }, [username]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleLike = async (noteId: string) => {
    const res = await SchoolFeatures.toggleLikeStudyNote(noteId, username);
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === noteId) {
          const liked = (n.likedBy || []).includes(username);
          return {
            ...n,
            likes: res.likes,
            likedBy: liked ? (n.likedBy || []).filter((u) => u !== username) : [...(n.likedBy || []), username],
          };
        }
        return n;
      })
    );
    if (res.isLiked) {
      showToast('Thank you for appreciating this student note! (+5 Spirit Points recorded in cloud)');
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsUploading(true);
    try {
      const created = await SchoolFeatures.addStudyNote({
        title: newTitle,
        subject: newSubject,
        classGrade: newGrade,
        description: newDesc || `Key study notes for ${newSubject}`,
        authorName: currentUser?.fullName || username,
        authorUsername: username,
        authorRole: currentUser?.role === 'admin' ? 'teacher' : 'student',
        authorClass: currentUser?.class ? `Class ${currentUser.class}` : newGrade,
        contentPreview: newContent,
        fileType: 'summary',
      });

      setNotes((prev) => [created, ...prev.filter((n) => n.id !== created.id)]);
      setIsUploadOpen(false);
      setNewTitle('');
      setNewDesc('');
      setNewContent('');
      showToast('Your notes were uploaded to Cloud Database successfully! 🌟');
    } catch {
      showToast('Error uploading notes.');
    } finally {
      setIsUploading(false);
    }
  };

  const grades = ['All', 'Class 10', 'Class 9', 'Class 8', 'Class 7', 'Class 6', 'Class 5', 'Junior (Nursery–4)'];
  const subjects = ['All', 'Mathematics', 'Science', 'Social Science', 'English', 'Computer Science'];

  const filteredNotes = notes.filter((n) => {
    const matchesGrade =
      selectedGrade === 'All' ||
      (selectedGrade === 'Junior (Nursery–4)'
        ? ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Nursery', 'LKG', 'UKG'].includes(n.classGrade)
        : n.classGrade.toLowerCase() === selectedGrade.toLowerCase());

    const matchesSubject = selectedSubject === 'All' || n.subject.toLowerCase() === selectedSubject.toLowerCase();

    const matchesSearch =
      !searchQuery.trim() ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.authorName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesGrade && matchesSubject && matchesSearch;
  });

  return (
    <div className="space-y-4 pb-24 select-none max-w-4xl mx-auto">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-full shadow-lg animate-fade-in flex items-center gap-2">
          <Check size={14} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div
        className="flex items-center justify-between px-4 h-14 border-b sticky top-0 z-20 backdrop-blur-md"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--line)',
        }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/home"
            className="w-9 h-9 rounded-full flex items-center justify-center btn-press hover:bg-[var(--surface-sunken)] transition-colors"
            style={{ color: 'var(--text)' }}
            aria-label="Back to home"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-[var(--text)]">Study Corner</h1>
            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
              Nursery–10
            </span>
            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Cloud</span>
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsUploadOpen(true)}
          className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-full flex items-center gap-1.5 hover:opacity-95 shadow-sm active:scale-95 transition-all cursor-pointer"
        >
          <Plus size={15} />
          <span>Upload Notes</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-4">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topics, formulas, or student authors..."
            className="w-full h-10 pl-10 pr-4 text-xs rounded-xl border bg-[var(--surface)] text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            style={{ borderColor: 'var(--line)' }}
          />
        </div>
      </div>

      {/* Grade Filters */}
      <div className="px-4 space-y-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
          {grades.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setSelectedGrade(g)}
              className={`px-3 py-1.5 rounded-full font-semibold transition-all shrink-0 ${
                selectedGrade === g
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-[var(--surface-sunken)] text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--line)]'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Subject Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
          {subjects.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSelectedSubject(s)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all shrink-0 ${
                selectedSubject === s
                  ? 'bg-[var(--primary)] text-[var(--on-primary)] shadow-xs'
                  : 'bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--line)]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Notes Grid */}
      <div className="px-4 grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredNotes.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-[var(--text-muted)] space-y-3 bg-[var(--surface-sunken)] rounded-2xl border border-[var(--line)] p-6">
            <BookOpen size={36} className="mx-auto text-blue-500 opacity-70" />
            <div className="space-y-1">
              <p className="font-bold text-sm text-[var(--text)]">No study notes uploaded yet</p>
              <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                Share revision guides, formula cheat sheets, or chapter summaries to help your fellow students and earn Spirit Points!
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-full text-xs hover:opacity-95 shadow-xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus size={14} />
              <span>Upload Notes</span>
            </button>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const isLiked = (note.likedBy || []).includes(username);
            return (
              <div
                key={note.id}
                className="p-4 rounded-2xl border bg-[var(--surface)] shadow-2xs hover:border-blue-500/40 transition-all space-y-3 flex flex-col justify-between"
                style={{ borderColor: 'var(--line)' }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        {note.classGrade}
                      </span>
                      <span className="text-[10px] font-semibold text-[var(--text-muted)]">
                        • {note.subject}
                      </span>
                    </div>

                    {note.badge && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        {note.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold leading-snug text-[var(--text)]">{note.title}</h3>
                  <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                    {note.description}
                  </p>
                </div>

                {/* Preview Box */}
                <div
                  onClick={() => setActivePreviewNote(note)}
                  className="p-3 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] text-[11px] font-mono text-[var(--text-muted)] hover:border-blue-500/40 hover:text-[var(--text)] cursor-pointer transition-colors line-clamp-3 leading-relaxed"
                >
                  {note.contentPreview}
                </div>

                {/* Footer details & Action */}
                <div className="flex items-center justify-between pt-2 border-t border-[var(--line)] text-xs text-[var(--text-muted)]">
                  <div>
                    <span className="font-semibold text-[var(--text)]">{note.authorName}</span>
                    {note.authorClass && (
                      <span className="text-[11px] text-[var(--text-muted)] ml-1">({note.authorClass})</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleLike(note.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full border transition-all cursor-pointer text-xs font-semibold ${
                        isLiked
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                          : 'border-[var(--line)] hover:bg-[var(--surface-sunken)]'
                      }`}
                    >
                      <Heart size={13} className={isLiked ? 'fill-rose-500' : ''} />
                      <span>{note.likes}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActivePreviewNote(note)}
                      className="px-3 py-1 rounded-full bg-blue-600 text-white font-semibold text-xs hover:opacity-90 flex items-center gap-1"
                    >
                      <FileText size={13} />
                      <span>View</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Preview Modal */}
      {activePreviewNote && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div
            className="w-full max-w-lg rounded-2xl border bg-[var(--surface)] p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
            style={{ borderColor: 'var(--line)' }}
          >
            <div className="flex items-start justify-between gap-3 border-b pb-3" style={{ borderColor: 'var(--line)' }}>
              <div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-500">
                  {activePreviewNote.classGrade} • {activePreviewNote.subject}
                </span>
                <h2 className="text-base font-bold mt-1 text-[var(--text)]">{activePreviewNote.title}</h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Shared by {activePreviewNote.authorName} • {activePreviewNote.createdAt}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePreviewNote(null)}
                className="p-1 rounded-full hover:bg-[var(--surface-sunken)] text-[var(--text-muted)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              <div className="p-4 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] text-xs md:text-sm font-sans leading-relaxed whitespace-pre-wrap text-[var(--text)]">
                {activePreviewNote.contentPreview}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
              <button
                type="button"
                onClick={() => handleLike(activePreviewNote.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--line)] text-xs font-semibold hover:bg-[var(--surface-sunken)]"
              >
                <Heart size={14} className={activePreviewNote.likedBy?.includes(username) ? 'fill-rose-500 text-rose-500' : ''} />
                <span>{activePreviewNote.likes} Likes</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  showToast('Note saved to your offline device binder! 📥');
                  setActivePreviewNote(null);
                }}
                className="px-4 py-1.5 rounded-full bg-blue-600 text-white text-xs font-bold hover:opacity-95 flex items-center gap-1.5 shadow-sm"
              >
                <Download size={14} />
                <span>Save Offline</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Notes Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <form
            onSubmit={handleCreateNote}
            className="w-full max-w-lg rounded-2xl border bg-[var(--surface)] p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            style={{ borderColor: 'var(--line)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--line)' }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                  <BookOpen size={16} />
                </div>
                <h2 className="text-sm font-bold text-[var(--text)]">Upload Study Notes</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="p-1 rounded-full hover:bg-[var(--surface-sunken)] text-[var(--text-muted)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1 text-[var(--text)]">Note Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Class 8: Light & Sound Complete Formulas"
                  className="w-full h-9 px-3 rounded-xl border bg-[var(--surface-sunken)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  style={{ borderColor: 'var(--line)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1 text-[var(--text)]">Class Grade</label>
                  <select
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border bg-[var(--surface-sunken)] text-[var(--text)] focus:outline-none"
                    style={{ borderColor: 'var(--line)' }}
                  >
                    <option value="Class 10">Class 10</option>
                    <option value="Class 9">Class 9</option>
                    <option value="Class 8">Class 8</option>
                    <option value="Class 7">Class 7</option>
                    <option value="Class 6">Class 6</option>
                    <option value="Class 5">Class 5</option>
                    <option value="Junior (Nursery–4)">Junior (Nursery–4)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-[var(--text)]">Subject</label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border bg-[var(--surface-sunken)] text-[var(--text)] focus:outline-none"
                    style={{ borderColor: 'var(--line)' }}
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Science">Science</option>
                    <option value="Social Science">Social Science</option>
                    <option value="English">English</option>
                    <option value="Computer Science">Computer Science</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-[var(--text)]">Brief Description</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="e.g. Chapter 4 quick revision summary & 5 practice questions"
                  className="w-full h-9 px-3 rounded-xl border bg-[var(--surface-sunken)] text-[var(--text)] focus:outline-none"
                  style={{ borderColor: 'var(--line)' }}
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-[var(--text)]">Notes Content / Formulas / Summary *</label>
                <textarea
                  required
                  rows={6}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Type or paste your formulas, bullet points, key definitions, or exam questions..."
                  className="w-full p-3 rounded-xl border bg-[var(--surface-sunken)] text-[var(--text)] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  style={{ borderColor: 'var(--line)' }}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-sunken)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:opacity-95 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isUploading ? 'Publishing to Cloud...' : 'Publish to Cloud Database'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
