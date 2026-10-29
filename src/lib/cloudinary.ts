import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary server-side SDK
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'ogfaxmjw';
const API_KEY = process.env.CLOUDINARY_API_KEY || '585871931796836';
const API_SECRET = process.env.CLOUDINARY_API_SECRET || 'Fpudf-0uhRPjKpFdmQzOiXZTh1M';

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
  secure: true,
});

export type MediaFolder = 'posts' | 'stories' | 'avatars' | 'groups' | 'notices' | 'reels';

/**
 * Checks if Cloudinary environment variables are configured.
 */
export function isCloudinaryConfigured(): boolean {
  return Boolean(CLOUD_NAME && API_KEY && API_SECRET);
}

export interface CloudinarySignedUploadParams {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  uploadUrl: string;
  uploadPreset?: string;
}

/**
 * Generates signed parameters for direct, secure browser-to-Cloudinary uploads.
 * Bypasses intermediate Next.js server buffering while guaranteeing authenticated writes.
 */
export function generateCloudinaryUploadSignature(
  folder: MediaFolder,
  entityId?: string
): CloudinarySignedUploadParams {
  const cloudName = CLOUD_NAME;
  const apiKey = API_KEY;
  const apiSecret = API_SECRET;

  const timestamp = Math.round(new Date().getTime() / 1000);
  const targetFolder = entityId
    ? `dpsbuzz/${folder}/${entityId}`
    : `dpsbuzz/${folder}`;

  // Parameters to sign (must be sorted alphabetically by Cloudinary SDK)
  const paramsToSign: Record<string, any> = {
    folder: targetFolder,
    timestamp,
  };

  const signature = apiSecret
    ? cloudinary.utils.api_sign_request(paramsToSign, apiSecret)
    : 'mock_signature';

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  return {
    cloudName,
    apiKey,
    timestamp,
    signature,
    folder: targetFolder,
    uploadUrl,
  };
}

/**
 * Returns an auto-optimized, next-gen format (WebP/AVIF) Cloudinary image delivery URL.
 * Applies f_auto (auto WebP/AVIF) and q_auto (intelligent visual quality compression).
 */
export function getOptimizedImageUrl(
  publicIdOrUrl: string,
  options?: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'thumb' | 'limit';
    rounded?: boolean;
  }
): string {
  if (!publicIdOrUrl) return '';

  // If already a full URL and not Cloudinary, return as is
  if (publicIdOrUrl.startsWith('http') && !publicIdOrUrl.includes('res.cloudinary.com')) {
    return publicIdOrUrl;
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dpsbuzz';

  const transforms: string[] = ['f_auto', 'q_auto'];

  if (options?.width) transforms.push(`w_${options.width}`);
  if (options?.height) transforms.push(`h_${options.height}`);
  if (options?.crop) transforms.push(`c_${options.crop}`);
  if (options?.rounded) transforms.push('r_max');

  const transformString = transforms.join(',');

  // If it's already a publicId
  const cleanId = publicIdOrUrl.replace(/^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/(v\d+\/)?/, '');

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformString}/${cleanId}`;
}

/**
 * Delete an asset from Cloudinary by public ID.
 */
export async function deleteCloudinaryAsset(publicId: string): Promise<boolean> {
  if (!isCloudinaryConfigured()) return true;
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting asset from Cloudinary:', error);
    return false;
  }
}
