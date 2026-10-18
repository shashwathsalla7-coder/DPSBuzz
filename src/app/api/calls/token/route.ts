import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const ZEGO_APP_ID = Number(process.env.NEXT_PUBLIC_ZEGO_APP_ID || 1507772247);
// Server secret is kept strictly on server and never sent to browser
const ZEGO_SERVER_SECRET = process.env.ZEGO_SERVER_SECRET || process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET || 'fe6c00049754ab7ecdfc745c7c3b0dd3';

/**
 * Server-side ZEGOCLOUD kitToken generator.
 * Encrypts payload with AES-256-CBC, packing binary buffer identical to ZEGOCLOUD UIKit format.
 */
function generateServerZegoToken(
  appId: number,
  serverSecret: string,
  roomId: string,
  userId: string,
  userName: string,
  expireSeconds = 7200
): string {
  const now = Math.floor(Date.now() / 1000);
  const expire = now + expireSeconds;
  const nonce = Math.floor(Math.random() * 2147483647);

  const payload = JSON.stringify({
    app_id: appId,
    user_id: userId,
    nonce,
    ctime: now,
    expire,
  });

  let iv = Math.random().toString().substring(2, 18);
  while (iv.length < 16) {
    iv += iv.substring(0, 16 - iv.length);
  }

  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(serverSecret, 'utf8'), Buffer.from(iv, 'utf8'));
  const encrypted = Buffer.concat([cipher.update(payload, 'utf8'), cipher.final()]);

  const buf = Buffer.alloc(28 + encrypted.length);
  buf.writeUInt32BE(0, 0);
  buf.writeUInt32BE(expire, 4);
  buf.writeUInt16BE(iv.length, 8);
  Buffer.from(iv, 'utf8').copy(buf, 10);
  buf.writeUInt16BE(encrypted.length, 26);
  encrypted.copy(buf, 28);

  const token04 = '04' + buf.toString('base64');
  const meta = Buffer.from(
    JSON.stringify({
      userID: userId,
      roomID: roomId,
      userName: encodeURIComponent(userName),
      appID: appId,
    })
  ).toString('base64');

  return `${token04}#${meta}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId') || searchParams.get('roomID');
    const userId = searchParams.get('userId') || searchParams.get('userID');
    const userName = searchParams.get('userName') || searchParams.get('username') || userId;

    if (!roomId || !userId) {
      return NextResponse.json({ success: false, error: 'roomId and userId are required' }, { status: 400 });
    }

    const token = generateServerZegoToken(
      ZEGO_APP_ID,
      ZEGO_SERVER_SECRET,
      roomId,
      userId,
      userName || userId
    );

    return NextResponse.json({
      success: true,
      token,
      appID: ZEGO_APP_ID,
    });
  } catch (error: any) {
    console.error('Failed to generate call token (GET):', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Token generation failed' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomId, userId, userName } = body;

    if (!roomId || !userId) {
      return NextResponse.json({ success: false, error: 'roomId and userId are required' }, { status: 400 });
    }

    // Generate secure token on server
    const token = generateServerZegoToken(
      ZEGO_APP_ID,
      ZEGO_SERVER_SECRET,
      roomId,
      userId,
      userName || userId
    );

    return NextResponse.json({
      success: true,
      token,
      appID: ZEGO_APP_ID,
    });
  } catch (error: any) {
    console.error('Failed to generate call token:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Token generation failed' },
      { status: 500 }
    );
  }
}
