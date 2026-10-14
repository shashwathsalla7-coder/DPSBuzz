import { NextRequest, NextResponse } from 'next/server';
import {
  generateCloudinaryUploadSignature,
  isCloudinaryConfigured,
  type MediaFolder,
} from '@/lib/cloudinary';

// In-memory rate limiter: max 25 presigned upload tokens per 10 minutes per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return true;
  }

  if (record.count >= 25) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // 1. Rate limit check
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: 'Too many upload requests. Please wait a few minutes before trying again.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { folder, contentType, fileSize, entityId, userRole, currentStorageGB } = body as {
      folder: MediaFolder;
      contentType: string;
      fileSize: number;
      entityId?: string;
      userRole?: string;
      currentStorageGB?: number;
    };

    // 2. Folder validation
    const allowedFolders: MediaFolder[] = ['posts', 'stories', 'avatars', 'groups', 'notices'];
    if (!allowedFolders.includes(folder)) {
      return NextResponse.json(
        { success: false, error: 'Invalid media destination folder' },
        { status: 400 }
      );
    }

    // 3. Storage Lock Check (Hard limit at 20.0 GB for Cloudinary 25 GB Free Tier - No Card Required)
    const headerStorageGB = req.headers.get('x-dpsbuzz-storage-gb');
    let reportedStorageGB = currentStorageGB !== undefined
      ? currentStorageGB
      : headerStorageGB ? Number(headerStorageGB) : undefined;
    const defaultLockThresholdGB = Number(
      process.env.MEDIA_STORAGE_LOCK_GB || process.env.CLOUDINARY_STORAGE_LOCK_GB || '20.0'
    );
    let lockThresholdGB = defaultLockThresholdGB;

    // Optional Supabase DB live check if configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();
        const { data: lockRow } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'media_storage_lock_gb')
          .maybeSingle();

        if (lockRow?.value) {
          const parsed = Number(lockRow.value);
          if (!isNaN(parsed) && parsed > 0) {
            lockThresholdGB = parsed;
          }
        }

        const { data: stats } = await supabase.rpc('admin_get_storage_analytics');
        if (stats && stats.photos_bytes) {
          reportedStorageGB = Number(stats.photos_bytes) / (1024 * 1024 * 1024);
        }
      } catch {
        // Fall back to reportedStorageGB / defaultLockThresholdGB
      }
    }

    if (reportedStorageGB !== undefined && reportedStorageGB >= lockThresholdGB) {
      return NextResponse.json(
        {
          success: false,
          error: `Upload locked: Cloudinary media storage has reached the ${lockThresholdGB.toFixed(1)} GB safety limit (${reportedStorageGB.toFixed(2)} GB used). Uploads are paused to guarantee $0.00 free tier status (reserving a 5 GB buffer under the 25 GB free limit). Ask the school administrator to prune media in Admin.`,
          isLocked: true,
          lockThresholdGB,
          storageUsedGB: reportedStorageGB,
          provider: 'cloudinary',
        },
        { status: 423 } // HTTP 423 Locked
      );
    }

    // 4. Role validation (Notices attachments only permitted for admin)
    if (folder === 'notices' && userRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only school administrators can attach documents to circulars' },
        { status: 403 }
      );
    }

    // 5. File type validation
    const allowedTypes = ['image/webp', 'image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(contentType.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: 'Unsupported file format. Please upload WebP, JPEG, or PNG images.' },
        { status: 400 }
      );
    }

    // 6. File size validation (Max 600KB after client-side compression; 5MB for notice PDFs)
    const maxSizeBytes = folder === 'notices' ? 5 * 1024 * 1024 : 600 * 1024;
    if (fileSize > maxSizeBytes) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds the allowed limit (${Math.round(maxSizeBytes / 1024)}KB). Please ensure the image is compressed.`,
        },
        { status: 400 }
      );
    }

    // 7. Generate Cloudinary signed upload authorization
    if (!isCloudinaryConfigured()) {
      // Graceful fallback for local development before user enters credentials
      const mockUuid = crypto.randomUUID();
      const mockPublicId = entityId ? `dpsbuzz/${folder}/${entityId}/${mockUuid}` : `dpsbuzz/${folder}/${mockUuid}`;
      return NextResponse.json({
        success: true,
        provider: 'cloudinary',
        uploadUrl: `/api/upload/mock?key=${encodeURIComponent(mockPublicId)}`,
        publicId: mockPublicId,
        isMock: true,
      });
    }

    const signedParams = generateCloudinaryUploadSignature(folder, entityId);

    return NextResponse.json({
      success: true,
      provider: 'cloudinary',
      uploadUrl: signedParams.uploadUrl,
      cloudName: signedParams.cloudName,
      apiKey: signedParams.apiKey,
      timestamp: signedParams.timestamp,
      signature: signedParams.signature,
      folder: signedParams.folder,
      isMock: false,
    });
  } catch (error: any) {
    console.error('Error generating Cloudinary upload credentials:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error generating upload signature' },
      { status: 500 }
    );
  }
}
