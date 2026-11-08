'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  MapPin,
  Calendar,
  User,
  Tag,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
  Laptop,
  Shirt,
  KeyRound,
  CupSoda,
  X,
  ShieldCheck,
  Check,
  Camera,
  Loader2,
  ArrowLeft,
  MessageCircle,
  ExternalLink,
  Info,
} from 'lucide-react';
import { SchoolFeatures, type LostFoundItem } from '@/lib/schoolFeatures';
import { DataStore } from '@/lib/dataStore';

const CATEGORIES = [
  { id: 'all', label: 'All Categories', icon: Tag },
  { id: 'ID Cards & Keys', label: 'ID Cards & Keys', icon: KeyRound },
  { id: 'Electronics', label: 'Electronics', icon: Laptop },
  { id: 'Water Bottles & Lunchboxes', label: 'Bottles & Lunch', icon: CupSoda },
  { id: 'Uniform & Apparel', label: 'Uniform & Apparel', icon: Shirt },
  { id: 'Books & Stationery', label: 'Books & Stationery', icon: BookOpen },
  { id: 'Other', label: 'Other Items', icon: Tag },
];

const LOCATIONS = [
  'All Locations',
  'Library',
  'Cafeteria',
  'Sports Ground',
  'Science Block',
  'Main Reception',
  'Junior Wing (Nursery–5)',
  'Senior Corridors (6–10)',
];

