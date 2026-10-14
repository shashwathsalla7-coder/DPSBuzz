import { NextRequest, NextResponse } from 'next/server';
import { getServerStore, upsertServerProfile } from '@/lib/serverStore';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username')?.toLowerCase()?.trim();
    const store = getServerStore();

    if (!username) {
      return NextResponse.json({ success: true, profiles: store.profiles });
    }

    const match = store.profiles.find((p) => p.username.toLowerCase() === username);
    if (!match) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, profile: match });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profile } = body;
    if (!profile || !profile.username) {
      return NextResponse.json({ success: false, error: 'Invalid profile object' }, { status: 400 });
    }

    upsertServerProfile(profile);
    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
