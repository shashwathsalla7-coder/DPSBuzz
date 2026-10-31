import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawFolder = searchParams.get('folder') || 'reels';
    const folder = ['posts', 'stories', 'avatars', 'groups', 'notices', 'reels', 'videos'].includes(rawFolder)
      ? rawFolder
      : 'reels';

    const cloud_name = process.env.CLOUDINARY_CLOUD_NAME || 'ogfaxmjw';
    const api_key = process.env.CLOUDINARY_API_KEY || '585871931796836';
    const api_secret = process.env.CLOUDINARY_API_SECRET || 'Fpudf-0uhRPjKpFdmQzOiXZTh1M';

    cloudinary.config({
      cloud_name,
      api_key,
      api_secret,
      secure: true,
    });

    const timestamp = Math.round(Date.now() / 1000);
    const targetFolder = `dpsbuzz/${folder}`;
    const signature = cloudinary.utils.api_sign_request({ folder: targetFolder, timestamp }, api_secret);

    return NextResponse.json({
      success: true,
      cloudName: cloud_name,
      apiKey: api_key,
      timestamp,
      folder: targetFolder,
      signature,
      videoUploadUrl: `https://api.cloudinary.com/v1_1/${cloud_name}/video/upload`,
      imageUploadUrl: `https://api.cloudinary.com/v1_1/${cloud_name}/auto/upload`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
