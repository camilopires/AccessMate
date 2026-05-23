export type SharePlatform = 'x' | 'bluesky' | 'threads' | 'instagram';

export const PLATFORM_LIMITS: Record<SharePlatform, number> = {
  x: 280,
  bluesky: 300,
  threads: 500,
  instagram: Infinity,
};

export function sizeForPlatform(text: string, platform: SharePlatform): string {
  const limit = PLATFORM_LIMITS[platform];
  if (!isFinite(limit)) return text;
  if (text.length <= limit) return text;
  return text.slice(0, limit - 1) + '…';
}
