import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { isCloudinaryConfigured } from '@/lib/cloudinary';

const ALLOWED_FOLDERS = ['posts', 'stories', 'avatars', 'groups', 'notices'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB

// Helper to configure Cloudinary dynamically
function ensureCloudinary() {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME || 'ogfaxmjw';
  const api_key = process.env.CLOUDINARY_API_KEY || '585871931796836';
  const api_secret = process.env.CLOUDINARY_API_SECRET || 'Fpudf-0uhRPjKpFdmQzOiXZTh1M';

  if (cloud_name && api_key && api_secret) {
    cloudinary.config({
      cloud_name,
      api_key,
      api_secret,
      secure: true,
    });
    return true;
  }
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let buffer: Buffer | null = null;
    let mimeType = 'image/jpeg';
    let folder = 'posts';
    let filename = '';

    // 1. Handle Multipart / FormData Uploads
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const rawFolder = (formData.get('folder') as string) || 'posts';
      folder = ALLOWED_FOLDERS.includes(rawFolder) ? rawFolder : 'posts';

      if (!file) {
        return NextResponse.json({ success: false, error: 'No file provided in form data' }, { status: 400 });
      }

      mimeType = file.type.toLowerCase() || 'image/jpeg';
      if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        return NextResponse.json({ success: false, error: 'File format not supported' }, { status: 400 });
      }

      const maxAllowed = mimeType === 'application/pdf' ? MAX_PDF_BYTES : MAX_IMAGE_BYTES;
      if (file.size > maxAllowed) {
        return NextResponse.json(
          { success: false, error: `File size exceeds ${(maxAllowed / (1024 * 1024)).toFixed(0)}MB limit` },
          { status: 413 }
        );
      }

      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
      filename = file.name || `upload_${Date.now()}.jpg`;
    } else {
      // 2. Handle JSON with Base64 Data URL
      const body = await req.json();
      const { dataUrl, folder: rawFolder = 'posts', filename: customFilename } = body;
      folder = ALLOWED_FOLDERS.includes(rawFolder) ? rawFolder : 'posts';

      if (!dataUrl || typeof dataUrl !== 'string') {
        return NextResponse.json({ success: false, error: 'No valid dataUrl provided' }, { status: 400 });
      }

      const matches = dataUrl.match(/^data:([A-Za-z0-9-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return NextResponse.json({ success: false, error: 'Invalid base64 Data URL format' }, { status: 400 });
      }

      mimeType = matches[1].toLowerCase();
      if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        return NextResponse.json({ success: false, error: 'File format not supported' }, { status: 400 });
      }

      buffer = Buffer.from(matches[2], 'base64');
      const maxAllowed = mimeType === 'application/pdf' ? MAX_PDF_BYTES : MAX_IMAGE_BYTES;
      if (buffer.length > maxAllowed) {
        return NextResponse.json(
          { success: false, error: `File size exceeds ${(maxAllowed / (1024 * 1024)).toFixed(0)}MB limit` },
          { status: 413 }
        );
      }
      filename = customFilename || `upload_${Date.now()}.jpg`;
    }

    if (!buffer) {
      return NextResponse.json({ success: false, error: 'Failed to read upload buffer' }, { status: 400 });
    }

    // 3. Primary Persistence: Upload directly to Cloudinary (zero local disk dependency)
    const hasCloudinary = ensureCloudinary();
    if (hasCloudinary) {
      try {
        const base64DataUri = `data:${mimeType};base64,${buffer.toString('base64')}`;
        const uploadResult = await cloudinary.uploader.upload(base64DataUri, {
          folder: `dpsbuzz/${folder}`,
          resource_type: mimeType.includes('pdf') ? 'raw' : 'image',
          fetch_format: 'auto',
          quality: 'auto',
        });

        if (uploadResult?.secure_url) {
          return NextResponse.json({
            success: true,
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            sizeBytes: buffer.length,
            provider: 'cloudinary',
          });
        }
      } catch (cloudErr: any) {
        console.warn('Direct Cloudinary upload notice:', cloudErr?.message);
      }
    }

    // 4. Secondary Fallback: Local filesystem (Only in development where disk is writable)
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', folder);
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const isPdf = mimeType.includes('pdf');
      const ext = isPdf ? 'pdf' : mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
      const cleanName = `${folder}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const filePath = path.join(uploadsDir, cleanName);
      fs.writeFileSync(filePath, buffer);

      return NextResponse.json({
        success: true,
        url: `/uploads/${folder}/${cleanName}`,
        sizeBytes: buffer.length,
        provider: 'local',
      });
    } catch (diskErr: any) {
      // In serverless / read-only containers, return a safe data URI so posting never breaks!
      const dataUri = `data:${mimeType};base64,${buffer.toString('base64')}`;
      return NextResponse.json({
        success: true,
        url: dataUri,
        sizeBytes: buffer.length,
        provider: 'embedded',
      });
    }
  } catch (error: any) {
    console.error('Error handling upload:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process file upload' },
      { status: 500 }
    );
  }
}
