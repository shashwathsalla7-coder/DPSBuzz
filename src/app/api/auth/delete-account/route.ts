import { NextRequest, NextResponse } from 'next/server';
import { deleteServerAccount } from '@/lib/serverStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username } = body;

    if (!username || typeof username !== 'string') {
      return NextResponse.json({ success: false, error: 'Username is required' }, { status: 400 });
    }

    const updated = await deleteServerAccount(username);
    return NextResponse.json({
      success: true,
      message: `Account @${username} and all content permanently deleted from server.`,
      remainingProfiles: updated.profiles.length,
    });
  } catch (error: any) {
    console.error('Error deleting server account:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to delete account' }, { status: 500 });
  }
}
