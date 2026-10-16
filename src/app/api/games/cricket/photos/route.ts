import { NextRequest, NextResponse } from 'next/server';
import {
  searchWikimediaCricketerPhoto,
  CricketerImageMeta,
} from '@/lib/cricketPhotoService';

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id') || '';
    const name = searchParams.get('name') || id;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Player name or ID is required' },
        { status: 400 }
      );
    }

    const photoMeta = await searchWikimediaCricketerPhoto(name, id);
    return NextResponse.json(
      { success: true, meta: photoMeta },
      { headers: CACHE_HEADERS }
    );
  } catch (err: any) {
    console.error('[API Cricket Photos] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const players: Array<{ id: string; name: string }> = body.players || [];

    if (!Array.isArray(players) || players.length === 0) {
      return NextResponse.json(
        { success: false, error: 'players array required' },
        { status: 400 }
      );
    }

    // Limit batch size to 30 to prevent Wikimedia API rate limits
    const slice = players.slice(0, 30);
    const results: Record<string, CricketerImageMeta> = {};

    await Promise.all(
      slice.map(async (p) => {
        try {
          const meta = await searchWikimediaCricketerPhoto(p.name, p.id);
          if (meta) {
            results[p.id] = meta;
          }
        } catch {
          // Continue with remaining players
        }
      })
    );

    return NextResponse.json(
      { success: true, photos: results },
      { headers: CACHE_HEADERS }
    );
  } catch (err: any) {
    console.error('[API Cricket Photos] Batch Error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
