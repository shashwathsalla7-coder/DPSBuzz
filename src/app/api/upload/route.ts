import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ALLOWED_FOLDERS = ['posts', 'stories', 'avatars', 'groups', 'notices'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    // Handle FormData
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const rawFolder = (formData.get('folder') as string) || 'posts';
      const folder = ALLOWED_FOLDERS.includes(rawFolder) ? rawFolder : 'posts';

      if (!file) {
        return NextResponse.json({ success: false, error: 'No file provided in form data' }, { status: 400 });
      }

      // MIME Type check
      const mime = file.type.toLowerCase();
      if (!ALLOWED_MIME_TYPES.includes(mime)) {
        return NextResponse.json({ success: false, error: 'File format not supported' }, { status: 400 });
      }

      // File size check
      const maxAllowed = mime === 'application/pdf' ? MAX_PDF_BYTES : MAX_IMAGE_BYTES;
      if (file.size > maxAllowed) {
        return NextResponse.json(
          { success: false, error: `File size exceeds ${(maxAllowed / (1024 * 1024)).toFixed(0)}MB limit` },
          { status: 413 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', folder);
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const isPdf = mime.includes('pdf') || file.name.toLowerCase().endsWith('.pdf');
      const extension = isPdf ? 'pdf' : mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
      const filename = `${folder}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;
      const filePath = path.join(uploadsDir, filename);

      fs.writeFileSync(filePath, buffer);
      const publicUrl = `/uploads/${folder}/${filename}`;

      return NextResponse.json({
        success: true,
        url: publicUrl,
        sizeBytes: buffer.length,
      });
    }

    // Handle JSON body with base64 Data URL
    const body = await req.json();
    const { dataUrl, folder: rawFolder = 'posts', filename: customFilename } = body;
    const folder = ALLOWED_FOLDERS.includes(rawFolder) ? rawFolder : 'posts';

    if (!dataUrl || typeof dataUrl !== 'string') {
      return NextResponse.json({ success: false, error: 'No valid dataUrl provided' }, { status: 400 });
    }

    // Parse base64
    const matches = dataUrl.match(/^data:([A-Za-z0-9-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return NextResponse.json({ success: false, error: 'Invalid base64 Data URL format' }, { status: 400 });
    }

    const mimeType = matches[1].toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json({ success: false, error: 'File format not supported' }, { status: 400 });
    }

    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const maxAllowed = mimeType === 'application/pdf' ? MAX_PDF_BYTES : MAX_IMAGE_BYTES;
    if (buffer.length > maxAllowed) {
      return NextResponse.json(
        { success: false, error: `File size exceeds ${(maxAllowed / (1024 * 1024)).toFixed(0)}MB limit` },
        { status: 413 }
      );
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', folder);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const isPdf = mimeType.includes('pdf');
    const extension = isPdf ? 'pdf' : mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
    const filename = customFilename ? path.basename(customFilename).replace(/[^a-zA-Z0-9._-]/g, '') : `${folder}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, buffer);
    const publicUrl = `/uploads/${folder}/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      sizeBytes: buffer.length,
    });
  } catch (error: any) {
    console.error('Error handling local upload:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process file upload' },
      { status: 500 }
    );
  }
}
