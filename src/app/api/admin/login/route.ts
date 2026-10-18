import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '71845shashwath123';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ success: false, error: 'Password is required' }, { status: 400 });
    }

    // Explicitly reject common school invite codes
    const trimmed = password.trim();
    if (trimmed.toUpperCase() === 'DPS71845' || trimmed === '71845') {
      return NextResponse.json(
        { success: false, error: 'Access denied: The school invite code cannot be used as an administrator password.' },
        { status: 403 }
      );
    }

    // Verify true admin password
    if (trimmed !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, error: 'Incorrect administrator password. Access restricted to Admin ID: @shashwath71845.' },
        { status: 401 }
      );
    }

    const adminUser = {
      id: 'admin-shashwath-id',
      username: 'shashwath71845',
      fullName: 'Shashwath Salla',
      role: 'admin',
      avatar: null,
      isVerified: true,
      isApproved: true,
      class: 'Staff',
      section: 'Admin',
    };

    const res = NextResponse.json({
      success: true,
      user: adminUser,
    });

    // Set secure admin session cookie
    const adminSessionToken = Buffer.from(
      JSON.stringify({
        id: adminUser.id,
        username: adminUser.username,
        role: 'admin',
        issuedAt: Date.now(),
      })
    ).toString('base64');

    res.cookies.set('dpsbuzz_admin_session', adminSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    const publicAdminCookie = encodeURIComponent(
      JSON.stringify({ id: adminUser.id, username: adminUser.username, role: 'admin' })
    );
    res.cookies.set('dpsbuzz_user', publicAdminCookie, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Admin authentication failed' },
      { status: 500 }
    );
  }
}
