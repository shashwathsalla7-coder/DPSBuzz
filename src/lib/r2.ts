// =====================================================
// DPS BUZZ - Cloudflare R2 Client & Storage Manager
// Server-side only: never expose credentials to browser
// =====================================================

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET || 'dpsbuzz-media';

// Check if R2 environment variables are configured
export function isR2Configured(): boolean {
  return Boolean(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET);
}

// Lazy-initialized S3 client for Cloudflare R2
let s3ClientInstance: S3Client | null = null;

function getR2Client(): S3Client {
  if (!s3ClientInstance) {
    if (!isR2Configured()) {
      throw new Error('Cloudflare R2 is not configured. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY in .env.local');
    }
    s3ClientInstance = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return s3ClientInstance;
}

export type MediaFolder = 'posts' | 'stories' | 'avatars' | 'groups' | 'notices';

export interface PresignedUploadResult {
  uploadUrl: string;
  r2Key: string;
  expiresInSeconds: number;
}

/**
 * Generate a short-lived presigned upload URL (PUT) for direct browser-to-R2 upload.
 * Uses a random UUID key. Never uses the original filename.
 */
export async function getPresignedUploadUrl(
  folder: MediaFolder,
  contentType: string,
  entityId?: string
): Promise<PresignedUploadResult> {
  const s3 = getR2Client();

  // Extension deduction
  const ext = contentType.includes('webp') ? 'webp' : contentType.includes('png') ? 'png' : contentType.includes('pdf') ? 'pdf' : 'jpg';
  const fileUuid = crypto.randomUUID();

  // Random UUID object key structure
  const r2Key = entityId ? `${folder}/${entityId}/${fileUuid}.${ext}` : `${folder}/${fileUuid}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: r2Key,
    ContentType: contentType,
  });

  // Short-lived 5-minute upload window
  const expiresInSeconds = 300;
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: expiresInSeconds });

  return {
    uploadUrl,
    r2Key,
    expiresInSeconds,
  };
}

/**
 * Generate a short-lived presigned read URL (GET) for private bucket images.
 * Rounded to the current hour so the same URL string repeats and browsers can cache it.
 */
export async function getPresignedReadUrl(r2Key: string): Promise<string> {
  if (!isR2Configured()) {
    // Fallback if R2 credentials are not yet supplied
    return `/api/media/mock?key=${encodeURIComponent(r2Key)}`;
  }

  const s3 = getR2Client();

  // Round signing date to the start of the current hour (e.g. 13:00:00)
  const now = new Date();
  const signingDate = new Date(now);
  signingDate.setMinutes(0, 0, 0);

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: r2Key,
  });

  // Valid for 2 hours (7200s), repeatable within the same hour
  const readUrl = await getSignedUrl(s3, command, {
    expiresIn: 7200,
    signingDate,
  });

  return readUrl;
}

/**
 * Delete a single object from Cloudflare R2
 */
export async function deleteR2Object(r2Key: string): Promise<boolean> {
  if (!isR2Configured()) return true;
  try {
    const s3 = getR2Client();
    await s3.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET,
        Key: r2Key,
      })
    );
    return true;
  } catch (error) {
    console.error(`Failed to delete R2 object ${r2Key}:`, error);
    return false;
  }
}

/**
 * Batch delete multiple objects from Cloudflare R2
 */
export async function deleteR2Objects(r2Keys: string[]): Promise<number> {
  if (!isR2Configured() || r2Keys.length === 0) return 0;
  try {
    const s3 = getR2Client();
    const command = new DeleteObjectsCommand({
      Bucket: R2_BUCKET,
      Delete: {
        Objects: r2Keys.map((Key) => ({ Key })),
        Quiet: true,
      },
    });
    const result = await s3.send(command);
    return (result.Deleted || []).length;
  } catch (error) {
    console.error('Failed to batch delete R2 objects:', error);
    return 0;
  }
}
