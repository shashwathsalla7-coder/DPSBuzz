import { NextRequest, NextResponse } from 'next/server';
import { getServerStore, addServerStory } from '@/lib/serverStore';

export async function GET() {
  try {
    const store = await getServerStore();
    return NextResponse.json({ success: true, stories: store.stories });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { story } = body;
    if (!story || !story.username) {
      return NextResponse.json({ success: false, error: 'Invalid story object' }, { status: 400 });
    }

    const updated = await addServerStory(story);
    return NextResponse.json({ success: true, story, totalStories: updated.stories.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
