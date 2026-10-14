import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    // Handle FormData
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const folder = (formData.get('folder') as string) || 'posts';

      if (!file) {
        return NextResponse.json({ success: false, error: 'No file provided in form data' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', folder);
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const extension = file.type.includes('png') ? 'png' : file.type.includes('webp') ? 'webp' : 'jpg';
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
    const { dataUrl, folder = 'posts', filename: customFilename } = body;

    if (!dataUrl || typeof dataUrl !== 'string') {
      return NextResponse.json({ success: false, error: 'No valid dataUrl provided' }, { status: 400 });
    }

    // Parse base64
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return NextResponse.json({ success: false, error: 'Invalid base64 Data URL format' }, { status: 400 });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', folder);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const extension = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
    const filename = customFilename || `${folder}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;
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
