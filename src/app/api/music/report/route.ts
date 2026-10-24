// =====================================================
// DPS BUZZ - Music Reporting API Route
// Students can report any inappropriate track
// Admin can view all reports in the admin panel
// =====================================================

import { NextRequest, NextResponse, connection } from 'next/server';
import { MusicReport } from '@/lib/music/types';

let IN_MEMORY_REPORTS: MusicReport[] = [
  {
    id: 'rep-sample-1',
    trackId: 'jamendo:999999',
    trackTitle: 'Suspicious Audio Track',
    trackArtist: 'Unknown',
    reporterUsername: 'student_tester',
    reason: 'Inappropriate lyrics for school',
    createdAt: new Date().toISOString(),
    status: 'pending',
  },
];

export function getInternalReports(): MusicReport[] {
  return IN_MEMORY_REPORTS;
}

export function updateInternalReportStatus(reportId: string, status: 'resolved' | 'dismissed') {
  IN_MEMORY_REPORTS = IN_MEMORY_REPORTS.map((r) => (r.id === reportId ? { ...r, status } : r));
}

export async function GET(request: NextRequest) {
  await connection();
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get('username') || '';
  const isAdmin = searchParams.get('isAdmin') === 'true';

  // Privacy protection: Regular students can only see their own reports
  if (!isAdmin) {
    const studentReports = IN_MEMORY_REPORTS.filter((r) => r.reporterUsername.toLowerCase() === username.toLowerCase());
    return NextResponse.json({ reports: studentReports }, { status: 200 });
  }

  // Admin sees all reports
  return NextResponse.json({ reports: IN_MEMORY_REPORTS }, { status: 200 });
}

export async function POST(request: NextRequest) {
  await connection();
  try {
    const body = await request.json();
    const { trackId, trackTitle, trackArtist, reporterUsername, reason } = body;

    if (!trackId || !reason) {
      return NextResponse.json({ error: 'Missing trackId or reason' }, { status: 400 });
    }

    const newReport: MusicReport = {
      id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      trackId,
      trackTitle: trackTitle || 'Unknown Track',
      trackArtist: trackArtist || 'Unknown Artist',
      reporterUsername: reporterUsername || 'anonymous_student',
      reason: reason.trim(),
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    IN_MEMORY_REPORTS = [newReport, ...IN_MEMORY_REPORTS];

    return NextResponse.json(
      {
        success: true,
        message: 'Report submitted. Our school moderation team will review this track.',
        reportId: newReport.id,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to submit report' }, { status: 500 });
  }
}