export default function LostFoundPage() {
  const router = useRouter();
  const [items, setItems] = useState<LostFoundItem[]>(() => SchoolFeatures.getLostFoundItems());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LOST' | 'FOUND' | 'CLAIMED'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('All Locations');

  // Modals
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [activeFoundModalItem, setActiveFoundModalItem] = useState<LostFoundItem | null>(null);
  const [activePreviewItem, setActivePreviewItem] = useState<LostFoundItem | null>(null);
  const [toastMessage, setToastMessage] = useState<{ msg: string; type: 'success' | 'danger' } | null>(null);

  // Current logged in student
  const currentUser = DataStore.getCurrentUser();
  const username = (currentUser?.username || 'student').toLowerCase().trim();
  const userFullName = currentUser?.fullName || username;
  const userClass = currentUser?.class ? `Class ${currentUser.class}` : 'Class 10';
  const userSection = currentUser?.section || 'A';

  // Report Form State
  const [reportTitle, setReportTitle] = useState('');
  const [reportCategory, setReportCategory] = useState('Electronics');
  const [reportStatus, setReportStatus] = useState<'LOST' | 'FOUND'>('LOST');
  const [reportLocation, setReportLocation] = useState('Science Block');
  const [reportSpot, setReportSpot] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reportImage, setReportImage] = useState<File | null>(null);
  const [reportImagePreview, setReportImagePreview] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // "I Found This" Modal State
  const [finderClass, setFinderClass] = useState(userClass);
  const [finderSection, setFinderSection] = useState(userSection);
  const [finderNotes, setFinderNotes] = useState('');
  const [isSubmittingFound, setIsSubmittingFound] = useState(false);

  useEffect(() => {
    SchoolFeatures.sync(username);

    const handleUpdate = () => {
      setItems(SchoolFeatures.getLostFoundItems());
    };
    window.addEventListener('dpsbuzz:campus_updated', handleUpdate);
    return () => window.removeEventListener('dpsbuzz:campus_updated', handleUpdate);
  }, [username]);

  const showToast = (msg: string, type: 'success' | 'danger' = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Stats
  const stats = useMemo(() => {
    const lost = items.filter((i) => i.status === 'LOST').length;
    const found = items.filter((i) => i.status === 'FOUND').length;
    const claimed = items.filter((i) => i.status === 'CLAIMED').length;
    return { lost, found, claimed, total: items.length };
  }, [items]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      const matchesLocation = locationFilter === 'All Locations' || item.location === locationFilter;

      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.reporterName.toLowerCase().includes(q) ||
        (item.finderName && item.finderName.toLowerCase().includes(q)) ||
        item.id.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q);

      return matchesStatus && matchesCategory && matchesLocation && matchesQuery;
    });
  }, [items, statusFilter, categoryFilter, locationFilter, searchQuery]);

  // Image Upload Handler
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WEBP)', 'danger');
      return;
    }

    const preview = URL.createObjectURL(file);
    setReportImage(file);
    setReportImagePreview(preview);
    setIsUploadingPhoto(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'notes');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data && data.url) {
        setUploadedImageUrl(data.url);
        showToast('Photo uploaded to Cloud CDN! 📸', 'success');
      } else {
        showToast('Photo upload failed. Please try again.', 'danger');
        setReportImage(null);
        setReportImagePreview(null);
      }
    } catch {
      showToast('Error uploading photo.', 'danger');
      setReportImage(null);
      setReportImagePreview(null);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setReportImage(null);
    if (reportImagePreview) URL.revokeObjectURL(reportImagePreview);
    setReportImagePreview(null);
    setUploadedImageUrl('');
  };

  // Submit New Lost / Found Report
  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle.trim()) return;

    setIsSubmittingReport(true);
    try {
      const newItem = await SchoolFeatures.reportLostFound({
        title: reportTitle.trim(),
        category: reportCategory,
        status: reportStatus,
        location: reportLocation,
        specificSpot: reportSpot.trim() || reportLocation,
        description: reportDesc.trim() || 'Reported via DPS Buzz Lost & Found Portal',
        imageUrl: uploadedImageUrl || undefined,
        reporterUsername: username,
        reporterName: userFullName,
        reporterClass: userClass,
        reporterSection: userSection,
        urgent: reportStatus === 'LOST',
      });

      setItems((prev) => [newItem, ...prev.filter((i) => i.id !== newItem.id)]);
      setIsReportModalOpen(false);
      setReportTitle('');
      setReportSpot('');
      setReportDesc('');
      handleRemovePhoto();

      showToast(
        `Report ${newItem.id} published as ${newItem.status}! (+10 Spirit Points recorded)`,
        'success'
      );
    } catch {
      showToast('Failed to publish report to Cloud Database.', 'danger');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Handle Classmate clicking "I Found This Item!"
  const handleConfirmFound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFoundModalItem) return;

    setIsSubmittingFound(true);
    try {
      const success = await SchoolFeatures.markItemFound({
        itemId: activeFoundModalItem.id,
        finderUsername: username,
        finderName: userFullName,
        finderClass: finderClass,
        finderSection: finderSection,
        finderNotes: finderNotes.trim() || `Found by ${userFullName} (${finderClass}-${finderSection})`,
      });

      if (success) {
        setItems(SchoolFeatures.getLostFoundItems());
        showToast(
          `🎉 Thank you! Your Class (${finderClass}-${finderSection}) is now visible to the item owner! (+25 Spirit Points)`,
          'success'
        );
      }
      setActiveFoundModalItem(null);
      setFinderNotes('');
    } catch {
      showToast('Error updating item.', 'danger');
    } finally {
      setIsSubmittingFound(false);
    }
  };

  // Handle Owner or Reception Marking as Reunited
  const handleMarkClaimed = async (itemId: string) => {
    const success = await SchoolFeatures.claimLostFound(itemId);
    if (success) {
      setItems(SchoolFeatures.getLostFoundItems());
      showToast('Item marked as Reunited! Handover complete. 🤝', 'success');
    }
  };

  // Direct Message action without follower barriers
  const handleDirectMessage = (targetUser: string, itemTitle: string, itemId: string, isOwner: boolean) => {
    const cleanUser = targetUser.toLowerCase().trim();
    if (!cleanUser) return;

    const introMsg = isOwner
      ? `Hi @${cleanUser}! I saw that you reported "${itemTitle}" (ID: ${itemId}) as lost. I found it! I am in ${userClass}-${userSection}. Let's meet to hand it over!`
      : `Hi @${cleanUser}! Regarding my lost item "${itemTitle}" (ID: ${itemId}) that you found — thank you so much! I am in ${userClass}-${userSection}. Where can I collect it?`;

    router.push(`/chats?user=${encodeURIComponent(cleanUser)}&text=${encodeURIComponent(introMsg)}`);
  };

  return (
    <div className="min-h-screen bg-[var(--surface-sunken)] text-[var(--text)] select-none pb-24">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-full shadow-xl animate-fade-in flex items-center gap-2">
          <Check size={14} />
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-[var(--surface)]/95 border-b border-[var(--line)]">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/home"
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--surface-sunken)] transition-colors"
              aria-label="Back to home"
            >
              <ArrowLeft size={20} />
            </Link>

            {/* School Brand Crest Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-600 text-white flex items-center justify-center font-black shadow-md border border-white/20">
                <span className="text-xs tracking-tighter">DPS</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-[var(--text)]">
                    DPS Buzz <span className="text-blue-500">•</span> Lost & Found
                  </h1>
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live Cloud</span>
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] hidden sm:block">
                  Verified Campus Recovery & Peer Handover Portal • Nursery to Class 10
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-full flex items-center gap-1.5 hover:opacity-95 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Plus size={15} />
              <span>Report Item</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN BODY */}
      <main className="max-w-6xl mx-auto px-4 py-5 space-y-4">
        {/* Reception Desk Hero Card */}
        <div
          className="rounded-2xl p-4 sm:p-5 border bg-gradient-to-br from-blue-500/10 via-[var(--surface)] to-emerald-500/5 shadow-xs relative overflow-hidden"
          style={{ borderColor: 'var(--line)' }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                <ShieldCheck size={16} />
                <span>Instant Class & Section Classroom Discovery</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--text)]">
                Lost an item on campus? Classmates and Office can help.
              </h2>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                When anyone marks an item as found, their <strong className="text-[var(--text)]">Class & Section</strong> are instantly visible to the owner. You can message each other directly to collect your belongings!
              </p>
            </div>

            {/* Quick Counts */}
            <div className="grid grid-cols-3 gap-2 w-full sm:w-auto shrink-0 text-center">
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'LOST' ? 'ALL' : 'LOST')}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  statusFilter === 'LOST'
                    ? 'bg-rose-500/15 border-rose-500/40'
                    : 'bg-[var(--surface)] border-[var(--line)]'
                }`}
              >
                <div className="text-[10px] text-[var(--text-muted)] font-semibold">Missing</div>
                <div className="text-lg font-bold text-rose-500">{stats.lost}</div>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'FOUND' ? 'ALL' : 'FOUND')}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  statusFilter === 'FOUND'
                    ? 'bg-emerald-500/15 border-emerald-500/40'
                    : 'bg-[var(--surface)] border-[var(--line)]'
                }`}
              >
                <div className="text-[10px] text-[var(--text-muted)] font-semibold">Found</div>
                <div className="text-lg font-bold text-emerald-500">{stats.found}</div>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'CLAIMED' ? 'ALL' : 'CLAIMED')}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  statusFilter === 'CLAIMED'
                    ? 'bg-blue-500/15 border-blue-500/40'
                    : 'bg-[var(--surface)] border-[var(--line)]'
                }`}
              >
                <div className="text-[10px] text-[var(--text-muted)] font-semibold">Reunited</div>
                <div className="text-lg font-bold text-blue-500">{stats.claimed}</div>
              </button>
            </div>
          </div>
        </div>

        {/* Search & Location Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="md:col-span-2 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search calculator, water bottle, ID card, location, or student..."
              className="w-full h-10 pl-10 pr-4 text-xs rounded-xl border bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              style={{ borderColor: 'var(--line)' }}
            />
          </div>

          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="h-10 px-3 text-xs rounded-xl border bg-[var(--surface)] text-[var(--text)] focus:outline-none"
            style={{ borderColor: 'var(--line)' }}
          >
            {LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                📍 {loc}
              </option>
            ))}
          </select>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSel = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold transition-all shrink-0 cursor-pointer ${
                  isSel
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--line)]'
                }`}
              >
                <Icon size={13} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* ITEMS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredItems.length === 0 ? (
            <div className="col-span-full py-12 text-center text-xs text-[var(--text-muted)] space-y-3 bg-[var(--surface)] rounded-2xl border border-[var(--line)] p-6">
              <CheckCircle2 size={36} className="mx-auto text-emerald-500 opacity-70" />
              <div className="space-y-1">
                <p className="font-bold text-sm text-[var(--text)]">No items match your search</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Everything reported has either been reunited with its owner or clear of filters.
                </p>
              </div>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isReporterMe = item.reporterUsername === username;
              const isFinderMe = item.finderUsername === username;
              const hasFinder = Boolean(item.finderUsername);

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border bg-[var(--surface)] shadow-2xs hover:border-blue-500/40 transition-all space-y-3 flex flex-col justify-between"
                  style={{ borderColor: 'var(--line)' }}
                >
                  <div className="space-y-2.5">
                    {/* Header badge & status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[var(--surface-sunken)] border border-[var(--line)] text-[var(--text-muted)] font-mono">
                          {item.id}
                        </span>
                        <span className="text-[10px] font-semibold text-[var(--text-muted)]">
                          • {item.category}
                        </span>
                      </div>

                      {/* Status chip */}
                      {item.status === 'LOST' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                          <span>MISSING</span>
                        </span>
                      ) : item.status === 'FOUND' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>FOUND IN OFFICE / CLASS</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                          <CheckCircle2 size={12} />
                          <span>REUNITED</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-[var(--text)] leading-snug">{item.title}</h3>
                    <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Image Preview if attached */}
                    {item.imageUrl && (
                      <div
                        onClick={() => setActivePreviewItem(item)}
                        className="relative w-full h-32 rounded-xl overflow-hidden border border-[var(--line)] bg-[var(--surface-sunken)] cursor-pointer group"
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-2">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-full">
                            <Camera size={11} />
                            <span>Photo Attached • Tap to zoom</span>
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Location detail */}
                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                      <MapPin size={13} className="text-blue-500 shrink-0" />
                      <span className="font-semibold text-[var(--text)]">{item.location}</span>
                      {item.specificSpot && item.specificSpot !== item.location && (
                        <span className="text-[11px]">({item.specificSpot})</span>
                      )}
                    </div>

                    {/* ------------------------------------------------------------- */}
                    {/* INSTANT CLASSROOM MATCH CARD (When someone has found the item) */}
                    {/* ------------------------------------------------------------- */}
                    {hasFinder && (
                      <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/30 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 size={13} />
                            <span>Found by Classmate!</span>
                          </span>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                            {item.finderClass}-{item.finderSection}
                          </span>
                        </div>

                        <div className="text-xs space-y-0.5">
                          <p className="text-[var(--text)]">
                            <strong>Finder:</strong> {item.finderName} (@{item.finderUsername})
                          </p>
                          <p className="text-[11px] text-[var(--text-muted)]">
                            <strong>Classroom Location:</strong> {item.finderClass}, Section {item.finderSection}
                          </p>
                          {item.finderNotes && (
                            <p className="text-[11px] italic text-[var(--text-muted)]">
                              "{item.finderNotes}"
                            </p>
                          )}
                        </div>

                        {/* Direct 1-Click Message Button */}
                        <div className="pt-1 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleDirectMessage(
                                isReporterMe ? item.finderUsername! : item.reporterUsername,
                                item.title,
                                item.id,
                                isFinderMe
                              )
                            }
                            className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                          >
                            <MessageCircle size={13} />
                            <span>
                              {isReporterMe
                                ? `Message Finder (@${item.finderUsername})`
                                : `Message Owner (@${item.reporterUsername})`}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-3 border-t border-[var(--line)] text-xs flex items-center justify-between gap-2">
                    {/* Reporter info */}
                    <div className="text-[11px] text-[var(--text-muted)] truncate">
                      <span>Reported by: </span>
                      <strong className="text-[var(--text)]">{item.reporterName}</strong>
                      <span className="ml-1 text-blue-500 font-semibold">
                        ({item.reporterClass}-{item.reporterSection})
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.status === 'LOST' && !hasFinder && !isReporterMe && (
                        <button
                          type="button"
                          onClick={() => setActiveFoundModalItem(item)}
                          className="px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
                        >
                          I Found This!
                        </button>
                      )}

                      {item.status === 'FOUND' && isReporterMe && (
                        <button
                          type="button"
                          onClick={() => handleMarkClaimed(item.id)}
                          className="px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
                        >
                          Received / Claimed
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* "I FOUND THIS" MODAL (Instantly captures Class & Section for the owner) */}
      {activeFoundModalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <form
            onSubmit={handleConfirmFound}
            className="w-full max-w-md rounded-2xl border bg-[var(--surface)] p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            style={{ borderColor: 'var(--line)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--line)' }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[var(--text)]">I Found This Item!</h2>
                  <p className="text-[11px] text-[var(--text-muted)]">Item ID: {activeFoundModalItem.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveFoundModalItem(null)}
                className="p-1 rounded-full hover:bg-[var(--surface-sunken)] text-[var(--text-muted)] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300">
              <p className="font-semibold mb-0.5">Item: {activeFoundModalItem.title}</p>
              <p className="text-[11px]">
                Owner: {activeFoundModalItem.reporterName} ({activeFoundModalItem.reporterClass}-{activeFoundModalItem.reporterSection})
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1 text-[var(--text)]">Your Class *</label>
                  <select
                    value={finderClass}
                    onChange={(e) => setFinderClass(e.target.value)}
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
                  <label className="font-semibold block mb-1 text-[var(--text)]">Your Section *</label>
                  <select
                    value={finderSection}
                    onChange={(e) => setFinderSection(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border bg-[var(--surface-sunken)] text-[var(--text)] focus:outline-none"
                    style={{ borderColor: 'var(--line)' }}
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="D">Section D</option>
                    <option value="E">Section E</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-[var(--text)]">Handover Note / Where is the item now? *</label>
                <textarea
                  required
                  rows={3}
                  value={finderNotes}
                  onChange={(e) => setFinderNotes(e.target.value)}
                  placeholder="e.g. With me right now in Class 9-B 3rd row, or turned in to Reception Lost & Found shelf..."
                  className="w-full p-3 rounded-xl border bg-[var(--surface-sunken)] text-[var(--text)] text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  style={{ borderColor: 'var(--line)' }}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
              <button
                type="button"
                onClick={() => setActiveFoundModalItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingFound}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:opacity-95 shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {isSubmittingFound ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Updating Cloud...</span>
                  </>
                ) : (
                  <span>Notify Owner & Share Classroom</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* REPORT NEW ITEM MODAL */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <form
            onSubmit={handleCreateReport}
            className="w-full max-w-lg rounded-2xl border bg-[var(--surface)] p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            style={{ borderColor: 'var(--line)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--line)' }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Plus size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[var(--text)]">Report Lost or Found Item</h2>
                  <p className="text-[11px] text-[var(--text-muted)]">Permanent Cloud Database • Visible across all campus devices</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="p-1 rounded-full hover:bg-[var(--surface-sunken)] text-[var(--text-muted)] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Lost or Found Selector */}
              <div>
                <label className="font-semibold block mb-1.5 text-[var(--text)]">Report Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReportStatus('LOST')}
                    className={`py-2 px-3 rounded-xl font-bold border text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      reportStatus === 'LOST'
                        ? 'bg-rose-500/15 border-rose-500 text-rose-500 shadow-xs'
                        : 'bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-muted)]'
                    }`}
                  >
                    <span>🔴 I LOST Something</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReportStatus('FOUND')}
                    className={`py-2 px-3 rounded-xl font-bold border text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      reportStatus === 'FOUND'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-xs'
                        : 'bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-muted)]'
                    }`}
                  >
                    <span>🟢 I FOUND Something</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-[var(--text)]">Item Name / Title *</label>
                <input
                  type="text"
                  required
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="e.g. Casio fx-991EX Scientific Calculator"
                  className="w-full h-9 px-3 rounded-xl border bg-[var(--surface-sunken)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  style={{ borderColor: 'var(--line)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1 text-[var(--text)]">Category</label>
                  <select
                    value={reportCategory}
                    onChange={(e) => setReportCategory(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border bg-[var(--surface-sunken)] text-[var(--text)] focus:outline-none"
                    style={{ borderColor: 'var(--line)' }}
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="ID Cards & Keys">ID Cards & Keys</option>
                    <option value="Water Bottles & Lunchboxes">Water Bottles & Lunchboxes</option>
                    <option value="Uniform & Apparel">Uniform & Apparel</option>
                    <option value="Books & Stationery">Books & Stationery</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-[var(--text)]">Campus Location</label>
                  <select
                    value={reportLocation}
                    onChange={(e) => setReportLocation(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border bg-[var(--surface-sunken)] text-[var(--text)] focus:outline-none"
                    style={{ borderColor: 'var(--line)' }}
                  >
                    <option value="Science Block">Science Block</option>
                    <option value="Library">Library</option>
                    <option value="Cafeteria">Cafeteria</option>
                    <option value="Sports Ground">Sports Ground</option>
                    <option value="Main Reception">Main Reception</option>
                    <option value="Junior Wing (Nursery–5)">Junior Wing (Nursery–5)</option>
                    <option value="Senior Corridors (6–10)">Senior Corridors (6–10)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-[var(--text)]">Specific Spot</label>
                <input
                  type="text"
                  value={reportSpot}
                  onChange={(e) => setReportSpot(e.target.value)}
                  placeholder="e.g. Physics Lab 2, Workbench 4 or Basketball Bleachers"
                  className="w-full h-9 px-3 rounded-xl border bg-[var(--surface-sunken)] text-[var(--text)] focus:outline-none"
                  style={{ borderColor: 'var(--line)' }}
                />
              </div>

              {/* Attach Photo Button */}
              <div>
                <label className="font-semibold block mb-1 text-[var(--text)] flex items-center justify-between">
                  <span>Attach Photo of Item (Optional)</span>
                  <span className="text-[10px] text-blue-500 font-normal">Stored on Cloud CDN</span>
                </label>

                {!reportImagePreview ? (
                  <label className="flex flex-col items-center justify-center p-3.5 rounded-xl border-2 border-dashed border-[var(--line)] hover:border-blue-500/60 bg-[var(--surface-sunken)] cursor-pointer transition-all hover:bg-blue-500/5 group">
                    <div className="flex items-center gap-2 text-blue-500 font-semibold text-xs mb-0.5 group-hover:scale-105 transition-transform">
                      <Camera size={16} />
                      <span>Take Photo or Upload Image</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)]">PNG, JPG up to 10MB</p>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border border-[var(--line)] bg-[var(--surface-sunken)] p-2">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-[var(--line)] bg-black/20">
                        <img src={reportImagePreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0 text-xs">
                        <p className="font-bold text-[var(--text)] truncate">{reportImage?.name || 'Selected photo'}</p>
                        <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                          {isUploadingPhoto ? (
                            <span className="text-amber-500 flex items-center gap-1 font-semibold">
                              <Loader2 size={12} className="animate-spin" /> Uploading to cloud...
                            </span>
                          ) : uploadedImageUrl ? (
                            <span className="text-emerald-500 flex items-center gap-1 font-semibold">
                              <Check size={12} /> Uploaded to Cloud CDN
                            </span>
                          ) : (
                            'Ready'
                          )}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 text-xs font-semibold cursor-pointer"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="font-semibold block mb-1 text-[var(--text)]">Description & Identification Details *</label>
                <textarea
                  required
                  rows={3}
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  placeholder="Describe unique markings, color, brand, stickers, or tags to help identify it..."
                  className="w-full p-3 rounded-xl border bg-[var(--surface-sunken)] text-[var(--text)] text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  style={{ borderColor: 'var(--line)' }}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingReport || isUploadingPhoto}
                className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:opacity-95 shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {isSubmittingReport ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Publishing to Cloud...</span>
                  </>
                ) : (
                  <span>Publish to Campus Database</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FULL-IMAGE PREVIEW MODAL */}
      {activePreviewItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div
            className="w-full max-w-lg rounded-2xl border bg-[var(--surface)] p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col"
            style={{ borderColor: 'var(--line)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--line)' }}>
              <div>
                <h2 className="text-sm font-bold text-[var(--text)]">{activePreviewItem.title}</h2>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Reported by {activePreviewItem.reporterName} ({activePreviewItem.reporterClass}-{activePreviewItem.reporterSection})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePreviewItem(null)}
                className="p-1 rounded-full hover:bg-[var(--surface-sunken)] text-[var(--text-muted)] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {activePreviewItem.imageUrl && (
              <div className="rounded-xl overflow-hidden border border-[var(--line)] bg-black/20 p-1 flex items-center justify-center">
                <img
                  src={activePreviewItem.imageUrl}
                  alt={activePreviewItem.title}
                  className="max-h-80 w-auto object-contain rounded-lg"
                />
              </div>
            )}

            <p className="text-xs text-[var(--text)] leading-relaxed">
              {activePreviewItem.description}
            </p>

            <div className="flex items-center justify-end pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
              <button
                type="button"
                onClick={() => setActivePreviewItem(null)}
                className="px-4 py-1.5 rounded-full bg-blue-600 text-white text-xs font-bold hover:opacity-95 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
