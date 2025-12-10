/**
 * Supabase Storage Helper
 * Handles file uploads to Supabase Storage buckets
 */

import { supabase } from './client';
import { v4 as uuidv4 } from 'uuid';

export type StorageBucket = 'submissions' | 'avatars' | 'badges';

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

export interface UploadOptions {
  bucket: StorageBucket;
  userId: string;
  file: File;
  folder?: string;
  customFileName?: string;
}

/**
 * Get file extension from file name or mime type
 */
function getFileExtension(file: File): string {
  // Try to get from file name first
  const nameParts = file.name.split('.');
  if (nameParts.length > 1) {
    return nameParts.pop()!.toLowerCase();
  }
  
  // Fall back to mime type
  const mimeExtensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
  };
  
  return mimeExtensions[file.type] || 'bin';
}

/**
 * Generate a unique file path for uploads
 */
function generateFilePath(options: UploadOptions): string {
  const { userId, file, folder, customFileName } = options;
  const ext = getFileExtension(file);
  const fileName = customFileName || `${uuidv4()}.${ext}`;
  
  if (folder) {
    return `${userId}/${folder}/${fileName}`;
  }
  return `${userId}/${fileName}`;
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  const { bucket, file } = options;
  const filePath = generateFilePath(options);

  try {
    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Upload submission media (image or video)
 */
export async function uploadSubmissionMedia(
  userId: string,
  challengeId: string,
  file: File
): Promise<UploadResult> {
  return uploadFile({
    bucket: 'submissions',
    userId,
    file,
    folder: challengeId,
  });
}

/**
 * Upload avatar image
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<UploadResult> {
  return uploadFile({
    bucket: 'avatars',
    userId,
    file,
    customFileName: `avatar.${getFileExtension(file)}`,
  });
}

/**
 * Upload badge image
 */
export async function uploadBadgeImage(
  challengeId: string,
  file: File
): Promise<UploadResult> {
  return uploadFile({
    bucket: 'badges',
    userId: 'system',
    file,
    folder: challengeId,
  });
}

/**
 * Delete a file from storage
 */
export async function deleteFile(
  bucket: StorageBucket,
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
}

/**
 * Get signed URL for temporary access (useful for private files)
 */
export async function getSignedUrl(
  bucket: StorageBucket,
  path: string,
  expiresIn: number = 3600
): Promise<{ url?: string; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      return { error: error.message };
    }

    return { url: data.signedUrl };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to get signed URL',
    };
  }
}

/**
 * Validate file before upload
 */
export function validateFile(
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const { maxSize = 50 * 1024 * 1024, allowedTypes } = options;

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`,
    };
  }

  // Check file type
  if (allowedTypes && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }

  return { valid: true };
}

/**
 * Get media type from file
 */
export function getMediaType(file: File): 'image' | 'video' {
  return file.type.startsWith('video/') ? 'video' : 'image';
}
