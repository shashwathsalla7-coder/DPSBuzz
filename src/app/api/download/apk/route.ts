import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const apkPath = path.join(process.cwd(), 'public', 'downloads', 'DPS_Buzz.apk');

  if (!fs.existsSync(apkPath)) {
    return new NextResponse('APK not found', { status: 404 });
  }

  const stat = fs.statSync(apkPath);
  const fileStream = fs.createReadStream(apkPath);

  // Convert Node readable stream to Web ReadableStream
  const stream = new ReadableStream({
    start(controller) {
      fileStream.on('data', (chunk) => {
        controller.enqueue(chunk);
      });
      fileStream.on('end', () => {
        controller.close();
      });
      fileStream.on('error', (err) => {
        controller.error(err);
      });
    },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Length': stat.size.toString(),
      'Content-Disposition': 'attachment; filename="DPS_Buzz.apk"',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
