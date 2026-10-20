// lib/utils/admin/study-materials/youtube.ts

/** All YouTube URL patterns we recognise. */
const YT_PATTERNS: RegExp[] = [
  // Standard watch URL: https://www.youtube.com/watch?v=VIDEO_ID
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?(?:.*&)?v=([\w-]{11})/,
  /(?:https?:\/\/)?youtu\.be\/([\w-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([\w-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([\w-]{11})/,
]

/**
 * Extracts the 11-character video ID from any recognised YouTube URL.
 * Returns `null` for invalid / unrecognised URLs.
 */
export function extractYouTubeId(url: string): string | null {
  if (!url || typeof url !== 'string') {return null}

  for (const pattern of YT_PATTERNS) {
    const match = url.match(pattern)
    if (match?.[1]) {return match[1]}
  }

  return null
}

/**
 * Returns a no-cookie embed URL for the given YouTube video URL,
 * or `null` if the URL is not a valid YouTube link.
 *
 * Uses `youtube-nocookie.com` to respect user privacy.
 */
export function getYouTubeEmbedUrl(url: string): string | null {
  const id = extractYouTubeId(url)
  if (!id) {return null}
  return `https://www.youtube-nocookie.com/embed/${id}`
}

/**
 * Returns a best-quality thumbnail URL for a YouTube video,
 * falling back through quality levels.
 *
 * Returns `null` if the URL is not valid.
 */
export function getYouTubeThumbnail(
  url: string,
  quality: 'maxres' | 'hq' | 'mq' | 'sd' = 'hq',
): string | null {
  const id = extractYouTubeId(url)
  if (!id) {return null}
  return `https://img.youtube.com/vi/${id}/${quality}default.jpg`
}

/**
 * Returns `true` when the string looks like a valid YouTube URL.
 */
export function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null
}