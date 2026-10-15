import { NextRequest, NextResponse } from 'next/server';
import { getServerStore, addServerStory } from '@/lib/serverStore';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET() {
  try {
    const store = await getServerStore();
    return NextResponse.json({ success: true, stories: store.stories }, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { story } = body;
    if (!story || !story.username) {
      return NextResponse.json({ success: false, error: 'Invalid story object' }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    const updated = await addServerStory(story);
    return NextResponse.json({ success: true, story, totalStories: updated.stories.length }, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
