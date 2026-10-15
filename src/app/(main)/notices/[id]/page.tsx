'use client';

import { use, Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, FileText, Download, Share2, Eye, FileQuestion } from 'lucide-react';
import { DataStore, type Notice } from '@/lib/dataStore';
import { colors } from '@/config/tokens';

export default function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-500">Loading notice...</div>}>
      <NoticeDetailContent params={params} />
    </Suspense>
  );
}

function dataUrlToBlob(dataUrl: string): Blob {
  try {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/pdf';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch {
    return new Blob([dataUrl], { type: 'application/pdf' });
  }
}

function NoticeDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    DataStore.markNoticeAsRead(id);
    const list = DataStore.getNotices();
    const found = list.find((n) => n.id === id);

    if (found) {
      setNotice(found);
      setLoading(false);
    } else {
      // Attempt to fetch from server API
      fetch(`/api/notices?id=${encodeURIComponent(id)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.notice) {
            setNotice(data.notice);
          } else {
            setNotFound(true);
          }
        })
        .catch(() => {
          setNotFound(true);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
        Loading notice...
      </div>
    );
  }

  if (notFound || !notice) {
    return (
      <div className="min-h-dvh pb-20 select-none">
        <div
          className="flex items-center px-4 h-14 border-b sticky top-0 z-20"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--line)',
          }}
        >
          <Link href="/notices" className="w-9 h-9 flex items-center justify-center btn-press" style={{ color: 'var(--text)' }}>
            <ArrowLeft size={20} />
          </Link>
          <div className="text-xs font-bold uppercase tracking-wider ml-2" style={{ color: 'var(--text-muted)' }}>
            Notice Not Found
          </div>
        </div>
        <main className="p-8 max-w-[480px] mx-auto text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-[var(--surface-sunken)] border border-[var(--line)] flex items-center justify-center mx-auto text-amber-500">
            <FileQuestion size={28} />
          </div>
          <h1 className="text-base font-bold" style={{ color: 'var(--text)' }}>
            This notice is no longer available
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            The school circular you are looking for may have expired, been updated, or was removed by the admin office.
          </p>
          <div className="pt-2">
            <Link
              href="/notices"
              className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-full btn-press"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--on-primary)',
              }}
            >
              Back to Notice Board
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const catKey = (notice.category || 'urgent').toLowerCase();
  const map = colors.notices as Record<string, { light: string; dark: string }>;
  const catColor = map[catKey]?.light || colors.light.primary;

  const handleDownloadPdf = () => {
    if (!notice.pdfUrl) {
      alert('Attachment file is not available.');
      return;
    }

    const downloadFileName = notice.pdfName || `school_circular_${notice.id}.pdf`;

    if (notice.pdfUrl.startsWith('data:application/pdf') || notice.pdfUrl.startsWith('data:')) {
      const blob = dataUrlToBlob(notice.pdfUrl);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } else {
      const a = document.createElement('a');
      a.href = notice.pdfUrl;
      a.download = downloadFileName;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleViewPdf = () => {
    if (!notice.pdfUrl) return;

    if (notice.pdfUrl.startsWith('data:application/pdf') || notice.pdfUrl.startsWith('data:')) {
      const blob = dataUrlToBlob(notice.pdfUrl);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } else {
      window.open(notice.pdfUrl, '_blank');
    }
  };

  return (
    <div className="min-h-dvh pb-20 select-none">
      {/* Top Bar */}
      <div
        className="flex items-center justify-between px-4 h-14 border-b sticky top-0 z-20"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--line)',
        }}
      >
        <Link href="/notices" className="w-9 h-9 flex items-center justify-center btn-press" style={{ color: 'var(--text)' }}>
          <ArrowLeft size={20} />
        </Link>
        <div className="text-xs font-bold uppercase tracking-wider" style={{ color: catColor }}>
          Official Circular
        </div>
        <button
          onClick={() => {
            if (typeof navigator !== 'undefined' && navigator.share) {
              navigator.share({
                title: notice.title,
                text: (notice.content || '').slice(0, 100),
                url: window.location.href,
              }).catch(() => {});
            } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
              navigator.clipboard.writeText(window.location.href);
              alert('Notice link copied to clipboard! 📋');
            } else {
              alert('Notice shared! 📢');
            }
          }}
          className="w-9 h-9 flex items-center justify-center btn-press cursor-pointer"
          style={{ color: 'var(--text-muted)' }}
          aria-label="Share notice"
        >
          <Share2 size={18} />
        </button>
      </div>

      {/* Notice Detail Content */}
      <main className="p-4 max-w-[480px] mx-auto space-y-4">
        <article
          className="p-5 border space-y-4 rounded-xl"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--line)',
            borderLeftWidth: '4px',
            borderLeftColor: catColor,
          }}
        >
          {/* Metadata */}
          <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
            <span className="font-bold tracking-wider uppercase" style={{ color: catColor }}>
              {notice.category}
            </span>
            <span className="tabular-nums">{notice.date}</span>
          </div>

          {/* Title */}
          <h1
            className="text-xl font-bold tracking-[-0.02em] leading-[1.15]"
            style={{
              fontFamily: "var(--font-cabinet), 'Cabinet Grotesk', sans-serif",
              color: 'var(--text)',
            }}
          >
            {notice.title}
          </h1>

          <div className="text-xs pb-3 border-b" style={{ borderColor: 'var(--line)', color: 'var(--text-muted)' }}>
            Published by Admin Office • Dilsukhnagar Public School
          </div>

          {/* Body */}
          <div className="text-sm leading-relaxed whitespace-pre-line space-y-3" style={{ color: 'var(--text)' }}>
            {notice.content}
          </div>

          {/* Attachments Section - STRICTLY ONLY SHOWN IF REAL ATTACHMENT EXISTS */}
          {notice.hasAttachment && (notice.pdfUrl || notice.pdfName) && (
            <div className="pt-3 border-t space-y-2" style={{ borderColor: 'var(--line)' }}>
              <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Attached Documents
              </div>
              <div
                className="p-3 border flex items-center justify-between text-xs rounded-xl"
                style={{
                  backgroundColor: 'var(--surface-sunken)',
                  borderColor: 'var(--line)',
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 border border-red-500/20">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-xs truncate" style={{ color: 'var(--text)' }}>
                      {notice.pdfName || 'school_circular.pdf'}
                    </div>
                    <div className="text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                      {notice.pdfSize || 'Official PDF'} • Official School Circular
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {notice.pdfUrl && (
                    <button
                      type="button"
                      onClick={handleViewPdf}
                      className="px-2.5 h-8 border rounded-lg flex items-center gap-1.5 text-xs font-semibold btn-press cursor-pointer hover:bg-[var(--surface)] transition-colors"
                      style={{
                        borderColor: 'var(--line)',
                        backgroundColor: 'var(--surface)',
                        color: 'var(--text)',
                      }}
                      title="View PDF Document"
                    >
                      <Eye size={13} />
                      <span>View</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="w-8 h-8 border rounded-lg flex items-center justify-center btn-press cursor-pointer shrink-0 shadow-xs"
                    style={{
                      borderColor: 'var(--primary)',
                      backgroundColor: 'var(--primary)',
                      color: 'var(--on-primary)',
                    }}
                    aria-label="Download attachment"
                    title="Download Attached PDF"
                  >
                    <Download size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mark as Seen confirmation */}
          <div
            className="p-3 border flex items-center gap-2 text-xs rounded-lg"
            style={{
              backgroundColor: 'var(--primary-tint)',
              borderColor: 'var(--primary)',
              color: 'var(--primary)',
            }}
          >
            <CheckCircle2 size={16} />
            <span className="font-semibold">Recorded as seen on your student account</span>
          </div>
        </article>
      </main>
    </div>
  );
}
