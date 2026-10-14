import { NextRequest, NextResponse } from 'next/server';
import { getPresignedReadUrl } from '@/lib/r2';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { keys } = body as { keys: string[] };

    if (!Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json({ success: true, signedUrls: {} });
    }

    // Limit to max 50 keys per batch request
    const cappedKeys = keys.slice(0, 50);
    const signedUrls: Record<string, string> = {};

    await Promise.all(
      cappedKeys.map(async (key) => {
        if (key && typeof key === 'string') {
          try {
            signedUrls[key] = await getPresignedReadUrl(key);
          } catch (err) {
            console.error(`Failed to sign read URL for key ${key}:`, err);
            signedUrls[key] = '';
          }
        }
      })
    );

    return NextResponse.json({
      success: true,
      signedUrls,
    });
  } catch (error: any) {
    console.error('Error generating signed read URLs:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to sign read URLs' },
      { status: 500 }
    );
  }
}
