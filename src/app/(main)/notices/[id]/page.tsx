'use client';

import { use, Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, FileText, Download, Share2 } from 'lucide-react';
import { DataStore, type Notice } from '@/lib/dataStore';
import { colors } from '@/config/tokens';

export default function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-500">Loading notice...</div>}>
      <NoticeDetailContent params={params} />
    </Suspense>
  );
}

function NoticeDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isMarkedSeen, setIsMarkedSeen] = useState(true);

  useEffect(() => {
    DataStore.markNoticeAsRead(id);
    const list = DataStore.getNotices();
    const found = list.find((n) => n.id === id);
    if (found) {
      setNotice(found);
    } else {
      setNotice({
        id,
        title: 'Morning assembly timing adjusted for sports day march-past',
        content:
          'Morning assembly starts 15 minutes early tomorrow for sports day march-past rehearsal. All students from Class 6 to Class 10 must assemble on the senior turf ground by 7:45 AM sharp in complete white uniform and PT shoes.\n\nAttendance will be recorded directly on the field. Students exempt on medical grounds must report to Room 104 with a signed slip from their class teacher.',
        category: 'urgent',
        isUrgent: true,
        pinned: true,
        date: 'Today, 8:15 AM',
        seenBy: 343,
        hasAttachment: true,
      });
    }
  }, [id]);

  if (!notice) {
    return (
      <div className="p-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
        Loading notice...
      </div>
    );
  }

  const catKey = (notice.category || 'urgent').toLowerCase();
  const map = colors.notices as Record<string, { light: string; dark: string }>;
  const catColor = map[catKey]?.light || colors.light.primary;

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

      {/* Notice Detail Content (DESIGN.md Section 9.5) */}
      <main className="p-4 max-w-[480px] mx-auto space-y-4">
        <article
          className="p-5 border space-y-4"
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

          {/* Title in title size (22/28) */}
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

          {/* Body in body-l (16px) with 24px line height */}
          <div className="text-sm leading-relaxed whitespace-pre-line space-y-3" style={{ color: 'var(--text)' }}>
            {notice.content}
          </div>

          {/* Attachments Section */}
          <div className="pt-3 border-t space-y-2" style={{ borderColor: 'var(--line)' }}>
            <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Attached Documents
            </div>
            <div
              className="p-3 border flex items-center justify-between text-xs"
              style={{
                backgroundColor: 'var(--surface-sunken)',
                borderColor: 'var(--line)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <FileText size={18} style={{ color: 'var(--primary)' }} />
                <div>
                  <div className="font-semibold" style={{ color: 'var(--text)' }}>
                    circular_march_past_instructions.pdf
                  </div>
                  <div className="text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                    142 KB • Official PDF
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const pdfHeader = `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>/Contents 4 0 R>>endobj\n4 0 obj<</Length 120>>stream\nBT /F1 14 Tf 72 720 Td (DILSUKHNAGAR PUBLIC SCHOOL) Tj ET\nBT /F1 10 Tf 72 690 Td (Official Notice: ${notice.title.replace(/[()]/g, '')}) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000215 00000 n \ntrailer<</Size 5/Root 1 0 R>>\nstartxref\n386\n%%EOF`;
                  const blob = new Blob([pdfHeader], { type: 'application/pdf' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `circular_${notice.id || 'official'}.pdf`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }}
                className="w-8 h-8 border flex items-center justify-center btn-press cursor-pointer"
                style={{
                  borderColor: 'var(--line-strong)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--primary)',
                }}
                aria-label="Download attachment"
              >
                <Download size={14} />
              </button>
            </div>
          </div>

          {/* Mark as Seen confirmation */}
          <div
            className="p-3 border flex items-center gap-2 text-xs"
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
