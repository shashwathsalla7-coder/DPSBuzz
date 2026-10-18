import { NextRequest, NextResponse } from 'next/server';
import { addServerReport, getServerReports } from '@/lib/serverStore';

export async function GET(req: NextRequest) {
  try {
    const reports = await getServerReports();
    return NextResponse.json({ success: true, reports });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, targetUser, reporterUsername, reporterReason, contentSnippet, urgency } = body;

    if (!targetUser || !reporterReason) {
      return NextResponse.json(
        { success: false, error: 'targetUser and reporterReason are required' },
        { status: 400 }
      );
    }

    const report = await addServerReport({
      type: type || 'message',
      targetUser: targetUser.toLowerCase().trim(),
      reporterUsername: (reporterUsername || 'anonymous').toLowerCase().trim(),
      reporterReason,
      contentSnippet: contentSnippet || '',
      urgency: urgency || 'medium',
    });

    console.log('[MODERATION] Safety report logged:', report);

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    console.error('Failed to save safety report:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
