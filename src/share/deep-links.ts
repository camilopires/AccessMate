import type { SharePlatform } from './sizer';

export function shareDeepLink(platform: SharePlatform, text: string): string | null {
  const encoded = encodeURIComponent(text);
  if (platform === 'x') return `https://twitter.com/intent/tweet?text=${encoded}`;
  if (platform === 'bluesky') return `https://bsky.app/intent/compose?text=${encoded}`;
  if (platform === 'threads') return `https://www.threads.net/intent/post?text=${encoded}`;
  // Instagram has no public compose deep link — users paste a caption.
  return null;
}

export const SUGGESTED_HASHTAGS = [
  '#AccessForAll',
  '#DisabledTravel',
  '#A11y',
  '#AccessibleRail',
  '#AccessibleTransport',
];
