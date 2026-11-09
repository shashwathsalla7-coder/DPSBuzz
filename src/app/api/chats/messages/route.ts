import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/db/d1Supabase';
import { getSession } from '@/lib/auth/session';
import { canAccessConversation } from '@/lib/auth/conversationAccess';
import { sanitizeText } from '@/lib/security';

// Chat history and sending for the browser, stored in Cloudflare D1 (sb_messages).

const supabaseUrl = 'd1'; // data lives in Cloudflare D1
const dbKey = 'd1';
const NO_CACHE = { 'Cache-Control': 'no-store' };

function db() {
  if (!supabaseUrl || !dbKey) return null;
  return createClient(supabaseUrl, dbKey, { auth: { persistSession: false } });
}

function altId(chatId: string) {
  return chatId.includes('__') ? chatId.split('__').reverse().join('__') : chatId;
}

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
  const chatId = req.nextUrl.searchParams.get('chatId') || '';
  if (!chatId) return NextResponse.json({ success: false, error: 'chatId required' }, { status: 400 });
  if (!(await canAccessConversation(chatId, session))) {
    return NextResponse.json({ success: false, error: 'Not a participant' }, { status: 403 });
  }
  const sb = db();
  if (!sb) return NextResponse.json({ success: true, messages: [] }, { headers: NO_CACHE });
  const { data, error } = await sb
    .from('messages')
    .select('*')
    .in('chat_id', [chatId, altId(chatId)])
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, messages: data || [] }, { headers: NO_CACHE });
}

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const chatId = String(body?.chatId || '');
  const clientId = String(body?.clientId || '');
  const text = sanitizeText(body?.text || '', 2000);
  if (!chatId || !clientId || !text) {
    return NextResponse.json({ success: false, error: 'chatId, clientId and text are required' }, { status: 400 });
  }
  if (!(await canAccessConversation(chatId, session))) {
    return NextResponse.json({ success: false, error: 'Not a participant' }, { status: 403 });
  }
  const sb = db();
  if (!sb) return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 });

  // Idempotent retries: if this client_id already exists in this chat, return it.
  const { data: existing } = await sb
    .from('messages')
    .select('id, client_id, chat_id, created_at')
    .eq('client_id', clientId)
    .in('chat_id', [chatId, altId(chatId)])
    .maybeSingle();
  if (existing) return NextResponse.json({ success: true, message: existing }, { headers: NO_CACHE });

  const { data, error } = await sb
    .from('messages')
    .insert([{ chat_id: chatId, sender_id: session.username, text, client_id: clientId }])
    .select();
  if (error) {
    if (error.code === '23505') return NextResponse.json({ success: true, message: { client_id: clientId } });
    return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: 500 });
  }
  return NextResponse.json({ success: true, message: data?.[0] || null }, { headers: NO_CACHE });
}
