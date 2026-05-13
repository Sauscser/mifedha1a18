import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { uploadData, getUrl } from '@aws-amplify/storage';
// utils/getSignedImageUrl.ts

/**
 * Get a signed image URL from S3 for display in the app.
 * @param key The S3 object key (e.g. "public/123_item.jpg")
 * @returns The full signed URL string, or undefined if failed
 */
export const getSignedImageUrl = async (key: string): Promise<string | undefined> => {
  try {
    if (!key || key === 'None') return undefined;
    // Always stringify the key and only pass key, never path
    const stringKey = key.toString();
    const url = await getUrl({ key: stringKey });
    // HomeScrn pattern: use url.url.toString()
    return url && url.url ? url.url.toString() : undefined;
  } catch (error) {
    console.error('Failed to get signed URL for image:', key, error);
    return undefined;
  }
};
